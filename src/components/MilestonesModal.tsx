import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { MilestoneBadge, MilestoneStats } from '../types/milestone.ts';
import { DailySummary, Attempt } from '../types/learning.ts';
import { WeeklyProgressChart } from './WeeklyProgressChart.tsx';
import { localStore } from '../services/localStore.ts';

interface MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBadges: MilestoneBadge[];
  unlockedBadges: MilestoneBadge[];
  stats: MilestoneStats;
  summaries?: DailySummary[];
  attempts?: Attempt[];
  onJumpToPractice?: () => void;
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  isOpen,
  onClose,
  allBadges,
  unlockedBadges,
  stats,
  summaries: propsSummaries,
  attempts: propsAttempts,
  onJumpToPractice
}) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'badges'>('weekly');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lessons' | 'vocabulary' | 'grammar'>('all');
  const [loadedSummaries, setLoadedSummaries] = useState<DailySummary[]>(propsSummaries || []);
  const [loadedAttempts, setLoadedAttempts] = useState<Attempt[]>(propsAttempts || []);

  useEffect(() => {
    if (propsSummaries && propsSummaries.length > 0) {
      setLoadedSummaries(propsSummaries);
    } else if (isOpen) {
      localStore.getSummaries().then(s => {
        if (s && s.length > 0) setLoadedSummaries(s);
      }).catch(err => console.warn('Could not load summaries for milestones:', err));
    }
  }, [isOpen, propsSummaries]);

  useEffect(() => {
    if (propsAttempts && propsAttempts.length > 0) {
      setLoadedAttempts(propsAttempts);
    } else if (isOpen) {
      localStore.getAttempts().then(a => {
        if (a && a.length > 0) setLoadedAttempts(a);
      }).catch(err => console.warn('Could not load attempts for milestones:', err));
    }
  }, [isOpen, propsAttempts]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 md:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Milestones & Progress Center</h2>
              <p className="text-xs text-slate-400">
                Track your weekly learning trajectory and unlocked achievement badges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary View Switcher: Weekly Progress vs Badges */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 max-w-md">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Progress</span>
            <span className="px-1.5 py-0.2 bg-emerald-400/20 text-emerald-300 rounded-full text-[10px] border border-emerald-400/30">
              New
            </span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Milestone Badges</span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-amber-300 rounded-full text-[10px]">
              {unlockedBadges.length}/{allBadges.length}
            </span>
          </button>
        </div>

        {/* Global Progress Summary Strip (Always Visible) */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                Overall Mastery Overview
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {unlockedBadges.length} of {allBadges.length} Milestones Achieved • {stats.completedLessonsCount} Lessons Completed
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black bg-gradient-to-r from-amber-300 via-orange-300 to-indigo-300 bg-clip-text text-transparent">
                {completionPercentage}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-700/70 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
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

        {/* Tab 1: Weekly Progress Visualization (Recharts) */}
        {activeTab === 'weekly' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <WeeklyProgressChart
              summaries={loadedSummaries}
              attempts={loadedAttempts}
              targetAccuracy={80}
            />
          </div>
        )}

        {/* Tab 2: Milestone Badges Showcase */}
        {activeTab === 'badges' && (
          <div className="space-y-4 animate-in fade-in duration-300">
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
                  className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
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
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Consistent 10-20 minute daily study sessions build lasting fluency and unlock elite badges! 🐾
          </p>

          <button
            onClick={() => {
              onClose();
              if (onJumpToPractice) onJumpToPractice();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Continue Lesson</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
