import {
  LearnerSkillState,
  SkillMasteryStage,
  EnglishLevel,
  QuestionType,
  SectionType
} from '../types/learning.ts';

export interface SkillEvidenceInput {
  skillId: string;
  skillName: string;
  category: string;
  isCorrect: boolean;
  questionType?: QuestionType | string;
  questionDifficulty?: EnglishLevel;
  errorTag?: string;
  attemptTimestamp?: string;
  isProgressCheck?: boolean;
}

export interface MasteryUpdateResult {
  updatedSkill: LearnerSkillState;
  previousStage: SkillMasteryStage;
  newStage: SkillMasteryStage;
  didRegress: boolean;
  didAdvance: boolean;
  explanation: string;
}

/**
 * Mastery-Driven Cognitive Skill Progression Engine
 * 
 * Rules:
 * 1. Never declare mastery from a few immediate correct answers.
 * 2. Distinguish 5 cognitive stages:
 *    - exposure: 1 trial (just introduced)
 *    - recognition: multiple choice / option identification passed
 *    - active_recall: unprompted recall (fill-in-the-blank) passed
 *    - application: complex sentence transformation / production passed across diverse exercise types
 *    - retained_mastery: confirmed through delayed retrieval (>= 2 days) or independent progress check
 * 3. Accounts for delayed retrieval, recency weighting, and exercise type diversity.
 * 4. Catches regression: errors on previously mastered skills shorten review intervals and step back mastery.
 */
export class MasteryEngine {
  /**
   * Evaluates evidence and updates the skill state
   */
  public static recordSkillEvidence(
    currentSkill: LearnerSkillState | undefined,
    input: SkillEvidenceInput
  ): MasteryUpdateResult {
    const now = input.attemptTimestamp ? new Date(input.attemptTimestamp) : new Date();
    const nowIso = now.toISOString();

    const previousStage: SkillMasteryStage = currentSkill?.mastery_stage || 'exposure';
    const isNew = !currentSkill;

    let skill: LearnerSkillState;
    if (isNew) {
      skill = {
        skill_id: input.skillId || `skill-${Date.now()}`,
        skill_name: input.skillName,
        category: input.category || 'grammar',
        status: 'learning',
        accuracy_rate: input.isCorrect ? 1.0 : 0.0,
        total_attempts: 1,
        last_practiced_at: nowIso,
        next_review_at: new Date(now.getTime() + 86400000).toISOString(), // 1 day
        recurring_errors: input.errorTag ? [input.errorTag] : [],
        mastery_stage: 'exposure',
        mastery_score: input.isCorrect ? 25 : 10,
        exercise_types_passed: input.isCorrect && input.questionType ? [input.questionType] : [],
        consecutive_correct: input.isCorrect ? 1 : 0,
        retention_checks_passed: 0,
        prerequisite_skill_ids: [],
        difficulty_level: input.questionDifficulty || 'B1',
        last_retrieval_delay_days: 0,
        regression_count: 0
      };
    } else {
      skill = {
        ...currentSkill,
        exercise_types_passed: [...(currentSkill.exercise_types_passed || [])],
        recurring_errors: [...(currentSkill.recurring_errors || [])]
      };
    }

    if (!isNew) {
      // Calculate delay in days since last practice
      const lastPracticed = new Date(currentSkill.last_practiced_at || nowIso);
      const delayDays = Math.max(0, Math.floor((now.getTime() - lastPracticed.getTime()) / 86400000));
      skill.last_retrieval_delay_days = delayDays;

      skill.total_attempts += 1;

      // Recency-weighted accuracy: recent performance carries 65% weight
      const prevTotal = skill.total_attempts - 1;
      const prevCorrectCount = Math.round(skill.accuracy_rate * prevTotal);
      const newCorrectCount = prevCorrectCount + (input.isCorrect ? 1 : 0);
      const lifetimeAcc = newCorrectCount / skill.total_attempts;
      const recentTrialScore = input.isCorrect ? 1.0 : 0.0;
      const blendedAccuracy = Number((lifetimeAcc * 0.4 + recentTrialScore * 0.6).toFixed(2));
      skill.accuracy_rate = blendedAccuracy;
      skill.last_practiced_at = nowIso;

      if (input.isCorrect) {
        skill.consecutive_correct = (skill.consecutive_correct || 0) + 1;
        skill.exercise_types_passed = skill.exercise_types_passed || [];
        if (input.questionType && !skill.exercise_types_passed.includes(input.questionType)) {
          skill.exercise_types_passed.push(input.questionType);
        }
        // If retrieved after >= 2 days or during progress check, credit retention check
        if ((delayDays >= 2 || input.isProgressCheck) && skill.consecutive_correct >= 2) {
          skill.retention_checks_passed = (skill.retention_checks_passed || 0) + 1;
        }
      } else {
        skill.consecutive_correct = 0;
        if (input.errorTag && !skill.recurring_errors.includes(input.errorTag)) {
          skill.recurring_errors.push(input.errorTag);
          if (skill.recurring_errors.length > 5) skill.recurring_errors.shift();
        }
      }
    }

    // Determine Cognitive Mastery Stage & Regression
    let newStage: SkillMasteryStage = skill.mastery_stage || 'exposure';
    let didRegress = false;
    let didAdvance = false;
    let explanation = '';

    const consecutive = skill.consecutive_correct || 0;
    const diversityCount = skill.exercise_types_passed?.length || 0;
    const retentionChecks = skill.retention_checks_passed || 0;
    const delayDays = skill.last_retrieval_delay_days || 0;

    if (!input.isCorrect) {
      // Error occurred: check for regression
      if (previousStage === 'retained_mastery' || previousStage === 'application') {
        didRegress = true;
        skill.regression_count = (skill.regression_count || 0) + 1;
        skill.status = 'regressed';
        newStage = previousStage === 'retained_mastery' ? 'active_recall' : 'recognition';
        skill.next_review_at = new Date(now.getTime() + 86400000).toISOString(); // Immediate review tomorrow
        skill.mastery_score = Math.max(30, (skill.mastery_score || 70) - 25);
        explanation = `Skill regressed from ${previousStage} to ${newStage} due to incorrect response during review. Scheduled for immediate reinforcement.`;
      } else {
        skill.status = 'learning';
        newStage = previousStage === 'active_recall' ? 'recognition' : previousStage;
        skill.next_review_at = new Date(now.getTime() + 86400000).toISOString();
        skill.mastery_score = Math.max(10, (skill.mastery_score || 30) - 10);
        explanation = `Needs practice. Review scheduled for tomorrow with focused error correction.`;
      }
    } else {
      // Correct answer: advance stage based on rigorous multi-factor evidence
      if (previousStage === 'exposure') {
        newStage = 'recognition';
        skill.status = 'learning';
        skill.mastery_score = 45;
        skill.next_review_at = new Date(now.getTime() + 86400000).toISOString();
        explanation = `Advanced to Recognition. Learner successfully identified the correct target form.`;
      } else if (previousStage === 'recognition') {
        // Requires at least active recall exercise or multiple clean successes
        const hasRecallOrMultiple = consecutive >= 2 && (diversityCount >= 2 || input.questionType === 'fill_in_blank');
        if (hasRecallOrMultiple) {
          newStage = 'active_recall';
          skill.status = 'reviewing';
          skill.mastery_score = 65;
          skill.next_review_at = new Date(now.getTime() + 86400000 * 3).toISOString(); // 3-day spaced review
          explanation = `Advanced to Active Recall. Successfully produced target structure across varied questions.`;
        } else {
          skill.status = 'learning';
          skill.mastery_score = 55;
          skill.next_review_at = new Date(now.getTime() + 86400000).toISOString();
          explanation = `Recognizing form reliably. Ready for active recall practice.`;
        }
      } else if (previousStage === 'active_recall') {
        // Needs diverse exercises (at least 2 types) and consecutive >= 3 to reach Application
        if (consecutive >= 3 && diversityCount >= 2) {
          newStage = 'application';
          skill.status = 'mostly_mastered';
          skill.mastery_score = 80;
          skill.next_review_at = new Date(now.getTime() + 86400000 * 7).toISOString(); // 7-day spaced review
          explanation = `Advanced to Application. Can flexibly apply the target rule in complex contexts.`;
        } else {
          skill.status = 'reviewing';
          skill.mastery_score = 72;
          skill.next_review_at = new Date(now.getTime() + 86400000 * 3).toISOString();
          explanation = `Consolidating active recall. Spaced review scheduled in 3 days.`;
        }
      } else if (previousStage === 'application' || previousStage === 'retained_mastery') {
        // Retained Mastery CANNOT be awarded without delayed retrieval (delay >= 2 days or progress check)
        // and sustained performance
        const hasDelayedSuccess = delayDays >= 2 || input.isProgressCheck || retentionChecks >= 2;
        if (hasDelayedSuccess && consecutive >= 3 && skill.total_attempts >= 4) {
          newStage = 'retained_mastery';
          skill.status = 'mastered';
          skill.mastery_score = Math.min(100, Math.max(90, (skill.mastery_score || 80) + 10));
          // Spaced review interval increases to 14 or 30 days
          const nextIntervalDays = retentionChecks >= 3 ? 30 : 14;
          skill.next_review_at = new Date(now.getTime() + 86400000 * nextIntervalDays).toISOString();
          explanation = `Retained Mastery confirmed! Verified through delayed retrieval. Next maintenance check in ${nextIntervalDays} days.`;
        } else {
          newStage = 'application';
          skill.status = 'mostly_mastered';
          skill.mastery_score = Math.min(88, (skill.mastery_score || 80) + 3);
          skill.next_review_at = new Date(now.getTime() + 86400000 * 7).toISOString();
          explanation = `Applied correctly. Awaiting delayed retrieval check for permanent retained mastery.`;
        }
      }
    }

    didAdvance = newStage !== previousStage && !didRegress;
    skill.mastery_stage = newStage;

    return {
      updatedSkill: skill,
      previousStage,
      newStage,
      didRegress,
      didAdvance,
      explanation
    };
  }

  /**
   * Checks if all prerequisite skills for a given target skill are satisfied
   */
  public static arePrerequisitesMet(
    prerequisiteIds: string[],
    allSkills: LearnerSkillState[]
  ): { met: boolean; missingSkillNames: string[] } {
    if (!prerequisiteIds || prerequisiteIds.length === 0) {
      return { met: true, missingSkillNames: [] };
    }

    const missingSkillNames: string[] = [];
    for (const preId of prerequisiteIds) {
      const match = allSkills.find(s => s.skill_id === preId || s.skill_name.toLowerCase() === preId.toLowerCase());
      // A prerequisite is considered satisfied only if it is at least 'active_recall' or 'application' or 'retained_mastery'
      const isQualified = match && (
        match.mastery_stage === 'active_recall' ||
        match.mastery_stage === 'application' ||
        match.mastery_stage === 'retained_mastery' ||
        match.status === 'mostly_mastered' ||
        match.status === 'mastered'
      ) && match.status !== 'regressed';

      if (!isQualified) {
        missingSkillNames.push(match ? match.skill_name : preId);
      }
    }

    return {
      met: missingSkillNames.length === 0,
      missingSkillNames
    };
  }
}
