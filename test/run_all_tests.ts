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

console.log('\nRunning test suite 6: Word Family Discovery & Form Selection Micro-Exam Tests...');
const res6 = spawnSync('npx', ['tsx', 'test/word_family_and_micro_exam.test.ts'], { stdio: 'inherit' });
if (res6.status !== 0) {
  console.error('Word family & micro-exam tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 7: MeoMeo Cat Chibi Themes & Customization Tests...');
const res7 = spawnSync('npx', ['tsx', 'test/cat_chibi_customization.test.ts'], { stdio: 'inherit' });
if (res7.status !== 0) {
  console.error('Cat chibi & customization tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 8: Clickable Sentence Text & Natural Spacing Tests...');
const res8 = spawnSync('npx', ['tsx', 'test/clickable_sentence_text.test.ts'], { stdio: 'inherit' });
if (res8.status !== 0) {
  console.error('Clickable sentence text tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 9: MeoMeo Lesson Urgency & Timeout Tests...');
const res9 = spawnSync('npx', ['tsx', 'test/lesson_urgency_and_timeout.test.ts'], { stdio: 'inherit' });
if (res9.status !== 0) {
  console.error('Lesson urgency and timeout tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 10: Google Identity Services & Account Isolation Tests...');
const res10 = spawnSync('npx', ['tsx', 'test/google_auth_and_session.test.ts'], { stdio: 'inherit' });
if (res10.status !== 0) {
  console.error('Google Identity Services & session tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 11: Weekly Progress & Performance Visualization Tests...');
const res11 = spawnSync('npx', ['tsx', 'test/weekly_progress_visualization.test.ts'], { stdio: 'inherit' });
if (res11.status !== 0) {
  console.error('Weekly progress & performance visualization tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 12: Mastery-Driven Learning Progression & Scheduling Tests...');
const res12 = spawnSync('npx', ['tsx', 'test/mastery_learning_progression.test.ts'], { stdio: 'inherit' });
if (res12.status !== 0) {
  console.error('Mastery-driven learning progression tests failed.');
  process.exit(1);
}

console.log('\n======================================================');
console.log('ALL TEST SUITES COMPLETED SUCCESSFULLY!');
console.log('======================================================');
