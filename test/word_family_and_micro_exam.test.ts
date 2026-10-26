import { buildRuleBasedWordFamily, CURATED_WORD_FAMILIES } from '../server/fallbacks/wordFamilyFallbacks.js';
import { localStore } from '../src/services/localStore.js';
import { DEFAULT_PROFILE } from '../src/services/localSeed.js';
import { UserProfile } from '../src/types/learning.js';

const mockProfile: UserProfile = {
  ...DEFAULT_PROFILE,
  id: 'learner-word-fam-test',
  name: 'Test Learner',
  current_level: 'B2',
  target_level: 'C1',
  explanation_language: 'vi',
  daily_minutes: 20,
  major_or_subject: 'Technology & Software Engineering'
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runWordFamilyTests() {
  console.log('=== RUNNING WORD FAMILY DISCOVERY & MICRO-EXAM TESTS ===\n');

  // ----------------------------------------------------
  // TEST 1: Word Family Discovery for "collaboration"
  // ----------------------------------------------------
  console.log('--- Test 1: Word Family Discovery for "collaboration" ---');
  const collabData = buildRuleBasedWordFamily('collaboration', '', mockProfile);
  assert(Boolean(collabData.word_family), 'Word family data is discovered and populated');
  assert(collabData.word_family.members.length >= 4, 'Word family contains at least 4 derivational forms');

  const forms = collabData.word_family.members.map(m => m.form.toLowerCase());
  assert(forms.includes('collaborate'), 'Includes verb form "collaborate"');
  assert(forms.includes('collaboration'), 'Includes noun form "collaboration"');
  assert(forms.includes('collaborative'), 'Includes adjective form "collaborative"');
  assert(forms.includes('collaboratively'), 'Includes adverb form "collaboratively"');
  assert(forms.includes('collaborator'), 'Includes agent noun "collaborator"');

  const collabMember = collabData.word_family.members.find(m => m.form === 'collaborative');
  assert(collabMember?.suffix_or_pattern?.includes('-ive') || false, 'Member specifies derivational pattern/suffix');
  assert(Boolean(collabMember?.example_sentence), 'Member includes authentic example sentence');

  // ----------------------------------------------------
  // TEST 2: Primary Exercise — Word Form Selection
  // ----------------------------------------------------
  console.log('\n--- Test 2: Primary Exercise — Word Form Selection ---');
  assert(Array.isArray(collabData.exercises) && collabData.exercises.length > 0, 'Exercises array generated');
  const primaryEx = collabData.exercises[0];
  assert(primaryEx.exercise_type === 'word_form_selection', 'Primary exercise is word_form_selection');
  assert(primaryEx.target_form.toLowerCase() !== 'collaboration', 'Primary exercise tests a DIFFERENT word form than the entered word (tests "collaboratively")');
  assert(primaryEx.options.length === 4, 'Provides exactly 4 options A, B, C, D');
  assert(Boolean(primaryEx.grammatical_clue), 'Decisive grammatical clue is provided');
  assert(primaryEx.grammatical_clue.toLowerCase().includes('adverb') || primaryEx.grammatical_clue.includes('Trạng từ'), 'Grammatical clue explains syntactic requirement');
  assert(Boolean(primaryEx.distractor_explanations), 'Distractor explanations map provided');
  assert(Boolean(primaryEx.distractor_explanations?.['A']), 'Option A distractor explanation exists');
  assert(Boolean(primaryEx.distractor_explanations?.['B']), 'Option B distractor explanation exists');
  assert(Boolean(primaryEx.distractor_explanations?.['C']), 'Option C distractor explanation exists');

  // ----------------------------------------------------
  // TEST 3: Secondary Exercise Types (Error Correction & Transformation)
  // ----------------------------------------------------
  console.log('\n--- Test 3: Secondary Exercise Types ---');
  const errorCorrEx = collabData.exercises.find(e => e.exercise_type === 'error_correction');
  assert(Boolean(errorCorrEx), 'Includes error_correction exercise');
  assert(Boolean(errorCorrEx?.error_sentence), 'Error correction exercise includes sentence with deliberate grammatical mistake');
  assert(errorCorrEx?.error_sentence?.includes('collaborative') || false, 'Error sentence contains incorrect part of speech');

  const transformEx = collabData.exercises.find(e => e.exercise_type === 'sentence_transformation');
  assert(Boolean(transformEx), 'Includes sentence_transformation exercise');
  assert(Boolean(transformEx?.transformation_source_sentence), 'Transformation exercise includes source sentence');

  // ----------------------------------------------------
  // TEST 4: Missing Forms Note (No False Hallucinations)
  // ----------------------------------------------------
  console.log('\n--- Test 4: Missing Forms Note (No False Hallucinations) ---');
  const discData = buildRuleBasedWordFamily('discrepancy', '', mockProfile);
  assert(Boolean(discData.word_family.missing_forms_note), 'Explains missing forms instead of inventing rare/non-existent derivatives');
  assert(discData.word_family.missing_forms_note?.toLowerCase().includes('động từ') || discData.word_family.missing_forms_note?.toLowerCase().includes('verb') || false, 'Notes absence of common verb in modern English');

  // ----------------------------------------------------
  // TEST 5: Independent Word Form Learning Progress Tracking
  // ----------------------------------------------------
  console.log('\n--- Test 5: Independent Word Form Learning Progress Tracking ---');
  // Record correct evidence for "collaboratively"
  const res1 = await localStore.recordWordFormEvidence({
    rootWord: 'collaboration',
    form: 'collaboratively',
    partOfSpeech: 'adverb',
    isCorrect: true,
    familyData: collabData.word_family
  });

  assert(res1.formMastery.form === 'collaboratively', 'Updated form matches tested form');
  assert(res1.formMastery.status === 'understood', 'Single correct answer marks form as understood');
  assert(res1.allFormMasteries['collaboratively']?.status === 'understood', 'Form recorded in mastery map');

  // Verify other forms are NOT marked as understood/mastered based on this answer
  const masteriesAfter1 = await localStore.getWordFamilyMastery('collaboration');
  assert(masteriesAfter1['collaborate'] === undefined || masteriesAfter1['collaborate']?.status !== 'understood', 'Other family form "collaborate" is NOT marked understood');
  assert(masteriesAfter1['collaborative'] === undefined || masteriesAfter1['collaborative']?.status !== 'understood', 'Other family form "collaborative" is NOT marked understood');

  // Record mistake for "collaborate"
  const res2 = await localStore.recordWordFormEvidence({
    rootWord: 'collaboration',
    form: 'collaborate',
    partOfSpeech: 'verb',
    isCorrect: false,
    familyData: collabData.word_family
  });

  assert(res2.formMastery.status === 'needs_practice', '"collaborate" status is "needs_practice" after incorrect submission');

  const masteriesFinal = await localStore.getWordFamilyMastery('collaboration');
  assert(masteriesFinal['collaboratively'].status === 'understood', '"collaboratively" remains understood');
  assert(masteriesFinal['collaborate'].status === 'needs_practice', '"collaborate" is tracked separately as needs_practice');

  console.log('\n======================================================');
  console.log(`TOTAL WORD FAMILY TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runWordFamilyTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
