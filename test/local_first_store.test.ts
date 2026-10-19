process.env.NODE_ENV = 'test';

import { LocalLearningStore } from '../src/services/localStore.js';
import {
  UserProfile,
  LessonPlan,
  Question,
  AnswerEvaluation,
  Attempt,
  DiagnosticSession,
  DiagnosticReport,
  PersonalizedStudyPlan,
  ActiveLessonState
} from '../src/types/learning.js';

async function runLocalFirstStoreTests() {
  console.log('=== RUNNING LOCAL-FIRST CLIENT PERSISTENCE TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  const store = new LocalLearningStore();

  // =========================================================================
  // TEST 1: Learner Profile Persistence
  // =========================================================================
  console.log('--- Test 1: Learner Profile Persistence ---');
  const initialProfile = await store.getProfile();
  assert(Boolean(initialProfile && initialProfile.current_level), 'Default profile initialized');
  assert(initialProfile.daily_minutes === 20, 'Default daily minutes is 20');

  const updatedProfile = await store.updateProfile({
    name: 'Test Learner',
    current_level: 'B2',
    target_level: 'C1',
    daily_minutes: 30
  });
  assert(updatedProfile.name === 'Test Learner', 'Profile name updated');
  assert(updatedProfile.current_level === 'B2', 'Current level updated to B2');
  assert(updatedProfile.daily_minutes === 30, 'Daily minutes updated to 30');

  const reloadedProfile = await store.getProfile();
  assert(reloadedProfile.name === 'Test Learner', 'Reloaded profile reflects persistence');

  // =========================================================================
  // TEST 2: In-Progress Lesson State Resumption
  // =========================================================================
  console.log('\n--- Test 2: In-Progress Lesson State Resumption ---');
  const dummyPlan: LessonPlan = {
    lesson_id: 'lesson-test-101',
    lesson_number: 1,
    date: new Date().toISOString().split('T')[0],
    primary_objective: 'Master Present Perfect vs Past Simple',
    reason_for_selection: 'Calibration assessment',
    estimated_duration_minutes: 20,
    session_pace_mode: 'standard_20',
    total_planned_questions: 7,
    sections: [
      {
        section: 'grammar',
        title: 'Grammar Precision',
        description: 'Tense contrast',
        estimated_minutes: 5,
        skill_target: 'Present Perfect',
        completed: false,
        activity_type: 'concept_practice',
        target_questions_count: 2
      }
    ],
    status: 'in_progress'
  };

  const dummyQuestion: Question = {
    id: 'q-test-1',
    section: 'grammar',
    skill_id: 'skill-present-perfect',
    skill_name: 'Present Perfect',
    question_type: 'multiple_choice',
    difficulty: 'B1',
    context_topic: 'general',
    prompt: 'She ___ here since 2020.',
    hint: 'Unfinished time duration with since',
    explanation_rule: 'Use present perfect for ongoing actions'
  };

  const dummyEvaluation: AnswerEvaluation = {
    verdict: 'correct',
    user_answer: 'has lived',
    expected_answer: 'has lived',
    full_correct_sentence: 'She has lived here since 2020.',
    decisive_clue: 'since indicates duration from the past to now',
    explanation: 'Correct usage of present perfect.',
    error_tags: [],
    needs_retry: false,
    next_action: 'continue'
  };

  const activeLesson: ActiveLessonState = {
    lessonId: dummyPlan.lesson_id,
    plan: dummyPlan,
    currentSectionIndex: 0,
    questionIndexInSection: 1,
    currentQuestion: dummyQuestion,
    lastEvaluation: dummyEvaluation,
    lastUserAnswer: 'has lived',
    attempts: [
      {
        question: dummyQuestion,
        evaluation: dummyEvaluation,
        userAnswer: 'has lived'
      }
    ],
    sectionProgress: { 0: 1 },
    status: 'in_progress',
    secondsElapsed: 145,
    updatedAt: new Date().toISOString()
  };

  await store.saveActiveLesson(activeLesson);

  const restoredLesson = await store.getActiveLesson();
  assert(restoredLesson !== null, 'Active lesson retrieved from local storage');
  assert(restoredLesson?.lessonId === 'lesson-test-101', 'Restored lesson ID matches');
  assert(restoredLesson?.currentSectionIndex === 0, 'Restored section index');
  assert(restoredLesson?.questionIndexInSection === 1, 'Restored question position index');
  assert(restoredLesson?.attempts.length === 1, 'Restored accumulated attempts');
  assert(restoredLesson?.lastUserAnswer === 'has lived', 'Restored last submitted answer');
  assert(restoredLesson?.secondsElapsed === 145, 'Restored session timer seconds');

  await store.clearActiveLesson();
  assert((await store.getActiveLesson()) === null, 'Active lesson cleared on completion');

  // =========================================================================
  // TEST 3: Skill Mastery & Recurring Errors Tracking
  // =========================================================================
  console.log('\n--- Test 3: Local Skill Mastery Tracking ---');
  const dummyAttempt: Attempt = {
    id: 'att-1',
    lesson_id: 'lesson-test-101',
    question_id: 'q-past-simple',
    section: 'grammar',
    skill_name: 'Past Simple Irregular Verbs',
    user_answer: 'I catched the bus',
    verdict: 'incorrect',
    evaluation: {
      verdict: 'incorrect',
      user_answer: 'I catched the bus',
      expected_answer: 'I caught the bus',
      full_correct_sentence: 'I caught the bus',
      decisive_clue: 'catch is an irregular verb (caught)',
      explanation: 'Irregular past tense of catch is caught, not catched.',
      error_tags: ['irregular_verb_conjugation'],
      needs_retry: true,
      next_action: 'retry'
    },
    created_at: new Date().toISOString()
  };

  await store.recordAttempt(dummyAttempt);
  const skills = await store.getSkills();
  const targetSkill = skills.find(s => s.skill_name.toLowerCase().includes('past simple irregular'));

  assert(targetSkill !== undefined, 'Target skill tracked in local skills store');
  assert(targetSkill?.status === 'learning', 'Skill marked as learning upon error');
  assert(
    Boolean(targetSkill?.recurring_errors.some(e => e.includes('catch') || e.includes('irregular'))),
    'Recurring error tag recorded in skill state'
  );

  // =========================================================================
  // TEST 4: Vocabulary Spaced Repetition
  // =========================================================================
  console.log('\n--- Test 4: Vocabulary Management & Spaced Repetition ---');
  const newVocab = await store.saveVocabularyItem({
    word: 'Pragmatic',
    part_of_speech: 'adjective',
    ipa: '/præɡˈmæt.ɪk/',
    meaning: 'Solving problems in a sensible and practical way',
    collocation_pattern: 'pragmatic approach / pragmatic solution',
    example_general: 'We need a pragmatic approach to this issue.',
    example_workplace: 'The engineering team chose a pragmatic architecture.'
  });

  assert(newVocab.word === 'Pragmatic', 'Vocabulary item saved');
  assert(newVocab.review_stage === 1, 'Initial spaced repetition stage set to 1 day');

  const vocabList = await store.getVocabulary();
  assert(vocabList.some(v => v.word.toLowerCase() === 'pragmatic'), 'Vocabulary item listed in store');

  // =========================================================================
  // TEST 5: Diagnostic Session & Report Persistence
  // =========================================================================
  console.log('\n--- Test 5: Diagnostic Session & Report Persistence ---');
  const diagSession: DiagnosticSession = {
    sessionId: 'diag-session-001',
    mode: 'quick',
    status: 'in_progress',
    currentIndex: 3,
    minQuestions: 4,
    maxQuestions: 8,
    history: [],
    currentEstimates: {
      grammar: { category: 'grammar', cefrRange: 'B2', confidence: 'moderate', evidenceCount: 2, correctCount: 2, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      vocabulary: { category: 'vocabulary', cefrRange: 'B2', confidence: 'moderate', evidenceCount: 1, correctCount: 1, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      reading: { category: 'reading', cefrRange: 'B2', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      writing: { category: 'writing', cefrRange: 'B1', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      speaking: { category: 'speaking', cefrRange: 'Not Assessed', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      listening: { category: 'listening', cefrRange: 'Not Assessed', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] }
    },
    overallCEFR: 'B2',
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  await store.saveDiagnosticSession(diagSession);
  const loadedDiag = await store.getDiagnosticSession();
  assert(loadedDiag !== null && loadedDiag.sessionId === 'diag-session-001', 'Diagnostic session saved');

  // Pause session
  diagSession.status = 'paused';
  await store.saveDiagnosticSession(diagSession);
  const pausedDiag = await store.getDiagnosticSession();
  assert(pausedDiag?.status === 'paused', 'Diagnostic session paused state persisted');

  // Save diagnostic report
  const diagReport: DiagnosticReport = {
    id: 'report-001',
    sessionId: 'diag-session-001',
    mode: 'quick',
    completedAt: new Date().toISOString(),
    overallCEFR: 'B2',
    overallConfidence: 'moderate',
    overallSummary: 'Strong intermediate proficiency.',
    skillEstimates: diagSession.currentEstimates,
    demonstratedStrengths: ['Complex tenses'],
    priorityWeaknesses: ['Collocations'],
    recurringErrors: [],
    totalQuestionsAnswered: 4,
    accuracyRate: 0.75
  };

  await store.saveDiagnosticReport(diagReport);
  const reports = await store.getDiagnosticReports();
  assert(reports.length >= 1 && reports[0].id === 'report-001', 'Diagnostic report saved & retrievable');

  // =========================================================================
  // TEST 6: Export & Import Validation
  // =========================================================================
  console.log('\n--- Test 6: Export & Import Validation ---');
  const exportData = await store.exportAll();
  assert(exportData.version === 1, 'Export data has version 1');
  assert(Boolean(exportData.profile), 'Export contains profile');
  assert(Array.isArray(exportData.skills) && exportData.skills.length > 0, 'Export contains skills');
  assert(Array.isArray(exportData.vocabulary), 'Export contains vocabulary');
  assert(exportData.diagnosticReports?.length === 1, 'Export contains diagnostic reports');
  assert(typeof (exportData as any).apiKey === 'undefined', 'Export DOES NOT contain any API keys or secrets');

  // Validate corrupt or invalid data
  const invalid1 = store.validateImport(null);
  assert(!invalid1.valid, 'Null import rejected');

  const invalid2 = store.validateImport({ profile: {} });
  assert(!invalid2.valid, 'Incomplete profile import rejected');

  // Validate valid export
  const validCheck = store.validateImport(exportData);
  assert(validCheck.valid, 'Valid export passed pre-flight validation');
  assert(validCheck.summary.profileName === 'Test Learner', 'Validation summary extracts profile name');
  assert(validCheck.summary.skillsCount > 0, 'Validation summary counts skills');

  // =========================================================================
  // TEST 7: Reset All Progress
  // =========================================================================
  console.log('\n--- Test 7: Reset All Progress ---');
  await store.resetAll();
  const resetProfile = await store.getProfile();
  assert(resetProfile.name === 'Learner', 'Profile reset to default Learner');
  const resetReports = await store.getDiagnosticReports();
  assert(resetReports.length === 0, 'Diagnostic reports cleared on reset');
  const resetAttempts = await store.getAttempts();
  assert(resetAttempts.length === 0, 'Attempts cleared on reset');

  // =========================================================================
  // TEST 8: Storage Status Reporting
  // =========================================================================
  console.log('\n--- Test 8: Storage Status Reporting ---');
  const status = store.getStorageStatus();
  assert(status.initialized === true, 'Storage reports initialized');
  assert(typeof status.type === 'string', 'Storage reports storage engine type');
  assert(Boolean(status.lastSavedAt), 'Storage reports last saved timestamp');

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLocalFirstStoreTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
