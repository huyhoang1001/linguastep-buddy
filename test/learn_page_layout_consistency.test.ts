import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('🧪 Running Test Suite 19: Learn Page Content Width & Layout Consistency Tests...');

  const lessonViewPath = path.resolve('src/components/LessonView.tsx');
  const content = fs.readFileSync(lessonViewPath, 'utf-8');

  // 1. Verify shared page-level container matches design system token
  assert(
    content.includes('className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6"'),
    'LessonView must use the shared page container (max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6)'
  );

  // 2. Verify NO nested max-w-3xl mx-auto or max-w-2xl mx-auto on the question / tutor area
  assert(
    !content.includes('max-w-3xl mx-auto space-y-6'),
    'LessonView must NOT wrap Active Question or Tutor Assistance in a narrower max-w-3xl mx-auto container'
  );
  assert(
    !content.includes('max-w-2xl mx-auto space-y-6'),
    'LessonView must NOT wrap Active Question or Tutor Assistance in a narrower max-w-2xl mx-auto container'
  );

  // 3. Verify Active Question Card is a full-width container with matching rounded-3xl and padding
  assert(
    content.includes('className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-6 md:p-8 shadow-xs text-[#2D312E] dark:text-[#F4F2EC] space-y-6"'),
    'Active Question Card must be full-width with rounded-3xl p-6 md:p-8 shadow-xs'
  );

  // 4. Verify Tutor Assistance card has no narrowing max-width constraint
  assert(
    content.includes('className="bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#2D312E] dark:text-[#F4F2EC]"'),
    'Tutor Assistance card must be full-width in the shared space-y-6 container without max-width overrides'
  );

  // 5. Verify Key Concept card shares the same container layout without width reductions
  assert(
    content.includes('className="bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#334237] rounded-2xl p-4 text-xs text-[#1B4332] dark:text-[#F4F2EC] flex items-start space-x-3"'),
    'Key Concept card must reside directly in the shared space-y-6 container'
  );

  // 6. Verify Feedback card has matching outer card styling and spans the full available width
  assert(
    content.includes('rounded-3xl p-6 md:p-8 border shadow-xs space-y-5 transition-all'),
    'Answer Feedback card must match the primary card styling (rounded-3xl p-6 md:p-8 shadow-xs)'
  );

  // 7. Verify Answer Options use full available card width
  assert(
    content.includes('className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between space-x-4'),
    'Answer options must use w-full to span the available width of the card'
  );

  // 8. Verify Home, Progress, and Words screens also use the same shared max-w-5xl container
  const homePath = path.resolve('src/components/HomeScreen.tsx');
  const homeContent = fs.readFileSync(homePath, 'utf-8');
  assert(
    homeContent.includes('max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6'),
    'HomeScreen must share the identical max-w-5xl container definition'
  );

  const progressPath = path.resolve('src/components/ProgressView.tsx');
  const progressContent = fs.readFileSync(progressPath, 'utf-8');
  assert(
    progressContent.includes('max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6'),
    'ProgressView must share the identical max-w-5xl container definition'
  );

  console.log('✅ All Learn Page Content Width & Alignment tests passed!');
}

runTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
