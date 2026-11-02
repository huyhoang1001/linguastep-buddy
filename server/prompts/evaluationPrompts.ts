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
  const config = question.writing_config;

  return `You are a native English writing examiner evaluating a learner's free-writing response.
Target Level: ${profile.current_level}.
Goal Context: ${profile.primary_goal || 'General/Workplace English'}.
Question Prompt: "${(question.prompt || '').replace(/"/g, "'")}".
Target Skill / Rule: ${question.skill_name || question.explanation_rule || 'Cohesive paragraph structure'}.
Learner Answer: "${userAnswer.replace(/"/g, "'")}".

${config ? `ADAPTIVE TASK CONTEXT:
- Expected Task: ${config.task_type}
- Complexity: ${config.complexity}
- Target Length: ${config.min_words ? `${config.min_words}-${config.max_words} words` : `${config.min_sentences}-${config.max_sentences} sentences`}
Evaluate strictly based on whether a learner at ${profile.current_level} can successfully complete this ${config.task_type} with the requested ${config.complexity} complexity.` : ''}

Provide rigorous feedback in ${lang}:
1. Score each dimension on a 1.0 to 5.0 scale (accuracy, vocabularyRange, sentenceComplexity, coherence, naturalness, taskCompletion).
2. Polished Version: Provide a refined, native-sounding rephrasing of the learner's response.
3. Decisive Clue / Highlight: Point out 1 specific grammar/word choice improvement.
4. Reusable Pattern: Provide 1 key sentence template or connector pattern the learner can reuse.
5. Task Alignment: Comment on whether the learner met the requested word/sentence length and complexity.

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
  "keyCorrections": [ { "original": string, "corrected": string, "reason": string } ],
  "reusable_pattern": string
}`;
}

export function buildTranslationEvaluationPrompt(
  question: Question,
  userAnswer: string,
  profile: UserProfile
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';

  return `You are an expert bilingual English tutor assessing a learner's conversational translation.
Theme: "Say It Like You Mean It" (Authentic Vietnamese to Natural English).
Vietnamese Source: "${question.vietnamese_text}".
Scenario: "${question.translation_scenario}".
Tone: "${question.translation_tone}".
Relationship: "${question.relationship}".
Target Level: ${profile.current_level}.
Learner Answer: "${userAnswer.replace(/"/g, "'")}".
Model Answer (Reference): "${question.model_answer}".
Evaluation Criteria:
${(question.evaluation_criteria || []).map(c => `- ${c}`).join('\n')}

Evaluate the response across these 5 dimensions:
1. Meaning Preservation (35%): Does it convey the original Vietnamese intent accurately?
2. Naturalness (25%): Would a native speaker say it this way? (Ignore overly formal/stiff phrasing).
3. Tone Matching (20%): Does it preserve the humor, sarcasm, annoyance, or playful cheekiness?
4. Grammar (15%): Is the grammar correct for a conversational context? (Contractions allowed/encouraged).
5. Context (5%): Suitability for the relationship and situation.

Provide feedback in ${lang}:
1. Verdict: "correct", "partially_correct", or "incorrect".
2. Meaning Feedback: Explain if the intent was captured.
3. Natural English: Suggest the most fluent, conversational version.
4. Alternative Phrasing: Offer an alternative with a slightly different nuance.
5. Grammar Connection: Link the phrasing to grammar concepts the learner should know (${question.skill_name}).
6. Tone Insight: Explain why certain words create the desired effect (funny, sarcastic, etc.).
7. Scores: Provide 0-100 scores for Naturalness and Tone.

Output strictly JSON:
{
  "verdict": "correct" | "partially_correct" | "incorrect",
  "meaning_feedback": string,
  "explanation": string (A summary encouragement and key takeaway),
  "corrected_text": string (The recommended natural version),
  "alternative_phrasing": string,
  "grammar_connection": string,
  "tone_insight": string,
  "naturalness_score": number,
  "tone_score": number,
  "error_tags": ["string"]
}`;
}
