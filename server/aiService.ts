import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import {
  UserProfile,
  LessonPlan,
  Question,
  AnswerEvaluation,
  SectionType,
  LearnerSkillState,
  DailySummary,
  TutorAssistantResponse,
  DiscoveryMessage,
  DiagnosticSession,
  DiagnosticReport,
  PersonalizedStudyPlan,
  WritingRubricScore,
  DeepDiveInquiryResponse,
  WordPracticeData,
  NextSessionCustomContext
} from '../src/types/learning.js';
import { budgetManager } from './usageBudget.js';
import { contentCache } from './contentCache.js';
import { AIException, classifyGeminiError, type AIErrorCode } from './aiErrors.js';
import { sanitizeAndReconcileQuestion } from './questionUtils.js';

// Import modular prompt builders
import { buildDiscoverySystemPrompt } from './prompts/discoveryPrompts.js';
import { buildLessonPlanSystemPrompt, buildQuestionSystemPrompt } from './prompts/lessonPrompts.js';
import { buildContrastExplanationPrompt, buildWritingRubricPrompt } from './prompts/evaluationPrompts.js';
import { buildTutorAssistPrompt, buildDeepDiveSystemPrompt, buildLessonSummarySystemPrompt, buildWordPracticeSystemPrompt } from './prompts/tutorPrompts.js';
import { createFallbackWritingRubric } from './evaluators/diagnosticHelpers.js';

import { fallbackDiscoveryTurn } from './fallbacks/diagnosticFallbacks.js';
import { polishWritingText } from './fallbacks/lessonFallbacks.js';
import { buildRuleBasedWordFamily } from './fallbacks/wordFamilyFallbacks.js';
import { evaluateMultipleChoiceAnswer, normalizeAnswerText, buildFallbackDailySummary, buildFallbackTomorrowPlan } from './evaluators/lessonHelpers.js';
import { diagnosticService } from './services/diagnosticService.js';
import { CurriculumScheduler } from '../src/services/curriculumScheduler.js';

export { AIException, classifyGeminiError, type AIErrorCode };

export interface LearningModelProvider {
  generateLessonPlan(profile: UserProfile, skillStates: LearnerSkillState[], recentErrors: string[]): Promise<LessonPlan>;
  generateQuestion(section: SectionType, profile: UserProfile, targetSkillName?: string, contextTopic?: 'general' | 'workplace_tech', activityType?: string, questionIndex?: number, totalInActivity?: number, sessionObjective?: string): Promise<Question>;
  evaluateAnswer(question: Question, userAnswer: string, profile: UserProfile): Promise<AnswerEvaluation>;
  tutorAssist(question: Question, action: 'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity', profile: UserProfile): Promise<TutorAssistantResponse>;
  generateLessonSummary(lesson: LessonPlan, attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>, profile: UserProfile, timeSpentMinutes?: number): Promise<DailySummary>;
  handleDiscoveryTurn(history: DiscoveryMessage[], userMessage: string, currentProfile: UserProfile): Promise<any>;
  generateAdaptiveDiagnosticQuestion(session: DiagnosticSession, profile: UserProfile): Promise<Question>;
  generateDiagnosticBatchQuestions(session: DiagnosticSession, profile: UserProfile): Promise<Question[]>;
  evaluateDiagnosticAnswer(question: Question, userAnswer: string, profile: UserProfile): Promise<{ evaluation: AnswerEvaluation; writingRubric?: WritingRubricScore }>;
  computeDiagnosticReport(session: DiagnosticSession, profile: UserProfile): Promise<DiagnosticReport>;
  generatePersonalizedStudyPlan(report: DiagnosticReport, profile: UserProfile): Promise<PersonalizedStudyPlan>;
  deepDiveInquiry(question: Question, userAnswer: string, evaluation: AnswerEvaluation | undefined, message: string, history: Array<{ role: 'user' | 'tutor'; content: string }>, profile: UserProfile): Promise<DeepDiveInquiryResponse>;
}

export class GeminiLearningProvider implements LearningModelProvider {
  private ai: GoogleGenAI | null = null;
  private activeApiKeyInClient?: string;
  private modelCandidates = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  private quotaCooldownUntil = 0;
  private servedQuestionHistory: string[] = [];
  private currentApiKey?: string;
  private mockHandler: ((prompt: string, systemInstruction: string, options?: { userId?: string; operation?: string }) => any) | null = null;
  public isFallbackActive = false;
  public lastFallbackReason = '';

  private getLatestEnvKey(): string | undefined {
    try {
      if (fs.existsSync('.env')) {
        const content = fs.readFileSync('.env', 'utf-8');
        const match = content.match(/^GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
        if (match && match[1] && match[1].trim() && match[1].trim() !== 'MY_GEMINI_API_KEY') {
          process.env.GEMINI_API_KEY = match[1].trim();
          return match[1].trim();
        }
      }
    } catch {}
    return process.env.GEMINI_API_KEY;
  }

  public setApiKey(key?: string): void {
    const trimmed = key?.trim();
    if (trimmed && trimmed.length > 5) {
      if (this.currentApiKey !== trimmed) {
        this.currentApiKey = trimmed;
        this.initClientForApiKey(trimmed);
        this.quotaCooldownUntil = 0;
        this.isFallbackActive = false;
        this.lastFallbackReason = '';
      }
    } else {
      if (this.currentApiKey) {
        this.currentApiKey = undefined;
        const envKey = this.getLatestEnvKey();
        if (envKey) {
          this.initClientForApiKey(envKey);
        }
      }
    }
  }

  private initClientForApiKey(key: string): GoogleGenAI | null {
    try {
      const client = new GoogleGenAI({ apiKey: key });
      this.ai = client;
      this.activeApiKeyInClient = key;
      this.quotaCooldownUntil = 0;
      return client;
    } catch (err) {
      console.warn('Could not initialize GoogleGenAI client for key:', err);
      return null;
    }
  }

  private getAiClient(): GoogleGenAI | null {
    // 1. Check custom key set for current request / session
    if (this.currentApiKey && this.currentApiKey.trim().length > 5) {
      const customKey = this.currentApiKey.trim();
      if (this.ai && this.activeApiKeyInClient === customKey) {
        return this.ai;
      }
      return this.initClientForApiKey(customKey);
    }

    // 2. Check environment / .env file
    const envKey = this.getLatestEnvKey();
    if (!envKey || envKey === 'MY_GEMINI_API_KEY') {
      return null;
    }

    if (this.ai && this.activeApiKeyInClient === envKey) {
      return this.ai;
    }

    return this.initClientForApiKey(envKey);
  }

  constructor() {
    this.getAiClient();
  }

  public setMockHandler(handler: ((prompt: string, systemInstruction: string, options?: { userId?: string; operation?: string }) => any) | null): void {
    this.mockHandler = handler;
  }

  public isQuotaExhausted(): boolean {
    if (Date.now() < this.quotaCooldownUntil) return true;
    const activeKey = this.currentApiKey || this.getLatestEnvKey();
    if (activeKey && activeKey !== 'MY_GEMINI_API_KEY') return false;
    return false;
  }

  public resetQuotaCooldown(): void { this.quotaCooldownUntil = 0; }
  public clearQuotaCooldown(): void { this.quotaCooldownUntil = 0; }

  private cleanJson(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    else if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    return clean.trim();
  }

  public polishWritingText(rawText: string, prompt: string, profile: UserProfile) {
    return polishWritingText(rawText, prompt, profile);
  }

  public sanitizeAndReconcileQuestion(q: Question): Question {
    return sanitizeAndReconcileQuestion(q);
  }

  public async callGeminiJson<T>(
    prompt: string,
    systemInstruction: string,
    options?: { userId?: string; operation?: string }
  ): Promise<T | null> {
    const userId = options?.userId || 'system';
    const hasCustomKey = Boolean(this.currentApiKey && this.currentApiKey.trim().length > 5);

    if (this.isQuotaExhausted()) {
      if (hasCustomKey) {
        this.quotaCooldownUntil = 0;
      } else {
        this.isFallbackActive = true;
        this.lastFallbackReason = 'API quota cooldown active.';
        throw new AIException(
          'QUOTA_EXHAUSTED',
          "AI usage limit reached. We're unable to process your request right now. Please try again later.",
          { retryable: false, retryAfterSeconds: 60 }
        );
      }
    }

    if (!hasCustomKey) {
      const budgetStatus = budgetManager.checkAllowance(userId);
      if (!budgetStatus.allowed) {
        this.isFallbackActive = true;
        this.lastFallbackReason = budgetStatus.reason || 'Usage budget limit reached.';
        return null;
      }
    }

    if (this.mockHandler) {
      try {
        return this.mockHandler(prompt, systemInstruction, options) as T;
      } catch (err: any) {
        const classification = classifyGeminiError(err);
        if (classification.code === 'QUOTA_EXHAUSTED' || classification.code === 'RATE_LIMITED') {
          this.quotaCooldownUntil = Date.now() + 60_000;
          this.isFallbackActive = true;
          this.lastFallbackReason = classification.userMessage;
          throw classification;
        }
        console.warn('[AI] Mock handler failed:', err);
      }
    }

    const client = this.getAiClient();
    if (!client) {
      this.isFallbackActive = true;
      this.lastFallbackReason = 'No valid Gemini API key configured.';
      return null;
    }

    let lastErr: any = null;

    for (const modelName of this.modelCandidates) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        });

        const rawText = response.text || '';
        const cleanedText = this.cleanJson(rawText);
        const parsed = JSON.parse(cleanedText) as T;

        this.isFallbackActive = false;
        this.lastFallbackReason = '';
        return parsed;
      } catch (err: any) {
        lastErr = err;
        const classification = classifyGeminiError(err);
        if (classification.code === 'QUOTA_EXHAUSTED' || classification.code === 'RATE_LIMITED') {
          this.quotaCooldownUntil = Date.now() + 60_000;
          this.isFallbackActive = true;
          this.lastFallbackReason = 'Quota limit reached on model ' + modelName;
          throw classification;
        }
      }
    }

    this.isFallbackActive = true;
    this.lastFallbackReason = lastErr?.message || 'Gemini request failed.';
    return null;
  }

  // =========================================================================
  // 1. CONVERSATIONAL DISCOVERY
  // =========================================================================
  public async handleDiscoveryTurn(history: DiscoveryMessage[], userMessage: string, currentProfile: UserProfile): Promise<any> {
    const turnsCount = history.filter(m => m.sender === 'learner').length + 1;
    const systemPrompt = buildDiscoverySystemPrompt(currentProfile, history, userMessage);

    try {
      const prompt = `Process the learner's message "${userMessage}" at turn ${turnsCount}.`;
      const aiResult = await this.callGeminiJson<any>(prompt, systemPrompt, { userId: currentProfile.id, operation: 'discovery_turn' });
      if (aiResult && aiResult.tutorReply) return aiResult;
    } catch (err: any) {
      console.warn('[AI] handleDiscoveryTurn fallback:', err?.message);
    }

    return fallbackDiscoveryTurn(history, userMessage, currentProfile, turnsCount);
  }

  // =========================================================================
  // 2. ADAPTIVE DIAGNOSTIC QUESTION SELECTION & EVALUATION (Delegated to DiagnosticService)
  // =========================================================================
  public async generateAdaptiveDiagnosticQuestion(session: DiagnosticSession, profile: UserProfile): Promise<Question> {
    return diagnosticService.generateAdaptiveDiagnosticQuestion((p, s, o) => this.callGeminiJson(p, s, o), session, profile);
  }

  public async generateDiagnosticBatchQuestions(session: DiagnosticSession, profile: UserProfile): Promise<Question[]> {
    return diagnosticService.generateDiagnosticBatchQuestions((p, s, o) => this.callGeminiJson(p, s, o), session, profile);
  }

  public async evaluateDiagnosticAnswer(question: Question, userAnswer: string, profile: UserProfile): Promise<{ evaluation: AnswerEvaluation; writingRubric?: WritingRubricScore }> {
    return diagnosticService.evaluateDiagnosticAnswer((p, s, o) => this.callGeminiJson(p, s, o), (q, u, pr) => this.evaluateAnswer(q, u, pr), question, userAnswer, profile);
  }

  public async computeDiagnosticReport(session: DiagnosticSession, profile: UserProfile): Promise<DiagnosticReport> {
    return diagnosticService.computeDiagnosticReport((p, s, o) => this.callGeminiJson(p, s, o), session, profile);
  }

  public async generatePersonalizedStudyPlan(report: DiagnosticReport, profile: UserProfile): Promise<PersonalizedStudyPlan> {
    return diagnosticService.generatePersonalizedStudyPlan((p, s, o) => this.callGeminiJson(p, s, o), report, profile);
  }

  // =========================================================================
  // 3. LESSON PLAN & QUESTION GENERATION
  // =========================================================================
  public async generateLessonPlan(
    profile: UserProfile,
    skillStates: LearnerSkillState[],
    recentErrors: string[],
    lessonHistory: any[] = [],
    customContext?: NextSessionCustomContext
  ): Promise<LessonPlan> {
    const rawDuration = customContext?.dailyMinutes || profile.daily_minutes || 20;
    const duration: 10 | 20 | 30 = rawDuration <= 12 ? 10 : rawDuration >= 25 ? 30 : 20;
    const paceMode = duration === 10 ? 'quick_10' : duration === 30 ? 'deep_30' : 'standard_20';
    const totalPlannedQuestions = duration === 10 ? 6 : duration === 30 ? 15 : 10;

    // 1. Run deterministic curriculum scheduler to pre-select learning objectives,
    // prioritizing overdue reviews, weak prerequisites, and recurring mistakes.
    const blueprint = CurriculumScheduler.scheduleDailyLesson({
      profile,
      skillStates,
      recentErrors,
      completedLessonsCount: lessonHistory.length,
      customContext
    });

    const hasCustomConfig = Boolean(
      customContext && (
        (customContext.selectedMistakes && customContext.selectedMistakes.length > 0) ||
        (customContext.selectedVocabWords && customContext.selectedVocabWords.length > 0) ||
        (customContext.selectedNewSkills && customContext.selectedNewSkills.length > 0) ||
        customContext.topicCategory ||
        customContext.customInstructions
      )
    );

    const cacheKey = contentCache.makeKey('lesson_plan', {
      level: profile.current_level,
      duration,
      goal: profile.primary_goal,
      lang: profile.explanation_language,
      historyLength: lessonHistory.length,
      objective: blueprint.primary_objective
    });
    const cachedPlan = (lessonHistory.length > 0 || hasCustomConfig) ? null : contentCache.get<LessonPlan>(cacheKey);
    if (cachedPlan) return { ...cachedPlan, lesson_id: `lesson-${Date.now()}`, status: 'in_progress' };

    const systemPrompt = buildLessonPlanSystemPrompt(
      profile,
      skillStates,
      recentErrors,
      duration,
      paceMode,
      totalPlannedQuestions,
      lessonHistory,
      customContext,
      blueprint
    );
    const prompt = `Create pedagogical exercise details and scenarios for pre-selected objective: "${blueprint.primary_objective}".`;

    let generatedPlan: LessonPlan | null = null;
    try {
      const aiResult = await this.callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'lesson_plan' });
      if (aiResult && aiResult.sections && aiResult.sections.length > 0) {
        const parsedSections = aiResult.sections.map((s: any, idx: number) => {
          const bpSec = blueprint.sections[idx] || blueprint.sections[0];
          return {
            section: s.section || bpSec.section,
            title: s.title || bpSec.title,
            description: s.description || bpSec.description,
            estimated_minutes: s.estimated_minutes || bpSec.estimated_minutes,
            skill_target: s.skill_target || bpSec.skill_target,
            activity_type: s.activity_type || bpSec.activity_type || 'concept_practice',
            target_questions_count: s.target_questions_count || bpSec.target_questions_count || 2,
            pedagogical_focus: bpSec.pedagogical_focus,
            target_mastery_stage: bpSec.target_mastery_stage,
            is_progress_check: bpSec.is_progress_check,
            completed_questions_count: 0,
            completed: false
          };
        });

        generatedPlan = {
          lesson_id: `lesson-${Date.now()}`,
          lesson_number: lessonHistory.length + 1,
          date: new Date().toISOString().split('T')[0],
          primary_objective: aiResult.primary_objective || blueprint.primary_objective,
          reason_for_selection: aiResult.reason_for_selection || blueprint.reason_for_selection,
          estimated_duration_minutes: duration,
          session_pace_mode: paceMode,
          total_planned_questions: totalPlannedQuestions,
          sections: parsedSections,
          status: 'in_progress'
        };
      }
    } catch (err: any) {
      if (err instanceof AIException && (err.code === 'QUOTA_EXHAUSTED' || err.code === 'RATE_LIMITED')) {
        throw err;
      }
      console.warn('[AI] Lesson plan generation fallback to deterministic blueprint:', err?.message);
    }

    // If AI generation was unavailable or timed out, construct directly from deterministic blueprint
    if (!generatedPlan) {
      generatedPlan = {
        lesson_id: `lesson-${Date.now()}`,
        lesson_number: lessonHistory.length + 1,
        date: new Date().toISOString().split('T')[0],
        primary_objective: blueprint.primary_objective,
        reason_for_selection: blueprint.reason_for_selection,
        estimated_duration_minutes: duration,
        session_pace_mode: paceMode,
        total_planned_questions: totalPlannedQuestions,
        sections: blueprint.sections.map(s => ({
          section: s.section,
          title: s.title,
          description: s.description,
          estimated_minutes: s.estimated_minutes,
          skill_target: s.skill_target,
          activity_type: s.activity_type,
          target_questions_count: s.target_questions_count,
          pedagogical_focus: s.pedagogical_focus,
          target_mastery_stage: s.target_mastery_stage,
          is_progress_check: s.is_progress_check,
          completed_questions_count: 0,
          completed: false
        })),
        status: 'in_progress'
      };
    }

    const fullyPopulatedPlan = await this.populatePlanQuestions(generatedPlan, profile);
    contentCache.set(cacheKey, fullyPopulatedPlan, 86400);
    return fullyPopulatedPlan;
  }

  public async populatePlanQuestions(plan: LessonPlan, profile: UserProfile): Promise<LessonPlan> {
    const updatedSections = await Promise.all(
      plan.sections.map(async sec => {
        if (sec.questions && sec.questions.length >= sec.target_questions_count) return sec;
        const targetCount = sec.target_questions_count || 1;
        const promises: Promise<Question>[] = [];
        for (let qIdx = 0; qIdx < targetCount; qIdx++) {
          promises.push(this.generateQuestion(sec.section, profile, sec.skill_target, undefined, sec.activity_type, qIdx, targetCount, plan.primary_objective));
        }
        const questions = await Promise.all(promises);
        return { ...sec, questions };
      })
    );
    return { ...plan, sections: updatedSections };
  }

  public async generateQuestion(section: SectionType, profile: UserProfile, targetSkillName?: string, contextTopic?: 'general' | 'workplace_tech', activityType?: string, questionIndex = 0, totalInActivity = 1, sessionObjective?: string): Promise<Question> {
    const topic = contextTopic || (Math.random() * 100 > profile.general_vs_work_ratio ? 'workplace_tech' : 'general');
    const systemPrompt = buildQuestionSystemPrompt(section, profile, targetSkillName, topic, activityType, questionIndex, totalInActivity, sessionObjective);
    const prompt = `Generate question ${questionIndex + 1} of ${totalInActivity} for ${section}.`;

    const result = await this.callGeminiJson<Question>(prompt, systemPrompt, { userId: profile.id, operation: 'lesson_question' });
    if (result && result.prompt) {
      const sanitized = sanitizeAndReconcileQuestion(result);
      return { ...sanitized, id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, section };
    }

    throw new AIException('SERVICE_UNAVAILABLE', 'Failed to generate lesson question from AI.', { retryable: true });
  }

  // =========================================================================
  // 4. ANSWER EVALUATION & TUTOR ASSIST
  // =========================================================================
  public async evaluateAnswer(question: Question, userAnswer: string, profile: UserProfile): Promise<AnswerEvaluation> {
    const trimmed = userAnswer.trim();
    const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';
    const isVi = profile.explanation_language === 'vi';
    question = sanitizeAndReconcileQuestion(question);

    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    if (hasOptions) {
      const { isCorrect, selectedOption, expectedId, expectedText } = evaluateMultipleChoiceAnswer(question, trimmed);
      const selectedText = selectedOption ? selectedOption.text.trim() : trimmed;

      if (isCorrect) {
        return {
          verdict: 'correct',
          user_answer: selectedOption ? `${selectedOption.id}. ${selectedOption.text}` : userAnswer,
          expected_answer: `${expectedId}. ${expectedText}`,
          full_correct_sentence: question.prompt.replace('____', `**${expectedText}**`),
          decisive_clue: question.explanation_rule || `Correct! Option ${expectedId} is right.`,
          explanation: question.explanation_rule || `Well done! Option ${expectedId} is correct.`,
          sentence_translation: question.sentence_translation || question.vocab_card?.meaning,
          error_tags: [],
          needs_retry: false,
          next_action: 'continue'
        };
      }

      let contrastExplanation = `You selected "${selectedText}". The correct choice is "${expectedId}. ${expectedText}".`;
      let decisiveClue = question.explanation_rule || `The correct choice is ${expectedId}.`;

      try {
        const contrastSystemPrompt = buildContrastExplanationPrompt(question, expectedId, expectedText, selectedOption, selectedText, lang);
        const aiContrast = await this.callGeminiJson<any>(`Explain incorrect option ${selectedOption?.id || trimmed}`, contrastSystemPrompt, { userId: profile.id, operation: 'contrast_eval' });
        if (aiContrast && aiContrast.contrast_explanation) {
          contrastExplanation = aiContrast.contrast_explanation;
          decisiveClue = aiContrast.decisive_clue || decisiveClue;
        }
      } catch (err: any) {
        console.warn('[AI] contrast explanation fallback:', err?.message);
      }

      return {
        verdict: 'incorrect',
        user_answer: selectedOption ? `${selectedOption.id}. ${selectedOption.text}` : userAnswer,
        expected_answer: `${expectedId}. ${expectedText}`,
        full_correct_sentence: question.prompt.includes('____') ? question.prompt.replace('____', `**${expectedText}**`) : `${question.prompt} → **${expectedText}**`,
        decisive_clue: decisiveClue,
        contrast_explanation: contrastExplanation,
        explanation: question.explanation_rule || `Option ${expectedId} is correct.`,
        sentence_translation: question.sentence_translation || question.vocab_card?.meaning,
        error_tags: ['distractor_choice'],
        needs_retry: true,
        next_action: 'retry'
      };
    }

    if (question.question_type === 'free_writing') {
      const isVi = profile.explanation_language === 'vi';
      let aiRubric: any = null;
      try {
        const systemPrompt = buildWritingRubricPrompt(question, trimmed, profile);
        const prompt = `Evaluate free writing submission for ${question.skill_name}.`;
        aiRubric = await this.callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'writing_evaluation' });
      } catch (err: any) {
        console.warn('[AI] free_writing AI evaluation fallback:', err?.message);
      }

      const polished = polishWritingText(trimmed, question.prompt, profile);
      const rubric = createFallbackWritingRubric(trimmed, question.prompt, profile, aiRubric);
      const isSufficient = rubric.accuracy >= 3 && trimmed.length >= 15;

      return {
        verdict: isSufficient ? 'correct' : 'partially_correct',
        user_answer: userAnswer,
        expected_answer: 'Coherent written output',
        full_correct_sentence: rubric.correctedVersion || polished.polishedText,
        decisive_clue: rubric.feedbackSummary || (isVi ? 'Ý văn truyền tải tốt.' : 'Clear communicative phrasing.'),
        explanation: rubric.feedbackSummary || (isVi ? 'Bài viết mạch lạc! Tham khảo phiên bản trau chuốt bên dưới.' : 'Good response! Review the AI-polished native version below.'),
        corrected_text: rubric.correctedVersion || polished.polishedText,
        key_corrections: rubric.keyCorrections && rubric.keyCorrections.length > 0 ? rubric.keyCorrections : polished.keyCorrections,
        useful_phrases: polished.usefulPhrases,
        reusable_pattern: polished.reusablePattern,
        error_tags: isSufficient ? [] : ['Writing structure'],
        needs_retry: false,
        next_action: 'continue'
      };
    }

    // Handle fill_in_blank, open text, sentence completion, etc.
    const expected = (question.expected_answer_text || (question.options?.find(o => question.expected_answer_ids?.includes(o.id))?.text) || '').trim();
    const normUser = normalizeAnswerText(trimmed);
    const normExpected = normalizeAnswerText(expected);
    const acceptedAlts = (question.accepted_alternatives || []).map(normalizeAnswerText);
    const optionMatches = (question.options || []).some(o =>
      (o.id.toLowerCase() === normUser || normalizeAnswerText(o.text) === normUser) &&
      question.expected_answer_ids?.some(eid => eid.toUpperCase() === o.id.toUpperCase())
    );

    const isMatch = (normUser === normExpected) || acceptedAlts.includes(normUser) || optionMatches;

    const fullSentence = question.prompt.includes('____')
      ? question.prompt.replace(/_{2,}/g, `**${expected}**`)
      : (question.prompt.includes('(') ? question.prompt : `${question.prompt} → **${expected}**`);

    if (isMatch) {
      return {
        verdict: 'correct',
        user_answer: userAnswer,
        expected_answer: expected,
        full_correct_sentence: fullSentence,
        decisive_clue: question.explanation_rule || `Correct! The expected answer is "${expected}".`,
        explanation: question.explanation_rule || `Well done! "${expected}" is the correct answer.`,
        sentence_translation: question.sentence_translation || question.vocab_card?.meaning,
        error_tags: [],
        needs_retry: false,
        next_action: 'continue'
      };
    }

    return {
      verdict: 'incorrect',
      user_answer: userAnswer,
      expected_answer: expected,
      full_correct_sentence: fullSentence,
      decisive_clue: question.explanation_rule || `The expected answer is "${expected}".`,
      explanation: `The expected answer is "${expected}". ${question.explanation_rule || ''}`,
      contrast_explanation: `You entered "${trimmed}". The expected answer is "${expected}".`,
      sentence_translation: question.sentence_translation || question.vocab_card?.meaning,
      error_tags: [question.skill_name || 'Grammar precision'],
      needs_retry: true,
      next_action: 'retry'
    };
  }

  public async tutorAssist(question: Question, action: 'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity', profile: UserProfile): Promise<TutorAssistantResponse> {
    if (action === 'hint') return { type: 'hint', content: question.hint || 'Focus on time markers and key verb forms.' };

    const systemPrompt = buildTutorAssistPrompt(question, action, profile);
    const prompt = `Help the student with action: ${action}`;

    try {
      const result = await this.callGeminiJson<TutorAssistantResponse>(prompt, systemPrompt, { userId: profile.id, operation: 'tutor_assist' });
      if (result && result.content) return result;
    } catch (err: any) {
      console.warn('[AI] tutorAssist fallback:', err?.message);
    }

    return { type: action, content: question.explanation_rule || 'Relate the action to the time context for precision.' };
  }

  public async deepDiveInquiry(question: Question, userAnswer: string, evaluation: AnswerEvaluation | undefined, message: string, history: Array<{ role: 'user' | 'tutor'; content: string }>, profile: UserProfile): Promise<DeepDiveInquiryResponse> {
    const systemPrompt = buildDeepDiveSystemPrompt(question, userAnswer, evaluation, profile);
    const conversationContext = history && history.length > 0 ? history.map(h => `${h.role === 'user' ? 'Learner' : 'Tutor'}: ${h.content}`).join('\n') + '\n\n' : '';
    const prompt = `${conversationContext}Learner's question: "${message}"`;

    try {
      const aiResult = await this.callGeminiJson<DeepDiveInquiryResponse>(prompt, systemPrompt, { userId: profile.id, operation: 'tutor_deep_dive' });
      if (aiResult && aiResult.reply) {
        if ((!aiResult.similar_words_comparison || aiResult.similar_words_comparison.length === 0) && question.vocab_card?.similar_word_comparison) {
          aiResult.similar_words_comparison = [
            {
              word: question.vocab_card.word,
              nuance: question.vocab_card.meaning || 'Primary target word',
              when_to_use: question.vocab_card.collocation_pattern || 'Formal / Professional',
              example: question.vocab_card.example_workplace || question.vocab_card.example_general || ''
            },
            {
              word: question.vocab_card.similar_word_comparison.word,
              nuance: question.vocab_card.similar_word_comparison.difference || 'Contrasting term',
              when_to_use: 'Distinct nuance / scope',
              example: ''
            }
          ];
        }
        return aiResult;
      }
    } catch (err: any) {
      console.warn('[AI] deepDiveInquiry fallback:', err?.message);
    }

    const fallbackSimilarWords = question.vocab_card?.similar_word_comparison ? [
      {
        word: question.vocab_card.word,
        nuance: question.vocab_card.meaning || 'Primary target word',
        when_to_use: question.vocab_card.collocation_pattern || 'Formal / Professional',
        example: question.vocab_card.example_workplace || question.vocab_card.example_general || ''
      },
      {
        word: question.vocab_card.similar_word_comparison.word,
        nuance: question.vocab_card.similar_word_comparison.difference || 'Contrasting term',
        when_to_use: 'Distinct nuance / scope',
        example: ''
      }
    ] : undefined;

    return {
      reply: `### Tutor Explanation:\n\nRegarding **"${message}"** for ${question.skill_name}:\n\n• **Core Rule:** ${question.explanation_rule || 'Focus on precision and natural cadence.'}\n\n• **Word Contrast:** ${question.vocab_card?.similar_word_comparison?.difference || 'Differentiate based on scope and intent.'}`,
      similar_words_comparison: fallbackSimilarWords,
      suggestedFollowUps: ['Give me more examples', 'Which prepositions work best here?'],
      examples: ['Our team prioritized precision over speed to ensure long-term stability.']
    };
  }

  public async generateLessonSummary(lesson: LessonPlan, attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>, profile: UserProfile, timeSpentMinutes?: number): Promise<DailySummary> {
    const totalQuestions = attempts.length;
    const correctCount = attempts.filter(a => a.evaluation.verdict === 'correct').length;
    const accuracy = totalQuestions > 0 ? Number((correctCount / totalQuestions).toFixed(2)) : 1.0;
    const sectionsPracticed = Array.from(new Set(attempts.map(a => a.question.section))) as SectionType[];
    const targetMins = lesson.estimated_duration_minutes || profile.daily_minutes || 20;
    const computedTimeSpent = timeSpentMinutes || Math.max(1, Math.round(targetMins * (totalQuestions / (lesson.total_planned_questions || totalQuestions || 4))));
    const paceMode = lesson.session_pace_mode || (targetMins <= 12 ? 'quick_10' : targetMins >= 25 ? 'deep_30' : 'standard_20');

    const systemPrompt = buildLessonSummarySystemPrompt(lesson, totalQuestions, accuracy, computedTimeSpent, targetMins, paceMode, profile);
    const prompt = `Generate summary reflecting ${targetMins}-minute study session.`;
    const fallbackTomorrowPlan = buildFallbackTomorrowPlan(profile, targetMins);

    try {
      const aiResult = await this.callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'lesson_summary' });
      if (aiResult) {
        return {
          lesson_id: lesson.lesson_id,
          lesson_number: lesson.lesson_number || 1,
          completed_at: new Date().toISOString(),
          primary_objective: lesson.primary_objective,
          sections_completed: sectionsPracticed,
          questions_answered: totalQuestions,
          total_planned_questions: lesson.total_planned_questions || totalQuestions,
          time_spent_minutes: computedTimeSpent,
          target_duration_minutes: targetMins,
          session_pace_mode: paceMode,
          accuracy_rate: accuracy,
          key_takeaways: aiResult.key_takeaways || [],
          vocabulary_learned: aiResult.vocabulary_learned || [],
          recurring_mistakes_flagged: aiResult.recurring_mistakes_flagged || [],
          next_review_topics: aiResult.next_review_topics || [],
          tomorrow_plan: aiResult.tomorrow_plan || fallbackTomorrowPlan,
          learner_rating: 'about_right'
        };
      }
    } catch (err: any) {
      console.warn('[AI] generateLessonSummary fallback:', err?.message);
    }

    return buildFallbackDailySummary(lesson, attempts, profile, timeSpentMinutes);
  }

  public async generateWordPractice(
    word: string,
    contextSentence: string,
    profile: UserProfile,
    majorOrField?: string
  ): Promise<WordPracticeData> {
    const cleaned = word.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (!cleaned) {
      throw new AIException('INVALID_REQUEST', 'Please provide a valid word or phrase to learn.', { retryable: false });
    }

    const systemPrompt = buildWordPracticeSystemPrompt(cleaned, contextSentence, profile, majorOrField);
    const prompt = `Break down and create practice micro-exercise for vocabulary: "${cleaned}".`;

    try {
      const aiResult = await this.callGeminiJson<WordPracticeData>(prompt, systemPrompt, {
        userId: profile.id,
        operation: 'word_practice'
      });

      if (aiResult && (aiResult.meaning_vi || aiResult.word_family)) {
        const exercises = Array.isArray(aiResult.exercises) && aiResult.exercises.length > 0
          ? aiResult.exercises
          : [];

        let wordFamily = aiResult.word_family;
        if (!wordFamily || !Array.isArray(wordFamily.members) || wordFamily.members.length === 0) {
          const fallbackData = buildRuleBasedWordFamily(cleaned, contextSentence, profile, majorOrField);
          wordFamily = fallbackData.word_family;
          if (exercises.length === 0) {
            exercises.push(...fallbackData.exercises);
          }
        }

        const practiceQuestion = aiResult.practice_question || (exercises.length > 0 ? {
          prompt: exercises[0].prompt,
          options: exercises[0].options.map(o => ({ id: o.id, text: o.text })),
          expected_answer_id: exercises[0].expected_answer_id,
          expected_answer_text: exercises[0].expected_answer_text,
          explanation: exercises[0].vietnamese_explanation,
          hint: exercises[0].hint || 'Choose the correct grammatical form.'
        } : undefined);

        return {
          ...aiResult,
          word: aiResult.word || cleaned,
          cleaned_word: cleaned,
          context_in_exam: contextSentence,
          word_family: wordFamily,
          exercises,
          practice_question: practiceQuestion
        };
      }
    } catch (err: any) {
      console.warn('[AI] generateWordPractice error, using morphological fallback:', err?.message);
      return buildRuleBasedWordFamily(cleaned, contextSentence, profile, majorOrField);
    }

    return buildRuleBasedWordFamily(cleaned, contextSentence, profile, majorOrField);
  }
}

export const aiService = new GeminiLearningProvider();
