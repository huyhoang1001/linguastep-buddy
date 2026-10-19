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
import { DIAGNOSTIC_BANK } from '../diagnosticBank.js';
import { sanitizeAndReconcileQuestion } from '../questionUtils.js';

import {
  buildAdaptiveDiagnosticSystemPrompt,
  buildDiagnosticReportSystemPrompt,
  buildPersonalizedStudyPlanPrompt
} from '../prompts/diagnosticPrompts.js';
import { buildWritingRubricPrompt } from '../prompts/evaluationPrompts.js';

import {
  createFallbackWritingRubric,
  buildFallbackDiagnosticReport,
  buildFallbackPersonalizedStudyPlan
} from '../evaluators/diagnosticHelpers.js';

export class DiagnosticService {
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
    const levels: Array<'A2' | 'B1' | 'B2' | 'C1'> = ['A2', 'B1', 'B2', 'C1'];
    let levelIdx = levels.indexOf((profile.current_level as any) || 'B2');
    if (secAttempts.length >= 2) {
      if (accuracy >= 0.8 && levelIdx < levels.length - 1) levelIdx++;
      else if (accuracy < 0.4 && levelIdx > 0) levelIdx--;
    }
    const targetLevel = levels[Math.max(0, Math.min(levels.length - 1, levelIdx))];

    const isTechGoal = profile.primary_goal === 'workplace_tech';
    const topic: 'general' | 'workplace_tech' = isTechGoal ? 'workplace_tech' : 'general';
    const existingPassage = targetSection === 'reading' && secAttempts.length > 0 ? secAttempts[secAttempts.length - 1].question.reading_passage : null;

    const systemPrompt = buildAdaptiveDiagnosticSystemPrompt(targetSection, activeSectionPlan, session.questionIndexInSection, targetLevel, topic, profile, answered, existingPassage);
    const prompt = `Generate item ${session.questionIndexInSection + 1}/${activeSectionPlan.targetQuestionsCount} for section ${targetSection} at CEFR ${targetLevel}.`;

    try {
      const generated = await callGeminiJson<Question>(prompt, systemPrompt, { userId: profile.id, operation: 'diagnostic_question' });
      if (generated && generated.prompt && !answeredIds.has(generated.id) && !answeredPrompts.has(generated.prompt.trim().toLowerCase())) {
        const sanitized = sanitizeAndReconcileQuestion(generated);
        return { ...sanitized, id: `diag-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, section: targetSection, difficulty: sanitized.difficulty || targetLevel };
      }
    } catch (err: any) {
      console.warn('[AI] generateAdaptiveDiagnosticQuestion fallback:', err?.message);
    }

    const bankCandidates = DIAGNOSTIC_BANK.filter(item => item.category === targetSection && !answeredIds.has(item.question.id) && !answeredPrompts.has(item.question.prompt.trim().toLowerCase()));
    const selected = bankCandidates[0] || DIAGNOSTIC_BANK[0];
    return selected.question;
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
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 75;
    const placedLevel = percentage >= 85 ? 'C1' : percentage >= 70 ? 'B2' : percentage >= 50 ? 'B1' : 'A2';

    const systemPrompt = buildDiagnosticReportSystemPrompt(session, profile, percentage, placedLevel as any);
    const prompt = `Compute diagnostic report for learner at ${placedLevel}.`;

    try {
      const aiReport = await callGeminiJson<any>(prompt, systemPrompt, { userId: profile.id, operation: 'diagnostic_report' });
      if (aiReport && aiReport.summary) {
        return {
          id: `diag-report-${Date.now()}`,
          sessionId: session.sessionId,
          mode: session.mode,
          completedAt: new Date().toISOString(),
          overallCEFR: aiReport.overallLevel || placedLevel,
          overallScorePercentage: percentage,
          overallConfidence: 'high',
          overallSummary: aiReport.summary,
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

    return buildFallbackDiagnosticReport(session, profile, totalCount, correctCount, placedLevel, percentage);
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
