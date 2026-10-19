import { Question, UserProfile, AnswerEvaluation, LessonPlan } from '../../src/types/learning.js';

export function buildTutorAssistPrompt(
  question: Question,
  action: 'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity',
  profile: UserProfile
): string {
  return [
    'You are a supportive, patient English tutor.',
    'The learner requested assistance for this active question:',
    `Question Prompt: "${(question.prompt || '').replace(/"/g, "'")}"`,
    `Target Skill: ${question.skill_name}`,
    `Current Level: ${profile.current_level}`,
    `Action requested: "${action}".`,
    '',
    'Output in JSON:',
    '{',
    `  "type": "${action}",`,
    '  "content": string,',
    '  "example_sentence": string (optional)',
    '}'
  ].join('\n');
}

export function buildDeepDiveSystemPrompt(
  question: Question,
  userAnswer: string,
  evaluation: AnswerEvaluation | undefined,
  profile: UserProfile
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';
  const vocabDetail = question.vocab_card
    ? `- Vocabulary Item: "${question.vocab_card.word}" (${question.vocab_card.part_of_speech}), IPA: "${question.vocab_card.ipa}", Collocation: "${question.vocab_card.collocation_pattern}"`
    : '';

  return [
    'You are an expert, encouraging, pedagogically skilled English tutor.',
    'The learner has completed an exercise and is asking follow-up questions to dig deeper into the concept instead of moving on immediately.',
    '',
    `- Section: ${question.section} (vocabulary, grammar, reading, writing)`,
    `- Target Skill: ${question.skill_name}`,
    `- Question Prompt: "${(question.prompt || '').replace(/"/g, "'")}"`,
    `- Correct / Target Answer: "${(evaluation?.expected_answer || question.expected_answer_text || '').replace(/"/g, "'")}"`,
    `- Learner's Submitted Answer: "${(userAnswer || '(none)').replace(/"/g, "'")}"`,
    `- Evaluation Verdict: "${evaluation?.verdict || 'evaluated'}"`,
    `- Decisive Clue / Rule: "${(evaluation?.decisive_clue || question.explanation_rule || '').replace(/"/g, "'")}"`,
    vocabDetail,
    '',
    'LEARNER PROFILE:',
    `- Level: ${profile.current_level}`,
    `- Target: ${profile.target_level}`,
    `- Primary Goal: ${profile.primary_goal}`,
    `- Explanation Language: ${lang}`,
    '',
    'INSTRUCTIONS FOR TUTOR RESPONSE:',
    `1. Answer the learner's question directly, clearly, and insightfully in ${lang}:`,
    '   - If the learner asks about VOCABULARY or SIMILAR WORDS / SYNONYMS:',
    '     * Clarify the exact shades of meaning, register (formal vs. casual vs. technical), and nuances.',
    '     * Explain WHEN and WHY to use each word with concrete workplace and everyday situations.',
    '     * Fill the "similar_words_comparison" table with the words compared.',
    '   - If the learner asks about GRAMMAR:',
    '     * Explain the structural reason behind the rule with an intuitive memory trick.',
    '     * Contrast the right way with common intuitive errors.',
    '     * Provide 2-3 clear example sentences showing how to use it in different contexts.',
    '   - If the learner asks about WRITING:',
    '     * Explain how sentence variety, natural collocations, and signposting improve flow.',
    '     * Show contrasting "Standard" vs. "Polished Native" variations.',
    '2. Structure your reply in clear Markdown with formatting (bold keywords, bullet points, clean paragraphs).',
    '3. Provide 2 to 3 natural example sentences in "examples" field.',
    '4. Suggest 2 to 3 concise, intriguing follow-up prompts in "suggestedFollowUps" that the learner might want to explore next.',
    '',
    'OUTPUT JSON SCHEMA:',
    '{',
    `  "reply": "markdown explanation in ${lang}",`,
    '  "suggestedFollowUps": ["string"],',
    '  "examples": ["string"],',
    '  "similar_words_comparison": [',
    '    {',
    '      "word": "string",',
    '      "nuance": "string",',
    '      "when_to_use": "string",',
    '      "example": "string"',
    '    }',
    '  ]',
    '}'
  ].filter(Boolean).join('\n');
}

export function buildLessonSummarySystemPrompt(
  lesson: LessonPlan,
  totalQuestions: number,
  accuracy: number,
  computedTimeSpent: number,
  targetMins: number,
  paceMode: string,
  profile: UserProfile
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';

  return `You are a warm, professional English learning coach.
Summarize today's lesson session for a ${profile.current_level} learner.
Duration completed: ${computedTimeSpent} minutes (Target was ${targetMins} minutes, Pace mode: ${paceMode}).
Questions completed: ${totalQuestions} of ${lesson.total_planned_questions || totalQuestions}.
Accuracy: ${Math.round(accuracy * 100)}%.
Language: ${lang}.
Lesson objective: "${lesson.primary_objective}".

Output JSON:
{
  "key_takeaways": [string],
  "vocabulary_learned": [string],
  "recurring_mistakes_flagged": [string],
  "next_review_topics": [string],
  "tomorrow_plan": {
    "focus_title": string (e.g. "Tomorrow's Focus: Negative Inversion & Executive Status Writing"),
    "review_topics": [string] (1-3 items to review tomorrow based on today's performance & mistakes),
    "new_skills": [string] (2-3 new grammar/vocab/writing skills coming in tomorrow's session),
    "estimated_minutes": number,
    "preview_summary": string
  }
}`;
}
