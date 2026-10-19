process.env.NODE_ENV = 'test';

import assert from 'assert';
import { classifyGeminiError, AIException } from '../server/aiErrors.js';
import { aiService } from '../server/aiService.js';
import { budgetManager } from '../server/usageBudget.js';
import { AIClientError } from '../src/services/api.js';

async function runQuotaAndErrorTests() {
  console.log('🧪 Starting AI Quota & Error Classification Tests...\n');

  // Test 1: Classification of RESOURCE_EXHAUSTED (HTTP 429 Quota Exhaustion)
  {
    console.log('Test 1: RESOURCE_EXHAUSTED is classified as QUOTA_EXHAUSTED with friendly message');
    const sdkError = {
      status: 429,
      message: 'Resource has been exhausted (e.g. check quota, credit limit, or billing settings). RESOURCE_EXHAUSTED'
    };

    const classified = classifyGeminiError(sdkError);
    assert.strictEqual(classified.code, 'QUOTA_EXHAUSTED');
    assert.strictEqual(classified.retryable, false);
    assert.strictEqual(
      classified.userMessage,
      "AI usage limit reached. We're unable to process your request right now. Please try again later."
    );
    console.log('  ✓ Correctly identified as non-retryable QUOTA_EXHAUSTED with clean user message.');
  }

  // Test 2: Classification of temporary rate limit (per-minute RPM limit)
  {
    console.log('\nTest 2: Temporary RPM rate limit is classified as RATE_LIMITED with retryAfterSeconds');
    const rateLimitError = {
      status: 429,
      message: 'Rate limit exceeded: Please wait 12s before retrying.'
    };

    const classified = classifyGeminiError(rateLimitError);
    assert.strictEqual(classified.code, 'RATE_LIMITED');
    assert.strictEqual(classified.retryable, true);
    assert.strictEqual(classified.retryAfterSeconds, 12);
    assert(classified.userMessage.includes('rate limits'));
    console.log('  ✓ Correctly extracted cooldown duration and retryable status.');
  }

  // Test 3: Classification of Authentication failures (Invalid API key)
  {
    console.log('\nTest 3: API key and auth errors are classified as AUTH_FAILED without exposing secrets');
    const authError = {
      status: 400,
      message: 'API_KEY_INVALID: The provided API key is expired or deleted.'
    };

    const classified = classifyGeminiError(authError);
    assert.strictEqual(classified.code, 'AUTH_FAILED');
    assert.strictEqual(classified.retryable, false);
    assert(!classified.userMessage.includes('API_KEY_INVALID'));
    assert(classified.userMessage.includes('authentication failed') || classified.userMessage.includes('unable to verify credentials'));
    console.log('  ✓ Sanitized user-facing message prevents key/trace leakage.');
  }

  // Test 4: Classification of Service disruptions & timeouts
  {
    console.log('\nTest 4: Network timeouts and 503 service unavailabilities');
    const timeoutError = {
      code: 'ETIMEDOUT',
      message: 'Connection timed out after 30000ms'
    };

    const classifiedTimeout = classifyGeminiError(timeoutError);
    assert.strictEqual(classifiedTimeout.code, 'TIMEOUT');
    assert.strictEqual(classifiedTimeout.retryable, true);

    const serviceError = {
      status: 503,
      message: 'The model is overloaded. Please try again later.'
    };

    const classifiedService = classifyGeminiError(serviceError);
    assert.strictEqual(classifiedService.code, 'SERVICE_UNAVAILABLE');
    assert.strictEqual(classifiedService.retryable, true);
    console.log('  ✓ Network and model overload conditions mapped to retryable service errors.');
  }

  // Test 5: callGeminiJson NEVER silently returns a hardcoded mock when quota is exhausted
  {
    console.log('\nTest 5: callGeminiJson rejects immediately on QUOTA_EXHAUSTED without returning mock data');
    
    // Install a mock handler that simulates Gemini throwing a 429 quota exhaustion
    aiService.setMockHandler(() => {
      const err: any = new Error('RESOURCE_EXHAUSTED: Daily quota reached for project 123');
      err.status = 429;
      throw err;
    });

    let didThrow = false;
    let thrownError: any = null;

    try {
      await aiService.callGeminiJson('test prompt', 'system prompt', {
        userId: 'fresh_quota_user',
        operation: 'diagnostic_question'
      });
    } catch (err) {
      didThrow = true;
      thrownError = err;
    }

    assert.strictEqual(didThrow, true, 'callGeminiJson MUST throw on quota exhaustion');
    assert.strictEqual(thrownError.code, 'QUOTA_EXHAUSTED');
    assert.strictEqual(
      thrownError.userMessage,
      "AI usage limit reached. We're unable to process your request right now. Please try again later."
    );
    console.log('  ✓ Quota error correctly threw AIException instead of returning a fabricated mock result.');
  }

  // Test 6: Global quota cooldown protects against hammering the API
  {
    console.log('\nTest 6: Quota cooldown prevents subsequent requests from hammering the API');
    
    // Reset mock handler to check if quotaCooldownUntil is checked prior to network call
    let attemptedExecution = false;
    aiService.setMockHandler(() => {
      attemptedExecution = true;
      return { success: true };
    });

    // Make sure quotaCooldown is active from previous test
    assert(aiService.isQuotaExhausted(), 'aiService should be in quota cooldown state');

    let didThrowCooldown = false;
    try {
      await aiService.callGeminiJson('test prompt', 'system prompt');
    } catch (err: any) {
      didThrowCooldown = true;
      assert.strictEqual(err.code, 'QUOTA_EXHAUSTED');
    }

    assert.strictEqual(didThrowCooldown, true, 'Cooldown must block new calls');
    assert.strictEqual(attemptedExecution, false, 'No API call attempted while in cooldown');
    console.log('  ✓ Global quota cooldown enforced without making wasteful outbound calls.');

    // Clear cooldown for subsequent tests
    aiService.clearQuotaCooldown();
    assert.strictEqual(aiService.isQuotaExhausted(), false);
  }

  // Test 7: Budget manager allowance enforcement and retry header
  {
    console.log('\nTest 7: Client IP budget allowance enforcement');
    const testIp = 'test_burst_ip';
    budgetManager.updateConfig({ userDailyRequestsLimit: 30 });
    
    // Simulate exceeding daily limit
    for (let i = 0; i < 35; i++) {
      budgetManager.recordUsage(testIp, 'gemini-2.5-flash', 'test_op', 100, 100, 'success');
    }

    const check = budgetManager.checkAllowance(testIp);
    assert.strictEqual(check.allowed, false, 'Allowance should be disallowed after limit exceeded');
    assert(check.reason && (check.reason.includes('limit') || check.reason.includes('Daily')));
    console.log('  ✓ Client budget tracking rejects excessive calls with structured limit guidance.');
  }

  // Test 8: Client AIClientError structure
  {
    console.log('\nTest 8: AIClientError holds code, userMessage, retryable, and retryAfterSeconds');
    const clientErr = new AIClientError(
      "AI usage limit reached. We're unable to process your request right now. Please try again later.",
      'QUOTA_EXHAUSTED',
      false
    );

    assert.strictEqual(clientErr.name, 'AIClientError');
    assert.strictEqual(clientErr.code, 'QUOTA_EXHAUSTED');
    assert.strictEqual(clientErr.retryable, false);
    assert.strictEqual(clientErr.retryAfterSeconds, undefined);
    assert(clientErr.userMessage.includes('AI usage limit reached'));
    console.log('  ✓ Frontend AIClientError maintains full error semantics for UI banners.');
  }

  console.log('\n======================================================');
  console.log('✅ ALL AI QUOTA & ERROR HANDLING TESTS PASSED!');
  console.log('======================================================\n');
}

runQuotaAndErrorTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
