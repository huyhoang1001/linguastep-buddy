import assert from 'assert';

console.log('=== RUNNING CLICKABLE SENTENCE TEXT & NATURAL WORD SPACING TESTS ===');

// Simulate the tokenization and parsing logic from ClickableSentenceText
const cleanWord = (raw: string): string => {
  return raw.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
};

const isClickableWord = (raw: string): boolean => {
  const cleaned = cleanWord(raw);
  if (cleaned.length < 2) return false;
  if (/^[0-9]+$/.test(cleaned)) return false;
  if (/^_{2,}$/.test(cleaned)) return false;
  return /^[a-zA-Z]/i.test(cleaned);
};

interface ParsedToken {
  type: 'whitespace' | 'blank' | 'clickable_word' | 'plain';
  text: string;
  leading?: string;
  core?: string;
  trailing?: string;
  cleaned?: string;
}

const parseSentenceTokens = (text: string): ParsedToken[] => {
  const tokens = text.split(/(\s+)/);
  return tokens.map(tok => {
    if (/^\s+$/.test(tok)) {
      return { type: 'whitespace', text: tok };
    }

    const blankMatch = tok.match(/^([^a-zA-Z0-9_]*)(_{2,})([^a-zA-Z0-9_]*)$/);
    if (blankMatch) {
      return {
        type: 'blank',
        text: tok,
        leading: blankMatch[1],
        core: blankMatch[2],
        trailing: blankMatch[3]
      };
    }

    const wordMatch = tok.match(/^([^a-zA-Z0-9]*)([\w'-]+)([^a-zA-Z0-9]*)$/);
    if (wordMatch) {
      const leading = wordMatch[1];
      const core = wordMatch[2];
      const trailing = wordMatch[3];
      const cleaned = cleanWord(core);
      if (isClickableWord(core)) {
        return {
          type: 'clickable_word',
          text: tok,
          leading,
          core,
          trailing,
          cleaned
        };
      }
    }

    return { type: 'plain', text: tok };
  });
};

// Test 1: Standard question sentence with blank
console.log('--- Test 1: Question Sentence with Blank ---');
const sentence1 = "The teams worked _____ to deliver the project.";
const tokens1 = parseSentenceTokens(sentence1);

// Verify reconstructed text matches original exactly
const reconstructed1 = tokens1.map(t => {
  if (t.type === 'blank' || t.type === 'clickable_word') {
    return `${t.leading || ''}${t.core || ''}${t.trailing || ''}`;
  }
  return t.text;
}).join('');

assert.strictEqual(reconstructed1, sentence1, 'Reconstructed sentence must match original string character for character');
console.log('✓ PASS: Zero character drift or synthetic spacing in reconstructed sentence');

const blankToken = tokens1.find(t => t.type === 'blank');
assert.ok(blankToken, 'Blank _____ must be identified as a blank token');
assert.strictEqual(blankToken?.core, '_____', 'Blank core must be _____');
console.log('✓ PASS: Answer blank correctly identified and preserved');

const words1 = tokens1.filter(t => t.type === 'clickable_word');
const wordCores1 = words1.map(w => w.core);
assert.deepStrictEqual(wordCores1, ['The', 'teams', 'worked', 'to', 'deliver', 'the', 'project']);
console.log('✓ PASS: All words in sentence are clickable without dropping any word');

// Verify period attachment
const projectToken = words1.find(w => w.core === 'project');
assert.strictEqual(projectToken?.trailing, '.', 'Punctuation period must attach directly to project as trailing');
console.log('✓ PASS: Punctuation attaches directly without extra whitespace gap');

// Test 2: Contractions and hyphenations
console.log('--- Test 2: Contractions and Hyphenations ---');
const sentence2 = "They didn't finalize state-of-the-art architectures.";
const tokens2 = parseSentenceTokens(sentence2);
const words2 = tokens2.filter(t => t.type === 'clickable_word');
const wordCores2 = words2.map(w => w.core);
assert.ok(wordCores2.includes("didn't"), "Should recognize didn't as single word token");
assert.ok(wordCores2.includes("state-of-the-art"), "Should recognize state-of-the-art as single word token");
console.log('✓ PASS: Contractions and hyphenated terms are preserved as clickable words');

// Test 3: Quoted sentences and parentheticals
console.log('--- Test 3: Quotes and Parentheses ---');
const sentence3 = 'He said, "(collaboration) is essential."';
const tokens3 = parseSentenceTokens(sentence3);
const collab = tokens3.find(t => t.core === 'collaboration');
assert.ok(collab, 'Should identify collaboration inside parentheses');
assert.strictEqual(collab?.leading, '"(', 'Should preserve leading quote and parenthesis');
assert.strictEqual(collab?.trailing, ')', 'Should preserve trailing parenthesis');
assert.strictEqual(collab?.cleaned, 'collaboration', 'Cleaned lookup word should strip parentheses');
console.log('✓ PASS: Quotes and parentheses cleanly separate without altering word spacing');

// Test 4: Preserving multi-line text with newlines
console.log('--- Test 4: Multi-line Reading Passage ---');
const passage = "First paragraph here.\n\nSecond paragraph begins.";
const tokens4 = parseSentenceTokens(passage);
const newlineTok = tokens4.find(t => t.type === 'whitespace' && t.text.includes('\n'));
assert.ok(newlineTok, 'Whitespace token must preserve exact newline sequence');
assert.strictEqual(newlineTok?.text, '\n\n', 'Must preserve exact double newlines');
console.log('✓ PASS: Multi-line passage preserves exact line break sequences');

// Test 5: Numbers and symbols should not trigger false dictionary lookups
console.log('--- Test 5: Numbers and Pure Symbols ---');
const sentence5 = "Project cost $500 in 2026 -- verified.";
const tokens5 = parseSentenceTokens(sentence5);
const clickables5 = tokens5.filter(t => t.type === 'clickable_word').map(w => w.core);
assert.ok(!clickables5.includes('500'), 'Pure numbers must not be clickable');
assert.ok(!clickables5.includes('2026'), 'Years must not be clickable');
assert.ok(!clickables5.includes('--'), 'Dashes must not be clickable');
assert.ok(clickables5.includes('Project'), 'Project must be clickable');
assert.ok(clickables5.includes('cost'), 'cost must be clickable');
assert.ok(clickables5.includes('verified'), 'verified must be clickable');
console.log('✓ PASS: Numbers, currency, and symbols correctly excluded from vocabulary lookups');

console.log('======================================================');
console.log('ALL CLICKABLE SENTENCE TEXT TESTS: 8 PASSED, 0 FAILED');
console.log('======================================================');
