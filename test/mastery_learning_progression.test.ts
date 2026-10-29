process.env.NODE_ENV = 'test';

import assert from 'assert';
import { MasteryEngine } from '../src/services/masteryEngine.js';
import { CEFREvaluator } from '../src/services/cefrEvaluator.js';
import { CurriculumScheduler, CURRICULUM_SKILL_CATALOG } from '../src/services/curriculumScheduler.js';
import { LearnerSkillState, UserProfile } from '../src/types/learning.js';

const mockProfile: UserProfile = {
  id: 'learner-test-progression',
  name: 'Alex Developer',
  current_level: 'B1',
  target_level: 'C1',
  primary_goal: 'workplace_tech',
  goal_summary: 'Communicate smoothly in engineering reviews and RFC proposals',
  explanation_language: 'en',
  general_vs_work_ratio: 40,
  daily_minutes: 20,
  days_per_week: 5,
  feedback_style: 'detailed',
  enable_audio_tips: true,
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function runMasteryProgressionTests() {
  console.log('=== RUNNING MASTERY-DRIVEN LEARNING PROGRESSION TESTS ===\n');

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

  // =========================================================================
  // TEST 1: Failed Prerequisites Block Advanced Progression
  // =========================================================================
  console.log('--- Test 1: Failed Prerequisites Block Advanced Topics ---');
  {
    // Learner tries to jump to 'Mixed Conditionals' (B2), which requires 'Conditionals' and 'Past Perfect'
    const skillsWithFailedPrereq: LearnerSkillState[] = [
      {
        skill_id: 'conditionals_real_hypothetical',
        skill_name: 'First & Second Conditionals',
        category: 'grammar',
        status: 'learning', // NOT mastered / NOT active_recall
        mastery_stage: 'exposure',
        accuracy_rate: 0.4,
        total_attempts: 2,
        last_practiced_at: '2026-10-27T10:00:00Z',
        next_review_at: '2026-10-28T10:00:00Z',
        recurring_errors: ['Mixing will with past subjunctive']
      }
    ];

    const prereqCheck = MasteryEngine.arePrerequisitesMet(
      ['conditionals_real_hypothetical', 'past_perfect_narrative_anchors'],
      skillsWithFailedPrereq
    );

    assertTest(!prereqCheck.met, 'Prerequisites are correctly recognized as unsatisfied');
    assertTest(prereqCheck.missingSkillNames.length >= 1, 'Identifies specific missing prerequisite skills');

    // Scheduler must NOT advance to advanced dependent skill; it must schedule the prerequisite for repair
    const blueprint = CurriculumScheduler.scheduleDailyLesson({
      profile: mockProfile,
      skillStates: skillsWithFailedPrereq,
      recentErrors: ['Mixing will with past subjunctive'],
      now: fixedNow
    });

    assertTest(
      blueprint.sections.some(s => s.pedagogical_focus === 'prerequisite_reinforcement' || s.pedagogical_focus === 'mistake_clinic'),
      'Scheduler prioritizes prerequisite reinforcement rather than jumping blindly ahead'
    );
    assertTest(
      blueprint.reason_for_selection.toLowerCase().includes('prerequisite') || blueprint.reason_for_selection.toLowerCase().includes('nền tảng') || blueprint.reason_for_selection.toLowerCase().includes('reinforce'),
      'Pedagogical reason explicitly justifies prerequisite prioritization'
    );
  }

  // =========================================================================
  // TEST 2: Repeated Mistakes Trigger Targeted Mistake Clinic
  // =========================================================================
  console.log('\n--- Test 2: Repeated Mistakes Trigger Targeted Clinic ---');
  {
    const skillsWithRecurringErrors: LearnerSkillState[] = [
      {
        skill_id: 'preposition_collocation',
        skill_name: 'Professional Prepositions',
        category: 'vocabulary',
        status: 'learning',
        mastery_stage: 'recognition',
        accuracy_rate: 0.5,
        total_attempts: 4,
        last_practiced_at: '2026-10-27T10:00:00Z',
        next_review_at: '2026-10-28T10:00:00Z',
        recurring_errors: ['Used "depend of" instead of "depend on"', 'Confusion with "comply to" vs "comply with"']
      }
    ];

    const blueprint = CurriculumScheduler.scheduleDailyLesson({
      profile: mockProfile,
      skillStates: skillsWithRecurringErrors,
      recentErrors: ['Used "depend of" instead of "depend on"'],
      now: fixedNow
    });

    assertTest(
      blueprint.sections.some(s => s.pedagogical_focus === 'mistake_clinic'),
      'Schedules a dedicated mistake clinic section for recurring errors'
    );
    assertTest(
      blueprint.recurring_mistakes_targeted.some(e => e.includes('depend')),
      'Clinic targets the specific error tag ("depend of")'
    );
  }

  // =========================================================================
  // TEST 3: Overdue Reviews Prioritized via Spaced Repetition Intervals
  // =========================================================================
  console.log('\n--- Test 3: Overdue Reviews Scheduled Ahead of Unreviewed New Topics ---');
  {
    const skillsWithOverdueReview: LearnerSkillState[] = [
      {
        skill_id: 'past_narrative',
        skill_name: 'Past Simple Regular & Irregular',
        category: 'grammar',
        status: 'reviewing',
        mastery_stage: 'active_recall',
        accuracy_rate: 0.8,
        total_attempts: 3,
        last_practiced_at: '2026-10-24T10:00:00Z',
        next_review_at: '2026-10-26T10:00:00Z', // Overdue by 2 days relative to Oct 28
        recurring_errors: []
      }
    ];

    const blueprint = CurriculumScheduler.scheduleDailyLesson({
      profile: mockProfile,
      skillStates: skillsWithOverdueReview,
      recentErrors: [],
      now: fixedNow
    });

    assertTest(blueprint.overdue_reviews_count > 0, 'Scheduler counts overdue review');
    assertTest(
      blueprint.sections.some(s => s.pedagogical_focus === 'overdue_review'),
      'Allocates section for overdue spaced retrieval'
    );
    assertTest(
      blueprint.sections[0].skill_target.includes('Past Simple'),
      'Overdue skill is placed in opening review section'
    );
  }

  // =========================================================================
  // TEST 4: Mastery Regression When Mastered Skill Fails on Delayed Review
  // =========================================================================
  console.log('\n--- Test 4: Mastery Regression on Delayed Review Failure ---');
  {
    const previouslyMasteredSkill: LearnerSkillState = {
      skill_id: 'cleft_sentences',
      skill_name: 'Cleft Sentences for Focus',
      category: 'writing',
      status: 'mastered',
      mastery_stage: 'retained_mastery',
      mastery_score: 95,
      accuracy_rate: 0.95,
      total_attempts: 6,
      consecutive_correct: 4,
      last_practiced_at: '2026-10-15T10:00:00Z', // Practiced 13 days ago
      next_review_at: '2026-10-28T10:00:00Z',
      recurring_errors: [],
      exercise_types_passed: ['multiple_choice', 'sentence_rewrite'],
      retention_checks_passed: 2
    };

    // Learner fails the delayed review check
    const regressionResult = MasteryEngine.recordSkillEvidence(previouslyMasteredSkill, {
      skillId: previouslyMasteredSkill.skill_id,
      skillName: previouslyMasteredSkill.skill_name,
      category: previouslyMasteredSkill.category,
      isCorrect: false,
      errorTag: 'Inverted word order incorrectly in what-cleft',
      attemptTimestamp: '2026-10-28T12:00:00Z'
    });

    assertTest(regressionResult.didRegress === true, 'MasteryEngine flags regression');
    assertTest(regressionResult.newStage !== 'retained_mastery', 'Skill is demoted from retained_mastery');
    assertTest(regressionResult.updatedSkill.status === 'regressed', 'Status is marked as regressed');
    assertTest(regressionResult.updatedSkill.consecutive_correct === 0, 'Consecutive correct counter resets to 0');
    assertTest(
      new Date(regressionResult.updatedSkill.next_review_at).getTime() <= fixedNow.getTime() + 86400000 + 1000,
      'Next review is immediately rescheduled for tomorrow (1 day interval)'
    );
  }

  // =========================================================================
  // TEST 5: Anti-Premature Mastery Guard
  // =========================================================================
  console.log('\n--- Test 5: Anti-Premature Mastery Guard ---');
  {
    // A brand new skill answered correctly on first try
    const trial1 = MasteryEngine.recordSkillEvidence(undefined, {
      skillId: 'inversion',
      skillName: 'Negative Inversion',
      category: 'grammar',
      isCorrect: true,
      questionType: 'multiple_choice',
      attemptTimestamp: '2026-10-28T10:00:00Z'
    });

    assertTest(trial1.newStage === 'recognition', 'First correct answer sets stage to Recognition, NOT Mastered');
    assertTest(trial1.updatedSkill.status === 'learning', 'Status remains learning after single trial');

    // Immediate second correct answer on the SAME day
    const trial2 = MasteryEngine.recordSkillEvidence(trial1.updatedSkill, {
      skillId: 'inversion',
      skillName: 'Negative Inversion',
      category: 'grammar',
      isCorrect: true,
      questionType: 'multiple_choice',
      attemptTimestamp: '2026-10-28T10:05:00Z' // 5 mins later on same day
    });

    assertTest(trial2.newStage !== 'retained_mastery', 'Same-day immediate drill cannot achieve Retained Mastery');
    assertTest(trial2.updatedSkill.status !== 'mastered', 'Status is NOT marked as mastered');

    // Simulated delayed retrieval after 3 days with varied exercise type
    const trial3 = MasteryEngine.recordSkillEvidence(trial2.updatedSkill, {
      skillId: 'inversion',
      skillName: 'Negative Inversion',
      category: 'grammar',
      isCorrect: true,
      questionType: 'fill_in_blank',
      attemptTimestamp: '2026-10-31T10:00:00Z' // 3 days delay
    });

    assertTest(trial3.newStage === 'active_recall', 'Delayed recall with open cloze advances to Active Recall');
    assertTest((trial3.updatedSkill.retention_checks_passed || 0) >= 1, 'Delayed retrieval credits retention check');
  }

  // =========================================================================
  // TEST 6: Difficulty-Weighted Provisional CEFR Calibration (Anti-Cheat)
  // =========================================================================
  console.log('\n--- Test 6: Difficulty-Weighted Provisional CEFR Calibration ---');
  {
    // Learner gets 100% on 4 easy A1 questions
    const easyA1Attempts = [
      { question: { section: 'grammar', difficulty: 'A1', skill_name: 'Present Simple' }, verdict: 'correct' as const },
      { question: { section: 'grammar', difficulty: 'A1', skill_name: 'Articles' }, verdict: 'correct' as const },
      { question: { section: 'vocabulary', difficulty: 'A1', skill_name: 'Numbers' }, verdict: 'correct' as const },
      { question: { section: 'reading', difficulty: 'A1', skill_name: 'Greetings' }, verdict: 'correct' as const }
    ];

    const resultA1 = CEFREvaluator.evaluateAttempts(easyA1Attempts);
    assertTest(resultA1.placedLevel === 'A1', '100% on A1 questions places at A1, NOT C1');
    assertTest(resultA1.confidence === 'provisional', 'Marked as provisional due to limited difficulty breadth');

    // Learner completes calibrated multi-level suite with B2 success
    const multiLevelAttempts = [
      { question: { section: 'grammar', difficulty: 'A1' }, verdict: 'correct' as const },
      { question: { section: 'grammar', difficulty: 'A2' }, verdict: 'correct' as const },
      { question: { section: 'grammar', difficulty: 'B1' }, verdict: 'correct' as const },
      { question: { section: 'grammar', difficulty: 'B1' }, verdict: 'correct' as const },
      { question: { section: 'grammar', difficulty: 'B2' }, verdict: 'correct' as const },
      { question: { section: 'writing', difficulty: 'B2' }, verdict: 'correct' as const },
      { question: { section: 'vocabulary', difficulty: 'B2' }, verdict: 'correct' as const },
      { question: { section: 'reading', difficulty: 'B2' }, verdict: 'correct' as const },
      { question: { section: 'grammar', difficulty: 'C1' }, verdict: 'incorrect' as const }
    ];

    const resultB2 = CEFREvaluator.evaluateAttempts(multiLevelAttempts);
    assertTest(resultB2.placedLevel === 'B2', 'Multi-level evidence accurately places at B2');
    assertTest(resultB2.confidence === 'moderate', 'Confidence rises to moderate with cross-category evidence');
  }

  // =========================================================================
  // TEST 7: Dynamic Session Mode Allocation (10m, 20m, 30m)
  // =========================================================================
  console.log('\n--- Test 7: Dynamic Session Duration Allocation ---');
  {
    const plan10 = CurriculumScheduler.scheduleDailyLesson({
      profile: { ...mockProfile, daily_minutes: 10 },
      skillStates: [],
      recentErrors: [],
      now: fixedNow
    });
    assertTest(plan10.estimated_duration_minutes === 10, '10-minute session duration preserved');
    assertTest(plan10.total_planned_questions === 6, '10-minute session plans exactly 6 questions');
    assertTest(plan10.sections.length === 3, '10-minute session structured into 3 focused activities');

    const plan20 = CurriculumScheduler.scheduleDailyLesson({
      profile: { ...mockProfile, daily_minutes: 20 },
      skillStates: [],
      recentErrors: [],
      now: fixedNow
    });
    assertTest(plan20.estimated_duration_minutes === 20, '20-minute session duration preserved');
    assertTest(plan20.total_planned_questions === 10, '20-minute session plans exactly 10 questions');
    assertTest(plan20.sections.length === 4, '20-minute session structured into 4 activities');

    const plan30 = CurriculumScheduler.scheduleDailyLesson({
      profile: { ...mockProfile, daily_minutes: 30 },
      skillStates: [],
      recentErrors: [],
      now: fixedNow
    });
    assertTest(plan30.estimated_duration_minutes === 30, '30-minute session duration preserved');
    assertTest(plan30.total_planned_questions === 15, '30-minute session plans exactly 15 questions');
    assertTest(plan30.sections.length === 5, '30-minute session structured into 5 deep activities');
  }

  // =========================================================================
  // TEST 8: Periodic Independent Progress Check Scheduling
  // =========================================================================
  console.log('\n--- Test 8: Periodic Independent Progress Check Trigger ---');
  {
    // On the 4th lesson (completedLessonsCount = 3, so next is lesson 4)
    const planLesson4 = CurriculumScheduler.scheduleDailyLesson({
      profile: mockProfile,
      skillStates: [],
      recentErrors: [],
      completedLessonsCount: 3,
      now: fixedNow
    });

    assertTest(planLesson4.progress_check_active === true, 'Progress check triggered on 4th lesson cycle');
    assertTest(
      planLesson4.sections.some(s => s.is_progress_check === true),
      'Injects dedicated independent progress check section'
    );
  }

  console.log('\n======================================================');
  console.log(`TOTAL MASTERY PROGRESSION TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runMasteryProgressionTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
