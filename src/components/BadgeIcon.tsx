import React from 'react';
import {
  Footprints,
  Medal,
  Trophy,
  Crown,
  Bookmark,
  Sparkles,
  BookOpen,
  Compass,
  Award,
  Target,
  type LucideIcon
} from 'lucide-react';

const badgeIcons: Record<string, LucideIcon> = {
  Footprints: Footprints,
  Footprint: Footprints, // Support both singular and plural
  Medal: Medal,
  Trophy: Trophy,
  Crown: Crown,
  Bookmark: Bookmark,
  Sparkles: Sparkles,
  BookOpen: BookOpen,
  Compass: Compass,
  Award: Award,
  Target: Target,
};

interface BadgeIconProps {
  iconName: string;
  className?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({ iconName, className }) => {
  const IconComponent = badgeIcons[iconName] || Award;
  return <IconComponent className={className} />;
};
