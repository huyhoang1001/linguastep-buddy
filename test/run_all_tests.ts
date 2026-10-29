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

console.log('\nRunning test suite 13: Theme Persistence & System Preference Tests...');
const res13 = spawnSync('npx', ['tsx', 'test/theme_persistence.test.ts'], { stdio: 'inherit' });
if (res13.status !== 0) {
  console.error('Theme persistence tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 14: AI Companion Cat Tutoring & Sound Safety Tests...');
const res14 = spawnSync('npx', ['tsx', 'test/companion_cat_tutoring.test.ts'], { stdio: 'inherit' });
if (res14.status !== 0) {
  console.error('AI Companion cat tutoring tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 15: Header Dedicated Second Row Search Layout Tests...');
const res15 = spawnSync('npx', ['tsx', 'test/header_search_layout.test.ts'], { stdio: 'inherit' });
if (res15.status !== 0) {
  console.error('Header search layout tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 16: UI Interaction Primitives & Affordances Tests...');
const res16 = spawnSync('npx', ['tsx', 'test/interaction_primitives.test.ts'], { stdio: 'inherit' });
if (res16.status !== 0) {
  console.error('UI Interaction Primitives tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 17: Full-App Theme Contrast & Accessibility Audit Tests...');
const res17 = spawnSync('npx', ['tsx', 'test/theme_contrast_audit.test.ts'], { stdio: 'inherit' });
if (res17.status !== 0) {
  console.error('Theme contrast audit tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 18: Answer Submission & Assessment Policy Tests...');
const res18 = spawnSync('npx', ['tsx', 'test/answer_submission_policy.test.ts'], { stdio: 'inherit' });
if (res18.status !== 0) {
  console.error('Answer submission & assessment policy tests failed.');
  process.exit(1);
}

console.log('\nRunning test suite 19: Learn Page Content Width & Layout Consistency Tests...');
const res19 = spawnSync('npx', ['tsx', 'test/learn_page_layout_consistency.test.ts'], { stdio: 'inherit' });
if (res19.status !== 0) {
  console.error('Learn page content width & layout consistency tests failed.');
  process.exit(1);
}

console.log('\n======================================================');
console.log('ALL TEST SUITES COMPLETED SUCCESSFULLY!');
console.log('======================================================');
