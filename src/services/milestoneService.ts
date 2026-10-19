import { MilestoneBadge, MilestoneStats } from '../types/milestone.ts';
import {
  LearnerSkillState,
  VocabularyItem,
  Attempt,
  LessonPlan,
  DailySummary
} from '../types/learning.ts';

export function calculateMilestones(data: {
  skills: LearnerSkillState[];
  vocabulary: VocabularyItem[];
  attempts: Attempt[];
  lessons: LessonPlan[];
  summaries: DailySummary[];
}): {
  allBadges: MilestoneBadge[];
  unlockedBadges: MilestoneBadge[];
  featuredBadge: MilestoneBadge | null;
  nextBadge: MilestoneBadge | null;
  stats: MilestoneStats;
} {
  const completedLessons = Math.max(
    data.summaries?.length || 0,
    data.lessons?.filter(l => l.status === 'completed')?.length || 0
  );
  const vocabCount = data.vocabulary?.length || 0;
  const masteredSkills = data.skills?.filter(s => s.status === 'mastered' || s.status === 'mostly_mastered')?.length || 0;
  const attemptsCount = data.attempts?.length || 0;
  const correctCount = data.attempts?.filter(a => a.verdict === 'correct')?.length || 0;
  const accuracy = attemptsCount > 0 ? correctCount / attemptsCount : 0;

  const stats: MilestoneStats = {
    completedLessonsCount: completedLessons,
    vocabularyCount: vocabCount,
    masteredSkillsCount: masteredSkills,
    totalAttemptsCount: attemptsCount,
    accuracyRate: accuracy
  };

  const badgesDef: Array<Omit<MilestoneBadge, 'isUnlocked' | 'currentValue'>> = [
    {
      id: 'first-step',
      title: 'First Step',
      category: 'lessons',
      description: 'Completed your very first personalized English lesson.',
      tier: 'bronze',
      icon: 'Footprints',
      targetValue: 1
    },
    {
      id: '5-lessons',
      title: '5 Lessons Completed',
      category: 'lessons',
      description: 'Completed 5 full adaptive English lessons.',
      tier: 'silver',
      icon: 'Medal',
      targetValue: 5
    },
    {
      id: '10-lessons',
      title: '10 Lessons Completed',
      category: 'lessons',
      description: 'Reached a major milestone of 10 completed adaptive lessons!',
      tier: 'gold',
      icon: 'Trophy',
      targetValue: 10
    },
    {
      id: '25-lessons',
      title: '25 Lessons Milestone',
      category: 'lessons',
      description: 'Completed 25 comprehensive English study sessions.',
      tier: 'platinum',
      icon: 'Crown',
      targetValue: 25
    },
    {
      id: 'vocab-explorer',
      title: 'Word Explorer',
      category: 'vocabulary',
      description: 'Saved 3 high-impact words with IPA and collocations.',
      tier: 'bronze',
      icon: 'Bookmark',
      targetValue: 3
    },
    {
      id: 'vocab-master',
      title: 'Vocabulary Master',
      category: 'vocabulary',
      description: 'Mastered 10 practical workplace & everyday vocabulary words.',
      tier: 'gold',
      icon: 'Sparkles',
      targetValue: 10
    },
    {
      id: 'vocab-scholar',
      title: 'Lexicon Scholar',
      category: 'vocabulary',
      description: 'Expanded your personal vocabulary notebook to 20+ words.',
      tier: 'platinum',
      icon: 'BookOpen',
      targetValue: 20
    },
    {
      id: 'grammar-scout',
      title: 'Grammar Scout',
      category: 'grammar',
      description: 'Practiced 3 different contextual grammar structures.',
      tier: 'bronze',
      icon: 'Compass',
      targetValue: 3
    },
    {
      id: 'grammar-virtuoso',
      title: 'Grammar Virtuoso',
      category: 'grammar',
      description: 'Achieved mastery across 5 distinct grammar skills.',
      tier: 'gold',
      icon: 'Award',
      targetValue: 5
    },
    {
      id: 'sharp-shooter',
      title: 'Sharp Shooter',
      category: 'accuracy',
      description: 'Maintained 80%+ accuracy across at least 8 answered questions.',
      tier: 'silver',
      icon: 'Target',
      targetValue: 8
    }
  ];

  const allBadges: MilestoneBadge[] = badgesDef.map(b => {
    let currentValue = 0;
    if (b.category === 'lessons') {
      currentValue = completedLessons;
    } else if (b.category === 'vocabulary') {
      currentValue = vocabCount;
    } else if (b.category === 'grammar') {
      currentValue = masteredSkills;
    } else if (b.category === 'accuracy') {
      currentValue = accuracy >= 0.8 ? attemptsCount : Math.round(attemptsCount * accuracy);
    }

    const isUnlocked = currentValue >= b.targetValue;
    return {
      ...b,
      currentValue: Math.min(currentValue, b.targetValue),
      isUnlocked
    };
  });

  const unlockedBadges = allBadges.filter(b => b.isUnlocked);
  
  // Featured badge: latest unlocked badge with priority on Gold/Silver (e.g. 10 Lessons, Vocab Master)
  // or the highest tier unlocked badge
  let featuredBadge: MilestoneBadge | null = null;
  if (unlockedBadges.length > 0) {
    const tierPriority = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
    featuredBadge = [...unlockedBadges].sort((a, b) => {
      const pDiff = tierPriority[b.tier] - tierPriority[a.tier];
      if (pDiff !== 0) return pDiff;
      return b.targetValue - a.targetValue;
    })[0];
  }

  // Next badge in progress: locked badge with closest % completion
  const lockedBadges = allBadges.filter(b => !b.isUnlocked);
  let nextBadge: MilestoneBadge | null = null;
  if (lockedBadges.length > 0) {
    nextBadge = [...lockedBadges].sort((a, b) => {
      const aPct = a.currentValue / a.targetValue;
      const bPct = b.currentValue / b.targetValue;
      return bPct - aPct;
    })[0];
  }

  return {
    allBadges,
    unlockedBadges,
    featuredBadge,
    nextBadge,
    stats
  };
}
