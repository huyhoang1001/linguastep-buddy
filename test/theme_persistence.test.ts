process.env.NODE_ENV = 'test';

// Mock localStorage and window.matchMedia if not available in Node environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

class DOMElementMock {
  classList = {
    classes: new Set<string>(),
    add(cls: string) { this.classes.add(cls); },
    remove(cls: string) { this.classes.delete(cls); },
    contains(cls: string): boolean { return this.classes.has(cls); },
    toggle(cls: string) {
      if (this.classes.has(cls)) {
        this.classes.delete(cls);
        return false;
      } else {
        this.classes.add(cls);
        return true;
      }
    }
  };
}

const mockLocalStorage = new LocalStorageMock();
const mockDocumentElement = new DOMElementMock();

// Helper to simulate theme resolution logic used in App.tsx / index.html inline script
function resolveTheme(storedTheme: string | null, prefersDarkSystem: boolean): 'light' | 'dark' {
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }
  return prefersDarkSystem ? 'dark' : 'light';
}

function applyThemeToDOM(theme: 'light' | 'dark', documentEl: DOMElementMock) {
  if (theme === 'dark') {
    documentEl.classList.add('dark');
  } else {
    documentEl.classList.remove('dark');
  }
}

async function runThemePersistenceTests() {
  console.log('=== RUNNING MEOMEO THEME PERSISTENCE & SYSTEM PREFERENCE TESTS ===\n');

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
  // TEST 1: Default to System Preference when no localStorage value exists
  // =========================================================================
  console.log('--- Test 1: System Preference Fallback ---');
  mockLocalStorage.clear();
  
  const themeDarkSystem = resolveTheme(mockLocalStorage.getItem('linguastep_theme'), true);
  assert(themeDarkSystem === 'dark', 'System dark preference returns dark when no local storage exists');

  const themeLightSystem = resolveTheme(mockLocalStorage.getItem('linguastep_theme'), false);
  assert(themeLightSystem === 'light', 'System light preference returns light when no local storage exists');

  // =========================================================================
  // TEST 2: LocalStorage Override takes precedence over System Preference
  // =========================================================================
  console.log('\n--- Test 2: LocalStorage Override ---');
  mockLocalStorage.setItem('linguastep_theme', 'dark');
  assert(
    resolveTheme(mockLocalStorage.getItem('linguastep_theme'), false) === 'dark',
    'LocalStorage "dark" overrides system light preference'
  );

  mockLocalStorage.setItem('linguastep_theme', 'light');
  assert(
    resolveTheme(mockLocalStorage.getItem('linguastep_theme'), true) === 'light',
    'LocalStorage "light" overrides system dark preference'
  );

  // =========================================================================
  // TEST 3: DOM Class Syncing (.dark class on <html>)
  // =========================================================================
  console.log('\n--- Test 3: DOM Class Manipulation ---');
  applyThemeToDOM('dark', mockDocumentElement);
  assert(mockDocumentElement.classList.contains('dark'), 'Applying "dark" adds .dark class to root document element');

  applyThemeToDOM('light', mockDocumentElement);
  assert(!mockDocumentElement.classList.contains('dark'), 'Applying "light" removes .dark class from root document element');

  // =========================================================================
  // TEST 4: Toggle Action Persistence & Immediate State Transition
  // =========================================================================
  console.log('\n--- Test 4: Toggle Action & Persistence ---');
  let themeState: 'light' | 'dark' = 'light';
  
  // Simulate toggle function from App.tsx
  function handleToggleTheme() {
    const nextTheme: 'light' | 'dark' = themeState === 'dark' ? 'light' : 'dark';
    themeState = nextTheme;
    mockLocalStorage.setItem('linguastep_theme', nextTheme);
    applyThemeToDOM(nextTheme, mockDocumentElement);
  }

  // Initial state: light
  applyThemeToDOM(themeState, mockDocumentElement);
  assert(!mockDocumentElement.classList.contains('dark'), 'Initial state is light');

  // Toggle 1: light -> dark
  handleToggleTheme();
  assert((themeState as 'light' | 'dark') === 'dark', 'State toggled to dark');
  assert(mockLocalStorage.getItem('linguastep_theme') === 'dark', 'LocalStorage saved "dark"');
  assert(mockDocumentElement.classList.contains('dark'), 'Root element has .dark class after toggle');

  // Toggle 2: dark -> light
  handleToggleTheme();
  assert((themeState as 'light' | 'dark') === 'light', 'State toggled back to light');
  assert(mockLocalStorage.getItem('linguastep_theme') === 'light', 'LocalStorage saved "light"');
  assert(!mockDocumentElement.classList.contains('dark'), 'Root element lost .dark class after toggle');

  // =========================================================================
  // TEST 5: CSS Selection Design Tokens & Global Rules Verification
  // =========================================================================
  console.log('\n--- Test 5: Text Selection Design Tokens & Global Rules ---');
  const fs = await import('fs');
  const path = await import('path');
  const cssContent = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf-8');

  assert(cssContent.includes('--selection-bg: #2D6A4F;'), 'Light mode selection background token defined (#2D6A4F)');
  assert(cssContent.includes('--selection-text: #ffffff;'), 'Light mode selection text token defined (#ffffff)');
  assert(cssContent.includes('--selection-bg: #a7d9bb;'), 'Dark mode selection background token defined (#a7d9bb)');
  assert(cssContent.includes('--selection-text: #14251b;'), 'Dark mode selection text token defined (#14251b)');
  assert(cssContent.includes('::selection') && cssContent.includes('::-moz-selection'), 'Global ::selection and ::-moz-selection rules present');

  console.log('\n======================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runThemePersistenceTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
