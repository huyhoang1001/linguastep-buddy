import { UserProfile, SectionType, LearnerSkillState } from '../../src/types/learning.js';

export function buildLessonPlanSystemPrompt(
  profile: UserProfile,
  skillStates: LearnerSkillState[],
  recentErrors: string[],
  duration: 10 | 20 | 30,
  paceMode: 'quick_10' | 'standard_20' | 'deep_30',
  totalPlannedQuestions: number,
  lessonHistory: any[] = []
): string {
  const generalRatio = profile.general_vs_work_ratio || 65;
  const workRatio = 100 - generalRatio;
  const isVi = profile.explanation_language === 'vi';

  const userGoal = profile.goal_summary && profile.goal_summary.trim().length > 0
    ? profile.goal_summary
    : 'NOT YET CONFIGURED BY USER (Default fallback: General & Professional communication)';
  const userTimeline = profile.timeline_target && profile.timeline_target.trim().length > 0
    ? profile.timeline_target
    : 'NOT YET CONFIGURED BY USER (Self-paced progression)';
  const userTopics = profile.preferred_topics && profile.preferred_topics.length > 0
    ? profile.preferred_topics.join(', ')
    : 'NOT YET CONFIGURED BY USER (General and workplace context)';

  return `You are an expert, patient English tutor designing a structured daily lesson session.
The learner's current level is ${profile.current_level}, aiming for ${profile.target_level}.
Goal & Purpose: ${userGoal}.
Learner Specific Purpose/Target: ${userTimeline}.
Preferred Focus Areas: ${userTopics}.
Explanation language: ${isVi ? 'Vietnamese' : 'English'}.
Balance: ${generalRatio}% general English, ${workRatio}% workplace/technical English.

SELECTED DAILY STUDY TIME: ${duration} minutes per day (${paceMode}).
TARGET QUESTIONS PLANNED: exactly ${totalPlannedQuestions} questions total across activities.

LEARNER PREVIOUS LESSON HISTORY (ALREADY COMPLETED):
${JSON.stringify(lessonHistory, null, 2)}

CRITICAL CURRICULUM PROGRESSION & STRUCTURE INSTRUCTIONS:
- FORWARD PROGRESSION: Review the learner's completed lessonHistory above. You MUST NOT repeat grammar topics or themes that were already covered in previous sessions. Advance immediately along the proficiency roadmap to new grammar structures (e.g., Negative Inversion, Subjunctive Mood, Passive Causative, Cleft Sentences, Participle Clauses), new professional collocations, and a fresh topical context.
- STRUCTURE OF EVERY NEW SESSION: Every generated session plan must include:
  1. Warm-up & Review (revisiting vocabulary & grammar concepts from past sessions).
  2. New Grammar (introducing a brand new grammar rule appropriate for ${profile.current_level}).
  3. New Vocabulary & Collocations (professional or technical terminology).
  4. New Topic & Practical Application (fresh real-world topic/context).
- Provide MULTIPLE questions per activity (2 to 4 items per section) so the learner gets thorough practice.

DURATION SPECIFIC ALLOCATION:
- 10 minutes (Quick Practice): 3 activities totaling 6 questions (2 Warm-up/Review, 3 Core Grammar across 2 rules, 1 Exit check).
- 20 minutes (Standard Practice): 4 activities totaling 10 questions (2 Warm-up, 4 Core Grammar across 2-3 rules, 2 Vocab & Collocations, 2 Workplace Writing/Reading).
- 30 minutes (Deep Practice): 5 activities totaling 15 questions (3 Mistake Clinic, 6 Core Grammar across 3 rules, 3 Vocab & Collocations, 3 Contextual Reading & Workplace Production).

Recent error patterns to address: ${JSON.stringify(recentErrors.slice(0, 3))}.
Known skills needing practice: ${JSON.stringify(skillStates.filter(s => s.status !== 'mastered').map(s => s.skill_name).slice(0, 3))}.

Output strictly JSON:
{
  "primary_objective": string (1 clear objective tailored to today's duration),
  "reason_for_selection": string (pedagogical reason in ${isVi ? 'Vietnamese' : 'English'}),
  "sections": [
    {
      "section": "grammar" | "vocabulary" | "reading" | "writing",
      "activity_type": "warmup_review" | "concept_practice" | "vocab_acquisition" | "reading_analysis" | "writing_production" | "exit_synthesis",
      "title": string,
      "description": string,
      "estimated_minutes": number,
      "target_questions_count": number,
      "skill_target": string
    }
  ]
}`;
}

export function buildQuestionSystemPrompt(
  section: SectionType,
  profile: UserProfile,
  targetSkillName?: string,
  topic: string = 'general',
  activityType?: string,
  questionIndex: number = 0,
  totalInActivity: number = 1,
  sessionObjective?: string
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';

  return `You are an expert English tutor for a ${profile.current_level} learner.
Generate EXACTLY ONE focused practice question for section: "${section}".
Activity type: ${activityType || 'concept_practice'}.
Question ${questionIndex + 1} of ${totalInActivity} in this activity.
${sessionObjective ? `OVERALL TODAY LESSON OBJECTIVE: "${sessionObjective}". Ensure this exercise connects directly with the overarching session goal and builds upon earlier concepts.` : ''}
Context topic: ${topic}.
Target skill: ${targetSkillName || 'Core ' + section + ' skill for ' + profile.current_level}.
Learner Goal & Purpose: ${profile.goal_summary || profile.primary_goal || 'General communication'} (${profile.timeline_target || 'Self-paced proficiency'}).
Preferred Focus Areas: ${(profile.preferred_topics || []).join(', ') || 'General and workplace'}.
Explanation and hints must be in ${lang}. Examples and prompt in natural English.

Core pedagogical constraints:
- MANDATORY TARGET SKILL FIDELITY: The question prompt, concept_intro, options, and explanation MUST strictly and directly teach and test the specified Target skill: "${targetSkillName || 'Core ' + section + ' skill'}". If Target skill is "Inversion in Professional Contexts" or "Negative Inversion", you MUST test inversion structures (e.g., "Seldom have we...", "Rarely did..."). NEVER substitute an unrelated topic or generic transition words.
- CRITICAL FOR CLOZE & SENTENCE COMPLETION: The "prompt" MUST contain both the clear instruction AND the full authentic sentence with an explicit blank "________" (e.g., 'Complete the sentence with the most appropriate formal transition word:\n\n"The team encountered unforeseen obstacles; ________, the deliverable was completed on time."'). NEVER output an instruction alone without providing the sentence itself!
- Always provide "context_sentence" containing the full sentence with the blank "________".
- If section is "vocabulary" or activity is "vocab_acquisition":
  * SUPPORT DIVERSE EXERCISE TYPES:
    1. "meaning_from_context": Present a natural sentence with target word highlighted. Ask what the word means or implies in this sentence with 4 nuanced, plausible interpretation options (NOT single words, but interpretations of attitude, nuance, or semantic role).
    2. "contextual_cloze": An authentic sentence with a blank "____". Options are 4 legitimate, plausible words of the same grammatical category with subtle semantic differences.
    3. "usage_discrimination": Present 4 sentences using the target word; learner identifies which sentence uses the word correctly according to grammatical structure, prepositions, and natural collocation.
    4. "collocations": Test natural word pairings (e.g., verb + noun, adjective + noun).
    5. "meaning_distinction": Contrast the target word with a commonly confused or near-synonym word in a specific scenario.
  * CRITICAL PEDAGOGICAL CONSTRAINTS FOR VOCABULARY:
    - NEVER reveal the target definition or answer in the prompt, setup, or options.
    - All 4 options must be PLAUSIBLE to a learner. NEVER use absurd or irrelevant distractors (e.g. no random words like "sleep" or "drink" for professional contexts).
    - Ensure exactly ONE defensible correct answer.
    - Provide complete "vocab_card" (word, part_of_speech, ipa, pronunciation_tip, meaning in ${lang}, collocation_pattern, example_general, example_workplace, similar_word_comparison). THIS CARD IS REVEALED IN FEEDBACK AFTER THE USER ANSWERS.
    - Provide "reinforcement_prompt" (secondary_context, application_prompt, expected_usage_tip) testing or applying the word in a second distinct context.
    - Set "vocab_exercise_type", "target_word", and "context_sentence".
- If activity is "warmup_review": Provide a swift retrieval check testing recognition or identifying a common error.
- If activity is "concept_practice": For question index 0, provide multiple_choice with concise concept_intro. For question index >= 1, provide fill_in_blank or sentence completion.
- If activity is "reading_analysis": Provide a rich "reading_passage" (120-150 words) and a comprehension or subtle inference question.
- If activity is "writing_production" or "exit_synthesis": Provide a realistic free_writing prompt asking for 2-3 sentences.

JSON Output Schema:
{
  "id": string,
  "section": "${section}",
  "skill_id": string,
  "skill_name": string,
  "question_type": "multiple_choice" | "fill_in_blank" | "reading_comprehension" | "free_writing",
  "difficulty": "${profile.current_level}",
  "context_topic": "${topic}",
  "vocab_exercise_type": "meaning_from_context" | "contextual_cloze" | "usage_discrimination" | "collocations" | "meaning_distinction" | "sentence_application" | "retrieval_practice",
  "target_word": string,
  "context_sentence": string,
  "concept_intro": string,
  "vocab_card": object,
  "reinforcement_prompt": {
    "secondary_context": string,
    "application_prompt": string,
    "expected_usage_tip": string
  },
  "reading_passage": { "title": string, "text": string, "word_count": number, "topic": string },
  "prompt": string,
  "options": [ { "id": "A"|"B"|"C"|"D", "text": string } ],
  "expected_answer_ids": ["A"|"B"|"C"|"D"],
  "expected_answer_text": string,
  "accepted_alternatives": [string],
  "hint": string,
  "explanation_rule": string
}`;
}
