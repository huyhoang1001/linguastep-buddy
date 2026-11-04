import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  X,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { MilestoneBadge, MilestoneStats } from '../types/milestone.ts';
import { DailySummary, Attempt } from '../types/learning.ts';
import { WeeklyProgressChart } from './WeeklyProgressChart.tsx';
import { localStore } from '../services/localStore.ts';
import { AppButton } from './ui/AppButton.tsx';
import { BadgeIcon } from './BadgeIcon.tsx';
import { StatusBadge } from './ui/StatusBadge.tsx';
import { InteractiveCard } from './ui/InteractiveCard.tsx';

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

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBadges = allBadges.filter(b => {
    if (selectedFilter === 'all') return true;
    return b.category === selectedFilter;
  });

  const completionPercentage = Math.round((unlockedBadges.length / allBadges.length) * 100);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 "
    >
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-3xl w-full p-5 sm:p-7 md:p-8 shadow-2xl text-[#2D312E] dark:text-[#F4F2EC] max-h-[92vh] overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">Milestones & Progress Center</h2>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                Track your weekly learning trajectory and unlocked achievement badges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-white dark:hover:bg-[#262F28] transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary View Switcher: Weekly Progress vs Badges */}
        <div className="flex items-center p-1 bg-white dark:bg-[#262F28] rounded-2xl border border-[#EBE4D7] dark:border-[#3C443E] max-w-md shadow-2xs">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Progress</span>
            <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-mono">
              Chart
            </span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Milestone Badges</span>
            <span className="px-1.5 py-0.2 bg-[#FAF7F2] dark:bg-[#1E231F] text-[#2D6A4F] dark:text-[#74A892] rounded-full text-[10px] font-mono font-bold">
              {unlockedBadges.length}/{allBadges.length}
            </span>
          </button>
        </div>

        {/* Global Progress Summary Strip (Always Visible) */}
        <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#52796F] dark:text-[#74A892] block mb-0.5">
                Overall Mastery Overview
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                {unlockedBadges.length} of {allBadges.length} Milestones Achieved • {stats.completedLessonsCount} Lessons Completed
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-serif font-black text-[#2D6A4F] dark:text-[#74A892]">
                {completionPercentage}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#FAF7F2] dark:bg-[#1E231F] h-2.5 rounded-full overflow-hidden border border-[#EBE4D7] dark:border-[#2C332E]">
            <div
              className="bg-[#2D6A4F] h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Micro stats counter */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
            <div className="bg-[#FAF7F2] dark:bg-[#1E231F] p-2.5 rounded-xl text-center border border-[#EBE4D7] dark:border-[#2C332E]">
              <span className="text-[10px] text-[#8C938D] block">Lessons Completed</span>
              <strong className="text-[#1B4332] dark:text-[#F4F2EC] font-serif font-bold text-sm">{stats.completedLessonsCount}</strong>
            </div>
            <div className="bg-[#FAF7F2] dark:bg-[#1E231F] p-2.5 rounded-xl text-center border border-[#EBE4D7] dark:border-[#2C332E]">
              <span className="text-[10px] text-[#8C938D] block">Vocabulary Saved</span>
              <strong className="text-[#1B4332] dark:text-[#F4F2EC] font-serif font-bold text-sm">{stats.vocabularyCount} words</strong>
            </div>
            <div className="bg-[#FAF7F2] dark:bg-[#1E231F] p-2.5 rounded-xl text-center border border-[#EBE4D7] dark:border-[#2C332E]">
              <span className="text-[10px] text-[#8C938D] block">Accuracy Rate</span>
              <strong className="text-[#1B4332] dark:text-[#F4F2EC] font-serif font-bold text-sm">{Math.round(stats.accuracyRate * 100)}%</strong>
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
                      ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white shadow-2xs'
                      : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredBadges.map(badge => {
                const progressPct = Math.round((badge.currentValue / badge.targetValue) * 100);

                return (
                  <InteractiveCard
                    key={badge.id}
                    className={`flex flex-col h-full transition-all duration-300 ${
                      !badge.isUnlocked ? 'bg-[var(--bg-surface-subdued)]/60 opacity-80 grayscale-[0.5]' : 'shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Icon Container */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                        badge.isUnlocked
                          ? 'bg-[var(--bg-concept)] border-[var(--border-concept)] text-[var(--brand-primary)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-muted)]'
                      }`}>
                        <BadgeIcon iconName={badge.icon} className="w-5 h-5" />
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-bold tracking-tight leading-tight truncate ${
                            badge.isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                          }`} title={badge.title}>
                            {badge.title}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={badge.isUnlocked ? 'success' : 'neutral'} className="scale-90 origin-left">
                            {badge.isUnlocked ? 'Unlocked' : 'Locked'}
                          </StatusBadge>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                            {badge.tier}
                          </span>
                        </div>

                        <p className={`text-[11px] leading-relaxed mt-2 ${
                          badge.isUnlocked ? 'text-[var(--text-secondary)] font-medium' : 'text-[var(--text-muted)] italic'
                        }`}>
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress / Footer */}
                    {!badge.isUnlocked && (
                      <div className="mt-4 pt-3 border-t border-[var(--border-default)]">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] mb-1.5 px-0.5">
                          <span className="uppercase tracking-widest text-[9px]">Progress</span>
                          <span className="font-mono">{badge.currentValue} / {badge.targetValue}</span>
                        </div>
                        <div className="w-full bg-[var(--bg-app)] h-1.5 rounded-full overflow-hidden border border-[var(--border-default)]">
                          <div
                            className="bg-[var(--brand-primary)] h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {badge.isUnlocked && badge.unlockedAt && (
                      <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest">Mastered</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(badge.unlockedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </InteractiveCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EBE4D7] dark:border-[#2C332E]">
          <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] text-center sm:text-left">
            Consistent 10-20 minute daily study sessions build lasting fluency and unlock badges! 🐾
          </p>

          <AppButton
            onClick={() => {
              onClose();
              if (onJumpToPractice) onJumpToPractice();
            }}
            variant="primary"
            size="md"
            rightIcon={<ChevronRight />}
          >
            Back to Study Desk
          </AppButton>
        </div>
      </div>
    </div>
  );
};
