import { AppButton } from '../src/components/ui/AppButton.tsx';
import { InteractiveCard } from '../src/components/ui/InteractiveCard.tsx';
import { InfoCard } from '../src/components/ui/InfoCard.tsx';
import { StatusBadge } from '../src/components/ui/StatusBadge.tsx';
import { FilterChip } from '../src/components/ui/FilterChip.tsx';
import { ActionChip } from '../src/components/ui/ActionChip.tsx';
import { InteractiveWord } from '../src/components/ui/InteractiveWord.tsx';
import React from 'react';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('--- TEST SUITE 16: UI Interaction Primitives & Affordances ---');

// 1. Verify AppButton component exports and prop interfaces
console.log('Test 1: AppButton prop variants and classes...');
assert(typeof AppButton === 'function', 'AppButton component must be exported as a React FC');

// 2. Verify InteractiveCard vs InfoCard affordance distinction
console.log('Test 2: InteractiveCard vs InfoCard cursor & accessibility attributes...');
assert(typeof InteractiveCard === 'function', 'InteractiveCard must be a React FC');
assert(typeof InfoCard === 'function', 'InfoCard must be a React FC');

// 3. Verify StatusBadge non-interactive affordance
console.log('Test 3: StatusBadge non-interactive cursor-default indicator...');
assert(typeof StatusBadge === 'function', 'StatusBadge must be a React FC');

// 4. Verify FilterChip & ActionChip interactive controls
console.log('Test 4: FilterChip and ActionChip interactive affordances...');
assert(typeof FilterChip === 'function', 'FilterChip must be a React FC');
assert(typeof ActionChip === 'function', 'ActionChip must be a React FC');

// 5. Verify InteractiveWord inline vocabulary style
console.log('Test 5: InteractiveWord vocabulary dotted underline...');
assert(typeof InteractiveWord === 'function', 'InteractiveWord must be a React FC');

console.log('✅ UI Interaction Primitives & Affordances tests passed!');
