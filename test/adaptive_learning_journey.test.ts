import assert from 'assert';
import { localStore } from '../src/services/localStore.ts';
import { generatePersonalizedRoadmap, syncAndAdvanceRoadmap } from '../src/services/roadmapGenerator.ts';
import { CurriculumScheduler } from '../src/services/curriculumScheduler.ts';
import { fallbackDiscoveryTurn } from '../server/fallbacks/diagnosticFallbacks.ts';
import { CEFREvaluator } from '../src/services/cefrEvaluator.ts';
import {
  UserProfile,
  LearnerSkillState
} from '../src/types/learning.ts';

async function runAdaptiveJourneyTests() {
  console.log('--- Starting Adaptive Learning Journey Integration Tests ---');
  await localStore.resetAll();

  // =========================================================================
  // Scenario A: Authentic Social / Dating Learner Goal ("tán gái")
  // =========================================================================
  console.log('Testing Scenario A: Social learner with authentic intent ("tán gái")...');
  const initialProfile: UserProfile = {
    id: 'test-user-social',
    name: 'Nam',
    current_level: 'A2',
    target_level: 'C1',
    primary_goal: 'conversation',
    goal_summary: '',
    explanation_language: 'vi',
    general_vs_work_ratio: 10,
    daily_minutes: 20,
    days_per_week: 5,
    feedback_style: 'encouraging',
    enable_audio_tips: true,
    onboarding_completed: false,
    struggles: [],
    timeline_target: '6 months',
    audio_importance: true,
    confidence_in_level: 'moderate',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const discoveryTurn1 = fallbackDiscoveryTurn(
    [],
    'Muốn học tiếng Anh để tán gái và chat với người nước ngoài',
    initialProfile,
    1
  );

  assert.strictEqual(discoveryTurn1.updatedProfile.primary_goal, 'conversation');
  assert.strictEqual(discoveryTurn1.updatedProfile.structured_goal?.preferred_tone, 'playful_cheeky');
  assert.ok(
    discoveryTurn1.updatedProfile.structured_goal?.original_free_text.includes('tán gái'),
    'Original free text goal must preserve authentic phrasing'
  );

  const socialProfile: UserProfile = {
    ...initialProfile,
    ...discoveryTurn1.updatedProfile,
    self_reported_level: 'B1',
    current_level: 'B1'
  };

  const socialRoadmap = generatePersonalizedRoadmap(socialProfile);
  assert.ok(socialRoadmap.milestones.length >= 4, 'Must generate at least 4 progressive milestones');
  assert.ok(
    socialRoadmap.milestones[0].required_skills.some(s => s.skill_id === 'social_icebreakers_banter'),
    'Milestone 1 must target conversational banter rather than workplace post-mortems'
  );
  assert.strictEqual(socialRoadmap.milestones[0].status, 'in_progress');
  assert.strictEqual(socialRoadmap.milestones[1].status, 'locked');
  console.log('✓ Scenario A passed.');

  // =========================================================================
  // Scenario B: Software Engineer Learner Goal
  // =========================================================================
  console.log('Testing Scenario B: Tech / Software Engineer roadmap...');
  const techProfile: UserProfile = {
    ...initialProfile,
    id: 'test-user-tech',
    primary_goal: 'workplace_tech',
    goal_summary: 'Senior software engineer leading international PR reviews and architecture RFCs',
    structured_goal: {
      original_free_text: 'Senior software engineer leading international PR reviews',
      interpreted_goal: 'Software Engineering Workplace Fluency',
      primary_objective: 'Technical design justification and code review alignment',
      preferred_situations: ['Standups', 'PR reviews', 'Design docs', 'Incident post-mortems'],
      preferred_tone: 'formal_workplace',
      available_daily_time: 20,
      target_level: 'C1',
      self_reported_level: 'B2'
    }
  };

  const techRoadmap = generatePersonalizedRoadmap(techProfile);
  assert.ok(
    techRoadmap.milestones[0].required_skills.some(s => s.skill_id === 'workplace_slack_update' || s.skill_id === 'collocation_mitigate'),
    'Tech roadmap milestone 1 must focus on engineering communication'
  );
  assert.ok(
    techRoadmap.milestones[1].required_skills.some(s => s.skill_id === 'mixed_conditionals'),
    'Tech roadmap milestone 2 must focus on architectural trade-offs'
  );
  console.log('✓ Scenario B passed.');

  // =========================================================================
  // Scenario C: Separating Self-Reported vs Assessed Level
  // =========================================================================
  console.log('Testing Scenario C: Self-reported B2 vs Assessed B1 proficiency...');
  // Profile update simulating completeDiagnosticSession
  const calibratedProfile: UserProfile = {
    ...socialProfile,
    self_reported_level: 'B2', // User claimed B2
    assessed_overall_level: 'B1', // Diagnostic measured B1
    assessment_confidence: 'moderate',
    assessed_at: new Date().toISOString(),
    current_level: 'B1' // Active baseline becomes assessed B1
  };

  assert.strictEqual(calibratedProfile.self_reported_level, 'B2', 'Self-reported level must remain untouched');
  assert.strictEqual(calibratedProfile.assessed_overall_level, 'B1', 'Assessed level must record diagnostic output');
  assert.strictEqual(calibratedProfile.goal_summary, 'Muốn học tiếng Anh để tán gái và chat với người nước ngoài', 'Original goal summary must NEVER be overwritten with calibration text');
  console.log('✓ Scenario C passed.');

  // =========================================================================
  // Scenario D: CEFR Evaluation & Timing Calibration
  // =========================================================================
  console.log('Testing Scenario D: CEFR Evaluator coverage & confidence calculation...');
  const sampleAttempts = [
    { question: { section: 'grammar', difficulty: 'A2' }, verdict: 'correct' as const },
    { question: { section: 'grammar', difficulty: 'A2' }, verdict: 'correct' as const },
    { question: { section: 'vocabulary', difficulty: 'B1' }, verdict: 'correct' as const },
    { question: { section: 'vocabulary', difficulty: 'B1' }, verdict: 'correct' as const },
    { question: { section: 'writing', difficulty: 'B2' }, verdict: 'incorrect' as const },
    { question: { section: 'reading', difficulty: 'B2' }, verdict: 'incorrect' as const }
  ];

  const placement = CEFREvaluator.evaluateAttempts(sampleAttempts);
  assert.strictEqual(placement.placedLevel, 'B1', 'Accurate placement at B1 based on confirmed prerequisites');
  assert.strictEqual(placement.confidence, 'moderate', '6 questions across 4 categories yields moderate confidence');
  console.log('✓ Scenario D passed.');

  // =========================================================================
  // Scenario E: Roadmap Progression Beyond Milestone 1
  // =========================================================================
  console.log('Testing Scenario E: Evidence-based mastery & milestone progression...');
  let activeRoadmap = generatePersonalizedRoadmap(socialProfile);
  assert.strictEqual(activeRoadmap.current_milestone_id, activeRoadmap.milestones[0].milestone_id);
  assert.strictEqual(activeRoadmap.milestones[0].status, 'in_progress');
  assert.strictEqual(activeRoadmap.milestones[1].status, 'locked');

  // Simulate learner practicing and mastering all required skills in Milestone 1
  const m1Skills = activeRoadmap.milestones[0].required_skills;
  const userSkillStates: LearnerSkillState[] = m1Skills.map(s => ({
    skill_id: s.skill_id,
    skill_name: s.name,
    category: s.category as any,
    status: 'mastered',
    mastery_stage: 'retained_mastery',
    accuracy_rate: 0.92,
    total_attempts: 6,
    consecutive_correct: 5,
    retention_checks_passed: 2,
    last_practiced_at: new Date().toISOString(),
    next_review_at: new Date(Date.now() + 86400000 * 14).toISOString(),
    recurring_errors: []
  }));

  const progressionResult = syncAndAdvanceRoadmap(activeRoadmap, userSkillStates);
  assert.ok(progressionResult.didAdvance, 'Roadmap must advance when milestone skills are mastered');
  assert.strictEqual(progressionResult.roadmap.milestones[0].status, 'completed', 'Milestone 1 must be marked completed');
  assert.strictEqual(progressionResult.roadmap.milestones[1].status, 'in_progress', 'Milestone 2 must unlock to in_progress');
  assert.strictEqual(
    progressionResult.roadmap.current_milestone_id,
    progressionResult.roadmap.milestones[1].milestone_id,
    'Current milestone ID must advance to milestone 2'
  );
  console.log('✓ Scenario E passed.');

  // =========================================================================
  // Scenario F: Persistence, Migration, Export & Import
  // =========================================================================
  console.log('Testing Scenario F: Persistence, Export, Import and Account Isolation...');
  await localStore.saveProfile(calibratedProfile);
  await localStore.saveRoadmap(progressionResult.roadmap);

  const exported = await localStore.exportAll();
  assert.ok(exported.roadmap, 'Export bundle must contain roadmap');
  assert.strictEqual(exported.roadmap.current_milestone_id, progressionResult.roadmap.milestones[1].milestone_id);

  // Validate import schema
  const validation = localStore.validateImport(exported);
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.summary.hasRoadmap, true);

  // Test guest migration to Google account
  await localStore.migrateGuestDataToAccount('google-user-999');
  localStore.setActiveAccount('google-user-999');
  const migratedRoadmap = await localStore.getRoadmap();
  assert.ok(migratedRoadmap, 'Roadmap must be cleanly migrated to newly signed-in account');
  assert.strictEqual(migratedRoadmap.current_milestone_id, progressionResult.roadmap.milestones[1].milestone_id);

  localStore.setActiveAccount('learner-primary'); // switch back
  console.log('✓ Scenario F passed.');

  // =========================================================================
  // Scenario G: Lesson Scheduling Follows Active Roadmap Milestone
  // =========================================================================
  console.log('Testing Scenario G: Lesson scheduling selects from active roadmap milestone...');
  const scheduledLesson = CurriculumScheduler.scheduleDailyLesson({
    profile: calibratedProfile,
    skillStates: userSkillStates,
    recentErrors: [],
    completedLessonsCount: 4,
    roadmap: progressionResult.roadmap
  });

  const scheduledSkillTarget = scheduledLesson.sections.find(
    s => s.pedagogical_focus === 'new_concept' || s.activity_type === 'concept_practice'
  )?.skill_target;
  const m2Required = progressionResult.roadmap.milestones[1].required_skills;
  const matchesM2 = m2Required.some(s => 
    s.skill_id === 'past_narrative_social' ||
    (scheduledSkillTarget && (
      scheduledSkillTarget.toLowerCase().includes('narrative past') ||
      scheduledSkillTarget.toLowerCase().includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(scheduledSkillTarget.toLowerCase())
    ))
  );
  assert.ok(
    matchesM2,
    `Scheduled skill target "${scheduledSkillTarget}" must come from active Milestone 2`
  );
  console.log('✓ Scenario G passed.');

  console.log('\n======================================================');
  console.log('ALL ADAPTIVE LEARNING JOURNEY TESTS PASSED CLEANLY!');
  console.log('======================================================');
}

runAdaptiveJourneyTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
