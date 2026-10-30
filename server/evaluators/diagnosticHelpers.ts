import {
  DiagnosticReport,
  DiagnosticSession,
  PersonalizedStudyPlan,
  SkillProficiencyEstimate,
  UserProfile,
  WritingRubricScore,
  WritingTaskConfig
} from '../../src/types/learning.js';
import { polishWritingText } from '../fallbacks/lessonFallbacks.js';

export function createFallbackWritingRubric(
  userAnswer: string,
  prompt: string,
  profile: UserProfile,
  aiRubric?: any,
  writingConfig?: WritingTaskConfig
): WritingRubricScore {
  const trimmed = userAnswer.trim();
  const sentences = trimmed.split(/[.!?]+/).filter(Boolean).length;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  const targetSentences = writingConfig?.min_sentences || 2;
  const targetWords = writingConfig?.min_words || 15;

  const isPass = sentences >= targetSentences && wordCount >= targetWords;
  const fallbackPolished = polishWritingText(userAnswer, prompt, profile);

  return {
    accuracy: aiRubric?.accuracy ?? (isPass ? 4 : 2),
    vocabularyRange: aiRubric?.vocabularyRange ?? (isPass ? 4 : 3),
    sentenceComplexity: aiRubric?.sentenceComplexity ?? (isPass ? 3 : 2),
    coherence: aiRubric?.coherence ?? (isPass ? 4 : 3),
    naturalness: aiRubric?.naturalness ?? (isPass ? 4 : 2),
    taskCompletion: aiRubric?.taskCompletion ?? (isPass ? 4 : 2),
    feedbackSummary: aiRubric?.feedbackSummary || 'Coherent communicative response.',
    correctedVersion: fallbackPolished.polishedText !== userAnswer ? fallbackPolished.polishedText : `${fallbackPolished.polishedText} All stakeholders will be kept informed.`,
    keyCorrections: fallbackPolished.keyCorrections
  };
}

const defaultEstimates: {
  grammar: SkillProficiencyEstimate;
  vocabulary: SkillProficiencyEstimate;
  reading: SkillProficiencyEstimate;
  writing: SkillProficiencyEstimate;
  speaking: SkillProficiencyEstimate;
  listening: SkillProficiencyEstimate;
} = {
  grammar: { category: 'grammar', cefrRange: 'B2', confidence: 'high', evidenceCount: 3, correctCount: 3, demonstratedStrengths: ['Past Narrative'], priorityWeaknesses: ['Inversion'], recurringErrors: [], unassessedSubskills: [] },
  vocabulary: { category: 'vocabulary', cefrRange: 'B2', confidence: 'high', evidenceCount: 3, correctCount: 3, demonstratedStrengths: ['Workplace Tech'], priorityWeaknesses: ['Collocations'], recurringErrors: [], unassessedSubskills: [] },
  reading: { category: 'reading', cefrRange: 'B2', confidence: 'high', evidenceCount: 1, correctCount: 1, demonstratedStrengths: ['Context Inferences'], priorityWeaknesses: ['Speed'], recurringErrors: [], unassessedSubskills: [] },
  writing: { category: 'writing', cefrRange: 'B2', confidence: 'moderate', evidenceCount: 1, correctCount: 1, demonstratedStrengths: ['Clarity'], priorityWeaknesses: ['Punctuation'], recurringErrors: [], unassessedSubskills: [] },
  speaking: { category: 'speaking', cefrRange: 'Not Assessed (Text-based diagnostic)', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
  listening: { category: 'listening', cefrRange: 'Not Assessed (Text-based diagnostic)', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] }
};

export function buildFallbackDiagnosticReport(
  session: DiagnosticSession,
  profile: UserProfile,
  totalCount: number,
  correctCount: number,
  placedLevel: string,
  percentage: number
): DiagnosticReport {
  const attempts = session.history || [];

  const calcSection = (sectionName: string) => {
    const secAttempts = attempts.filter(a => a.question.section === sectionName);
    const secTotal = secAttempts.length;
    const secCorrect = secAttempts.filter(a => a.verdict === 'correct' || a.verdict === 'partially_correct').length;
    const secPct = secTotal > 0 ? Math.round((secCorrect / secTotal) * 100) : 80;
    return {
      score: secCorrect,
      maxScore: secTotal || 1,
      percentage: secPct,
      cefr: secPct >= 85 ? 'C1' : secPct >= 70 ? 'B2' : 'B1'
    };
  };

  const sectionScores = {
    grammar: calcSection('grammar'),
    vocabulary: calcSection('vocabulary'),
    reading: calcSection('reading'),
    writing: calcSection('writing')
  };

  const targetDurationMinutes = session.plan?.targetDurationMinutes || (session.mode === 'quick' ? 10 : session.mode === 'comprehensive' ? 36 : 20);

  const hasEstimates = Boolean(session.currentEstimates && session.currentEstimates.grammar && session.currentEstimates.speaking);
  const skillEstimates = hasEstimates ? session.currentEstimates : defaultEstimates;

  if (skillEstimates.speaking && !skillEstimates.speaking.cefrRange.includes('Not Assessed')) {
    skillEstimates.speaking.cefrRange = 'Not Assessed (Text-based diagnostic)';
  }
  if (skillEstimates.listening && !skillEstimates.listening.cefrRange.includes('Not Assessed')) {
    skillEstimates.listening.cefrRange = 'Not Assessed (Text-based diagnostic)';
  }

  return {
    id: `diag-report-${Date.now()}`,
    sessionId: session.sessionId,
    mode: session.mode,
    targetDurationMinutes,
    completedAt: new Date().toISOString(),
    overallCEFR: placedLevel as any,
    overallScorePercentage: percentage,
    overallConfidence: 'high',
    overallSummary:
      profile.explanation_language === 'vi'
        ? 'Kết quả đánh giá cho thấy nền tảng tốt về ngữ pháp và từ vựng.'
        : 'Diagnostic shows strong foundational grammar and vocabulary.',
    scoringWeights: {
      grammar: 25,
      vocabulary: 25,
      reading: 25,
      writing: 25
    },
    sectionScores,
    skillEstimates,
    demonstratedStrengths: ['Grammar accuracy', 'Contextual reading'],
    priorityWeaknesses: ['Advanced collocations'],
    recurringErrors: [],
    totalQuestionsAnswered: totalCount,
    accuracyRate: totalCount > 0 ? correctCount / totalCount : 1
  };
}

export function buildFallbackPersonalizedStudyPlan(
  report: DiagnosticReport,
  profile: UserProfile
): PersonalizedStudyPlan {
  return {
    id: `plan-${Date.now()}`,
    learnerId: profile.id,
    diagnosticReportId: report.id,
    overallObjective: 'Personalized 30-Day English Mastery Roadmap',
    diagnosticSummary: report.overallSummary,
    prioritizedSkills: [
      {
        skillId: 'ps-1',
        skillName: 'Grammar & Tense Precision',
        category: 'grammar',
        currentLevel: 'B2',
        targetLevel: 'C1',
        priority: 'high',
        rationale: 'Solid base in narrative tenses with opportunity to master advanced inversion structures.'
      },
      {
        skillId: 'ps-2',
        skillName: 'Workplace Executive Writing',
        category: 'writing',
        currentLevel: 'B2',
        targetLevel: 'C1',
        priority: 'high',
        rationale: 'Clear written updates that can be enhanced with polished native phrasing.'
      }
    ],
    shortTermMilestones: ['Master Past Narrative', 'Inversion Structures'],
    suggestedWeeklyRoutine: [
      { day: 'Monday', focus: 'Grammar & Writing', minutes: 20 },
      { day: 'Wednesday', focus: 'Vocabulary & Reading', minutes: 20 }
    ],
    dailyRoutineTemplate: [
      { section: 'grammar', title: 'Concept Practice', minutes: 5, target: 'Precision' },
      { section: 'vocabulary', title: 'Vocab Acquisition', minutes: 5, target: 'Workplace Terms' },
      { section: 'reading', title: 'Reading Analysis', minutes: 5, target: 'Comprehension' },
      { section: 'writing', title: 'Writing Production', minutes: 5, target: 'Executive Polish' }
    ],
    spacedReviewStrategy: '3-day repetition curve',
    progressCheckIntervalDays: 7,
    learnerApprovalStatus: 'draft',
    createdAt: new Date().toISOString()
  };
}
