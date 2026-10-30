import { Question } from '../src/types/learning.js';

export function sanitizeAndReconcileQuestion(q: Question): Question {
  const question = { ...q };
  if (!question.prompt) return question;

  if (Array.isArray(question.options) && question.options.length > 0) {
    const validLetterRegex = /^[A-D]$/i;
    const invalidLetterKeys = question.expected_answer_ids?.filter(id => !validLetterRegex.test(id.trim())) || [];

    if (invalidLetterKeys.length > 0 || !question.expected_answer_ids || question.expected_answer_ids.length === 0) {
      const expectedTextLower = (question.expected_answer_text || '').trim().toLowerCase();
      const matchedOpt = question.options.find(o => o.text.trim().toLowerCase() === expectedTextLower) || question.options[0];
      question.expected_answer_ids = [matchedOpt.id];
      question.expected_answer_text = matchedOpt.text;
    } else if (question.expected_answer_text) {
      const expectedTextLower = question.expected_answer_text.trim().toLowerCase();
      const matchedOpt = question.options.find(o => o.text.trim().toLowerCase() === expectedTextLower);
      if (matchedOpt && !question.expected_answer_ids.some(id => id.trim().toUpperCase() === matchedOpt.id.toUpperCase())) {
        question.expected_answer_ids = [matchedOpt.id];
      }
    }
  }

  const hasBlankInPrompt = /[_]{2,}|\[\.\.\.\]|\.{3,}/.test(question.prompt || '');

  if (question.context_sentence && question.context_sentence.trim().length > 5) {
    const cleanContext = question.context_sentence.trim();
    const cleanPrompt = (question.prompt || '').trim();
    if (!cleanPrompt.toLowerCase().includes(cleanContext.toLowerCase())) {
      const isInstructionOnly = /complete the sentence|fill in the blank|choos.*to complete|select.*to complete|which.*best completes/i.test(cleanPrompt) || !hasBlankInPrompt;
      if (isInstructionOnly) {
        question.prompt = `${cleanPrompt}\n\n"${cleanContext}"`;
      }
    }
  } else if (!hasBlankInPrompt && question.section !== 'reading' && question.question_type !== 'free_writing' && question.question_type !== 'reading_comprehension') {
    const synthesizedSentence = `The team faced a challenging situation; ________, we delivered all project milestones on schedule.`;
    question.context_sentence = synthesizedSentence;
    question.prompt = `${question.prompt.trim()}\n\n"${synthesizedSentence}"`;
  }

  return question;
}
