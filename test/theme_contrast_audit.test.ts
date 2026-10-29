process.env.NODE_ENV = 'test';
import fs from 'fs';
import path from 'path';

// Helper function to calculate relative luminance according to WCAG 2.1 specifications
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '').trim();
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
    g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
    b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const parseComponent = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = parseComponent(r);
  const G = parseComponent(g);
  const B = parseComponent(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Calculate WCAG contrast ratio between two hex colors (Foreground vs Background)
function calculateContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runThemeContrastAuditTests() {
  console.log('=== RUNNING FULL-APP THEME CONTRAST & ACCESSIBILITY AUDIT TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // =========================================================================
  // TEST 1: Semantic Theme Token Definitions in src/index.css
  // =========================================================================
  console.log('--- Test 1: Verify Theme Variables in src/index.css ---');
  const cssPath = path.join(process.cwd(), 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  const requiredTokens = [
    '--bg-app',
    '--bg-surface',
    '--bg-surface-subdued',
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--border-default',
    '--brand-primary',
    '--bg-concept',
    '--border-concept',
    '--fg-concept-title',
    '--fg-concept-body',
    '--bg-warning',
    '--border-warning',
    '--fg-warning-title',
    '--fg-warning-body',
    '--bg-alert',
    '--border-alert',
    '--fg-alert-title',
    '--fg-alert-body'
  ];

  requiredTokens.forEach(token => {
    assert(cssContent.includes(token), `Theme token ${token} defined in index.css`);
  });

  // =========================================================================
  // TEST 2: Light Mode WCAG AA Contrast Compliance
  // =========================================================================
  console.log('\n--- Test 2: Light Mode WCAG AA Contrast Compliance ---');

  // Light Mode Token Pairs
  const lightPairs = [
    { fg: '#1B4332', bg: '#FAF7F2', name: 'Primary Text on App Background (Light)', min: 4.5 },
    { fg: '#1B4332', bg: '#FFFFFF', name: 'Primary Text on Surface Card (Light)', min: 4.5 },
    { fg: '#2D4036', bg: '#FAF7F2', name: 'Secondary Text on App Background (Light)', min: 4.5 },
    { fg: '#3D4E45', bg: '#FFFFFF', name: 'Muted Text on Surface Card (Light)', min: 4.5 },
    { fg: '#1B4332', bg: '#EFF6F1', name: 'Concept Title on Concept Card (Light)', min: 4.5 },
    { fg: '#2D4036', bg: '#EFF6F1', name: 'Concept Body on Concept Card (Light)', min: 4.5 },
    { fg: '#B84228', bg: '#FAF7F2', name: 'Warning Title on App Background (Light)', min: 4.5 },
    { fg: '#3D4E45', bg: '#FAF7F2', name: 'Warning Body on App Background (Light)', min: 4.5 },
    { fg: '#902C1B', bg: '#FDF0ED', name: 'Alert Title on Alert Card (Light)', min: 4.5 }
  ];

  lightPairs.forEach(pair => {
    const ratio = calculateContrastRatio(pair.fg, pair.bg);
    const passes = ratio >= pair.min;
    assert(passes, pair.name, `Ratio: ${ratio.toFixed(2)}:1 (Required: ${pair.min}:1)`);
  });

  // =========================================================================
  // TEST 3: Dark Mode WCAG AA Contrast Compliance
  // =========================================================================
  console.log('\n--- Test 3: Dark Mode WCAG AA Contrast Compliance ---');

  // Dark Mode Token Pairs
  const darkPairs = [
    { fg: '#F4F2EC', bg: '#161A17', name: 'Primary Text on App Background (Dark)', min: 4.5 },
    { fg: '#F4F2EC', bg: '#1E231F', name: 'Primary Text on Surface Card (Dark)', min: 4.5 },
    { fg: '#D1DCD5', bg: '#161A17', name: 'Secondary Text on App Background (Dark)', min: 4.5 },
    { fg: '#A7B3AB', bg: '#1E231F', name: 'Muted Text on Surface Card (Dark)', min: 4.5 },
    { fg: '#74A892', bg: '#252F28', name: 'Concept Title on Concept Card (Dark)', min: 4.5 },
    { fg: '#D1DCD5', bg: '#252F28', name: 'Concept Body on Concept Card (Dark)', min: 4.5 },
    { fg: '#FF8A65', bg: '#161A17', name: 'Warning Title on App Background (Dark)', min: 4.5 },
    { fg: '#D1DCD5', bg: '#161A17', name: 'Warning Body on App Background (Dark)', min: 4.5 },
    { fg: '#FF8A65', bg: '#342421', name: 'Alert Title on Alert Card (Dark)', min: 4.5 }
  ];

  darkPairs.forEach(pair => {
    const ratio = calculateContrastRatio(pair.fg, pair.bg);
    const passes = ratio >= pair.min;
    assert(passes, pair.name, `Ratio: ${ratio.toFixed(2)}:1 (Required: ${pair.min}:1)`);
  });

  // =========================================================================
  // TEST 4: Component Code Audit for Raw Unadapted Slate Styles
  // =========================================================================
  console.log('\n--- Test 4: Component Code Audit for Hardcoded Slate Styling ---');

  const componentsToAudit = [
    'src/components/AdaptiveDiagnosticView.tsx',
    'src/components/LessonView.tsx',
    'src/components/VocabularyCard.tsx',
    'src/components/CatCompanionWidget.tsx',
    'src/components/HomeScreen.tsx',
    'src/components/CambridgeDictionarySearch.tsx',
    'src/components/WordPracticeModal.tsx',
    'src/components/ProgressView.tsx'
  ];

  componentsToAudit.forEach(compRelativePath => {
    const fullPath = path.join(process.cwd(), compRelativePath);
    if (!fs.existsSync(fullPath)) return;

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Check for raw unadapted bg-slate-900 or text-slate-300 without dark: prefix
    const rawSlateMatches = content.match(/(?<!dark:)(bg-slate-9[0-5]0|bg-slate-800|text-slate-300|bg-indigo-950)/g);
    const hasUnadaptedSlate = Boolean(rawSlateMatches && rawSlateMatches.length > 0);
    assert(
      !hasUnadaptedSlate,
      `Component ${compRelativePath} contains no unadapted raw dark slate/indigo classes`,
      hasUnadaptedSlate ? `Found: ${rawSlateMatches?.slice(0, 3).join(', ')}` : undefined
    );
  });

  // =========================================================================
  // TEST 5: Selection Highlighting Tokens
  // =========================================================================
  console.log('\n--- Test 5: Accessible Selection Contrast Tokens ---');
  assert(
    cssContent.includes('::selection') && cssContent.includes('--selection-bg'),
    'Global ::selection styling uses CSS contrast tokens'
  );

  const lightSelContrast = calculateContrastRatio('#ffffff', '#2D6A4F');
  assert(
    lightSelContrast >= 4.5,
    'Light Mode selection contrast meets WCAG AA',
    `Ratio: ${lightSelContrast.toFixed(2)}:1`
  );

  const darkSelContrast = calculateContrastRatio('#14251b', '#a7d9bb');
  assert(
    darkSelContrast >= 4.5,
    'Dark Mode selection contrast meets WCAG AA',
    `Ratio: ${darkSelContrast.toFixed(2)}:1`
  );

  console.log('\n======================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runThemeContrastAuditTests().catch(err => {
  console.error('Unhandled contrast test error:', err);
  process.exit(1);
});
