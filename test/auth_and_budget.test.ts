process.env.NODE_ENV = 'test';

import { MultiUserMemoryStore } from '../server/storage.js';
import { UsageBudgetManager } from '../server/usageBudget.js';
import { ContentCacheManager } from '../server/contentCache.js';
import { GeminiLearningProvider } from '../server/aiService.js';
import { AIException } from '../server/aiErrors.js';
import {
  verifyGoogleIdToken,
  createSessionToken,
  validateSessionToken,
  createGuestSession,
  clearSessionsForTest
} from '../server/authService.js';
import { UserAccount } from '../server/authTypes.js';
import { UserProfile, LessonPlan, Attempt } from '../src/types/learning.js';
import fs from 'fs';
import path from 'path';

async function runAuthAndBudgetTests() {
  console.log('=== RUNNING AUTHENTICATION, QUOTA, ISOLATION & CACHE TESTS ===\n');

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

  // =========================================================================
  // TEST 1: Authentication & Token Lifecycle
  // =========================================================================
  console.log('--- Test 1: Authentication & Session Verification ---');
  clearSessionsForTest();

  // Test guest session creation
  const guest1 = createGuestSession('guest-alice');
  assert(Boolean(guest1.token && guest1.token.startsWith('lst_')), 'Guest session creates secure session token');
  assert(guest1.user.id === 'guest-alice', 'Guest account ID matches requested identifier');

  // Validate session token
  const validatedUser = validateSessionToken(guest1.token);
  assert(validatedUser !== null && validatedUser.id === 'guest-alice', 'Session token validates to correct user');

  // Validate nonexistent or invalid token returns null
  assert(validateSessionToken('invalid_token') === null, 'Invalid session token returns null');

  // Verify Google ID token mock
  const googleUser = await verifyGoogleIdToken('test_mock_google_sub123');
  assert(googleUser.id === 'google_sub123', 'Google ID token resolves to isolated google_sub user');
  assert(googleUser.authProvider === 'google', 'Google authProvider is properly flagged');

  // =========================================================================
  // TEST 2: User Data Isolation in Storage
  // =========================================================================
  console.log('\n--- Test 2: User Data Isolation ---');
  const testDbPath = path.resolve(process.cwd(), 'data', `test_db_${Date.now()}.json`);
  const testStore = new MultiUserMemoryStore(testDbPath);

  const userA: UserAccount = {
    id: 'user-a',
    email: 'user-a@example.com',
    name: 'User A',
    authProvider: 'google',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  const userB: UserAccount = {
    id: 'user-b',
    email: 'user-b@example.com',
    name: 'User B',
    authProvider: 'google',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  testStore.getOrCreateUser(userA);
  testStore.getOrCreateUser(userB);

  // User A updates profile to C1
  testStore.updateProfile('user-a', { current_level: 'C1', name: 'Alice A' });
  // User B updates profile to B1
  testStore.updateProfile('user-b', { current_level: 'B1', name: 'Bob B' });

  const profileA = testStore.getProfile('user-a');
  const profileB = testStore.getProfile('user-b');

  assert(profileA.current_level === 'C1' && profileA.name === 'Alice A', 'User A profile updated correctly');
  assert(profileB.current_level === 'B1' && profileB.name === 'Bob B', 'User B profile isolated from User A');

  // User A records an attempt
  const attemptA: Attempt = {
    id: 'att-a-1',
    lesson_id: 'l-1',
    question_id: 'q-1',
    section: 'grammar',
    skill_name: 'Conditionals',
    user_answer: 'would have',
    verdict: 'correct',
    evaluation: { verdict: 'correct', user_answer: 'would have', expected_answer: 'would have', full_correct_sentence: '', decisive_clue: '', explanation: '', error_tags: [], needs_retry: false, next_action: 'continue' },
    created_at: new Date().toISOString()
  };
  testStore.recordAttempt('user-a', attemptA);

  assert(testStore.getAttempts('user-a').length === 1, 'User A has 1 recorded attempt');
  assert(testStore.getAttempts('user-b').length === 0, 'User B attempts list remains completely empty and isolated');

  // Clean up test db file
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  } catch (e) {}

  // =========================================================================
  // TEST 3: Server-side Usage Quota Enforcement
  // =========================================================================
  console.log('\n--- Test 3: Server-Side AI Quota & Budget Enforcement ---');
  const testBudget = new UsageBudgetManager({
    userDailyRequestsLimit: 3, // strict test limit
    globalDailyRequestsLimit: 5,
    minRequestCooldownMs: 100,
    maxConcurrentPerUser: 1
  });

  // User 1 makes 3 requests
  assert(testBudget.checkAllowance('learner-1').allowed === true, 'Request 1 for learner-1 is allowed');
  testBudget.recordUsage('learner-1', 'gemini-2.5-flash', 'test_op', 50, 50, 'success');

  // Wait for cooldown
  await new Promise(r => setTimeout(r, 120));

  assert(testBudget.checkAllowance('learner-1').allowed === true, 'Request 2 for learner-1 is allowed');
  testBudget.recordUsage('learner-1', 'gemini-2.5-flash', 'test_op', 50, 50, 'success');

  await new Promise(r => setTimeout(r, 120));

  assert(testBudget.checkAllowance('learner-1').allowed === true, 'Request 3 for learner-1 is allowed');
  testBudget.recordUsage('learner-1', 'gemini-3.8-flash', 'test_op', 50, 50, 'success');

  // Wait for cooldown to pass so daily limit triggers
  await new Promise(r => setTimeout(r, 120));

  // 4th request should be REJECTED on server because user limit is 3
  const fourthCheck = testBudget.checkAllowance('learner-1');
  assert(fourthCheck.allowed === false, 'Server rejected 4th request when daily quota (3) was reached');
  assert(Boolean(fourthCheck.reason?.includes('Daily free AI limit reached')), 'Reason clearly states daily limit reached');

  // User 2 should STILL be allowed because user quotas are isolated
  assert(testBudget.checkAllowance('learner-2').allowed === true, 'User 2 is not affected by User 1 reaching quota');

  // =========================================================================
  // TEST 4: Global Daily Budget Protection
  // =========================================================================
  console.log('\n--- Test 4: Global Community Budget Cap ---');
  // Record 2 more requests for learner-2 so global reaches 5 (3 + 2 = 5)
  await new Promise(r => setTimeout(r, 120));
  testBudget.recordUsage('learner-2', 'gemini-2.5-flash', 'test_op', 50, 50, 'success');
  await new Promise(r => setTimeout(r, 120));
  testBudget.recordUsage('learner-2', 'gemini-2.5-flash', 'test_op', 50, 50, 'success');

  // Global total is now 5. Even a brand new User 3 must be rejected to protect app owner from costs
  const globalCheck = testBudget.checkAllowance('learner-3');
  assert(globalCheck.allowed === false, 'New user rejected when global community capacity is reached');
  assert(Boolean(globalCheck.reason?.includes('Community AI capacity')), 'Reason explains community capacity reached');

  // =========================================================================
  // TEST 5: Content Caching & Reusability
  // =========================================================================
  console.log('\n--- Test 5: Content Caching ---');
  const testCache = new ContentCacheManager();

  const key = testCache.makeKey('plan', { level: 'B2', duration: 20 });
  assert(testCache.get(key) === null, 'Cache returns null on initial miss');

  const samplePlan: Partial<LessonPlan> = {
    lesson_id: 'plan-123',
    primary_objective: 'Master conditionals'
  };
  testCache.set(key, samplePlan, 10);

  const cached = testCache.get<Partial<LessonPlan>>(key);
  assert(cached !== null && cached.primary_objective === 'Master conditionals', 'Cached content retrieved accurately');

  // =========================================================================
  // TEST 6: Mock AI Provider & Calibrated Fallbacks
  // =========================================================================
  console.log('\n--- Test 6: Mock AI Provider & Fallback Resilience ---');
  const aiProvider = new GeminiLearningProvider();

  // Test with mock handler
  aiProvider.setMockHandler((prompt: string) => {
    return {
      tutorReply: 'Mocked tutor response',
      quickReplies: ['Option A', 'Option B'],
      isDiscoveryComplete: false,
      updatedProfile: {}
    };
  });

  const discoveryResult = await aiProvider.handleDiscoveryTurn([], 'My goal is tech English', {
    ...profileA,
    id: 'user-mock'
  });
  assert(discoveryResult.tutorReply === 'Mocked tutor response', 'Mocked AI provider returned expected mocked turn');

  // Clear mock handler and test fallback resilience when offline/uninitialized
  aiProvider.setMockHandler(null);
  try {
    const fallbackTurn = await aiProvider.handleDiscoveryTurn([], 'I work in tech and need English', {
      ...profileA,
      id: 'user-offline'
    });
    assert(Boolean(fallbackTurn.tutorReply && fallbackTurn.tutorReply.length > 0), 'Gracefully handled AI offline state using calibrated fallback');
  } catch (err: any) {
    if (err instanceof AIException && (err.code === 'QUOTA_EXHAUSTED' || err.code === 'RATE_LIMITED')) {
      assert(true, 'Gracefully blocked AI quota exhaustion without substituting mock turn');
    } else {
      throw err;
    }
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthAndBudgetTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
