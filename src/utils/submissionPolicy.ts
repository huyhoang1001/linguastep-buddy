import { Question } from '../types/learning.ts';

export type SubmissionType = 'auto_assess' | 'explicit_submit';

export const AUTO_SUBMIT_NOTE = 'Choose carefully — your answer is submitted immediately.';

/**
 * Determines whether a question or exercise should auto-assess on option click
 * or require explicit manual submission ("Check Answer").
 */
export function getSubmissionType(question: Partial<Question> | null | undefined): SubmissionType {
  if (!question) return 'explicit_submit';

  const type = question.question_type;

  // Manual submission question types (text inputs, compositions, open-ended)
  if (type === 'fill_in_blank' || type === 'sentence_rewrite' || type === 'free_writing') {
    return 'explicit_submit';
  }

  // Single-choice multiple choice is auto-assessed immediately
  if (type === 'multiple_choice') {
    return 'auto_assess';
  }

  // Reading comprehension or other questions with choice options
  if (Array.isArray(question.options) && question.options.length > 0) {
    return 'auto_assess';
  }

  return 'explicit_submit';
}

/**
 * Helper to check if a question auto-assesses upon answer selection.
 */
export function isAutoAssessQuestion(question: Partial<Question> | null | undefined): boolean {
  return getSubmissionType(question) === 'auto_assess';
}
