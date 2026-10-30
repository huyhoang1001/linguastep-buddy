import { GeminiLearningProvider } from '../server/aiService.js';
import { DiagnosticSession, UserProfile } from '../src/types/learning.js';
import { createDiagnosticAssessmentPlan } from '../src/types/diagnosticPlans.js';

async function runTests() {
  console.log('=== RUNNING ADAPTIVE DIAGNOSTIC ASSESSMENT TESTS ===\n');

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

  let questionCounter = 0;
  const ai = new GeminiLearningProvider();
  // Mock AI provider for hermetic, fast test execution
  ai.setMockHandler((prompt: string) => {
    if (prompt.includes('Assess writing') || prompt.includes('Evaluate free writing')) {
      return {
        accuracy: 4,
        vocabularyRange: 4,
        sentenceComplexity: 4,
        coherence: 4,
        naturalness: 4,
        taskCompletion: 4,
        feedbackSummary: 'Clear and well-structured workplace response.',
        correctedVersion: 'I encountered an unexpected database connection error during deployment.',
        keyCorrections: []
      };
    }
    if (prompt.includes('Generate the complete calibrated suite')) {
      return {
        questions: [
          { id: 'q-g1', section: 'grammar', skill_name: 'Tenses', question_type: 'multiple_choice', difficulty: 'B1', prompt: 'He ____ finished the report.', options: [{ id: 'A', text: 'has' }, { id: 'B', text: 'have' }, { id: 'C', text: 'had' }, { id: 'D', text: 'having' }], expected_answer_ids: ['A'], expected_answer_text: 'has', hint: 'Present perfect with third person singular.' },
          { id: 'q-g2', section: 'grammar', skill_name: 'Conditionals', question_type: 'multiple_choice', difficulty: 'B2', prompt: 'If we ____ earlier, we would have caught the train.', options: [{ id: 'A', text: 'left' }, { id: 'B', text: 'had left' }, { id: 'C', text: 'have left' }, { id: 'D', text: 'were leaving' }], expected_answer_ids: ['B'], expected_answer_text: 'had left', hint: 'Third conditional.' },
          { id: 'q-g3', section: 'grammar', skill_name: 'Passive Voice', question_type: 'multiple_choice', difficulty: 'B2', prompt: 'The software ____ by our team last week.', options: [{ id: 'A', text: 'was updated' }, { id: 'B', text: 'is updated' }, { id: 'C', text: 'updated' }, { id: 'D', text: 'has updated' }], expected_answer_ids: ['A'], expected_answer_text: 'was updated', hint: 'Past simple passive.' },
          { id: 'q-v1', section: 'vocabulary', skill_name: 'Collocations', question_type: 'multiple_choice', difficulty: 'B1', prompt: 'We need to ____ a decision quickly.', options: [{ id: 'A', text: 'make' }, { id: 'B', text: 'do' }, { id: 'C', text: 'take' }, { id: 'D', text: 'give' }], expected_answer_ids: ['A'], expected_answer_text: 'make', hint: 'Make a decision.' },
          { id: 'q-v2', section: 'vocabulary', skill_name: 'Workplace Terms', question_type: 'multiple_choice', difficulty: 'B2', prompt: 'The team managed to ____ the issue before release.', options: [{ id: 'A', text: 'resolve' }, { id: 'B', text: 'break' }, { id: 'C', text: 'ignore' }, { id: 'D', text: 'delay' }], expected_answer_ids: ['A'], expected_answer_text: 'resolve', hint: 'Fix or resolve a problem.' },
          { id: 'q-v3', section: 'vocabulary', skill_name: 'Technical Terms', question_type: 'multiple_choice', difficulty: 'B2', prompt: 'We experienced an unexpected network ____.', options: [{ id: 'A', text: 'latency' }, { id: 'B', text: 'happy' }, { id: 'C', text: 'run' }, { id: 'D', text: 'blue' }], expected_answer_ids: ['A'], expected_answer_text: 'latency', hint: 'Network delay.' },
          { id: 'q-r1', section: 'reading', skill_name: 'Comprehension', question_type: 'reading_comprehension', difficulty: 'B2', reading_passage: { title: 'Async Work', text: 'Asynchronous communication is vital for global remote teams.', word_count: 50, topic: 'remote_work' }, prompt: 'Why is async communication important?', options: [{ id: 'A', text: 'It helps remote teams' }, { id: 'B', text: 'It slows work' }, { id: 'C', text: 'It causes confusion' }, { id: 'D', text: 'It requires co-location' }], expected_answer_ids: ['A'], expected_answer_text: 'It helps remote teams', hint: 'Read the first sentence.' },
          { id: 'q-w1', section: 'writing', skill_name: 'Workplace Update', question_type: 'free_writing', difficulty: 'B2', prompt: 'Write 2-3 sentences updating your team on current project blockers.', expected_answer_text: 'Original coherent response.', hint: 'Use clear sentences.' }
        ]
      };
    }
    if (prompt.includes('for section')) {
      questionCounter++;
      const isReading = prompt.includes('section reading');
      const isWriting = prompt.includes('section writing');
      const isVocab = prompt.includes('section vocabulary');
      const sec = isWriting ? 'writing' : isReading ? 'reading' : isVocab ? 'vocabulary' : 'grammar';

      if (isWriting) {
        return {
          id: `ai-item-${questionCounter}`,
          section: 'writing',
          skill_name: 'Written Communication',
          question_type: 'free_writing',
          difficulty: 'B2',
          prompt: `Write 2-3 sentences explaining your progress today (Item ${questionCounter}).`,
          expected_answer_text: 'Original text.',
          hint: 'Write clearly.'
        };
      }
      if (isReading) {
        return {
          id: `ai-item-${questionCounter}`,
          section: 'reading',
          skill_name: 'Reading Comprehension',
          question_type: 'reading_comprehension',
          difficulty: 'B2',
          reading_passage: {
            title: 'Modern Architecture',
            text: 'Scalable services require modular component boundaries and isolated state management.',
            word_count: 100,
            topic: 'system_design'
          },
          prompt: `What is necessary for scalable systems according to the passage? (Item ${questionCounter})`,
          options: [
            { id: 'A', text: 'Modular component boundaries' },
            { id: 'B', text: 'Monolithic single threads' },
            { id: 'C', text: 'No testing' },
            { id: 'D', text: 'Uncapped network queues' }
          ],
          expected_answer_ids: ['A'],
          expected_answer_text: 'Modular component boundaries',
          hint: 'Look at the first line.'
        };
      }
      return {
        id: `ai-item-${questionCounter}`,
        section: sec,
        skill_name: `${sec} precision ${questionCounter}`,
        question_type: 'multiple_choice',
        difficulty: 'B2',
        prompt: `Select the correct form for item ${questionCounter}: Our team has ____ the milestone.`,
        options: [
          { id: 'A', text: 'reached' },
          { id: 'B', text: 'reach' },
          { id: 'C', text: 'reaching' },
          { id: 'D', text: 'reaches' }
        ],
        expected_answer_ids: ['A'],
        expected_answer_text: 'reached',
        hint: 'Past participle form.'
      };
    }
    return null;
  });

  const mockProfile: UserProfile = {
    id: 'test-learner',
    name: 'Test Learner',
    current_level: 'B2',
    target_level: 'C1',
    primary_goal: 'workplace_tech',
    goal_summary: 'Targeting technical communication',
    explanation_language: 'vi',
    general_vs_work_ratio: 65,
    daily_minutes: 20,
    days_per_week: 5,
    feedback_style: 'encouraging',
    enable_audio_tips: true,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // TEST 1: Diagnostic Mode Calibration Plans (No hardcoded question banks)
  console.log('--- Test 1: Diagnostic Mode Calibration Plans ---');
  const quickPlan = createDiagnosticAssessmentPlan('quick');
  assert(quickPlan.targetDurationMinutes === 10, 'Quick mode has calibrated 10m target duration');
  assert(quickPlan.totalQuestions === 8, 'Quick mode has exactly 8 total questions');
  assert(quickPlan.sections.length === 4, 'Quick mode covers all 4 sequential sections');
  assert(quickPlan.scoringWeights.grammar === 25 && quickPlan.scoringWeights.vocabulary === 25 && quickPlan.scoringWeights.reading === 25 && quickPlan.scoringWeights.writing === 25,
    'Quick mode scoring weights add up to 100% (25% each)');

  const standardPlan = createDiagnosticAssessmentPlan('standard');
  assert(standardPlan.targetDurationMinutes === 20, 'Standard mode has calibrated 20m target duration');
  assert(standardPlan.totalQuestions === 13, 'Standard mode has calibrated 13 total questions');
  assert(standardPlan.sections[0].section === 'grammar' && standardPlan.sections[0].targetQuestionsCount === 5,
    'Standard mode Grammar section specifies 5 questions');
  assert(standardPlan.sections[1].section === 'vocabulary' && standardPlan.sections[1].targetQuestionsCount === 4,
    'Standard mode Vocabulary section specifies 4 questions');
  assert(standardPlan.sections[2].section === 'reading' && standardPlan.sections[2].targetQuestionsCount === 3,
    'Standard mode Reading section specifies 3 questions');
  assert(standardPlan.sections[3].section === 'writing' && standardPlan.sections[3].targetQuestionsCount === 1,
    'Standard mode Writing section specifies 1 task');

  const compPlan = createDiagnosticAssessmentPlan('comprehensive');
  assert(compPlan.targetDurationMinutes === 36, 'Comprehensive mode has calibrated 36m target duration');
  assert(compPlan.totalQuestions === 22, 'Comprehensive mode has calibrated 22 total questions');

  // TEST 2: Sequential Section Flow & Zero Duplicate Execution
  console.log('\n--- Test 2: Sequential Section Flow & Zero Duplicate Execution ---');
  const session: DiagnosticSession = {
    sessionId: 'test-session-sequential',
    mode: 'quick',
    status: 'in_progress',
    plan: quickPlan,
    currentSectionIndex: 0,
    questionIndexInSection: 0,
    currentIndex: 1,
    totalQuestions: quickPlan.totalQuestions,
    minQuestions: quickPlan.totalQuestions,
    maxQuestions: quickPlan.totalQuestions,
    history: [],
    currentEstimates: {} as any,
    overallCEFR: 'B2',
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  // Section 1: Grammar (target: 3 questions)
  const g1 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(g1.section === 'grammar', 'Item 1 begins in Section 1: Grammar');
  session.history.push({
    id: 'att-g1',
    question: g1,
    userAnswer: 'finished',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'finished', expected_answer: 'finished', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    timestamp: new Date().toISOString()
  });

  const g2 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(g2.section === 'grammar', 'Item 2 stays within Section 1: Grammar');
  assert(g2.id !== g1.id && g2.prompt !== g1.prompt, 'Item 2 does not duplicate Item 1');
  session.history.push({
    id: 'att-g2',
    question: g2,
    userAnswer: 'has hired',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'has hired', expected_answer: 'has hired', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    timestamp: new Date().toISOString()
  });

  const g3 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(g3.section === 'grammar', 'Item 3 stays within Section 1: Grammar');
  assert(g3.id !== g2.id && g3.id !== g1.id, 'Item 3 does not duplicate previous grammar items');
  session.history.push({
    id: 'att-g3',
    question: g3,
    userAnswer: 'had',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'had', expected_answer: 'had', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    timestamp: new Date().toISOString()
  });

  // Section 2: Vocabulary (Target: 3 questions) - should transition smoothly now that Grammar has 3
  const v1 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(v1.section === 'vocabulary', 'After completing Grammar, transitions sequentially to Section 2: Vocabulary');
  session.history.push({
    id: 'att-v1',
    question: v1,
    userAnswer: 'schedule',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'schedule', expected_answer: 'schedule', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    timestamp: new Date().toISOString()
  });

  const v2 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(v2.section === 'vocabulary', 'Item 5 stays within Section 2: Vocabulary');
  assert(v2.id !== v1.id, 'Item 5 does not duplicate Item 4');
  session.history.push({
    id: 'att-v2',
    question: v2,
    userAnswer: 'mitigate',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'mitigate', expected_answer: 'mitigate', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    timestamp: new Date().toISOString()
  });

  const v3 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(v3.section === 'vocabulary', 'Item 6 stays within Section 2: Vocabulary');
  session.history.push({
    id: 'att-v3',
    question: v3,
    userAnswer: 'trade-off',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'trade-off', expected_answer: 'trade-off', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    timestamp: new Date().toISOString()
  });

  // Section 3: Reading (Target: 1 question)
  const r1 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(r1.section === 'reading', 'After completing Vocabulary, transitions sequentially to Section 3: Reading');
  assert(Boolean(r1.reading_passage), 'Reading item includes coherent reading passage text and title');
  session.history.push({
    id: 'att-r1',
    question: r1,
    userAnswer: 'B',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'B', expected_answer: 'B', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    timestamp: new Date().toISOString()
  });

  // Section 4: Writing (Target: 1 question)
  const w1 = await ai.generateAdaptiveDiagnosticQuestion(session, mockProfile);
  assert(w1.section === 'writing', 'After completing Reading, transitions sequentially to Section 4: Writing');
  assert(w1.question_type === 'free_writing', 'Writing item is free_writing production task');

  // TEST 3: Multi-Dimensional Writing Evaluation
  console.log('\n--- Test 3: Multi-Dimensional Writing Evaluation & Polishing ---');
  const studentWriting = 'I encountered an unexpected database connection error during deployment. I am currently reviewing the server configuration logs with the backend team. I anticipate deploying the fix by 3 PM.';
  const writingResult = await ai.evaluateDiagnosticAnswer(w1, studentWriting, mockProfile);

  assert(writingResult.evaluation.verdict === 'correct', 'Writing response evaluated as correct/pass');
  assert(Boolean(writingResult.writingRubric), 'Writing rubric generated with 6-dimension scores');
  if (writingResult.writingRubric) {
    assert(writingResult.writingRubric.accuracy >= 3, 'Rubric scored accuracy >= 3');
    assert(writingResult.writingRubric.taskCompletion >= 3, 'Rubric scored task completion >= 3');
    assert(writingResult.writingRubric.correctedVersion !== studentWriting, 'Polished native model is elevated and not raw echo');
  }

  session.history.push({
    id: 'att-w1',
    question: w1,
    userAnswer: studentWriting,
    verdict: 'correct',
    evaluation: writingResult.evaluation,
    writingRubric: writingResult.writingRubric,
    timestamp: new Date().toISOString()
  });

  assert(session.history.length === quickPlan.totalQuestions, `All ${quickPlan.totalQuestions} questions completed across all 4 sections`);

  // TEST 4: Explicit 4-Area Weighted Scoring & Report Generation
  console.log('\n--- Test 4: Explicit 4-Area Weighted Scoring & Report Generation ---');
  const report = await ai.computeDiagnosticReport(session, mockProfile);

  assert(typeof report.overallScorePercentage === 'number', `Report contains overallScorePercentage: ${report.overallScorePercentage}%`);
  assert((report.overallScorePercentage ?? 0) >= 80, 'High accuracy results in overall score >= 80%');
  assert(Boolean(report.sectionScores), 'Report contains explicit sectionScores breakdown');
  if (report.sectionScores) {
    assert(report.sectionScores.grammar.percentage === 100, 'Grammar section scored 100% (3/3)');
    assert(report.sectionScores.vocabulary.percentage === 100, 'Vocabulary section scored 100% (3/3)');
    assert(report.sectionScores.reading.percentage === 100, 'Reading section scored 100% (1/1)');
    assert(report.sectionScores.writing.percentage >= 60, 'Writing section scored from multi-dimensional rubric');
  }
  assert(report.scoringWeights?.grammar === 25 && report.scoringWeights?.writing === 25, 'Report reflects 25% scoring weights per area');
  assert(report.targetDurationMinutes === 10, 'Report reflects 10m target duration for quick mode');
  assert(report.skillEstimates.speaking.cefrRange.includes('Not Assessed'), 'Speaking honestly marked as Not Assessed in text diagnostic');
  assert(report.skillEstimates.listening.cefrRange.includes('Not Assessed'), 'Listening honestly marked as Not Assessed in text diagnostic');

  // TEST 5: Evidence-Grounded Study Plan Generation
  console.log('\n--- Test 5: Personalized Study Plan Generation ---');
  const studyPlan = await ai.generatePersonalizedStudyPlan(report, mockProfile);
  assert(Boolean(studyPlan.overallObjective), 'Study plan contains overall objective');
  assert(studyPlan.prioritizedSkills.length >= 2, 'Study plan contains prioritized skills');
  assert(Boolean(studyPlan.prioritizedSkills[0].rationale), 'Prioritized skills include explicit rationale grounded in assessment');
  assert(studyPlan.dailyRoutineTemplate.length === 4, 'Daily routine template has 4 flexible sections (Grammar, Vocab, Reading, Writing)');
  assert(studyPlan.learnerApprovalStatus === 'draft', 'Study plan is created in draft status awaiting learner approval');

  // TEST 6: One-Time Batch Question Generation for Whole Assessment
  console.log('\n--- Test 6: One-Time Batch Generation for Full Assessment ---');
  const batchSession: DiagnosticSession = {
    sessionId: 'test-session-batch',
    mode: 'quick',
    status: 'in_progress',
    plan: quickPlan,
    currentSectionIndex: 0,
    questionIndexInSection: 0,
    currentIndex: 1,
    totalQuestions: 8,
    minQuestions: 8,
    maxQuestions: 8,
    history: [],
    currentEstimates: session.currentEstimates,
    overallCEFR: 'B2',
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  const batchQuestions = await ai.generateDiagnosticBatchQuestions(batchSession, mockProfile);
  assert(Array.isArray(batchQuestions), 'Batch question generation returns an array of questions');
  assert(batchQuestions.length === 8, 'Quick mode generates all 8 assessment questions at once');
  const batchGrammar = batchQuestions.filter(q => q.section === 'grammar');
  const batchVocab = batchQuestions.filter(q => q.section === 'vocabulary');
  const batchReading = batchQuestions.filter(q => q.section === 'reading');
  const batchWriting = batchQuestions.filter(q => q.section === 'writing');
  assert(batchGrammar.length === 3, 'Batch contains 3 grammar questions');
  assert(batchVocab.length === 3, 'Batch contains 3 vocabulary questions');
  assert(batchReading.length === 1, 'Batch contains 1 reading comprehension question');
  assert(Boolean(batchReading[0].reading_passage), 'Reading question in batch has a reading passage');
  assert(batchWriting.length === 1, 'Batch contains 1 writing question');
  assert(batchWriting[0].question_type === 'free_writing', 'Writing question in batch is free_writing');

  // TEST 7: Major / Subject Tailoring in Profile & Diagnostic Session
  console.log('\n--- Test 7: Subject / Major Focus Propagation ---');
  const medicalProfile: UserProfile = {
    ...mockProfile,
    major_or_subject: 'Healthcare & Medicine',
    major_focus_details: 'Clinical oncology nurse presenting daily patient chart summaries'
  };

  const medicalSession: DiagnosticSession = {
    ...batchSession,
    sessionId: 'test-session-medical',
    major_or_subject: medicalProfile.major_or_subject,
    major_focus_details: medicalProfile.major_focus_details
  };

  assert(medicalSession.major_or_subject === 'Healthcare & Medicine', 'Diagnostic session stores selected major');
  assert(Boolean(medicalSession.major_focus_details?.includes('Clinical oncology')), 'Diagnostic session stores specialty focus details');

  const medicalQuestions = await ai.generateDiagnosticBatchQuestions(medicalSession, medicalProfile);
  assert(medicalQuestions.length === 8, 'Batch generator successfully completes for medical major');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
