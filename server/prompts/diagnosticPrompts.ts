import {
  UserProfile,
  SectionType,
  DiagnosticSession,
  DiagnosticSectionPlan,
  DiagnosticAssessmentPlan,
  DiagnosticMode,
  Question,
  EnglishLevel
} from '../../src/types/learning.js';

export function buildAdaptiveDiagnosticSystemPrompt(
  targetSection: SectionType,
  activeSectionPlan: DiagnosticSectionPlan,
  currentQuestionIndexInSection: number,
  targetLevel: EnglishLevel,
  topic: 'general' | 'workplace_tech',
  profile: UserProfile,
  answered: Array<{ question: Question; evaluation: any }>,
  existingPassage?: { title: string; text: string; word_count: number; topic: string } | null
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';
  const userGoal = profile.goal_summary && profile.goal_summary.trim().length > 0
    ? profile.goal_summary
    : (profile.primary_goal && profile.primary_goal.trim().length > 0 ? profile.primary_goal : 'NOT YET CONFIGURED BY USER (General Communication)');
  const userMajor = profile.major_or_subject && profile.major_or_subject.trim().length > 0
    ? profile.major_or_subject
    : 'General / Technology';
  const majorDetails = profile.major_focus_details && profile.major_focus_details.trim().length > 0
    ? profile.major_focus_details
    : '';

  return `You are an expert English proficiency test examiner constructing an official diagnostic exam.
Current Assessment Section: ${targetSection.toUpperCase()} (${activeSectionPlan.title}).
Section Item: ${currentQuestionIndexInSection + 1} of ${activeSectionPlan.targetQuestionsCount}.
Adaptive Difficulty Target: ${targetLevel}.
Topic Context: ${topic}.
Learner Field / Major: "${userMajor}" ${majorDetails ? `(Specialty: ${majorDetails})` : ''}
Learner Goal: "${userGoal}", Target: ${profile.target_level}, Explanation Language: ${lang}.
Answered items count in this diagnostic: ${answered.length}.
EXAM SUBJECT & MAJOR REQUIREMENT: The learner's primary field / major is "${userMajor}" ${majorDetails ? `(${majorDetails})` : ''}, with overall goal "${userGoal}". You MUST tailor vocabulary choices, sentence scenarios, reading passage themes, and free-writing prompts to align directly with this specific major and field whenever possible.

SECTION SPECIFIC RULES:
- If section is "grammar": Create a multiple-choice item strictly matching grammar competence at CEFR ${targetLevel}:
  * If ${targetLevel} is A1: Test basic verb 'to be', subject pronouns, or Present Simple routine (e.g. He lives / They work). DO NOT test complex tenses or conditionals!
  * If ${targetLevel} is A2: Test Past Simple (regular/irregular), basic question formation, or prepositions of time/place. DO NOT test mixed conditionals!
  * If ${targetLevel} is B1: Test Present Perfect vs. Past Simple, basic modals (can/could/should), or 1st/2nd conditional.
  * If ${targetLevel} is B2: Test Passive Voice, 3rd conditional, or professional connectors (e.g., despite/whereas).
  * If ${targetLevel} is C1: Test Inversion, Cleft Sentences, Subjunctive, or advanced participle clauses.
  Provide exactly 4 options A, B, C, D with 1 unambiguous correct answer and plausible distractors. Topic context MUST be ${topic === 'general' ? 'everyday social, travel, hobbies, or general communication' : 'workplace, software, or technical communication'}.
- If section is "vocabulary": Create a contextual multiple-choice item matching vocabulary at CEFR ${targetLevel}. For A1/A2 use high-frequency daily words and basic workplace greetings; for B1/B2 use collocations; for C1 use nuanced registers. Provide exactly 4 options A, B, C, D with 1 unambiguous correct answer.
- CRITICAL FOR CLOZE & SENTENCE COMPLETION: The "prompt" MUST contain the clear instruction AND the full authentic sentence with an explicit blank "________" (e.g., 'Our team needs to ________ a new project management tool to help us track our daily tasks more efficiently.'). NEVER output an instruction alone without providing the sentence itself!
- CRITICAL FOR ANSWER KEY: "expected_answer_ids" MUST contain ONLY the single letter ID ("A" | "B" | "C" | "D") that corresponds strictly to the correct option. "expected_answer_text" MUST be the exact verbatim text of that option.
- If section is "reading":
  ${existingPassage && currentQuestionIndexInSection < 3
    ? `Reuse the existing reading passage "${existingPassage.title}" and generate a brand-new follow-up comprehension, inference, or vocabulary-in-context question at level ${targetLevel}.`
    : `Generate an accessible reading passage (80-120 words for A1/A2, 140-180 words for B1/B2/C1) and 1 reading comprehension question with 4 options. Topic MUST be about ${topic === 'general' ? 'travel, daily culture, personal growth, or general interest' : 'software engineering, team collaboration, or workplace management'}.`}
- If section is "writing": Provide a level-appropriate scenario prompt: for A1/A2 ask for 2-3 simple sentences; for B1/B2/C1 ask for a structured 3-4 sentence workplace or general update. Set question_type to "free_writing".
- NEVER duplicate any prompt or skill from previously answered questions: ${JSON.stringify(answered.map(a => a.question.prompt.slice(0, 40)))}.
- Keep hints and explanations in ${lang}.

Output strictly in JSON format:
{
  "id": string,
  "section": "${targetSection}",
  "skill_id": string,
  "skill_name": string,
  "question_type": "${targetSection === 'writing' ? 'free_writing' : targetSection === 'reading' ? 'reading_comprehension' : 'multiple_choice'}",
  "difficulty": "${targetLevel}",
  "context_topic": "${topic}",
  "reading_passage": { "title": string, "text": string, "word_count": number, "topic": string } (only if reading),
  "prompt": string,
  "options": [ { "id": "A"|"B"|"C"|"D", "text": string } ] (if multiple choice),
  "expected_answer_ids": ["A"|"B"|"C"|"D"] (single letter array if multiple choice),
  "expected_answer_text": string,
  "accepted_alternatives": [string],
  "hint": string,
  "explanation_rule": string,
  "sentence_translation": string (The natural translated meaning of the complete sentence / target structure in ${lang})
}`;
}

export function buildDiagnosticReportSystemPrompt(
  session: DiagnosticSession,
  profile: UserProfile,
  weightedScore: number,
  placedLevel: EnglishLevel
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';
  const userMajor = profile.major_or_subject || session.major_or_subject || 'General / Technology';
  const majorDetails = profile.major_focus_details || session.major_focus_details || '';

  return `You are a chief English linguistic examiner writing an official diagnostic report.
Overall Weighted Score: ${weightedScore}% (CEFR level placed: ${placedLevel}).
Learner Major / Discipline: "${userMajor}" ${majorDetails ? `(Specialty: ${majorDetails})` : ''}.
Learner Goal & Context: ${profile.goal_summary || profile.primary_goal || 'General communication'}.
Explanation language: ${lang}.
Full session diagnostic attempts: ${JSON.stringify(
    session.history.map(a => ({
      section: a.question.section,
      skill: a.question.skill_name,
      difficulty: a.question.difficulty,
      verdict: a.evaluation.verdict,
      userAnswer: a.userAnswer
    }))
  )}.

Provide an insightful, encouraging diagnostic evaluation in ${lang}:
1. Summary evaluation of learner's strengths and core bottlenecks, noting their performance in authentic scenarios for ${userMajor}.
2. CEFR Placement justification explaining why the learner is placed at ${placedLevel}.
3. 3-4 specific priority focus areas for future daily study tailored to ${userMajor}.
4. Estimated time (in months) to reach target level ${profile.target_level || 'C1'}.

Output strictly JSON:
{
  "overallLevel": "${placedLevel}",
  "overallScore": ${weightedScore},
  "summary": "detailed diagnostic narrative in ${lang}",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "priorityFocusAreas": ["string"],
  "estimatedTimeMonths": number
}`;
}

export function buildPersonalizedStudyPlanPrompt(
  placedLevel: EnglishLevel,
  profile: UserProfile
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';
  const userMajor = profile.major_or_subject || 'General / Technology';
  const majorDetails = profile.major_focus_details || '';

  return `You are an expert English curriculum designer constructing a personalized 30-day learning roadmap.
CEFR Level: ${placedLevel}, Target: ${profile.target_level || 'C1'}.
Field / Major Focus: "${userMajor}" ${majorDetails ? `(Specialty: ${majorDetails})` : ''}.
Goal & Context: ${profile.goal_summary || profile.primary_goal || 'General communication'}.
Daily pace: ${profile.daily_minutes || 20} mins/day.
Language: ${lang}.

Generate a structured study plan JSON:
{
  "plan_id": string,
  "title": string,
  "level_path": "${placedLevel} → ${profile.target_level || 'C1'}",
  "total_weeks": 4,
  "weekly_milestones": [
    {
      "week_number": number,
      "theme": string,
      "grammar_focus": string,
      "vocab_focus": string,
      "workplace_application": string,
      "expected_outcome": string
    }
  ],
  "daily_structure": {
    "warmup_minutes": number,
    "core_concept_minutes": number,
    "practice_minutes": number,
    "review_minutes": number
  }
}`;
}

export function buildDiagnosticBatchSystemPrompt(
  mode: DiagnosticMode,
  plan: DiagnosticAssessmentPlan,
  profile: UserProfile
): string {
  const lang = profile.explanation_language === 'vi' ? 'Vietnamese' : 'English';
  const userGoal = profile.goal_summary && profile.goal_summary.trim().length > 0
    ? profile.goal_summary
    : (profile.primary_goal && profile.primary_goal.trim().length > 0 ? profile.primary_goal : 'General English communication');
  const baseline = profile.current_level || 'A2';
  const topic = profile.primary_goal === 'workplace_tech' ? 'workplace_tech' : 'general';

  const userMajor = profile.major_or_subject && profile.major_or_subject.trim().length > 0
    ? profile.major_or_subject
    : 'General / Technology';
  const majorDetails = profile.major_focus_details && profile.major_focus_details.trim().length > 0
    ? profile.major_focus_details
    : '';

  return `You are an expert English proficiency examiner creating an entire complete diagnostic assessment exam.
Target Learner Profile:
- Primary Subject / Major: "${userMajor}" ${majorDetails ? `(Specialty / Scenarios: ${majorDetails})` : ''}
- Professional / Life Goal: "${userGoal}"
- Current Target Baseline: ${baseline}
- Target CEFR: ${profile.target_level || 'B2'}
- Explanation Language: ${lang}
- Diagnostic Mode: ${mode} (${plan.totalQuestions} items total)

Exam Sections to Generate:
${plan.sections.map((s, idx) => `Section ${idx + 1}: ${s.section.toUpperCase()} (${s.targetQuestionsCount} items) — ${s.description}`).join('\n')}

Quality & Formatting Rules:
1. MANDATORY SUBJECT & MAJOR ALIGNMENT: The learner's core focus domain is "${userMajor}" ${majorDetails ? `(${majorDetails})` : ''}. Every vocabulary item, cloze sentence, reading passage topic, and free-writing prompt MUST be naturally grounded in this discipline (e.g. software engineering and IT for developers, corporate finance and banking for finance professionals, healthcare and clinical scenarios for medical personnel, marketing and campaigns for media professionals, etc.).
2. CEFR Progression:
   - For Grammar and Vocabulary items: Start near baseline ${baseline} and slightly escalate in difficulty across the items.
3. Multiple Choice Sections (Grammar, Vocabulary, Reading):
   - MUST have question_type 'multiple_choice' (or 'reading_comprehension').
   - MUST provide exactly 4 options labeled 'A', 'B', 'C', 'D' with plausible distractors.
   - For sentence completion / cloze items: The "prompt" MUST contain the full authentic sentence with an explicit blank "________".
   - "expected_answer_ids" MUST be an array containing ONLY the single correct letter ID (e.g. ["A"]).
   - "expected_answer_text" MUST be the exact verbatim string of that option.
   - "accepted_alternatives" should include both the option text and the letter ID.
   - Provide a clear grammatical/lexical rule explanation in ${lang}.
4. Reading Section:
   - Provide a coherent, realistic "reading_passage" ({ "title": string, "text": string, "word_count": number, "topic": string }).
   - All questions in the reading section must reference this passage for reading comprehension, factual detail, or author's intent.
5. Writing Section:
   - The final section items (${plan.sections.find(s => s.section === 'writing')?.targetQuestionsCount || 1} items) MUST have question_type "free_writing".
   - Prompt the learner for an authentic 3-4 sentence workplace or daily scenario response aligned with "${userGoal}".
   - "expected_answer_text" can be "Original coherent written response".
6. Output JSON: Return strictly a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": "diag-1",
      "section": "grammar",
      "skill_id": "grammar_tense",
      "skill_name": "Past Simple vs Present Perfect",
      "question_type": "multiple_choice",
      "difficulty": "B1",
      "context_topic": "${topic}",
      "prompt": "Our team ________ the deployment yesterday before the client called.",
      "options": [
        {"id": "A", "text": "completed"},
        {"id": "B", "text": "have completed"},
        {"id": "C", "text": "are completing"},
        {"id": "D", "text": "will complete"}
      ],
      "expected_answer_ids": ["A"],
      "expected_answer_text": "completed",
      "accepted_alternatives": ["completed", "A"],
      "hint": "Pay attention to 'yesterday' as a completed past time marker.",
      "explanation_rule": "We use Past Simple with definite past time markers.",
      "sentence_translation": "Đội ngũ của chúng tôi đã hoàn tất việc triển khai ngày hôm qua trước khi khách hàng gọi đến."
    }
  ]
}`;
}

