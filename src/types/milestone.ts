export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type BadgeCategory = 'lessons' | 'vocabulary' | 'grammar' | 'accuracy' | 'streak';

export interface MilestoneBadge {
  id: string;
  title: string;
  category: BadgeCategory;
  description: string;
  tier: BadgeTier;
  icon: string; // Identifier for icon rendering
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  nextMilestoneTitle?: string;
}

export interface MilestoneStats {
  completedLessonsCount: number;
  vocabularyCount: number;
  masteredSkillsCount: number;
  totalAttemptsCount: number;
  accuracyRate: number;
}
