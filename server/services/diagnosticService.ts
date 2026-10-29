import {
  AnswerEvaluation,
  DiagnosticReport,
  DiagnosticSession,
  PersonalizedStudyPlan,
  Question,
  SectionType,
  UserProfile,
  WritingRubricScore
} from '../../src/types/learning.js';
import { createDiagnosticAssessmentPlan } from '../../src/types/diagnosticPlans.js';
import { sanitizeAndReconcileQuestion } from '../questionUtils.js';
import { AIException } from '../aiErrors.js';
import { CEFREvaluator } from '../../src/services/cefrEvaluator.js';

import {
  buildAdaptiveDiagnosticSystemPrompt,
  buildDiagnosticReportSystemPrompt,
  buildPersonalizedStudyPlanPrompt,
  buildDiagnosticBatchSystemPrompt
} from '../prompts/diagnosticPrompts.js';
import { buildWritingRubricPrompt } from '../prompts/evaluationPrompts.js';

import {
  createFallbackWritingRubric,
  buildFallbackDiagnosticReport,
  buildFallbackPersonalizedStudyPlan
} from '../evaluators/diagnosticHelpers.js';

export class DiagnosticService {
  public async generateDiagnosticBatchQuestions(
    callGeminiJson: <T>(prompt: string, sysPrompt: string, opts?: any) => Promise<T | null>,
    session: DiagnosticSession,
    profile: UserProfile
  ): Promise<Question[]> {
    const plan = session.plan || createDiagnosticAssessmentPlan(session.mode, profile.explanation_language);
    session.plan = plan;

    const systemPrompt = buildDiagnosticBatchSystemPrompt(session.mode, plan, profile);
    const prompt = `Generate the complete calibrated suite of ${plan.totalQuestions} assessment questions for ${session.mode} mode.`;

    const response = await callGeminiJson<{ questions: Question[] }>(prompt, systemPrompt, {
      userId: profile.id,
      operation: 'diagnostic_batch_questions'
    });

    if (response && Array.isArray(response.questions) && response.questions.length > 0) {
      const sanitizedList = response.questions.map((q, idx) => {
        const sanitized = sanitizeAndReconcileQuestion(q);
        return {
          ...sanitized,
          id: sanitized.id || `diag-batch-${Date.now()}-${idx + 1}`
        };
      });

      if (sanitizedList.length >= plan.sections.length) {
        return sanitizedList;
      }
    }

    throw new AIException('SERVICE_UNAVAILABLE', 'Failed to generate diagnostic assessment questions from AI.', { retryable: true });
  }

  public async generateAdaptiveDiagnosticQuestion(
    callGeminiJson: <T>(prompt: string, sysPrompt: string, opts?: any) => Promise<T | null>,
    session: DiagnosticSession,
    profile: UserProfile
  ): Promise<Question> {
    const answered = session.history;
    const answeredIds = new Set(answered.map(a => a.question.id));
    const answeredPrompts = new Set(answered.map(a => a.question.prompt.trim().toLowerCase()));

    const plan = session.plan || createDiagnosticAssessmentPlan(session.mode, profile.explanation_language);
    session.plan = plan;

    let activeSectionIndex = 0;
    let activeSectionPlan = plan.sections[0];
    for (let i = 0; i < plan.sections.length; i++) {
      const sec = plan.sections[i];
      if (answered.filter(a => a.question.section === sec.section).length < sec.targetQuestionsCount) {
        activeSectionIndex = i;
        activeSectionPlan = sec;
        break;
      }
    }

    session.currentSectionIndex = activeSectionIndex;
    const targetSection: SectionType = activeSectionPlan.section;
    const secAttempts = answered.filter(a => a.question.section === targetSection);
    session.questionIndexInSection = secAttempts.length;

    const correctInSec = secAttempts.filter(a => a.verdict === 'correct').length;
    const accuracy = secAttempts.length > 0 ? correctInSec / secAttempts.length : 0.5;
    const levels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1'> = ['A1', 'A2', 'B1', 'B2', 'C1'];
    let initialBaseline = (profile.current_level as any) || 'A1';
    if (!levels.includes(initialBaseline)) initialBaseline = 'A1';
    let levelIdx = levels.indexOf(initialBaseline);
    if (secAttempts.length >= 1) {
      if (accuracy >= 0.75 && levelIdx < levels.length - 1) levelIdx++;
      else if (accuracy < 0.4 && levelIdx > 0) levelIdx--;
    }
    const targetLevel = levels[Math.max(0, Math.min(levels.length - 1, levelIdx))];

    const isTechGoal = profile.primary_goal === 'workplace_tech';
    const topic: 'general' | 'workplace_tech' = isTechGoal ? 'workplace_tech' : 'general';
    const existingPassage = targetSection === 'reading' && secAttempts.length > 0 ? secAttempts[secAttempts.length - 1].question.reading_passage : null;

    const systemPrompt = buildAdaptiveDiagnosticSystemPrompt(targetSection, activeSectionPlan, session.questionIndexInSection, targetLevel, topic, profile, answered, existingPassage);
    const prompt = `Generate item ${session.questionIndexInSection + 1}/${activeSectionPlan.targetQuestionsCount} for section ${targetSection} at CEFR ${targetLevel}.`;

    const generated = await callGeminiJson<Question>(prompt, systemPrompt, { userId: profile.id, operation: 'diagnostic_question' });
    if (generated && generated.prompt && !answeredIds.has(generated.id) && !answeredPrompts.has(generated.prompt.trim().toLowerCase())) {
      const sanitized = sanitizeAndReconcileQuestion(generated);
      return { ...sanitized, id: `diag-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, section: targetSection, difficulty: sanitized.difficulty || targetLevel };
    }

    throw new AIException('SERVICE_UNAVAILABLE', 'Failed to generate diagnostic question from AI.', { retryable: true });
  }

  public async evaluateDiagnosticAnswer(
    callGeminiJson: <T>(prompt: string, sysPrompt: string, opts?: any) => Promise<T | null>,
    evaluateStandardAnswer: (question: Question, userAnswer: string, profile: UserProfile) => Promise<AnswerEvaluation>,
    question: Question,
    userAnswer: string,
    profile: UserProfile
  ): Promise<{ evaluation: AnswerEvaluation; writingRubric?: WritingRubricScore }> {
    if (question.question_type === 'free_writing') {
      const systemPrompt = buildWritingRubricPrompt(question, userAnswer, profile);
      const prompt = `Evaluate free writing submission for ${question.skill_name}.`;
      let aiRubric: any = null;
      try {
        aiRubric = await callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'diagnostic_evaluate' });
      } catch (err: any) {
        console.warn('[AI] evaluateDiagnosticAnswer fallback:', err?.message);
      }

      const rubric = createFallbackWritingRubric(userAnswer, question.prompt, profile, aiRubric);
      const isPass = rubric.accuracy >= 3;

      const evaluation: AnswerEvaluation = {
        verdict: isPass ? 'correct' : 'partially_correct',
        user_answer: userAnswer,
        expected_answer: 'Original coherent workplace update.',
        full_correct_sentence: rubric.correctedVersion || userAnswer,
        decisive_clue: 'Clear structure and communication.',
        explanation: rubric.feedbackSummary,
        error_tags: isPass ? [] : ['Writing structure'],
        needs_retry: false,
        next_action: 'continue'
      };

      return { evaluation, writingRubric: rubric };
    }

    const evalResult = await evaluateStandardAnswer(question, userAnswer, profile);
    return { evaluation: evalResult };
  }

  public async computeDiagnosticReport(
    callGeminiJson: <T>(prompt: string, sysPrompt: string, opts?: any) => Promise<T | null>,
    session: DiagnosticSession,
    profile: UserProfile
  ): Promise<DiagnosticReport> {
    const attempts = session.history;
    const totalCount = attempts.length;
    const correctCount = attempts.filter(a => a.verdict === 'correct').length;

    // Use difficulty-weighted, coverage-aware CEFR assessment
    const cefrResult = CEFREvaluator.evaluateAttempts(attempts.map(a => ({
      question: {
        section: a.question.section,
        difficulty: a.question.difficulty,
        skill_name: a.question.skill_name
      },
      verdict: a.verdict
    })));

    const placedLevel = cefrResult.placedLevel;
    const percentage = cefrResult.compositeScore;
    const confidence = cefrResult.confidence;

    const systemPrompt = buildDiagnosticReportSystemPrompt(session, profile, percentage, placedLevel as any);
    const prompt = `Compute diagnostic report for learner at ${placedLevel} based on evidence: ${cefrResult.rationale}`;

    try {
      const aiReport = await callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'diagnostic_report' });
      if (aiReport && aiReport.summary) {
        return {
          id: `diag-report-${Date.now()}`,
          sessionId: session.sessionId,
          mode: session.mode,
          completedAt: new Date().toISOString(),
          overallCEFR: placedLevel,
          overallScorePercentage: percentage,
          overallConfidence: confidence,
          overallSummary: aiReport.summary || cefrResult.rationale,
          skillEstimates: session.currentEstimates,
          demonstratedStrengths: aiReport.strengths || [],
          priorityWeaknesses: aiReport.weaknesses || [],
          recurringErrors: [],
          totalQuestionsAnswered: totalCount,
          accuracyRate: totalCount > 0 ? correctCount / totalCount : 1
        };
      }
    } catch (err: any) {
      console.warn('[AI] computeDiagnosticReport fallback:', err?.message);
    }

    const fallback = buildFallbackDiagnosticReport(session, profile, totalCount, correctCount, placedLevel, percentage);
    return {
      ...fallback,
      overallConfidence: confidence,
      overallSummary: `${fallback.overallSummary} ${cefrResult.rationale}`
    };
  }

  public async generatePersonalizedStudyPlan(
    callGeminiJson: <T>(prompt: string, sysPrompt: string, opts?: any) => Promise<T | null>,
    report: DiagnosticReport,
    profile: UserProfile
  ): Promise<PersonalizedStudyPlan> {
    const systemPrompt = buildPersonalizedStudyPlanPrompt(report.overallCEFR as any, profile);
    const prompt = `Generate study plan for level ${report.overallCEFR}.`;

    try {
      const aiPlan = await callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'study_plan' });
      if (aiPlan && aiPlan.title) {
        return {
          id: `plan-${Date.now()}`,
          learnerId: profile.id,
          diagnosticReportId: report.id,
          overallObjective: aiPlan.title,
          diagnosticSummary: report.overallSummary,
          prioritizedSkills: [],
          shortTermMilestones: ['Master Past Narrative', 'Inversion Structures'],
          suggestedWeeklyRoutine: [{ day: 'Monday', focus: 'Grammar & Writing', minutes: 20 }],
          dailyRoutineTemplate: [{ section: 'grammar', title: 'Concept Practice', minutes: 10, target: 'Precision' }],
          spacedReviewStrategy: '3-day repetition curve',
          progressCheckIntervalDays: 7,
          learnerApprovalStatus: 'approved',
          createdAt: new Date().toISOString()
        };
      }
    } catch (err: any) {
      console.warn('[AI] generatePersonalizedStudyPlan fallback:', err?.message);
    }

    return buildFallbackPersonalizedStudyPlan(report, profile);
  }
}

export const diagnosticService = new DiagnosticService();
