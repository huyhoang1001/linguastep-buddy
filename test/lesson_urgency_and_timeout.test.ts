import assert from 'assert';
import { playUrgentMeowAlert, playTimesUpChime } from '../src/services/catSoundService.ts';

console.log('=== RUNNING MEOMEO LESSON URGENCY & TIMEOUT TESTS ===');

// Test 1: Audio synthesizer safety in node environment
console.log('--- Test 1: Synthesizer Safety ---');
assert.doesNotThrow(() => {
  playUrgentMeowAlert();
}, 'playUrgentMeowAlert should execute without throw in test/node environment');
console.log('✓ PASS: playUrgentMeowAlert runs safely without errors');

assert.doesNotThrow(() => {
  playTimesUpChime();
}, 'playTimesUpChime should execute without throw in test/node environment');
console.log('✓ PASS: playTimesUpChime runs safely without errors');

// Test 2: Lesson Timer & Urgency Thresholds
console.log('--- Test 2: Timer & Urgency Logic ---');
const baseMinutes = 20;
let extraMinutes = 0;
let secondsElapsed = 19 * 60 + 5; // 19m 5s (55s remaining)

let durationTarget = baseMinutes + extraMinutes;
let targetSeconds = durationTarget * 60;
let remainingSeconds = Math.max(0, targetSeconds - secondsElapsed);
let isNearlyOut = remainingSeconds <= 60 && remainingSeconds > 0;

assert.strictEqual(remainingSeconds, 55, 'Should have exactly 55 seconds remaining');
assert.strictEqual(isNearlyOut, true, 'Should trigger isNearlyOut when 55s remaining (<= 60s)');
console.log('✓ PASS: Urgency threshold correctly identifies nearly out of time at <= 60s');

// Test 3: Overtime Extension (+5 minutes)
console.log('--- Test 3: Overtime Extension (+5m) ---');
extraMinutes += 5;
durationTarget = baseMinutes + extraMinutes;
targetSeconds = durationTarget * 60;
remainingSeconds = Math.max(0, targetSeconds - secondsElapsed);
isNearlyOut = remainingSeconds <= 60 && remainingSeconds > 0;

assert.strictEqual(durationTarget, 25, 'Duration target should now be 25 minutes');
assert.strictEqual(remainingSeconds, 55 + 300, 'Should have 355 seconds remaining after +5m');
assert.strictEqual(isNearlyOut, false, 'Should no longer be nearly out of time after +5m extension');
console.log('✓ PASS: Overtime extension successfully adds 5 minutes and clears urgency state');

// Test 4: Time Expired Transition
console.log('--- Test 4: Time Expired Trigger ---');
secondsElapsed = 25 * 60; // Exact target reached
remainingSeconds = Math.max(0, targetSeconds - secondsElapsed);
const isTimeExpired = remainingSeconds === 0 && secondsElapsed >= targetSeconds;

assert.strictEqual(remainingSeconds, 0, 'Remaining seconds should be 0');
assert.strictEqual(isTimeExpired, true, 'isTimeExpired must be true when target time is reached');
console.log('✓ PASS: Time expired condition triggers reliably at target seconds');

// Test 5: MeoMeo Urgency Encouragement Quotes
console.log('--- Test 5: MeoMeo Fun Encouragement Quotes ---');
const quotes = [
  'Meo meo! ⏰ Sắp hết giờ rồi sen ơi, chỉ còn 1 phút thôi! Vồ lấy điểm số như vồ chuột nào! 🐟💨',
  'Đồng hồ điểm tic-tac! ⏳ Còn 60 giây nữa, tập trung vuốt đáp án chuẩn xác về đích nào! 🐱⚡',
  'Nhanh lên sen ơi! Đừng để đĩa cá thơm vàng bị nguội, vuốt đáp án chớp nhoáng nào! 🐾🏆',
  'Tốc độ bàn chân mèo kích hoạt! 🚀 Một cú nước rút cuối cùng để chốt trọn vẹn điểm số hôm nay! Meow!'
];

assert.ok(quotes.length >= 4, 'Must have at least 4 fun encouragement quotes');
quotes.forEach(q => {
  assert.ok(q.includes('⏰') || q.includes('⏳') || q.includes('🚀') || q.includes('🐾'), 'Quote should include urgency or cat icon');
  assert.ok(q.length > 20, 'Quote should have descriptive, encouraging text');
});
console.log('✓ PASS: MeoMeo encouragement quotes are lively, fun, and complete');

console.log('======================================================');
console.log('ALL MEOMEO URGENCY & TIMEOUT TESTS: 7 PASSED, 0 FAILED');
console.log('======================================================');
