import assert from 'assert';
import fs from 'fs';
import path from 'path';

async function runHeaderSearchLayoutTests() {
  console.log('=== RUNNING MEOMEO HEADER SEARCH LAYOUT TESTS ===\n');

  const headerFilePath = path.join(process.cwd(), 'src/components/Header.tsx');
  assert(fs.existsSync(headerFilePath), 'Header.tsx component file must exist');

  const headerCode = fs.readFileSync(headerFilePath, 'utf-8');

  console.log('--- Test 1: Dedicated Search Row Below Top Navigation ---');
  assert(
    headerCode.includes('Row 2: Dedicated Global Search Row'),
    'Header must contain dedicated second row for global search'
  );

  console.log('--- Test 2: Search Trigger Elements & Keyboard Shortcut Badge ---');
  assert(
    headerCode.includes('onOpenSearchPalette'),
    'Header search bar must trigger onOpenSearchPalette'
  );
  assert(
    headerCode.includes('⌘K') || headerCode.includes('Cmd + K'),
    'Header search bar must display keyboard shortcut badge'
  );
  assert(
    headerCode.includes('Search Cambridge dictionary'),
    'Header search bar must include clear descriptive placeholder text'
  );

  console.log('--- Test 3: Search Removed from First Header Row ---');
  // Check that row 1 right side flex container does not contain search button
  const row1Start = headerCode.indexOf('<header');
  const row2Start = headerCode.indexOf('Row 2: Dedicated Global Search Row');
  const row1Code = headerCode.substring(row1Start, row2Start);

  assert(
    !row1Code.includes('Search words...'),
    'First row of Header must not contain the inline search trigger button'
  );

  console.log('\n======================================================');
  console.log('ALL HEADER SEARCH LAYOUT TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runHeaderSearchLayoutTests().catch((err) => {
  console.error('Header Search Layout Test Error:', err);
  process.exit(1);
});
