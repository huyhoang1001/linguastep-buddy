import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Sparkles,
  Bookmark,
  Footprints,
  Compass,
  Target,
  BookOpen,
  CheckCircle2,
  Lock,
  X,
  Flame,
  ChevronRight
} from 'lucide-react';
import { MilestoneBadge, MilestoneStats } from '../types/milestone.ts';

interface MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBadges: MilestoneBadge[];
  unlockedBadges: MilestoneBadge[];
  stats: MilestoneStats;
  onJumpToPractice?: () => void;
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  isOpen,
  onClose,
  allBadges,
  unlockedBadges,
  stats,
  onJumpToPractice
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lessons' | 'vocabulary' | 'grammar'>('all');

  if (!isOpen) return null;

  const filteredBadges = allBadges.filter(b => {
    if (selectedFilter === 'all') return true;
    return b.category === selectedFilter;
  });

  const getBadgeIcon = (iconName: string, isUnlocked: boolean, tier: string) => {
    const iconClass = `w-5 h-5 ${isUnlocked ? 'text-white' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Trophy': return <Trophy className={iconClass} />;
      case 'Medal': return <Medal className={iconClass} />;
      case 'Crown': return <Crown className={iconClass} />;
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'Bookmark': return <Bookmark className={iconClass} />;
      case 'Footprints': return <Footprints className={iconClass} />;
      case 'Compass': return <Compass className={iconClass} />;
      case 'Target': return <Target className={iconClass} />;
      case 'BookOpen': return <BookOpen className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  const getTierStyles = (tier: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        bg: 'bg-slate-900/60 border-slate-800',
        badgeChip: 'bg-slate-800 text-slate-500 border-slate-700',
        iconBg: 'bg-slate-800/80 border-slate-700/60'
      };
    }
    switch (tier) {
      case 'platinum':
        return {
          bg: 'bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border-purple-500/50 shadow-lg shadow-purple-900/20',
          badgeChip: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          iconBg: 'bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-md shadow-purple-500/30'
        };
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-amber-950/50 via-yellow-950/30 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-900/20',
          badgeChip: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-md shadow-amber-500/30'
        };
      case 'silver':
        return {
          bg: 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-600/60 shadow-md',
          badgeChip: 'bg-slate-700 text-slate-200 border-slate-600',
          iconBg: 'bg-gradient-to-tr from-slate-600 to-slate-400'
        };
      default: // bronze
        return {
          bg: 'bg-gradient-to-br from-orange-950/40 to-slate-900 border-orange-700/40',
          badgeChip: 'bg-orange-500/20 text-orange-300 border-orange-600/30',
          iconBg: 'bg-gradient-to-tr from-orange-600 to-amber-700'
        };
    }
  };

  const completionPercentage = Math.round((unlockedBadges.length / allBadges.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Milestones & Progress Badges</h2>
              <p className="text-xs text-slate-400">
                Track your personal achievements and mastery milestones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Banner */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                Milestone Progress
              </span>
              <h3 className="text-base font-bold text-white">
                {unlockedBadges.length} of {allBadges.length} Milestones Unlocked
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black bg-gradient-to-r from-amber-300 to-indigo-300 bg-clip-text text-transparent">
                {completionPercentage}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-700/70 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-indigo-500 to-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Micro stats counter */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-slate-300">
            <div className="bg-slate-900/60 p-2 rounded-xl text-center border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Lessons Completed</span>
              <strong className="text-white font-bold">{stats.completedLessonsCount}</strong>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl text-center border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Vocabulary Saved</span>
              <strong className="text-white font-bold">{stats.vocabularyCount} words</strong>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl text-center border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Accuracy Rate</span>
              <strong className="text-white font-bold">{Math.round(stats.accuracyRate * 100)}%</strong>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {[
            { id: 'all', label: `All Badges (${allBadges.length})` },
            { id: 'lessons', label: 'Lessons' },
            { id: 'vocabulary', label: 'Vocabulary' },
            { id: 'grammar', label: 'Grammar' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl border transition ${
                selectedFilter === tab.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredBadges.map(badge => {
            const styles = getTierStyles(badge.tier, badge.isUnlocked);
            const progressPct = Math.round((badge.currentValue / badge.targetValue) * 100);

            return (
              <div
                key={badge.id}
                className={`border rounded-2xl p-4 transition-all flex flex-col justify-between ${styles.bg}`}
              >
                <div>
                  {/* Top line: icon, title, tier */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${styles.iconBg}`}>
                        {getBadgeIcon(badge.icon, badge.isUnlocked, badge.tier)}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${badge.isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                          {badge.title}
                        </h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-block mt-0.5 ${styles.badgeChip}`}>
                          {badge.tier}
                        </span>
                      </div>
                    </div>

                    {badge.isUnlocked ? (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Unlocked">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700" title="Locked">
                        <Lock className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Bottom progress or status */}
                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  {badge.isUnlocked ? (
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                      <span>✓ Milestone Achieved</span>
                      <span className="text-[11px] text-slate-400">Target: {badge.targetValue}</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Progress: {badge.currentValue} / {badge.targetValue}</span>
                        <span className="font-semibold text-indigo-300">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Keep practicing daily to unlock higher milestone tiers!
          </p>

          <button
            onClick={() => {
              onClose();
              if (onJumpToPractice) onJumpToPractice();
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center space-x-1.5"
          >
            <span>Continue Lesson</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
