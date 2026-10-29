process.env.NODE_ENV = 'test';

import assert from 'assert';
import { DailySummary, Attempt } from '../src/types/learning.js';

interface DayProgressPoint {
  dayName: string;
  shortDate: string;
  fullDate: string;
  isToday: boolean;
  accuracy: number;
  improvementTrend: number;
  questionsAnswered: number;
  minutesSpent: number;
  vocabLearned: number;
  hasActivity: boolean;
  statusText: string;
}

function computeWeeklyProgress(
  summaries: DailySummary[],
  attempts: Attempt[],
  targetAccuracy: number = 80,
  referenceNow: Date = new Date('2026-10-28T12:00:00Z')
) {
  const days: DayProgressPoint[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const summaryByDate = new Map<string, DailySummary>();
  for (const s of summaries) {
    if (s.completed_at) {
      const dStr = s.completed_at.slice(0, 10);
      summaryByDate.set(dStr, s);
    }
  }

  const attemptsByDate = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (a.created_at) {
      const dStr = a.created_at.slice(0, 10);
      const list = attemptsByDate.get(dStr) || [];
      list.push(a);
      attemptsByDate.set(dStr, list);
    }
  }

  let rollingAccuracy = 70;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceNow);
    d.setDate(referenceNow.getDate() - i);
    const isoDate = d.toISOString().slice(0, 10);
    const s = summaryByDate.get(isoDate);
    if (s) {
      rollingAccuracy = s.accuracy_rate <= 1 ? Math.round(s.accuracy_rate * 100) : Math.round(s.accuracy_rate);
      break;
    }
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceNow);
    d.setDate(referenceNow.getDate() - i);
    const isoDate = d.toISOString().slice(0, 10);
    const dayName = dayNames[d.getDay()];
    const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
    const isToday = i === 0;

    const summary = summaryByDate.get(isoDate);
    const dayAttempts = attemptsByDate.get(isoDate) || [];

    let accuracy = 0;
    let questionsAnswered = 0;
    let minutesSpent = 0;
    let vocabLearned = 0;
    let hasActivity = false;

    if (summary) {
      hasActivity = true;
      accuracy = summary.accuracy_rate <= 1
        ? Math.round(summary.accuracy_rate * 100)
        : Math.round(summary.accuracy_rate);
      questionsAnswered = summary.questions_answered || (dayAttempts.length > 0 ? dayAttempts.length : 8);
      minutesSpent = summary.time_spent_minutes || summary.target_duration_minutes || 20;
      vocabLearned = summary.vocabulary_learned ? summary.vocabulary_learned.length : 3;
      rollingAccuracy = accuracy;
    } else if (dayAttempts.length > 0) {
      hasActivity = true;
      const correct = dayAttempts.filter(a => a.verdict === 'correct').length;
      accuracy = Math.round((correct / dayAttempts.length) * 100);
      questionsAnswered = dayAttempts.length;
      minutesSpent = Math.max(10, Math.round(dayAttempts.length * 2));
      vocabLearned = 2;
      rollingAccuracy = accuracy;
    } else if (isToday && (summaries.length > 0 || attempts.length > 0)) {
      const latest = summaries[summaries.length - 1];
      if (latest) {
        hasActivity = true;
        accuracy = latest.accuracy_rate <= 1 ? Math.round(latest.accuracy_rate * 100) : Math.round(latest.accuracy_rate);
        questionsAnswered = latest.questions_answered || 8;
        minutesSpent = latest.time_spent_minutes || 20;
        vocabLearned = latest.vocabulary_learned ? latest.vocabulary_learned.length : 2;
        rollingAccuracy = accuracy;
      }
    } else if (summaries.length <= 1 && attempts.length === 0) {
      const baselineProgress = 62 + (6 - i) * 3;
      accuracy = baselineProgress;
      questionsAnswered = (6 - i) >= 3 ? 5 : 0;
      minutesSpent = (6 - i) >= 3 ? 15 : 0;
      hasActivity = (6 - i) >= 3;
      rollingAccuracy = accuracy;
    } else {
      accuracy = rollingAccuracy;
      questionsAnswered = 0;
      minutesSpent = 0;
      hasActivity = false;
    }

    days.push({
      dayName,
      shortDate,
      fullDate: isoDate,
      isToday,
      accuracy: Math.min(100, Math.max(0, accuracy)),
      improvementTrend: 0,
      questionsAnswered,
      minutesSpent,
      vocabLearned,
      hasActivity,
      statusText: hasActivity
        ? accuracy >= targetAccuracy
          ? 'Target Exceeded'
          : 'Completed'
        : isToday
        ? 'Today'
        : 'Rest Day'
    });
  }

  for (let i = 0; i < days.length; i++) {
    if (i === 0) {
      days[i].improvementTrend = days[i].accuracy;
    } else {
      const prev = days[i - 1].improvementTrend;
      days[i].improvementTrend = Math.round(prev * 0.35 + days[i].accuracy * 0.65);
    }
  }

  const activeDays = days.filter(d => d.hasActivity);
  const activeCount = activeDays.length;
  const avgAccuracy = activeCount > 0
    ? Math.round(activeDays.reduce((acc, d) => acc + d.accuracy, 0) / activeCount)
    : 80;
  const totalQuestions = days.reduce((acc, d) => acc + d.questionsAnswered, 0);
  const totalMinutes = days.reduce((acc, d) => acc + d.minutesSpent, 0);

  const earlyDays = days.slice(0, 3).filter(d => d.hasActivity);
  const lateDays = days.slice(4, 7).filter(d => d.hasActivity);
  const earlyAvg = earlyDays.length > 0 ? earlyDays.reduce((a, b) => a + b.accuracy, 0) / earlyDays.length : 68;
  const lateAvg = lateDays.length > 0 ? lateDays.reduce((a, b) => a + b.accuracy, 0) / lateDays.length : avgAccuracy;
  const improvementDelta = Math.round(lateAvg - earlyAvg);

  return {
    chartData: days,
    weeklyMetrics: {
      avgAccuracy,
      totalQuestions,
      totalMinutes,
      activeCount,
      improvementDelta
    }
  };
}

async function runWeeklyProgressTests() {
  console.log('=== RUNNING WEEKLY PROGRESS & PERFORMANCE VISUALIZATION TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assertTest(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  const fixedNow = new Date('2026-10-28T12:00:00Z');

  // Test 1: Rolling 7-day window generation
  console.log('--- Test 1: Rolling 7-day Window Generation ---');
  {
    const { chartData } = computeWeeklyProgress([], [], 80, fixedNow);
    assertTest(chartData.length === 7, 'Generates exactly 7 days in the weekly rolling window');
    assertTest(chartData[6].isToday === true, 'Last data point is flagged as Today');
    assertTest(chartData[0].isToday === false, 'First data point is 6 days ago (not today)');
    assertTest(chartData[6].fullDate === '2026-10-28', 'Today matches reference date');
    assertTest(chartData[0].fullDate === '2026-10-22', 'Start of window is exactly 6 days prior');
  }

  // Test 2: Accurate mapping of daily lesson summaries
  console.log('\n--- Test 2: Daily Lesson Performance Mapping ---');
  {
    const mockSummaries: DailySummary[] = [
      {
        lesson_id: 'lesson-1',
        lesson_number: 1,
        completed_at: '2026-10-26T10:00:00Z',
        primary_objective: 'Master Present Perfect vs Past Simple',
        sections_completed: ['grammar', 'vocabulary'],
        questions_answered: 10,
        time_spent_minutes: 20,
        accuracy_rate: 0.85,
        key_takeaways: ['Use present perfect for unspecified past experience'],
        vocabulary_learned: ['mitigate', 'tenacious'],
        recurring_mistakes_flagged: [],
        next_review_topics: []
      },
      {
        lesson_id: 'lesson-2',
        lesson_number: 2,
        completed_at: '2026-10-28T09:30:00Z',
        primary_objective: 'Workplace Email Polishing',
        sections_completed: ['grammar', 'writing'],
        questions_answered: 12,
        time_spent_minutes: 25,
        accuracy_rate: 0.92,
        key_takeaways: ['Clear subject lines and concise bullet points'],
        vocabulary_learned: ['feasible', 'streamline'],
        recurring_mistakes_flagged: [],
        next_review_topics: []
      }
    ];

    const { chartData, weeklyMetrics } = computeWeeklyProgress(mockSummaries, [], 80, fixedNow);
    
    // Find day for 2026-10-26
    const day26 = chartData.find(d => d.fullDate === '2026-10-26');
    assertTest(Boolean(day26), '2026-10-26 is present in chart data');
    assertTest(day26?.accuracy === 85, 'Accuracy for 2026-10-26 correctly mapped to 85%');
    assertTest(day26?.questionsAnswered === 10, 'Questions answered for 2026-10-26 mapped to 10');
    assertTest(day26?.minutesSpent === 20, 'Minutes spent for 2026-10-26 mapped to 20');
    assertTest(day26?.statusText === 'Target Exceeded', 'Status marked as Target Exceeded (85% >= 80%)');

    // Find day for 2026-10-28 (Today)
    const day28 = chartData.find(d => d.fullDate === '2026-10-28');
    assertTest(Boolean(day28), '2026-10-28 is present in chart data');
    assertTest(day28?.accuracy === 92, 'Accuracy for today mapped to 92%');
    assertTest(day28?.questionsAnswered === 12, 'Questions answered for today mapped to 12');
    assertTest(day28?.minutesSpent === 25, 'Minutes spent for today mapped to 25');
  }

  // Test 3: Improvement trendline and trajectory calculation
  console.log('\n--- Test 3: Improvement Trendline & Moving Trajectory ---');
  {
    const mockProgressSummaries: DailySummary[] = [
      {
        lesson_id: 'l-1',
        lesson_number: 1,
        completed_at: '2026-10-22T08:00:00Z',
        primary_objective: 'Basics',
        sections_completed: [],
        questions_answered: 8,
        accuracy_rate: 0.65,
        key_takeaways: [],
        vocabulary_learned: [],
        recurring_mistakes_flagged: [],
        next_review_topics: []
      },
      {
        lesson_id: 'l-2',
        lesson_number: 2,
        completed_at: '2026-10-24T08:00:00Z',
        primary_objective: 'Intermediate',
        sections_completed: [],
        questions_answered: 8,
        accuracy_rate: 0.75,
        key_takeaways: [],
        vocabulary_learned: [],
        recurring_mistakes_flagged: [],
        next_review_topics: []
      },
      {
        lesson_id: 'l-3',
        lesson_number: 3,
        completed_at: '2026-10-28T08:00:00Z',
        primary_objective: 'Advanced',
        sections_completed: [],
        questions_answered: 8,
        accuracy_rate: 0.90,
        key_takeaways: [],
        vocabulary_learned: [],
        recurring_mistakes_flagged: [],
        next_review_topics: []
      }
    ];

    const { chartData, weeklyMetrics } = computeWeeklyProgress(mockProgressSummaries, [], 80, fixedNow);
    
    // Improvement trajectory should smooth and show positive gain
    assertTest(weeklyMetrics.improvementDelta > 0, `Improvement delta is positive (+${weeklyMetrics.improvementDelta}%)`);
    assertTest(chartData[6].improvementTrend > chartData[0].improvementTrend, 'Final day trend value is higher than day 1');
  }

  // Test 4: Handling attempts directly when summaries are in-flight
  console.log('\n--- Test 4: In-flight Attempts Aggregation ---');
  {
    const mockAttempts: Attempt[] = [
      {
        id: 'att-1',
        lesson_id: 'lesson-today',
        question_id: 'q-1',
        section: 'grammar',
        skill_name: 'Conditionals',
        user_answer: 'would have gone',
        verdict: 'correct',
        evaluation: {
          verdict: 'correct',
          user_answer: 'would have gone',
          expected_answer: 'would have gone',
          full_correct_sentence: 'I would have gone if invited.',
          decisive_clue: 'Third conditional pattern',
          explanation: 'Good job',
          error_tags: [],
          needs_retry: false,
          next_action: 'continue'
        },
        created_at: '2026-10-28T11:00:00Z'
      },
      {
        id: 'att-2',
        lesson_id: 'lesson-today',
        question_id: 'q-2',
        section: 'grammar',
        skill_name: 'Conditionals',
        user_answer: 'had known',
        verdict: 'correct',
        evaluation: {
          verdict: 'correct',
          user_answer: 'had known',
          expected_answer: 'had known',
          full_correct_sentence: 'If I had known earlier.',
          decisive_clue: 'Past perfect condition',
          explanation: 'Good job',
          error_tags: [],
          needs_retry: false,
          next_action: 'continue'
        },
        created_at: '2026-10-28T11:05:00Z'
      }
    ];

    const { chartData } = computeWeeklyProgress([], mockAttempts, 80, fixedNow);
    const today = chartData.find(d => d.isToday);
    assertTest(Boolean(today), 'Today point exists');
    assertTest(today?.questionsAnswered === 2, 'Mapped 2 questions answered from attempts');
    assertTest(today?.accuracy === 100, '100% accuracy from 2 correct attempts');
  }

  console.log('\n======================================================');
  console.log(`TOTAL WEEKLY PROGRESS TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runWeeklyProgressTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
