export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type PrimaryGoal = 
  | 'workplace_tech' 
  | 'conversation' 
  | 'reading_writing' 
  | 'exam' 
  | 'balanced';

export type ExplanationLanguage = 'vi' | 'en' | 'bilingual';

export type FeedbackStyle = 'encouraging' | 'detailed' | 'concise';

export type SectionType = 'grammar' | 'vocabulary' | 'reading' | 'writing';

export type QuestionType = 
  | 'multiple_choice' 
  | 'fill_in_blank' 
  | 'sentence_rewrite' 
  | 'reading_comprehension' 
  | 'free_writing';

export type Verdict = 'correct' | 'partially_correct' | 'incorrect' | 'ambiguous';

export interface UserProfile {
  id: string;
  name: string;
  current_level: EnglishLevel;
  target_level: EnglishLevel;
  primary_goal: PrimaryGoal;
  goal_summary: string;
  explanation_language: ExplanationLanguage;
  general_vs_work_ratio: number; // percentage of general english, e.g. 65 means 65% general, 35% workplace
  daily_minutes: number; // e.g. 15, 30, 45
  days_per_week: number;
  feedback_style: FeedbackStyle;
  enable_audio_tips: boolean;
  onboarding_completed: boolean;
  
  // Extended conversational discovery fields
  struggles?: string[];
  timeline_target?: string;
  audio_importance?: boolean;
  preferred_topics?: string[];
  confidence_in_level?: 'low' | 'moderate' | 'high';

  // Major / Subject & Domain Focus
  major_or_subject?: string; // Main subject, major, industry or domain (e.g., 'Software Engineering & IT', 'Finance & Banking', 'Healthcare', etc.)
  major_focus_details?: string; // Detailed specialty or workplace/academic context (e.g. 'Backend developer collaborating with US teams')
  
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'grammar' | 'vocabulary' | 'reading' | 'writing' | 'collocation';
  level: EnglishLevel;
  description: string;
}

export type SkillMasteryStage =
  | 'exposure'         // First encountered (1 trial)
  | 'recognition'      // Identifies correct form with options (multiple choice, guided cloze)
  | 'active_recall'    // Recalls without options (fill-in-the-blank, open sentence)
  | 'application'      // Applies in sentence transformations & free production
  | 'retained_mastery'; // Sustained retention across delayed review intervals

export interface LearnerSkillState {
  skill_id: string;
  skill_name: string;
  category: string;
  status: 'new' | 'learning' | 'reviewing' | 'mostly_mastered' | 'mastered' | 'regressed';
  accuracy_rate: number;
  total_attempts: number;
  last_practiced_at: string;
  next_review_at: string;
  recurring_errors: string[];

  // Multi-stage evidence & spaced mastery tracking
  mastery_stage?: SkillMasteryStage;
  mastery_score?: number; // 0 - 100 comprehensive evidence score
  exercise_types_passed?: string[]; // e.g. ['multiple_choice', 'fill_in_blank', 'sentence_rewrite']
  consecutive_correct?: number;
  retention_checks_passed?: number;
  prerequisite_skill_ids?: string[];
  difficulty_level?: EnglishLevel;
  last_retrieval_delay_days?: number;
  regression_count?: number;
}

export type VocabExerciseType =
  | 'meaning_from_context'
  | 'contextual_cloze'
  | 'usage_discrimination'
  | 'collocations'
  | 'meaning_distinction'
  | 'sentence_application'
  | 'retrieval_practice';

export type VocabMasteryStage = 'encountered' | 'practicing' | 'retrieved' | 'applied' | 'mastered';

export interface VocabularyItem {
  id: string;
  word: string;
  part_of_speech: string;
  ipa: string;
  pronunciation_tip: string;
  meaning: string;
  collocation_pattern: string;
  example_general: string;
  example_workplace: string;
  similar_word_comparison?: {
    word: string;
    difference: string;
  };
  review_stage: 1 | 3 | 7 | 14 | 30; // Spaced repetition interval in days
  mastery_stage?: VocabMasteryStage;
  mastery_score?: number; // 0-100
  contexts_encountered?: string[];
  exercise_types_passed?: VocabExerciseType[];
  common_confusions?: string[];
  next_review_at: string;
  first_seen_at: string;
  last_reviewed_at: string;
  times_correct: number;
  times_incorrect: number;
  word_family?: WordFamilyData;
  word_form_mastery?: Record<string, WordFormMastery>;
}

export interface WordFamilyMember {
  form: string;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'noun_person' | string;
  ipa?: string;
  suffix_or_pattern?: string; // e.g. "-tion (noun)", "-ly (adverb)", "-ive (adjective)"
  meaning_vi: string;
  meaning_en?: string;
  example_sentence: string;
  is_headword?: boolean;
}

export interface WordFamilyData {
  family_root: string;
  members: WordFamilyMember[];
  missing_forms_note?: string; // e.g. "Note: This word has no commonly accepted adverb derivative."
}

export type WordFormMasteryStatus = 'needs_practice' | 'understood' | 'mastered';

export interface WordFormMastery {
  form: string;
  part_of_speech: string;
  status: WordFormMasteryStatus;
  times_correct: number;
  times_incorrect: number;
  last_practiced_at: string;
}

export type WordFamilyExerciseType = 
  | 'word_form_selection' 
  | 'sentence_transformation' 
  | 'error_correction' 
  | 'family_completion';

export interface WordFamilyExerciseOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  part_of_speech?: string;
}

export interface WordFamilyExercise {
  id: string;
  exercise_type: WordFamilyExerciseType;
  prompt: string;
  target_form: string; // The exact form being tested (e.g. "collaboratively")
  target_part_of_speech: string; // e.g. "adverb"
  options: WordFamilyExerciseOption[];
  expected_answer_id: string; // "A" | "B" | "C" | "D"
  expected_answer_text: string;
  full_correct_sentence: string;
  grammatical_clue: string; // e.g. "Preceded by verb 'worked' and describes manner -> requires an adverb ending in -ly"
  vietnamese_explanation: string;
  distractor_explanations?: Record<string, string>; // Maps option id ('A', 'B', etc.) or text to why it is incorrect
  transformation_source_sentence?: string; // For transformation: "The two teams collaborated successfully."
  transformation_prompt?: string; // "Rewrite using the noun form 'collaboration'"
  error_sentence?: string; // For error correction: "The teams worked collaborative on the project."
  hint?: string;
}

export interface WordPracticeQuestion {
  prompt: string;
  options: Array<{ id: 'A' | 'B' | 'C' | 'D' | string; text: string }>;
  expected_answer_id: 'A' | 'B' | 'C' | 'D' | string;
  expected_answer_text: string;
  explanation: string;
  hint: string;
  context_sentence?: string;
}

export interface RelatedWordComparison {
  word: string;
  ipa: string;
  part_of_speech: string;
  meaning_en: string;
  meaning_vi: string;
  semantic_difference: string;
  usage_context: string;
  formality: string; // e.g., "formal", "informal", "neutral"
  collocations: string[];
  example: string;
  can_replace_original: boolean;
  substitutability_note: string;
}

export interface ContrastiveScenario {
  scenario_description_en: string;
  scenario_description_vi: string;
  word_usages: Array<{
    word: string;
    sentence: string;
    meaning_in_context_en: string;
    meaning_in_context_vi: string;
    nuance_explanation: string;
  }>;
}

export interface WordComparisonExercise {
  id: string;
  exercise_type: 'choose_best' | 'compare_sentences' | 'rewrite' | 'explain_choice';
  prompt: string;
  options?: Array<{ id: string; text: string }>;
  expected_answer_id?: string;
  expected_answer_text: string;
  explanation_en: string;
  explanation_vi: string;
  hint?: string;
}

export interface WordComparisonData {
  target_word: string;
  target_meaning_sense: string;
  related_words: RelatedWordComparison[];
  contrastive_scenario: ContrastiveScenario;
  exercises: WordComparisonExercise[];
}

export interface WordPracticeData {
  word: string;
  cleaned_word: string;
  part_of_speech: string;
  ipa: string;
  pronunciation_tip?: string;
  meaning_vi: string;
  meaning_en: string;
  collocation_pattern: string;
  example_general: string;
  example_workplace: string;
  similar_word_comparison?: {
    word: string;
    difference: string;
  };
  context_in_exam?: string;
  // Word Family Discovery & Redesigned Micro-Exam Exercises
  word_family: WordFamilyData;
  exercises: WordFamilyExercise[];
  // Compare & Choose feature data
  comparison_data?: WordComparisonData;
  // Retained for backward compatibility
  practice_question?: WordPracticeQuestion;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface WritingTaskConfig {
  min_words?: number;
  max_words?: number;
  min_sentences?: number;
  max_sentences?: number;
  task_type: 'micro' | 'paragraph' | 'email' | 'argument' | 'essay';
  complexity: 'basic' | 'developing' | 'independent' | 'advanced';
  estimated_minutes: number;
}

export interface Question {
  id: string;
  section: SectionType;
  skill_id: string;
  skill_name: string;
  question_type: QuestionType;
  difficulty: EnglishLevel;
  context_topic: 'general' | 'workplace_tech';
  
  // Content
  concept_intro?: string; // Short 1-2 sentence concept setup
  reading_passage?: {
    title: string;
    text: string;
    word_count: number;
    topic: string;
  };
  vocab_card?: Omit<VocabularyItem, 'id' | 'review_stage' | 'next_review_at' | 'first_seen_at' | 'last_reviewed_at' | 'times_correct' | 'times_incorrect' | 'mastery_stage' | 'mastery_score' | 'contexts_encountered' | 'exercise_types_passed' | 'common_confusions'>;
  
  // Vocabulary pedagogical fields
  vocab_exercise_type?: VocabExerciseType;
  target_word?: string;
  context_sentence?: string; // Sentence with target word highlighted or blanked
  reinforcement_prompt?: {
    secondary_context: string;
    application_prompt: string;
    expected_usage_tip: string;
  };

  prompt: string;
  options?: QuestionOption[];
  expected_answer_ids?: string[];
  expected_answer_text?: string;
  accepted_alternatives?: string[];
  hint: string;
  explanation_rule: string;
  sentence_translation?: string; // Translated meaning of the sentence or target structure in learner's language
  
  // Adaptive Writing Fields
  writing_config?: WritingTaskConfig;
  model_answer?: string; // Internal model answer, never shown before submission
}

export interface AnswerEvaluation {
  verdict: Verdict;
  user_answer: string;
  expected_answer: string;
  full_correct_sentence: string;
  decisive_clue: string;
  explanation: string;
  contrast_explanation?: string;
  sentence_translation?: string; // Meaning translation of the target sentence / concept
  vocab_mastery_update?: {
    word: string;
    previous_stage: VocabMasteryStage;
    new_stage: VocabMasteryStage;
    score: number;
    explanation: string;
  };
  corrected_text?: string; // For writing: natural native phrasing preserving voice
  key_corrections?: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
  useful_phrases?: Array<{
    phrase: string;
    meaning: string;
    how_to_use?: string;
  }>;
  reusable_pattern?: string;
  error_tags: string[];
  needs_retry: boolean;
  next_action: 'continue' | 'retry' | 'transfer';
}

export interface Attempt {
  id: string;
  lesson_id: string;
  question_id: string;
  section: SectionType;
  skill_name: string;
  user_answer: string;
  verdict: Verdict;
  evaluation: AnswerEvaluation;
  writing_rubric?: WritingRubricScore;
  created_at: string;
}

export type ActivityType = 
  | 'warmup_review' 
  | 'concept_practice' 
  | 'vocab_acquisition' 
  | 'reading_analysis' 
  | 'writing_production' 
  | 'exit_synthesis';

export interface LessonSectionPlan {
  section: SectionType;
  title: string;
  description: string;
  estimated_minutes: number;
  skill_target: string;
  completed: boolean;
  activity_type?: ActivityType;
  target_questions_count: number;
  completed_questions_count?: number;
  questions?: Question[];
  pedagogical_focus?: 'overdue_review' | 'mistake_clinic' | 'prerequisite_reinforcement' | 'new_concept' | 'progress_check' | 'production_application';
  target_mastery_stage?: SkillMasteryStage;
  is_progress_check?: boolean;
}

export interface DeterministicSectionBlueprint {
  section: SectionType;
  title: string;
  description: string;
  estimated_minutes: number;
  target_questions_count: number;
  skill_target: string;
  activity_type: ActivityType;
  pedagogical_focus: 'overdue_review' | 'mistake_clinic' | 'prerequisite_reinforcement' | 'new_concept' | 'progress_check' | 'production_application';
  target_mastery_stage?: SkillMasteryStage;
  is_progress_check?: boolean;
}

export interface DeterministicLessonPlanBlueprint {
  primary_objective: string;
  reason_for_selection: string;
  estimated_duration_minutes: 10 | 20 | 30;
  session_pace_mode: 'quick_10' | 'standard_20' | 'deep_30';
  total_planned_questions: number;
  sections: DeterministicSectionBlueprint[];
  overdue_reviews_count: number;
  recurring_mistakes_targeted: string[];
  progress_check_active?: boolean;
}

export interface IndependentProgressCheck {
  id: string;
  session_id: string;
  date: string;
  difficulty_level: EnglishLevel;
  skill_targets: string[];
  total_questions: number;
  correct_count: number;
  accuracy: number;
  passed: boolean; // >= 75% accuracy
  verified_skills: string[];
  regressed_skills: string[];
  feedback_summary: string;
}

export interface LessonPlan {
  lesson_id: string;
  lesson_number: number;
  curriculum_day?: number;
  date: string;
  primary_objective: string;
  reason_for_selection: string;
  estimated_duration_minutes: number; // 10, 20, or 30
  session_pace_mode?: 'quick_10' | 'standard_20' | 'deep_30';
  total_planned_questions: number; // e.g. 6 for 10m, 10 for 20m, 15 for 30m
  sections: LessonSectionPlan[];
  status: 'planned' | 'in_progress' | 'completed' | 'paused';
  progress_check?: IndependentProgressCheck;
}

export interface NextSessionCustomContext {
  dailyMinutes?: number;
  paceMode?: 'quick_10' | 'standard_20' | 'deep_30';
  topicCategory?: string;
  topicCustomScenario?: string;
  generalVsWorkRatio?: number;
  selectedMistakes?: string[];
  selectedVocabWords?: string[];
  selectedNewSkills?: string[];
  customInstructions?: string;
}

export interface TomorrowPlanPreview {
  focus_title: string;
  review_topics: string[];
  new_skills: string[];
  estimated_minutes: number;
  preview_summary: string;
}

export interface DailySummary {
  lesson_id: string;
  lesson_number: number;
  completed_at: string;
  primary_objective: string;
  sections_completed: SectionType[];
  questions_answered: number;
  total_planned_questions?: number;
  time_spent_minutes?: number;
  target_duration_minutes?: number;
  session_pace_mode?: 'quick_10' | 'standard_20' | 'deep_30';
  accuracy_rate: number;
  key_takeaways: string[];
  vocabulary_learned: string[];
  recurring_mistakes_flagged: string[];
  next_review_topics: string[];
  tomorrow_plan?: TomorrowPlanPreview;
  learner_rating?: 'too_easy' | 'about_right' | 'too_difficult';
}

export interface TutorAssistantResponse {
  type: 'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity';
  content: string;
  example_sentence?: string;
}

// ----------------------------------------------------
// CONVERSATIONAL DISCOVERY TYPES
// ----------------------------------------------------

export interface DiscoveryMessage {
  id: string;
  sender: 'tutor' | 'learner';
  text: string;
  quickReplies?: string[];
  dimension?: 'goal' | 'level' | 'struggles' | 'language' | 'time' | 'ratio' | 'correction' | 'audio' | 'timeline' | 'confirmation';
  timestamp: string;
}

export interface DiscoveryState {
  messages: DiscoveryMessage[];
  currentDimensionIndex: number;
  isConfirmed: boolean;
  summary: string;
  profileDraft: Partial<UserProfile>;
  updatedAt: string;
}

// ----------------------------------------------------
// ADAPTIVE DIAGNOSTIC ASSESSMENT TYPES
// ----------------------------------------------------

export type DiagnosticMode = 'quick' | 'standard' | 'comprehensive';

export interface DiagnosticSectionPlan {
  section: SectionType;
  title: string;
  description: string;
  weightPercentage: number; // e.g. 25 for 25%
  targetQuestionsCount: number;
  estimatedMinutes: number;
  completed: boolean;
}

export interface DiagnosticAssessmentPlan {
  mode: DiagnosticMode;
  title: string;
  subtitle: string;
  targetDurationMinutes: number;
  totalQuestions: number;
  scoringWeights: {
    grammar: number;
    vocabulary: number;
    reading: number;
    writing: number;
  };
  sections: DiagnosticSectionPlan[];
}

export interface WritingRubricScore {
  accuracy: number; // 1-5
  vocabularyRange: number; // 1-5
  sentenceComplexity: number; // 1-5
  coherence: number; // 1-5
  naturalness: number; // 1-5
  taskCompletion: number; // 1-5
  feedbackSummary: string;
  correctedVersion: string;
  keyCorrections: Array<{ original: string; corrected: string; reason: string }>;
}

export interface SkillProficiencyEstimate {
  category: SectionType | 'speaking' | 'listening';
  cefrRange: string; // e.g. "B1-B2", "B2", "C1", "Not Assessed"
  confidence: 'low' | 'moderate' | 'high' | 'provisional';
  evidenceCount: number;
  correctCount: number;
  demonstratedStrengths: string[];
  priorityWeaknesses: string[];
  recurringErrors: string[];
  unassessedSubskills: string[];
}

export interface DiagnosticItemAttempt {
  id: string;
  question: Question;
  userAnswer: string;
  verdict: Verdict;
  evaluation: AnswerEvaluation;
  writingRubric?: WritingRubricScore;
  durationSeconds?: number;
  timestamp: string;
}

export interface DiagnosticSession {
  sessionId: string;
  mode: DiagnosticMode;
  status: 'in_progress' | 'paused' | 'completed';
  major_or_subject?: string;
  major_focus_details?: string;
  plan?: DiagnosticAssessmentPlan;
  currentSectionIndex?: number;
  questionIndexInSection?: number;
  currentIndex: number;
  totalQuestions?: number;
  minQuestions: number;
  maxQuestions: number;
  history: DiagnosticItemAttempt[];
  pregeneratedQuestions?: Question[];
  currentEstimates: {
    grammar: SkillProficiencyEstimate;
    vocabulary: SkillProficiencyEstimate;
    reading: SkillProficiencyEstimate;
    writing: SkillProficiencyEstimate;
    speaking: SkillProficiencyEstimate;
    listening: SkillProficiencyEstimate;
  };
  overallCEFR: string;
  currentQuestion?: Question;
  startedAt: string;
  lastActiveAt: string;
  completedAt?: string;
}

export interface DiagnosticReport {
  id: string;
  sessionId: string;
  mode: DiagnosticMode;
  targetDurationMinutes?: number;
  completedAt: string;
  overallScorePercentage?: number; // 0-100%
  overallCEFR: string;
  overallConfidence: 'low' | 'moderate' | 'high' | 'provisional';
  overallSummary: string;
  scoringWeights?: {
    grammar: number;
    vocabulary: number;
    reading: number;
    writing: number;
  };
  sectionScores?: {
    grammar: { score: number; maxScore: number; percentage: number; cefr: string };
    vocabulary: { score: number; maxScore: number; percentage: number; cefr: string };
    reading: { score: number; maxScore: number; percentage: number; cefr: string };
    writing: { score: number; maxScore: number; percentage: number; cefr: string };
  };
  skillEstimates: {
    grammar: SkillProficiencyEstimate;
    vocabulary: SkillProficiencyEstimate;
    reading: SkillProficiencyEstimate;
    writing: SkillProficiencyEstimate;
    speaking: SkillProficiencyEstimate;
    listening: SkillProficiencyEstimate;
  };
  demonstratedStrengths: string[];
  priorityWeaknesses: string[];
  recurringErrors: string[];
  totalQuestionsAnswered: number;
  accuracyRate: number;
}

// ----------------------------------------------------
// PERSONALIZED STUDY PLAN TYPES
// ----------------------------------------------------

export interface PrioritizedSkillPlan {
  skillId: string;
  skillName: string;
  category: SectionType;
  currentLevel: string;
  targetLevel: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface PersonalizedStudyPlan {
  id: string;
  learnerId: string;
  diagnosticReportId: string;
  overallObjective: string;
  diagnosticSummary: string;
  prioritizedSkills: PrioritizedSkillPlan[];
  shortTermMilestones: string[];
  suggestedWeeklyRoutine: Array<{ day: string; focus: string; minutes: number }>;
  dailyRoutineTemplate: Array<{ section: SectionType; title: string; minutes: number; target: string }>;
  spacedReviewStrategy: string;
  progressCheckIntervalDays: number;
  learnerApprovalStatus: 'draft' | 'approved';
  approvedAt?: string;
  createdAt: string;
}

export interface ActiveLessonState {
  lessonId: string;
  plan: LessonPlan;
  currentSectionIndex: number;
  questionIndexInSection: number;
  currentQuestion: Question | null;
  lastEvaluation: AnswerEvaluation | null;
  lastUserAnswer: string;
  attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>;
  sectionProgress: Record<number, number>;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  secondsElapsed: number;
  updatedAt: string;
}

export interface LearningDataExport {
  version: number;
  profile: UserProfile;
  skills: LearnerSkillState[];
  vocabulary: VocabularyItem[];
  attempts: Attempt[];
  lessons: LessonPlan[];
  activeLesson?: ActiveLessonState | null;
  summaries: DailySummary[];
  discoveryState?: DiscoveryState;
  diagnosticSession?: DiagnosticSession;
  diagnosticReports?: DiagnosticReport[];
  studyPlan?: PersonalizedStudyPlan;
  exported_at: string;
}

export interface SimilarWordComparison {
  word: string;
  nuance: string;
  when_to_use: string;
  example: string;
}

export interface DeepDiveChatMessage {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  created_at: string;
  examples?: string[];
  similar_words_comparison?: SimilarWordComparison[];
  suggestedFollowUps?: string[];
}

export interface DeepDiveInquiryRequest {
  question: Question;
  userAnswer: string;
  evaluation?: AnswerEvaluation;
  message: string;
  history?: Array<{ role: 'user' | 'tutor'; content: string }>;
  profile: UserProfile;
}

export interface DeepDiveInquiryResponse {
  reply: string;
  suggestedFollowUps?: string[];
  examples?: string[];
  similar_words_comparison?: SimilarWordComparison[];
}

export interface CompanionChatMessage {
  id: string;
  sender: 'user' | 'cat';
  content: string;
  timestamp: string;
  suggestedPills?: string[];
}

export interface CompanionChatContext {
  objective?: string;
  questionPrompt?: string;
  section?: SectionType | string;
  skillName?: string;
  conceptIntro?: string;
  userAnswer?: string;
  evaluationVerdict?: string;
  expectedAnswer?: string;
  explanationRule?: string;
}

