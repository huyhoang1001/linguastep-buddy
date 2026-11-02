import assert from 'assert';
import {
  GENZ_TRANSLATION_BANK,
  selectAdaptiveTranslation,
  buildTranslationQuestion,
  evaluateTranslationOffline
} from '../server/services/translationService.js';
import { MasteryEngine } from '../src/services/masteryEngine.js';
import { CurriculumScheduler } from '../src/services/curriculumScheduler.js';
import { UserProfile, Question } from '../src/types/learning.js';

console.log('=== RUNNING TEST SUITE 22: ADAPTIVE VIETNAMESE-TO-ENGLISH GEN Z TRANSLATION EXERCISES ===\n');

const mockProfile: UserProfile = {
  id: 'test-user-genz',
  name: 'An',
  primary_goal: 'conversation',
  goal_summary: 'Master conversational English',
  current_level: 'B1',
  target_level: 'B2',
  daily_minutes: 20,
  general_vs_work_ratio: 30,
  explanation_language: 'vi',
  days_per_week: 5,
  feedback_style: 'encouraging',
  enable_audio_tips: true,
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Test 1: Gen Z Translation Bank Coverage
console.log('Test 1: Verifying Gen Z Translation Bank coverage across A1-C1 and tones...');
assert.ok(GENZ_TRANSLATION_BANK.length >= 10, 'Translation bank should contain at least 10 items');
const levelsInBank = new Set(GENZ_TRANSLATION_BANK.map(item => item.cefrLevel));
assert.ok(levelsInBank.has('A1') || levelsInBank.has('A2'), 'Bank should cover beginner levels');
assert.ok(levelsInBank.has('B1') || levelsInBank.has('B2'), 'Bank should cover intermediate levels');
assert.ok(levelsInBank.has('C1'), 'Bank should cover advanced levels');

GENZ_TRANSLATION_BANK.forEach(item => {
  assert.ok(item.vietnameseText && item.vietnameseText.length > 3, `Item ${item.id} must have valid Vietnamese text`);
  assert.ok(item.scenario, `Item ${item.id} must have a scenario description`);
  assert.ok(item.hints && item.hints.length === 3, `Item ${item.id} must have exactly 3 progressive hints`);
  assert.ok(item.modelAnswer, `Item ${item.id} must have a model answer`);
  assert.ok(item.acceptedAlternatives && item.acceptedAlternatives.length >= 1, `Item ${item.id} must have accepted alternatives`);
});
console.log('✓ Gen Z Translation Bank verified successfully.');

// Test 2: Adaptive Selection based on Level and Skill
console.log('\nTest 2: Verifying adaptive selection by CEFR level and target skill...');
const a1Item = selectAdaptiveTranslation({ ...mockProfile, current_level: 'A1' }, 'Present Simple vs Continuous');
assert.ok(a1Item, 'Should select an item for A1 level');
assert.strictEqual(a1Item.cefrLevel, 'A1', 'Selected item should match A1 CEFR level');

const b2Item = selectAdaptiveTranslation({ ...mockProfile, current_level: 'B2' }, 'Past Narrative Social');
assert.ok(b2Item, 'Should select an item for B2 level');
assert.strictEqual(b2Item.cefrLevel, 'B2', 'Selected item should match B2 CEFR level');
console.log('✓ Adaptive selection verified successfully.');

// Test 3: Question Builder and Anti-Leakage Scrubbing
console.log('\nTest 3: Verifying question builder and pre-submission anti-leakage...');
const question: Question = buildTranslationQuestion(b2Item, mockProfile);
assert.strictEqual(question.question_type, 'vi_to_en_translation', 'Question type must be vi_to_en_translation');
assert.strictEqual(question.vietnamese_text, b2Item.vietnameseText, 'Vietnamese text must match bank item');
assert.strictEqual(question.translation_scenario, b2Item.scenario, 'Scenario must match bank item');
assert.strictEqual(question.translation_tone, b2Item.tone, 'Tone must match bank item');
assert.strictEqual(question.context_sentence, undefined, 'Context sentence must be undefined to prevent answer leakage');
assert.strictEqual(question.sentence_translation, undefined, 'Sentence translation must be undefined before submission');
assert.ok(!question.prompt.includes(b2Item.modelAnswer), 'Prompt must not leak model answer');
console.log('✓ Question builder & anti-leakage verified successfully.');

// Test 4: Offline 5-Dimension Translation Evaluator - Accurate Response
console.log('\nTest 4: Verifying offline 5-dimension evaluator on accurate natural translation...');
const accurateUserAnswer = b2Item.modelAnswer;
const evalAccurate = evaluateTranslationOffline(question, accurateUserAnswer, mockProfile);
assert.strictEqual(evalAccurate.verdict, 'correct', 'Accurate natural translation should receive correct verdict');
assert.ok((evalAccurate.naturalness_score || 0) >= 70, 'Naturalness score should be high for model answer');
assert.ok((evalAccurate.tone_score || 0) >= 70, 'Tone score should be high for model answer');
assert.ok(evalAccurate.meaning_feedback, 'Feedback must contain meaning preservation feedback');
assert.ok(evalAccurate.tone_insight, 'Feedback must contain tone insight');
assert.ok(evalAccurate.grammar_connection, 'Feedback must contain grammar connection');
assert.ok(evalAccurate.alternative_phrasing, 'Feedback must contain alternative phrasing');
console.log('✓ Accurate offline evaluation verified successfully.');

// Test 5: Offline Evaluator - Alternative Phrasing Acceptance
console.log('\nTest 5: Verifying acceptance of valid conversational alternatives...');
if (b2Item.acceptedAlternatives.length > 0) {
  const altAnswer = b2Item.acceptedAlternatives[0];
  const evalAlt = evaluateTranslationOffline(question, altAnswer, mockProfile);
  assert.ok(evalAlt.verdict === 'correct' || evalAlt.verdict === 'partially_correct', 'Valid alternative should be accepted');
}
console.log('✓ Alternative phrasing acceptance verified successfully.');

// Test 6: Offline Evaluator - Poor/Literal Translation
console.log('\nTest 6: Verifying offline evaluator on overly literal or incomplete translation...');
const poorAnswer = 'hi tired';
const evalPoor = evaluateTranslationOffline(question, poorAnswer, mockProfile);
assert.strictEqual(evalPoor.verdict, 'incorrect', 'Short incomplete answer should be marked incorrect');
assert.strictEqual(evalPoor.needs_retry, true, 'Incorrect translation must require retry');
console.log('✓ Poor translation evaluation verified successfully.');

// Test 7: Progressive Hints Stepper
console.log('\nTest 7: Verifying 3-step progressive hints content...');
assert.strictEqual(b2Item.hints.length, 3, 'Bank item must provide 3 progressive hints');
assert.ok(b2Item.hints[0].includes('Ý định') || b2Item.hints[0].includes('Intent'), 'Hint 1 should focus on communicative intent');
assert.ok(b2Item.hints[1].includes('Ngữ pháp') || b2Item.hints[1].includes('Grammar'), 'Hint 2 should focus on grammar concept');
assert.ok(b2Item.hints[2].includes('Gợi ý từ') || b2Item.hints[2].includes('Phrasing') || b2Item.hints[2].includes('Clue'), 'Hint 3 should focus on vocabulary/phrasing clue');
console.log('✓ Progressive hints stepper verified successfully.');

// Test 8: Cognitive Mastery Progression - Productive Translation Evidence
console.log('\nTest 8: Verifying productive translation evidence in MasteryEngine...');
const initialSkill = {
  skill_id: 'casual_present_tense_cadence',
  skill_name: 'Casual Present Tense Cadence',
  category: 'grammar',
  status: 'learning' as const,
  accuracy_rate: 0.8,
  total_attempts: 2,
  last_practiced_at: new Date().toISOString(),
  next_review_at: new Date().toISOString(),
  recurring_errors: [],
  mastery_stage: 'recognition' as const,
  mastery_score: 55,
  exercise_types_passed: ['multiple_choice'],
  consecutive_correct: 1,
  retention_checks_passed: 0,
  prerequisite_skill_ids: [],
  difficulty_level: 'B1' as const,
  last_retrieval_delay_days: 0,
  regression_count: 0
};

const updateResult = MasteryEngine.recordSkillEvidence(initialSkill, {
  skillId: initialSkill.skill_id,
  skillName: initialSkill.skill_name,
  category: 'grammar',
  isCorrect: true,
  questionType: 'vi_to_en_translation'
});

assert.strictEqual(updateResult.newStage, 'active_recall', 'Successful productive translation should advance skill to active_recall stage');
assert.ok(updateResult.explanation.includes('conversational translation'), 'Explanation should highlight productive translation evidence');
console.log('✓ Mastery engine integration verified successfully.');

// Test 9: Curriculum Scheduler Integration
console.log('\nTest 9: Verifying curriculum scheduler allocation for 20m standard sessions...');
const plan = CurriculumScheduler.scheduleDailyLesson({
  profile: mockProfile,
  skillStates: [initialSkill],
  recentErrors: []
});

assert.ok(plan.sections && plan.sections.length > 0, 'Plan must contain sections');
const hasTranslationSection = plan.sections.some(s => s.activity_type === 'conversational_translation');
assert.ok(hasTranslationSection, '20m standard session should include a conversational translation activity');
console.log('✓ Curriculum scheduler integration verified successfully.');

console.log('\n======================================================');
console.log('ALL TEST SUITE 22 TESTS PASSED PERFECTLY!');
console.log('======================================================\n');
