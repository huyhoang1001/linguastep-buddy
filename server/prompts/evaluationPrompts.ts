import { Question, UserProfile, QuestionOption } from '../../src/types/learning.js';

export function buildContrastExplanationPrompt(
  question: Question,
  expectedId: string,
  expectedText: string,
  selectedOption: QuestionOption | undefined,
  selectedText: string,
  lang: string
): string {
  const chosenStr = selectedOption ? `${selectedOption.id}. ${selectedOption.text}` : selectedText;

  return [
    'You are an empathetic, precise English tutor explaining why a student\'s answer was incorrect on a multiple-choice question.',
    `Language for explanation: ${lang}.`,
    `Section: ${question.section}`,
    `Prompt: "${(question.prompt || '').replace(/"/g, "'")}"`,
    'All Options:',
    (question.options || []).map(o => `${o.id}. ${o.text}`).join('\n'),
    `Correct Answer: ${expectedId}. ${expectedText}`,
    `Student's Chosen Option (INCORRECT): ${chosenStr}`,
    `Underlying rule / context: "${(question.explanation_rule || '').replace(/"/g, "'")}"`,
    '',
    'CRITICAL INSTRUCTIONS:',
    `1. Explain clearly in ${lang} WHY "${chosenStr}" is incorrect or suboptimal for this specific sentence/context.`,
    `2. Contrast it directly with WHY "${expectedId}. ${expectedText}" is the correct, natural choice.`,
    '3. Provide a decisive clue (1 concise sentence highlight) identifying the key signal word or structure.',
    '4. Categorize the error with 1-2 short error tags (e.g., "tense_confusion", "false_friend", "preposition_mismatch", "informal_register").',
    '',
    'Output strictly JSON:',
    '{',
    '  "contrast_explanation": "detailed contrast in ' + lang + '",',
    '  "decisive_clue": "1 concise sentence in ' + lang + '",',
    '  "error_tags": ["string"]',
    '}'
  ].join('\n');
}

export function buildWritingRubricPrompt(
  question: Question,
  userAnswer: string,
  profile: UserProfile
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';

  return `You are a native English writing examiner evaluating a learner's free-writing response.
Target Level: ${profile.current_level}.
Goal Context: ${profile.primary_goal || 'General/Workplace English'}.
Question Prompt: "${(question.prompt || '').replace(/"/g, "'")}".
Target Skill / Rule: ${question.skill_name || question.explanation_rule || 'Cohesive paragraph structure'}.
Learner Answer: "${userAnswer.replace(/"/g, "'")}".

Provide rigorous feedback in ${lang}:
1. Score each dimension on a 1.0 to 5.0 scale (accuracy, vocabularyRange, sentenceComplexity, coherence, naturalness, taskCompletion).
2. Polished Version: Provide a refined, native-sounding rephrasing of the learner's response.
3. Decisive Clue / Highlight: Point out 1 specific grammar/word choice improvement.
4. Reusable Pattern: Provide 1 key sentence template or connector pattern the learner can reuse.

Output strictly JSON:
{
  "accuracy": number,
  "vocabularyRange": number,
  "sentenceComplexity": number,
  "coherence": number,
  "naturalness": number,
  "taskCompletion": number,
  "feedbackSummary": string,
  "correctedVersion": string,
  "keyCorrections": [ { "original": string, "corrected": string, "reason": string } ]
}`;
}
