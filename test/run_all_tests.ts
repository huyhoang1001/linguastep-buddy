import { spawnSync } from 'child_process';

console.log('Running test suite 1: Adaptive Diagnostic Tests...');
const res1 = spawnSync('npx', ['tsx', 'test/adaptive_diagnostic.test.ts'], { stdio: 'inherit' });
if (res1.status !== 0) {
  console.error('Adaptive diagnostic tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 2: Authentication & Budget Tests...');
const res2 = spawnSync('npx', ['tsx', 'test/auth_and_budget.test.ts'], { stdio: 'inherit' });
if (res2.status !== 0) {
  console.error('Authentication & budget tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 3: Local-First Client Persistence Tests...');
const res3 = spawnSync('npx', ['tsx', 'test/local_first_store.test.ts'], { stdio: 'inherit' });
if (res3.status !== 0) {
  console.error('Local-first client persistence tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 4: Writing Polishing & Tutor Deep-Dive Tests...');
const res4 = spawnSync('npx', ['tsx', 'test/writing_and_deepdive.test.ts'], { stdio: 'inherit' });
if (res4.status !== 0) {
  console.error('Writing polishing and tutor deep-dive tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 5: AI Quota & Error Handling Tests...');
const res5 = spawnSync('npx', ['tsx', 'test/ai_quota_and_error_handling.test.ts'], { stdio: 'inherit' });
if (res5.status !== 0) {
  console.error('AI quota and error handling tests failed.');
  process.exit(1);
}

console.log('\n======================================================');
console.log('ALL TEST SUITES COMPLETED SUCCESSFULLY!');
console.log('======================================================');
