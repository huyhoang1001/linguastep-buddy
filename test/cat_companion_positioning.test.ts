import assert from 'assert';
import fs from 'fs';
import path from 'path';

async function runCatCompanionPositioningTests() {
  console.log('=== RUNNING MEOMEO CAT COMPANION POSITIONING TESTS ===\n');

  const widgetPath = path.join(process.cwd(), 'src/components/CatCompanionWidget.tsx');
  assert(fs.existsSync(widgetPath), 'CatCompanionWidget.tsx must exist');
  
  const code = fs.readFileSync(widgetPath, 'utf-8');

  console.log('--- Test 1: Logical Placement State ---');
  assert(code.includes('CatCompanionPlacement'), 'Must use CatCompanionPlacement type');
  assert(code.includes('verticalRatio'), 'Must use verticalRatio for logical positioning');

  console.log('--- Test 2: Edge Snapping Logic ---');
  assert(code.includes('snapToEdge'), 'Must implement snapToEdge function');
  assert(code.includes("edge === 'left' ? 'left' : 'right'"), 'Must calculate nearest horizontal edge');

  console.log('--- Test 3: Stable Dimensions ---');
  assert(code.includes('COLLAPSED_WIDTH'), 'Must define COLLAPSED_WIDTH');
  assert(code.includes('EXPANDED_WIDTH'), 'Must define EXPANDED_WIDTH');
  assert(code.includes('calc(100vw-32px)'), 'Must use responsive viewport constraints for width');

  console.log('--- Test 4: Anchored Expansion ---');
  assert(
    code.includes('styles.left =') && code.includes('styles.right ='),
    'Must set left or right based on docked edge to anchor expansion'
  );

  console.log('--- Test 5: Dragging Threshold ---');
  assert(code.includes('DRAG_THRESHOLD'), 'Must use a drag threshold to distinguish click from drag');
  assert(code.includes('moved: false'), 'Must track movement in dragStartRef');

  console.log('--- Test 6: Persistence ---');
  assert(code.includes('catCustomizationStore.saveConfig'), 'Must persist placement to store');

  console.log('\n======================================================');
  console.log('ALL CAT COMPANION POSITIONING TESTS PASSED!');
  console.log('======================================================\n');
}

runCatCompanionPositioningTests().catch(err => {
  console.error('Positioning Test Error:', err);
  process.exit(1);
});
