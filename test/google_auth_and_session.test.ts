process.env.NODE_ENV = 'test';

import {
  verifyGoogleIdToken,
  createSessionToken,
  validateSessionToken,
  revokeSessionToken,
  createGuestSession,
  clearSessionsForTest
} from '../server/authService.js';
import { localStore } from '../src/services/localStore.js';

async function runGoogleAuthAndSessionTests() {
  console.log('=== RUNNING GOOGLE IDENTITY SERVICES, SESSION & ACCOUNT ISOLATION TESTS ===\n');

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

  clearSessionsForTest();

  // =========================================================================
  // TEST 1: Google ID Token Verification & Stable Identifier (sub)
  // =========================================================================
  console.log('--- Test 1: Google ID Token Verification & Stable Google Sub ---');

  const testGoogleSub = '109876543210987654321';
  const googleUser = await verifyGoogleIdToken(`test_mock_google_${testGoogleSub}`);

  assert(googleUser.id === `google_${testGoogleSub}`, 'Uses verified Google sub as immutable account ID');
  assert(googleUser.authProvider === 'google', 'Account authProvider is set to google');
  assert(Boolean(googleUser.email && googleUser.email.includes(testGoogleSub)), 'Account includes verified email');

  // =========================================================================
  // TEST 2: Session Establishment & Validation (Cookie/Bearer token)
  // =========================================================================
  console.log('\n--- Test 2: Session Creation & Token Lifecycle ---');

  const sessionToken = createSessionToken(googleUser);
  assert(sessionToken.startsWith('lst_'), 'Issues cryptographically random session token (lst_ prefix)');

  // Validate session
  const activeUser = validateSessionToken(sessionToken);
  assert(activeUser !== null && activeUser.id === googleUser.id, 'Session validates successfully to Google user');

  // Validate invalid token
  const badTokenUser = validateSessionToken('lst_invalid_fake_token_12345');
  assert(badTokenUser === null, 'Invalid session token returns null');

  // =========================================================================
  // TEST 3: Sign-Out & Invalidation
  // =========================================================================
  console.log('\n--- Test 3: Sign-Out Session Revocation ---');

  revokeSessionToken(sessionToken);
  const userAfterSignOut = validateSessionToken(sessionToken);
  assert(userAfterSignOut === null, 'Revoking session token prevents subsequent validation (clean sign-out)');

  // =========================================================================
  // TEST 4: Explicit Guest Mode Lifecycle
  // =========================================================================
  console.log('\n--- Test 4: Explicit Guest Mode Lifecycle ---');

  const guestSession = createGuestSession('learner-primary');
  assert(guestSession.user.authProvider === 'guest', 'Guest session flagged with authProvider: guest');
  assert(guestSession.user.id === 'learner-primary', 'Guest session ID is learner-primary');
  assert(validateSessionToken(guestSession.token)?.id === 'learner-primary', 'Guest session token is valid and isolated');

  // =========================================================================
  // TEST 5: Storage Isolation between Accounts & Guest
  // =========================================================================
  console.log('\n--- Test 5: Storage Isolation in LocalStore ---');

  const googleSubAlice = 'google_alice_999';
  const googleSubBob = 'google_bob_888';

  // 1. User Alice saves profile & vocabulary
  localStore.setActiveAccount(googleSubAlice);
  await localStore.updateProfile({
    name: 'Alice in Wonderland',
    major_or_subject: 'IELTS Academic',
    current_level: 'B2'
  });
  await localStore.saveVocabularyItem({
    word: 'serendipity',
    meaning: 'finding valuable things by chance',
    ipa: '/ˌser.ənˈdɪp.ə.ti/',
    part_of_speech: 'noun'
  });

  const aliceProfile = await localStore.getProfile();
  const aliceVocab = await localStore.getVocabulary();
  assert(aliceProfile.name === 'Alice in Wonderland', 'Alice profile saved in Alice partition');
  assert(aliceVocab.some(v => v.word === 'serendipity'), 'Alice vocabulary contains serendipity');

  // 2. User Bob signs in (Account Switching)
  localStore.setActiveAccount(googleSubBob);
  const bobProfileInitial = await localStore.getProfile();
  const bobVocabInitial = await localStore.getVocabulary();

  assert(bobProfileInitial.name !== 'Alice in Wonderland', 'Bob does not see Alice profile name');
  assert(!bobVocabInitial.some(v => v.word === 'serendipity'), 'Bob does not see Alice vocabulary');

  // 3. Bob saves his own data
  await localStore.updateProfile({
    name: 'Bob the Builder',
    major_or_subject: 'TOEIC',
    current_level: 'B1'
  });
  await localStore.saveVocabularyItem({
    word: 'blueprint',
    meaning: 'a photographic print of an architectural plan',
    ipa: '/ˈbluː.prɪnt/',
    part_of_speech: 'noun'
  });

  const bobProfile = await localStore.getProfile();
  const bobVocab = await localStore.getVocabulary();
  assert(bobProfile.name === 'Bob the Builder', 'Bob profile saved in Bob partition');
  assert(bobVocab.some(v => v.word === 'blueprint'), 'Bob vocabulary contains blueprint');

  // 4. Switch back to Alice: verify integrity
  localStore.setActiveAccount(googleSubAlice);
  const aliceProfileRestored = await localStore.getProfile();
  const aliceVocabRestored = await localStore.getVocabulary();
  assert(aliceProfileRestored.name === 'Alice in Wonderland', 'Alice profile preserved across account switches');
  assert(aliceVocabRestored.some(v => v.word === 'serendipity'), 'Alice vocabulary preserved');
  assert(!aliceVocabRestored.some(v => v.word === 'blueprint'), 'Bob vocabulary does not leak into Alice partition');

  // =========================================================================
  // TEST 6: Guest Data Migration Path
  // =========================================================================
  console.log('\n--- Test 6: Safe Migration of Guest Progress to New Account ---');

  // Guest Learner learns a word
  localStore.setActiveAccount('learner-primary');
  await localStore.updateProfile({
    name: 'Exploration Guest',
    current_level: 'B1'
  });
  await localStore.saveVocabularyItem({
    word: 'resilience',
    meaning: 'the capacity to recover quickly from difficulties',
    ipa: '/rɪˈzɪl.jəns/',
    part_of_speech: 'noun'
  });

  // Now Guest decides to sign in with Google for the first time
  const newGoogleUserSub = 'google_new_learner_555';
  const migrated = await localStore.migrateGuestDataToAccount(newGoogleUserSub);
  assert(migrated === true, 'Migration from guest to new Google account completes');

  localStore.setActiveAccount(newGoogleUserSub);
  const migratedProfile = await localStore.getProfile();
  const migratedVocab = await localStore.getVocabulary();

  assert(migratedProfile.name === 'Exploration Guest', 'Guest learning profile migrated to new Google account');
  assert(migratedVocab.some(v => v.word === 'resilience'), 'Guest vocabulary migrated to new Google account');

  console.log(`\n======================================================`);
  console.log(`TOTAL GOOGLE AUTH & SESSION TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runGoogleAuthAndSessionTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
