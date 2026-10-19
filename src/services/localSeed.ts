import {
  UserProfile,
  LearnerSkillState,
  VocabularyItem
} from '../types/learning.ts';

export const DEFAULT_PROFILE: UserProfile = {
  id: 'learner-local',
  name: 'Learner',
  current_level: 'A1',
  target_level: 'C1',
  primary_goal: 'balanced',
  goal_summary: '',
  explanation_language: 'vi',
  general_vs_work_ratio: 50,
  daily_minutes: 20,
  days_per_week: 5,
  feedback_style: 'encouraging',
  enable_audio_tips: true,
  onboarding_completed: false,
  struggles: [],
  timeline_target: '6 months',
  audio_importance: false,
  confidence_in_level: 'moderate',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const INITIAL_SKILLS: LearnerSkillState[] = [
  {
    skill_id: 'present_simple_vs_continuous',
    skill_name: 'Present Simple vs. Continuous',
    category: 'grammar',
    status: 'learning',
    accuracy_rate: 0.7,
    total_attempts: 3,
    last_practiced_at: new Date().toISOString(),
    next_review_at: new Date(Date.now() + 86400000).toISOString(),
    recurring_errors: []
  },
  {
    skill_id: 'past_simple_regular_irregular',
    skill_name: 'Past Simple Regular & Irregular',
    category: 'grammar',
    status: 'learning',
    accuracy_rate: 0.75,
    total_attempts: 4,
    last_practiced_at: new Date().toISOString(),
    next_review_at: new Date(Date.now() + 86400000).toISOString(),
    recurring_errors: []
  },
  {
    skill_id: 'collocation_mitigate',
    skill_name: 'Collocations with Mitigate',
    category: 'vocabulary',
    status: 'mostly_mastered',
    accuracy_rate: 0.9,
    total_attempts: 3,
    last_practiced_at: new Date().toISOString(),
    next_review_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    recurring_errors: []
  },
  {
    skill_id: 'workplace_slack_update',
    skill_name: 'Clear Workplace Status Updates',
    category: 'writing',
    status: 'learning',
    accuracy_rate: 0.8,
    total_attempts: 2,
    last_practiced_at: new Date().toISOString(),
    next_review_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    recurring_errors: []
  }
];

export const INITIAL_VOCABULARY: VocabularyItem[] = [
  {
    id: 'vocab-1',
    word: 'mitigate',
    part_of_speech: 'verb',
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pronunciation_tip: 'Nhấn trọng âm vào âm đầu: MIT-i-gate; âm cuối bật /t/ rõ ràng.',
    meaning: 'làm giảm bớt mức độ nghiêm trọng, đau đớn hoặc rủi ro của một vấn đề',
    collocation_pattern: 'mitigate + risk / impact / circumstances / damage',
    example_general: 'Soil conservation practices help mitigate the severity of flooding.',
    example_workplace: 'We added fallback servers to mitigate the risk of downtime during database migration.',
    similar_word_comparison: {
      word: 'alleviate',
      difference: 'alleviate thường dùng cho nỗi đau, triệu chứng bệnh; mitigate thường dùng cho rủi ro, tổn thất hoặc thiệt hại.'
    },
    review_stage: 3,
    mastery_stage: 'practicing',
    mastery_score: 55,
    contexts_encountered: [
      'We added fallback servers to mitigate the risk of downtime during database migration.'
    ],
    exercise_types_passed: ['meaning_from_context'],
    next_review_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    first_seen_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    last_reviewed_at: new Date().toISOString(),
    times_correct: 3,
    times_incorrect: 0
  },
  {
    id: 'vocab-2',
    word: 'streamline',
    part_of_speech: 'verb',
    ipa: '/ˈstriːmlaɪn/',
    pronunciation_tip: 'Âm /iː/ kéo dài trong stream; trọng âm vào âm đầu: STREAM-line.',
    meaning: 'tinh gọn hoá quy trình để loại bỏ khâu thừa và tiết kiệm thời gian',
    collocation_pattern: 'streamline + process / workflow / operations',
    example_general: 'The clinic introduced an online booking form to streamline admissions.',
    example_workplace: 'We automated the release cycle to streamline our deployment pipeline.',
    similar_word_comparison: {
      word: 'simplify',
      difference: 'simplify là làm cho dễ hiểu hơn; streamline là cắt bớt các bước rườm rà để vận hành hiệu quả hơn.'
    },
    review_stage: 1,
    mastery_stage: 'encountered',
    mastery_score: 25,
    contexts_encountered: [
      'We automated the release cycle to streamline our deployment pipeline.'
    ],
    exercise_types_passed: ['contextual_cloze'],
    next_review_at: new Date(Date.now() + 86400000).toISOString(),
    first_seen_at: new Date().toISOString(),
    last_reviewed_at: new Date().toISOString(),
    times_correct: 1,
    times_incorrect: 0
  }
];
