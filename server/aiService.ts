import { GoogleGenAI } from '@google/genai';
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
  DeepDiveInquiryResponse
} from '../src/types/learning.js';
import { budgetManager } from './usageBudget.js';
import { contentCache } from './contentCache.js';
import { AIException, classifyGeminiError, type AIErrorCode } from './aiErrors.js';
import { sanitizeAndReconcileQuestion } from './questionUtils.js';

// Import modular prompt builders
import { buildDiscoverySystemPrompt } from './prompts/discoveryPrompts.js';
import { buildLessonPlanSystemPrompt, buildQuestionSystemPrompt } from './prompts/lessonPrompts.js';
import { buildContrastExplanationPrompt } from './prompts/evaluationPrompts.js';
import { buildTutorAssistPrompt, buildDeepDiveSystemPrompt, buildLessonSummarySystemPrompt } from './prompts/tutorPrompts.js';

// Import modular fallbacks and helpers
import { fallbackDiscoveryTurn } from './fallbacks/diagnosticFallbacks.js';
import { polishWritingText, fallbackQuestion } from './fallbacks/lessonFallbacks.js';
import { evaluateMultipleChoiceAnswer, buildFallbackDailySummary, buildFallbackTomorrowPlan } from './evaluators/lessonHelpers.js';
import { diagnosticService } from './services/diagnosticService.js';

export { AIException, classifyGeminiError, type AIErrorCode };

export interface LearningModelProvider {
  generateLessonPlan(profile: UserProfile, skillStates: LearnerSkillState[], recentErrors: string[]): Promise<LessonPlan>;
  generateQuestion(section: SectionType, profile: UserProfile, targetSkillName?: string, contextTopic?: 'general' | 'workplace_tech', activityType?: string, questionIndex?: number, totalInActivity?: number, sessionObjective?: string): Promise<Question>;
  evaluateAnswer(question: Question, userAnswer: string, profile: UserProfile): Promise<AnswerEvaluation>;
  tutorAssist(question: Question, action: 'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity', profile: UserProfile): Promise<TutorAssistantResponse>;
  generateLessonSummary(lesson: LessonPlan, attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>, profile: UserProfile, timeSpentMinutes?: number): Promise<DailySummary>;
  handleDiscoveryTurn(history: DiscoveryMessage[], userMessage: string, currentProfile: UserProfile): Promise<any>;
  generateAdaptiveDiagnosticQuestion(session: DiagnosticSession, profile: UserProfile): Promise<Question>;
  evaluateDiagnosticAnswer(question: Question, userAnswer: string, profile: UserProfile): Promise<{ evaluation: AnswerEvaluation; writingRubric?: WritingRubricScore }>;
  computeDiagnosticReport(session: DiagnosticSession, profile: UserProfile): Promise<DiagnosticReport>;
  generatePersonalizedStudyPlan(report: DiagnosticReport, profile: UserProfile): Promise<PersonalizedStudyPlan>;
  deepDiveInquiry(question: Question, userAnswer: string, evaluation: AnswerEvaluation | undefined, message: string, history: Array<{ role: 'user' | 'tutor'; content: string }>, profile: UserProfile): Promise<DeepDiveInquiryResponse>;
}

export class GeminiLearningProvider implements LearningModelProvider {
  private ai: GoogleGenAI | null = null;
  private modelCandidates = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  private quotaCooldownUntil = 0;
  private servedQuestionHistory: string[] = [];
  private currentApiKey?: string;
  private mockHandler: ((prompt: string, systemInstruction: string, options?: { userId?: string; operation?: string }) => any) | null = null;
  public isFallbackActive = false;
  public lastFallbackReason = '';

  public setApiKey(key?: string): void {
    this.currentApiKey = key;
  }

  private getAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
    if (!this.ai || this.currentApiKey !== apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.currentApiKey = apiKey;
        this.quotaCooldownUntil = 0;
      } catch (err) {
        console.warn('Could not initialize GoogleGenAI client:', err);
        return null;
      }
    }
    return this.ai;
  }

  constructor() {
    this.getAiClient();
  }

  public setMockHandler(handler: ((prompt: string, systemInstruction: string, options?: { userId?: string; operation?: string }) => any) | null): void {
    this.mockHandler = handler;
  }

  public isQuotaExhausted(): boolean {
    if (Date.now() < this.quotaCooldownUntil) return true;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') return false;
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

    if (this.isQuotaExhausted()) {
      this.isFallbackActive = true;
      this.lastFallbackReason = 'API quota cooldown active.';
      throw new AIException(
        'QUOTA_EXHAUSTED',
        "AI usage limit reached. We're unable to process your request right now. Please try again later.",
        { retryable: false, retryAfterSeconds: 60 }
      );
    }

    const budgetStatus = budgetManager.checkAllowance(userId);
    if (!budgetStatus.allowed) {
      this.isFallbackActive = true;
      this.lastFallbackReason = budgetStatus.reason || 'Usage budget limit reached.';
      return null;
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
  public async generateLessonPlan(profile: UserProfile, skillStates: LearnerSkillState[], recentErrors: string[], lessonHistory: any[] = []): Promise<LessonPlan> {
    const rawDuration = profile.daily_minutes || 20;
    const duration: 10 | 20 | 30 = rawDuration <= 12 ? 10 : rawDuration >= 25 ? 30 : 20;
    const paceMode = duration === 10 ? 'quick_10' : duration === 30 ? 'deep_30' : 'standard_20';
    const totalPlannedQuestions = duration === 10 ? 6 : duration === 30 ? 15 : 10;

    const cacheKey = contentCache.makeKey('lesson_plan', { level: profile.current_level, duration, goal: profile.primary_goal, lang: profile.explanation_language, historyLength: lessonHistory.length });
    const cachedPlan = lessonHistory.length > 0 ? null : contentCache.get<LessonPlan>(cacheKey);
    if (cachedPlan) return { ...cachedPlan, lesson_id: `lesson-${Date.now()}`, status: 'in_progress' };

    const systemPrompt = buildLessonPlanSystemPrompt(profile, skillStates, recentErrors, duration, paceMode, totalPlannedQuestions, lessonHistory);
    const prompt = `Create daily lesson plan for ${duration} mins (${paceMode}) advancing forward from previous history.`;

    try {
      const aiResult = await this.callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'lesson_plan' });
      if (aiResult && aiResult.sections && aiResult.sections.length > 0) {
        const parsedSections = aiResult.sections.map((s: any) => ({
          section: s.section,
          title: s.title,
          description: s.description,
          estimated_minutes: s.estimated_minutes,
          skill_target: s.skill_target,
          activity_type: s.activity_type || 'concept_practice',
          target_questions_count: s.target_questions_count || 2,
          completed_questions_count: 0,
          completed: false
        }));

        const plan: LessonPlan = {
          lesson_id: `lesson-${Date.now()}`,
          lesson_number: 1,
          date: new Date().toISOString().split('T')[0],
          primary_objective: aiResult.primary_objective,
          reason_for_selection: aiResult.reason_for_selection,
          estimated_duration_minutes: duration,
          session_pace_mode: paceMode,
          total_planned_questions: totalPlannedQuestions,
          sections: parsedSections,
          status: 'in_progress'
        };

        const fullyPopulatedPlan = await this.populatePlanQuestions(plan, profile);
        contentCache.set(cacheKey, fullyPopulatedPlan, 86400);
        return fullyPopulatedPlan;
      }
    } catch (err: any) {
      console.warn('[AI] generateLessonPlan fallback:', err?.message);
    }

    const fallbackPlan: LessonPlan = {
      lesson_id: `lesson-${Date.now()}`,
      lesson_number: 1,
      date: new Date().toISOString().split('T')[0],
      primary_objective: 'Standard Practice: Narrative Tense Precision & Workplace Writing',
      reason_for_selection: 'Balanced daily practice.',
      estimated_duration_minutes: duration,
      session_pace_mode: paceMode,
      total_planned_questions: totalPlannedQuestions,
      sections: [
        { section: 'grammar', title: 'Part 1 — Warm-up', description: 'Quick check', estimated_minutes: 3, target_questions_count: 2, completed_questions_count: 0, skill_target: 'Past Perfect', completed: false },
        { section: 'grammar', title: 'Part 2 — Core Concept', description: 'In-depth practice', estimated_minutes: 7, target_questions_count: 3, completed_questions_count: 0, skill_target: 'Conditionals', completed: false }
      ],
      status: 'in_progress'
    };

    return await this.populatePlanQuestions(fallbackPlan, profile);
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

    try {
      const result = await this.callGeminiJson<Question>(prompt, systemPrompt, { userId: profile.id, operation: 'lesson_question' });
      if (result && result.prompt) {
        const sanitized = sanitizeAndReconcileQuestion(result);
        return { ...sanitized, id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, section };
      }
    } catch (err: any) {
      console.warn('[AI] generateQuestion fallback:', err?.message);
    }

    return fallbackQuestion(section, questionIndex, this.servedQuestionHistory);
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
          explanation: `Well done! Option ${expectedId} is correct. ${question.explanation_rule || ''}`,
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
        explanation: `Not quite. Option ${expectedId} is correct. ${question.explanation_rule || ''}`,
        contrast_explanation: contrastExplanation,
        error_tags: ['distractor_choice'],
        needs_retry: true,
        next_action: 'retry'
      };
    }

    if (question.question_type === 'free_writing') {
      const polished = polishWritingText(trimmed, question.prompt, profile);
      const isSufficient = trimmed.length >= 25;
      return {
        verdict: isSufficient ? 'correct' : 'partially_correct',
        user_answer: userAnswer,
        expected_answer: 'Coherent written output',
        full_correct_sentence: polished.polishedText,
        decisive_clue: isVi ? 'Ý văn truyền tải tốt.' : 'Clear communicative phrasing.',
        explanation: isVi ? 'Bài viết mạch lạc! Tham khảo phiên bản trau chuốt bên dưới.' : 'Good response! Review the polished native version below.',
        corrected_text: polished.polishedText,
        key_corrections: polished.keyCorrections,
        useful_phrases: polished.usefulPhrases,
        reusable_pattern: polished.reusablePattern,
        error_tags: [],
        needs_retry: false,
        next_action: 'continue'
      };
    }

    return {
      verdict: 'incorrect',
      user_answer: userAnswer,
      expected_answer: question.expected_answer_text || '',
      full_correct_sentence: question.prompt,
      decisive_clue: question.explanation_rule || 'Check time anchors and word forms.',
      explanation: question.explanation_rule || 'Review key grammar structure.',
      error_tags: [question.skill_name],
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
      if (aiResult && aiResult.reply) return aiResult;
    } catch (err: any) {
      console.warn('[AI] deepDiveInquiry fallback:', err?.message);
    }

    return {
      reply: `### Tutor Explanation:\n\nRegarding **"${message}"** for ${question.skill_name}:\n\n• **Core Rule:** ${question.explanation_rule || 'Focus on precision and natural cadence.'}`,
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
}

export const aiService = new GeminiLearningProvider();
