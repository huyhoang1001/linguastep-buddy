import {
  AnswerEvaluation,
  DailySummary,
  LessonPlan,
  Question,
  SectionType,
  TomorrowPlanPreview,
  UserProfile
} from '../../src/types/learning.js';
import { polishWritingText } from '../fallbacks/lessonFallbacks.js';

export function normalizeAnswerText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"“”()[\]{}]/g, '')
    .replace(/\s+/g, ' ');
}

export function evaluateMultipleChoiceAnswer(
  question: Question,
  trimmedUserAnswer: string
): { isCorrect: boolean; selectedOption?: { id: string; text: string }; expectedId: string; expectedText: string } {
  const options = question.options || [];
  const expectedOption = options.find(o =>
    question.expected_answer_ids?.some(id => id.trim().toUpperCase() === o.id.toUpperCase())
  ) || options[0];

  const expectedId = expectedOption ? expectedOption.id.toUpperCase() : 'A';
  const expectedText = expectedOption ? expectedOption.text.trim() : (question.expected_answer_text || '');

  const normUser = normalizeAnswerText(trimmedUserAnswer);
  const normExpected = normalizeAnswerText(expectedText);

  // Match by letter ID ('A') or normalized option text ('what' vs 'What')
  const selectedOption = options.find(
    o => o.id.toUpperCase() === trimmedUserAnswer.trim().toUpperCase() ||
         normalizeAnswerText(o.text) === normUser
  );

  const selectedId = (selectedOption ? selectedOption.id : trimmedUserAnswer.trim()).toUpperCase();
  const acceptedAlts = (question.accepted_alternatives || []).map(normalizeAnswerText);

  const isCorrect =
    (selectedOption && selectedOption.id.toUpperCase() === expectedId) ||
    (selectedId === expectedId) ||
    (normUser === normExpected) ||
    acceptedAlts.includes(normUser);

  return { isCorrect, selectedOption, expectedId, expectedText };
}

export function buildFallbackTomorrowPlan(
  profile: UserProfile,
  targetMins: number
): TomorrowPlanPreview {
  const isVi = profile.explanation_language === 'vi';
  return {
    focus_title: isVi
      ? 'Kế hoạch ngày mai: Đảo ngữ phủ định (Inversion) & Viết báo cáo điều hành'
      : "Tomorrow's Focus: Negative Inversion & Executive Status Writing",
    review_topics: isVi
      ? ['Ôn lại Câu điều kiện trộn (If + had... would be)']
      : ['Review Mixed Conditionals & Past Perfect'],
    new_skills: isVi
      ? ['Đảo ngữ với trạng từ phủ định (Seldom, Rarely)', 'Từ vựng: Discrepancy, Bottleneck']
      : ['Negative Inversion (Seldom, Rarely)', 'Precision Vocab: Bottleneck, Discrepancy'],
    estimated_minutes: targetMins,
    preview_summary: isVi
      ? 'Phiên học ngày mai mở đầu bằng 3 phút ôn tập, sau đó chinh phục Đảo ngữ phủ định.'
      : "Tomorrow's session starts with a 3-min review followed by Negative Inversion."
  };
}

export function buildFallbackDailySummary(
  lesson: LessonPlan,
  attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>,
  profile: UserProfile,
  timeSpentMinutes?: number
): DailySummary {
  const totalQuestions = attempts.length;
  const correctCount = attempts.filter(a => a.evaluation.verdict === 'correct').length;
  const accuracy = totalQuestions > 0 ? Number((correctCount / totalQuestions).toFixed(2)) : 1.0;
  const sectionsPracticed = Array.from(new Set(attempts.map(a => a.question.section))) as SectionType[];
  const targetMins = lesson.estimated_duration_minutes || profile.daily_minutes || 20;
  const computedTimeSpent = timeSpentMinutes || Math.max(1, Math.round(targetMins * (totalQuestions / (lesson.total_planned_questions || totalQuestions || 4))));
  const paceMode = lesson.session_pace_mode || (targetMins <= 12 ? 'quick_10' : targetMins >= 25 ? 'deep_30' : 'standard_20');
  const fallbackTomorrowPlan = buildFallbackTomorrowPlan(profile, targetMins);

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
    key_takeaways: ['Mastered Past Perfect time anchors', 'Practiced concise status reporting'],
    vocabulary_learned: ['mitigate', 'streamline', 'leverage'],
    recurring_mistakes_flagged: [],
    next_review_topics: ['Mixed Conditionals'],
    tomorrow_plan: fallbackTomorrowPlan,
    learner_rating: 'about_right'
  };
}
