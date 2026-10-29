import {
  UserProfile,
  LearnerSkillState,
  VocabularyItem,
  DeterministicLessonPlanBlueprint,
  DeterministicSectionBlueprint,
  NextSessionCustomContext,
  EnglishLevel,
  ActivityType
} from '../types/learning.ts';
import { MasteryEngine } from './masteryEngine.ts';

// Core curriculum roadmap of progressive skills with explicit prerequisite mappings
export interface CurriculumSkillDefinition {
  id: string;
  name: string;
  category: 'grammar' | 'vocabulary' | 'writing' | 'reading';
  level: EnglishLevel;
  prerequisites: string[]; // IDs or names of prerequisite skills
  description: string;
}

export const CURRICULUM_SKILL_CATALOG: CurriculumSkillDefinition[] = [
  // A2 / Foundation
  {
    id: 'past_simple_regular_irregular',
    name: 'Past Simple Regular & Irregular',
    category: 'grammar',
    level: 'A2',
    prerequisites: [],
    description: 'Narrating completed historical events and actions with specific past time markers.'
  },
  {
    id: 'present_simple_vs_continuous',
    name: 'Present Simple vs Continuous',
    category: 'grammar',
    level: 'A2',
    prerequisites: [],
    description: 'Habitual routines vs active ongoing workplace activities.'
  },
  // B1 / Intermediate
  {
    id: 'present_perfect_past_simple',
    name: 'Present Perfect vs Past Simple',
    category: 'grammar',
    level: 'B1',
    prerequisites: ['past_simple_regular_irregular'],
    description: 'Distinguishing past events with indefinite time from specific timestamped milestones.'
  },
  {
    id: 'conditionals_real_hypothetical',
    name: 'First & Second Conditionals',
    category: 'grammar',
    level: 'B1',
    prerequisites: ['past_simple_regular_irregular'],
    description: 'Project outcome predictions (If we launch...) and hypothetical trade-offs (If we had budget...).'
  },
  {
    id: 'passive_voice_objective',
    name: 'Passive Voice in Objective Reports',
    category: 'writing',
    level: 'B1',
    prerequisites: ['past_simple_regular_irregular'],
    description: 'Objective, neutral technical incident summaries and process documentation.'
  },
  // B2 / Upper Intermediate
  {
    id: 'past_perfect_narrative_anchors',
    name: 'Past Perfect & Narrative Time Anchors',
    category: 'grammar',
    level: 'B2',
    prerequisites: ['present_perfect_past_simple'],
    description: 'Clarifying the sequence of earlier past events before a second past milestone (By the time + V2... had V3).'
  },
  {
    id: 'mixed_conditionals',
    name: 'Mixed Conditionals (Past Cause, Present Result)',
    category: 'grammar',
    level: 'B2',
    prerequisites: ['conditionals_real_hypothetical', 'past_perfect_narrative_anchors'],
    description: 'Hypothesizing past actions that directly impact current reality (If we had mitigated... we would be ready).'
  },
  {
    id: 'negative_inversion',
    name: 'Negative & Restrictive Inversion',
    category: 'grammar',
    level: 'B2',
    prerequisites: ['present_simple_vs_continuous'],
    description: 'Formal emphasis with negative adverbs (Seldom have we witnessed, Rarely does a team...).'
  },
  {
    id: 'formal_contrast_connectors',
    name: 'Formal Contrast Connectors (Nevertheless, In spite of)',
    category: 'writing',
    level: 'B2',
    prerequisites: ['passive_voice_objective'],
    description: 'Nuanced transition management in executive memos and status briefs.'
  },
  // C1 / Advanced
  {
    id: 'cleft_sentences_focus',
    name: 'Cleft Sentences for Focus & Alignment',
    category: 'writing',
    level: 'C1',
    prerequisites: ['negative_inversion'],
    description: 'Directing listener focus on crucial bottlenecks and strategic decisions (What we must prioritize is...).'
  },
  {
    id: 'subjunctive_mood_executive',
    name: 'Subjunctive Mood in Formal Recommendations',
    category: 'grammar',
    level: 'C1',
    prerequisites: ['passive_voice_objective'],
    description: 'High-stakes formal mandate structures (It is imperative that the team implement...).'
  }
];

export interface SchedulerInput {
  profile: UserProfile;
  skillStates: LearnerSkillState[];
  recentErrors: string[];
  vocabulary?: VocabularyItem[];
  completedLessonsCount?: number;
  customContext?: NextSessionCustomContext;
  now?: Date;
}

/**
 * Deterministic Curriculum Scheduler
 * 
 * Selects learning objectives, review queues, mistake clinics, and progress checks
 * prior to any AI prompt generation.
 */
export class CurriculumScheduler {
  public static scheduleDailyLesson(input: SchedulerInput): DeterministicLessonPlanBlueprint {
    const now = input.now || new Date();
    const nowTime = now.getTime();
    const isVi = input.profile.explanation_language === 'vi';

    const rawMinutes = input.customContext?.dailyMinutes || input.profile.daily_minutes || 20;
    const duration: 10 | 20 | 30 = rawMinutes <= 12 ? 10 : rawMinutes >= 25 ? 30 : 20;
    const paceMode = duration === 10 ? 'quick_10' : duration === 30 ? 'deep_30' : 'standard_20';
    const totalPlannedQuestions = duration === 10 ? 6 : duration === 30 ? 15 : 10;

    // 1. Identify Overdue Spaced Reviews
    const overdueSkills = (input.skillStates || [])
      .filter(s => s.next_review_at && new Date(s.next_review_at).getTime() <= nowTime)
      .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());

    // 2. Identify Recurring Mistake Targets & Regressed Skills
    const mistakeSkills = (input.skillStates || [])
      .filter(s => s.status === 'regressed' || s.status === 'learning' || (s.recurring_errors && s.recurring_errors.length > 0))
      .sort((a, b) => (b.recurring_errors?.length || 0) - (a.recurring_errors?.length || 0));

    // Combine error strings
    const recurringMistakesTargeted: string[] = [];
    if (input.customContext?.selectedMistakes && input.customContext.selectedMistakes.length > 0) {
      recurringMistakesTargeted.push(...input.customContext.selectedMistakes);
    } else {
      for (const s of mistakeSkills.slice(0, 3)) {
        if (s.recurring_errors && s.recurring_errors.length > 0) {
          recurringMistakesTargeted.push(...s.recurring_errors.slice(0, 2));
        }
      }
      if (input.recentErrors && input.recentErrors.length > 0) {
        for (const err of input.recentErrors) {
          if (!recurringMistakesTargeted.includes(err) && recurringMistakesTargeted.length < 3) {
            recurringMistakesTargeted.push(err);
          }
        }
      }
    }

    // 3. Periodic Independent Progress Check Determination
    // Trigger progress check every 4th lesson or if there are 2+ skills in 'application' stage awaiting verification
    const completedCount = input.completedLessonsCount || 0;
    const skillsAwaitingVerification = (input.skillStates || []).filter(
      s => (s.mastery_stage === 'application' || s.status === 'mostly_mastered') && (s.retention_checks_passed || 0) < 1
    );
    const isProgressCheckDue = (completedCount > 0 && (completedCount + 1) % 4 === 0) || skillsAwaitingVerification.length >= 2;

    // 4. Candidate New Concept Selection with Prerequisite Check
    let blockedByPrerequisiteName: string | undefined = undefined;
    let selectedNewSkill: CurriculumSkillDefinition | undefined = undefined;

    // First, check if any active skill the learner is currently working on has unmet prerequisites
    const strugglingSkillWithMissingPrereq = (input.skillStates || [])
      .filter(s => s.status === 'learning' || s.status === 'regressed' || s.status === 'reviewing')
      .map(s => {
        const catalogDef = CURRICULUM_SKILL_CATALOG.find(c => c.id === s.skill_id || c.name.toLowerCase() === s.skill_name.toLowerCase());
        if (!catalogDef || !catalogDef.prerequisites || catalogDef.prerequisites.length === 0) return null;
        const check = MasteryEngine.arePrerequisitesMet(catalogDef.prerequisites, input.skillStates || []);
        if (!check.met) {
          return { skill: s, catalogDef, missingPrereq: check.missingSkillNames[0] };
        }
        return null;
      })
      .find(Boolean);

    if (strugglingSkillWithMissingPrereq) {
      blockedByPrerequisiteName = strugglingSkillWithMissingPrereq.missingPrereq;
      const prereqDef = CURRICULUM_SKILL_CATALOG.find(
        c => c.name.toLowerCase() === blockedByPrerequisiteName?.toLowerCase() || c.id === blockedByPrerequisiteName
      );
      selectedNewSkill = prereqDef || {
        id: `prereq_${Date.now()}`,
        name: blockedByPrerequisiteName,
        category: 'grammar',
        level: 'A2',
        prerequisites: [],
        description: `Foundation prerequisite: ${blockedByPrerequisiteName}`
      };
    } else if (input.customContext?.selectedNewSkills && input.customContext.selectedNewSkills.length > 0) {
      const customName = input.customContext.selectedNewSkills[0];
      const found = CURRICULUM_SKILL_CATALOG.find(c => c.name.toLowerCase() === customName.toLowerCase() || c.id === customName);
      if (found) {
        const prereqCheck = MasteryEngine.arePrerequisitesMet(found.prerequisites, input.skillStates || []);
        if (!prereqCheck.met) {
          blockedByPrerequisiteName = prereqCheck.missingSkillNames[0];
          const prereqDef = CURRICULUM_SKILL_CATALOG.find(c => c.name.toLowerCase() === blockedByPrerequisiteName?.toLowerCase() || c.id === blockedByPrerequisiteName);
          selectedNewSkill = prereqDef || found;
        } else {
          selectedNewSkill = found;
        }
      } else {
        selectedNewSkill = {
          id: `custom_${Date.now()}`,
          name: customName,
          category: 'grammar',
          level: input.profile.current_level,
          prerequisites: [],
          description: `Target skill selected by learner: ${customName}`
        };
      }
    } else {
      // Find candidate skills matching or above learner's current level first
      const levelRank: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
      const userRank = levelRank[input.profile.current_level] || 3;

      const candidateList = CURRICULUM_SKILL_CATALOG.filter(c => {
        const existing = (input.skillStates || []).find(s => s.skill_name.toLowerCase() === c.name.toLowerCase() || s.skill_id === c.id);
        return !existing || (existing.mastery_stage !== 'retained_mastery' && existing.status !== 'mastered');
      }).sort((a, b) => {
        const aDist = Math.abs((levelRank[a.level] || 3) - userRank);
        const bDist = Math.abs((levelRank[b.level] || 3) - userRank);
        return aDist - bDist;
      });

      for (const candidate of candidateList) {
        const prereqCheck = MasteryEngine.arePrerequisitesMet(candidate.prerequisites, input.skillStates || []);
        if (prereqCheck.met) {
          selectedNewSkill = candidate;
          break;
        } else {
          // Candidate skill is blocked because prerequisites are not met!
          blockedByPrerequisiteName = prereqCheck.missingSkillNames[0];
          const prereqDef = CURRICULUM_SKILL_CATALOG.find(c => c.name.toLowerCase() === blockedByPrerequisiteName?.toLowerCase() || c.id === blockedByPrerequisiteName);
          selectedNewSkill = prereqDef || candidate;
          break;
        }
      }
    }

    if (!selectedNewSkill) {
      selectedNewSkill = CURRICULUM_SKILL_CATALOG[2]; // Default to B1 present perfect vs past simple
    }

    // 5. Dynamic Section & Question Budgeting
    const sections: DeterministicSectionBlueprint[] = [];

    if (duration === 10) {
      // 10m Quick Session: 6 questions total across 3 activities
      if (overdueSkills.length > 0 || mistakeSkills.length > 0) {
        const hasMistakes = (mistakeSkills.length > 0 && mistakeSkills[0].recurring_errors && mistakeSkills[0].recurring_errors.length > 0) ||
                            (input.recentErrors && input.recentErrors.length > 0);
        const reviewTarget = hasMistakes ? (mistakeSkills[0] || overdueSkills[0]) : (overdueSkills[0] || mistakeSkills[0]);
        const focus: 'mistake_clinic' | 'overdue_review' = hasMistakes ? 'mistake_clinic' : 'overdue_review';
        sections.push({
          section: (reviewTarget.category as any) || 'grammar',
          title: hasMistakes
            ? (isVi ? `Phòng khám lỗi sai: ${reviewTarget.skill_name}` : `Mistake Clinic: ${reviewTarget.skill_name}`)
            : (isVi ? `Ôn tập củng cố: ${reviewTarget.skill_name}` : `Reinforcement Review: ${reviewTarget.skill_name}`),
          description: hasMistakes
            ? (isVi ? 'Khắc phục các lỗi sai thường gặp.' : 'Address recurring mistake patterns.')
            : (isVi ? 'Củng cố lại khái niệm trước đó theo lịch nhắc lại ngắt quãng.' : 'Spaced retrieval to consolidate memory traces.'),
          estimated_minutes: 3,
          target_questions_count: 2,
          skill_target: reviewTarget.skill_name,
          activity_type: 'warmup_review',
          pedagogical_focus: focus,
          target_mastery_stage: 'active_recall'
        });
      } else {
        sections.push({
          section: 'grammar',
          title: isVi ? 'Khởi động & Kích hoạt ngữ pháp' : 'Grammar Warm-up & Recall',
          description: isVi ? 'Kích hoạt kiến thức nền tảng.' : 'Activate foundational structures.',
          estimated_minutes: 3,
          target_questions_count: 2,
          skill_target: selectedNewSkill.name,
          activity_type: 'warmup_review',
          pedagogical_focus: blockedByPrerequisiteName ? 'prerequisite_reinforcement' : 'new_concept',
          target_mastery_stage: 'recognition'
        });
      }

      // Core Practice Section
      sections.push({
        section: selectedNewSkill.category === 'writing' ? 'writing' : 'grammar',
        title: isVi ? `Trọng tâm: ${selectedNewSkill.name}` : `Core Focus: ${selectedNewSkill.name}`,
        description: selectedNewSkill.description,
        estimated_minutes: 5,
        target_questions_count: 3,
        skill_target: selectedNewSkill.name,
        activity_type: 'concept_practice',
        pedagogical_focus: blockedByPrerequisiteName ? 'prerequisite_reinforcement' : 'new_concept',
        target_mastery_stage: 'active_recall'
      });

      // Exit Synthesis / Check
      sections.push({
        section: 'reading',
        title: isVi ? 'Tổng hợp & Đánh giá nhanh' : 'Exit Synthesis & Check',
        description: isVi ? 'Vận dụng ngữ cảnh ngắn gọn.' : 'Quick transfer verification.',
        estimated_minutes: 2,
        target_questions_count: 1,
        skill_target: selectedNewSkill.name,
        activity_type: 'exit_synthesis',
        pedagogical_focus: isProgressCheckDue ? 'progress_check' : 'production_application',
        is_progress_check: isProgressCheckDue
      });
    } else if (duration === 20) {
      // 20m Standard Session: 10 questions total across 4 activities
      // Section 1: Spaced Review or Mistake Clinic (2 questions)
      const hasMistakes = (mistakeSkills.length > 0 && mistakeSkills[0].recurring_errors && mistakeSkills[0].recurring_errors.length > 0) ||
                          (input.recentErrors && input.recentErrors.length > 0);
      const reviewTarget = hasMistakes ? (mistakeSkills[0] || overdueSkills[0]) : (overdueSkills[0] || mistakeSkills[0]);
      const reviewSkillName = reviewTarget ? reviewTarget.skill_name : 'Past Simple Regular & Irregular';
      const focus: 'mistake_clinic' | 'overdue_review' = hasMistakes ? 'mistake_clinic' : 'overdue_review';

      sections.push({
        section: (reviewTarget?.category as any) || 'grammar',
        title: hasMistakes
          ? (isVi ? `Phòng khám lỗi sai: ${reviewSkillName}` : `Mistake Clinic: ${reviewSkillName}`)
          : (isVi ? `Ôn tập nhắc lại: ${reviewSkillName}` : `Spaced Retrieval: ${reviewSkillName}`),
        description: hasMistakes
          ? (isVi ? 'Sửa chữa triệt để các lỗi sai thường lặp lại.' : 'Targeted resolution of recurring confusion patterns.')
          : (isVi ? 'Thực hành gợi nhớ ngắt quãng chống đường cong quên lãng.' : 'Spaced retrieval resisting memory decay.'),
        estimated_minutes: 4,
        target_questions_count: 2,
        skill_target: reviewSkillName,
        activity_type: 'warmup_review',
        pedagogical_focus: focus,
        target_mastery_stage: 'active_recall'
      });

      // Section 2: Core New Concept Practice (4 questions)
      sections.push({
        section: selectedNewSkill.category === 'writing' ? 'writing' : 'grammar',
        title: isVi ? `Khái niệm mới: ${selectedNewSkill.name}` : `Target Concept: ${selectedNewSkill.name}`,
        description: selectedNewSkill.description,
        estimated_minutes: 8,
        target_questions_count: 4,
        skill_target: selectedNewSkill.name,
        activity_type: 'concept_practice',
        pedagogical_focus: blockedByPrerequisiteName ? 'prerequisite_reinforcement' : 'new_concept',
        target_mastery_stage: 'application'
      });

      // Section 3: High-Impact Vocabulary & Collocations (2 questions)
      const targetVocab = (input.vocabulary && input.vocabulary.length > 0)
        ? input.vocabulary[0].word
        : 'mitigate';
      sections.push({
        section: 'vocabulary',
        title: isVi ? `Từ vựng chuyên sâu & Cụm từ: ${targetVocab}` : `Vocabulary & Collocations: ${targetVocab}`,
        description: isVi ? 'Học sâu qua ngữ cảnh và họ từ.' : 'Deep contextual vocabulary & word families.',
        estimated_minutes: 4,
        target_questions_count: 2,
        skill_target: `Vocabulary: ${targetVocab}`,
        activity_type: 'vocab_acquisition',
        pedagogical_focus: 'production_application',
        target_mastery_stage: 'application'
      });

      // Section 4: Practical Production or Periodic Progress Check (2 questions)
      sections.push({
        section: isProgressCheckDue ? 'reading' : 'writing',
        title: isProgressCheckDue
          ? (isVi ? 'Kiểm tra cột mốc định kỳ (Progress Check)' : 'Periodic Progress Check')
          : (isVi ? 'Ứng dụng thực tế & Viết tình huống' : 'Contextual Production & Writing'),
        description: isProgressCheckDue
          ? (isVi ? 'Kiểm tra độc lập độ bền vững của các kỹ năng đã học.' : 'Independent verification of retained skill mastery.')
          : (isVi ? 'Vận dụng cấu trúc vào giao tiếp công việc thực tế.' : 'Workplace communication scenario production.'),
        estimated_minutes: 4,
        target_questions_count: 2,
        skill_target: selectedNewSkill.name,
        activity_type: isProgressCheckDue ? 'exit_synthesis' : 'writing_production',
        pedagogical_focus: isProgressCheckDue ? 'progress_check' : 'production_application',
        is_progress_check: isProgressCheckDue
      });
    } else {
      // 30m Deep Session: 15 questions total across 5 activities
      // Section 1: Mistake Clinic (3 questions)
      const clinicSkillName = mistakeSkills[0]?.skill_name || overdueSkills[0]?.skill_name || 'Past Simple vs Continuous';
      sections.push({
        section: 'grammar',
        title: isVi ? `Phòng khám lỗi sai: ${clinicSkillName}` : `Mistake Clinic: ${clinicSkillName}`,
        description: isVi ? 'Sửa chữa triệt để các lỗi sai thường lặp lại.' : 'Targeted resolution of recurring confusion patterns.',
        estimated_minutes: 5,
        target_questions_count: 3,
        skill_target: clinicSkillName,
        activity_type: 'warmup_review',
        pedagogical_focus: 'mistake_clinic',
        target_mastery_stage: 'active_recall'
      });

      // Section 2: Overdue Spaced Retrieval (3 questions)
      const overdueSkillName = overdueSkills[0]?.skill_name || 'Present Perfect vs Past Simple';
      sections.push({
        section: 'grammar',
        title: isVi ? `Ôn tập nhắc lại ngắt quãng: ${overdueSkillName}` : `Spaced Retention Check: ${overdueSkillName}`,
        description: isVi ? 'Củng cố trí nhớ dài hạn.' : 'Long-term memory trace consolidation.',
        estimated_minutes: 6,
        target_questions_count: 3,
        skill_target: overdueSkillName,
        activity_type: 'warmup_review',
        pedagogical_focus: 'overdue_review',
        target_mastery_stage: 'retained_mastery'
      });

      // Section 3: Core Grammar Concept (4 questions)
      sections.push({
        section: selectedNewSkill.category === 'writing' ? 'writing' : 'grammar',
        title: isVi ? `Chuyên đề chính: ${selectedNewSkill.name}` : `Core Target: ${selectedNewSkill.name}`,
        description: selectedNewSkill.description,
        estimated_minutes: 8,
        target_questions_count: 4,
        skill_target: selectedNewSkill.name,
        activity_type: 'concept_practice',
        pedagogical_focus: blockedByPrerequisiteName ? 'prerequisite_reinforcement' : 'new_concept',
        target_mastery_stage: 'application'
      });

      // Section 4: Deep Vocabulary Acquisition (2 questions)
      const targetVocab = input.vocabulary && input.vocabulary.length > 0 ? input.vocabulary[0].word : 'streamline';
      sections.push({
        section: 'vocabulary',
        title: isVi ? `Phát triển vốn từ & Collocation: ${targetVocab}` : `Lexicon & Collocation Acquisition: ${targetVocab}`,
        description: isVi ? 'Nắm vững sắc thái và cách dùng tự nhiên.' : 'Master semantic nuances and natural collocations.',
        estimated_minutes: 5,
        target_questions_count: 2,
        skill_target: `Vocabulary: ${targetVocab}`,
        activity_type: 'vocab_acquisition',
        pedagogical_focus: 'production_application',
        target_mastery_stage: 'application'
      });

      // Section 5: Complex Writing Production or Progress Check (3 questions)
      sections.push({
        section: 'writing',
        title: isProgressCheckDue
          ? (isVi ? 'Đánh giá tiến bộ độc lập (Progress Check)' : 'Comprehensive Progress Check')
          : (isVi ? 'Thực hành viết báo cáo điều hành' : 'Executive Writing & Production'),
        description: isProgressCheckDue
          ? (isVi ? 'Kiểm tra độc lập độ bền vững qua bài tập mới.' : 'Independent verification using fresh calibrated items.')
          : (isVi ? 'Soạn thảo văn bản mạch lạc với cấu trúc mục tiêu.' : 'Synthesizing target grammar into coherent discourse.'),
        estimated_minutes: 6,
        target_questions_count: 3,
        skill_target: selectedNewSkill.name,
        activity_type: isProgressCheckDue ? 'exit_synthesis' : 'writing_production',
        pedagogical_focus: isProgressCheckDue ? 'progress_check' : 'production_application',
        is_progress_check: isProgressCheckDue
      });
    }

    // Pedagogical Reason Formulation
    let reason = '';
    if (blockedByPrerequisiteName) {
      reason = isVi
        ? `Tạm hoãn khái niệm nâng cao để củng cố kỹ năng nền tảng còn yếu: "${blockedByPrerequisiteName}". Học kỹ nền tảng giúp tránh tích tụ lỗ hổng ngữ pháp.`
        : `Pausing advance to reinforce prerequisite skill "${blockedByPrerequisiteName}". Mastering fundamentals ensures durable learning.`;
    } else if (overdueSkills.length > 0) {
      reason = isVi
        ? `Lên lịch ôn tập nhắc lại ngắt quãng cho "${overdueSkills[0].skill_name}" (đã đến hạn ôn) kết hợp mở rộng "${selectedNewSkill.name}".`
        : `Scheduled spaced review for "${overdueSkills[0].skill_name}" (overdue) paired with target progression in "${selectedNewSkill.name}".`;
    } else if (mistakeSkills.length > 0) {
      reason = isVi
        ? `Tập trung giải quyết các lỗi sai lặp lại ở "${mistakeSkills[0].skill_name}" trước khi phát triển chủ đề "${selectedNewSkill.name}".`
        : `Targeting recurring error patterns in "${mistakeSkills[0].skill_name}" before advancing into "${selectedNewSkill.name}".`;
    } else {
      reason = isVi
        ? `Tiến độ học tập vững chắc. Phát triển năng lực thực hành với "${selectedNewSkill.name}".`
        : `Solid mastery foundation. Progressing into contextual application of "${selectedNewSkill.name}".`;
    }

    const primaryObjective = isVi
      ? (overdueSkills.length > 0
          ? `Ôn tập nhắc lại "${overdueSkills[0].skill_name}" & Chinh phục "${selectedNewSkill.name}"`
          : `Thành thạo cấu trúc & ứng dụng "${selectedNewSkill.name}"`)
      : (overdueSkills.length > 0
          ? `Review "${overdueSkills[0].skill_name}" & Master "${selectedNewSkill.name}"`
          : `Master and apply "${selectedNewSkill.name}"`);

    return {
      primary_objective: primaryObjective,
      reason_for_selection: reason,
      estimated_duration_minutes: duration,
      session_pace_mode: paceMode,
      total_planned_questions: totalPlannedQuestions,
      sections,
      overdue_reviews_count: overdueSkills.length,
      recurring_mistakes_targeted: recurringMistakesTargeted,
      progress_check_active: isProgressCheckDue
    };
  }
}
