import {
  CAT_THEMES,
  CAT_COMPANIONS,
  CAT_ACCESSORIES,
  DEFAULT_CAT_CONFIG,
  CatCustomizationConfig
} from '../src/types/catTheme.js';
import { catCustomizationStore } from '../src/services/catCustomizationStore.js';
import { playMeowSound, playPurrSound, playCorrectMeowChime } from '../src/services/catSoundService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runCatChibiTests() {
  console.log('=== RUNNING MEOMEO CAT CHIBI & UI CUSTOMIZATION TESTS ===\n');

  // ----------------------------------------------------
  // TEST 1: Cat Themes & Palettes
  // ----------------------------------------------------
  console.log('--- Test 1: Cat Themes & Palettes ---');
  const themeKeys = Object.keys(CAT_THEMES);
  assert(themeKeys.length >= 6, `Defined ${themeKeys.length} distinct cat themes (expected >= 6)`);
  assert(themeKeys.includes('calico'), 'Includes Calico Caramel theme');
  assert(themeKeys.includes('sakura'), 'Includes Sakura Mochi Kitty theme');
  assert(themeKeys.includes('kuro'), 'Includes Midnight Kuro-Neko theme');
  assert(themeKeys.includes('matcha'), 'Includes Mint Matcha Paw theme');
  assert(themeKeys.includes('siamese'), 'Includes Blueberry Siamese theme');
  assert(themeKeys.includes('taro'), 'Includes Taro Purr theme');

  const calico = CAT_THEMES.calico;
  assert(Boolean(calico.primaryGradient && calico.bgGradient), 'Calico theme includes rich gradient definitions');
  assert(Boolean(calico.vietnameseName), 'Theme includes Vietnamese localized title');

  // ----------------------------------------------------
  // TEST 2: Cat Companions & Breeds
  // ----------------------------------------------------
  console.log('\n--- Test 2: Cat Companions & Breeds ---');
  const compKeys = Object.keys(CAT_COMPANIONS);
  assert(compKeys.length >= 5, `Defined ${compKeys.length} cat companions`);
  assert(compKeys.includes('mochi'), 'Includes Mochi (white kitty)');
  assert(compKeys.includes('kuro'), 'Includes Kuro (black cat)');
  assert(compKeys.includes('mikan'), 'Includes Mikan (orange tabby)');
  assert(compKeys.includes('boba'), 'Includes Boba (Siamese)');
  assert(compKeys.includes('luna'), 'Includes Luna (star cosmic cat)');

  const mikan = CAT_COMPANIONS.mikan;
  assert(Boolean(mikan.catchphrase && mikan.vietnameseCatchphrase), 'Companion includes bilingual encouragement catchphrases');
  assert(Boolean(mikan.avatarColor && mikan.earColor), 'Companion defines custom vector SVG colors');

  // ----------------------------------------------------
  // TEST 3: Cat Accessories
  // ----------------------------------------------------
  console.log('\n--- Test 3: Cat Accessories ---');
  const accKeys = Object.keys(CAT_ACCESSORIES);
  assert(accKeys.length >= 6, `Defined ${accKeys.length} cat accessories`);
  assert(accKeys.includes('none'), 'Includes Natural accessory');
  assert(accKeys.includes('ribbon'), 'Includes Red Bow Ribbon accessory');
  assert(accKeys.includes('wizard'), 'Includes Wizard Hat accessory');
  assert(accKeys.includes('graduation'), 'Includes Graduation Cap accessory');
  assert(accKeys.includes('fish'), 'Includes Cute Fish on Head accessory');
  assert(accKeys.includes('bell'), 'Includes Golden Bell accessory');

  // ----------------------------------------------------
  // TEST 4: Cat Customization Store & Defaults
  // ----------------------------------------------------
  console.log('\n--- Test 4: Customization Store & Defaults ---');
  assert(DEFAULT_CAT_CONFIG.themeId === 'calico', 'Default theme is Calico');
  assert(DEFAULT_CAT_CONFIG.soundEnabled === true, 'Default sound is enabled');
  assert(DEFAULT_CAT_CONFIG.floatingPaws === true, 'Default floating paws is enabled');
  assert(DEFAULT_CAT_CONFIG.showCompanionWidget === true, 'Default companion widget is enabled');

  const loaded = catCustomizationStore.getConfig();
  assert(Boolean(loaded && loaded.themeId), 'Store retrieves valid configuration');

  // Test updating config
  const customConfig: CatCustomizationConfig = {
    ...DEFAULT_CAT_CONFIG,
    themeId: 'sakura',
    companionId: 'mochi',
    accessoryId: 'wizard',
    catName: 'Mèo Mochi Phù Thủy'
  };
  catCustomizationStore.saveConfig(customConfig);
  const reloaded = catCustomizationStore.getConfig();
  assert(reloaded.themeId === 'sakura', 'Custom theme "sakura" saved and reloaded');
  assert(reloaded.accessoryId === 'wizard', 'Custom accessory "wizard" saved and reloaded');
  assert(reloaded.catName === 'Mèo Mochi Phù Thủy', 'Custom cat name saved and reloaded');

  // ----------------------------------------------------
  // TEST 5: Kitten Sound Synthesis Safety (No-throw)
  // ----------------------------------------------------
  console.log('\n--- Test 5: Kitten Sound Synthesis Safety ---');
  let soundThrew = false;
  try {
    playMeowSound(1.0);
    playCorrectMeowChime();
    playPurrSound();
  } catch (e) {
    soundThrew = true;
  }
  assert(!soundThrew, 'Cat sound synthesizer functions run safely without crashing in server/test environments');

  console.log('\n======================================================');
  console.log(`TOTAL CAT CHIBI TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCatChibiTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
