import React from 'react';
import {
  BookOpen,
  Brain,
  Sparkles,
  Sliders,
  AlertCircle,
  FileText,
  Trophy,
  Award,
  Medal,
  Crown,
  ChevronRight,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon,
  Compass,
  Calendar
} from 'lucide-react';
import { UserProfile } from '../types/learning.ts';
import { MilestoneBadge } from '../types/milestone.ts';
import { UserAccount, BudgetLimits } from '../types/auth.ts';

interface HeaderProps {
  profile: UserProfile;
  mistakesCount: number;
  featuredBadge: MilestoneBadge | null;
  nextBadge: MilestoneBadge | null;
  unlockedCount: number;
  totalBadgesCount: number;
  currentUser?: UserAccount | null;
  budgetLimits?: BudgetLimits | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenMilestones: () => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
  onOpenSummary?: () => void;
  hasActiveSummary?: boolean;
  onOpenRoadmap?: () => void;
  onRestartOnboarding?: () => void;
  onBuildNextSession?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  mistakesCount,
  featuredBadge,
  nextBadge,
  unlockedCount,
  totalBadgesCount,
  currentUser,
  budgetLimits,
  onOpenAuth,
  onLogout,
  onOpenMilestones,
  onOpenMemory,
  onOpenSettings,
  onOpenSummary,
  hasActiveSummary,
  onOpenRoadmap,
  onRestartOnboarding,
  onBuildNextSession
}) => {
  const getBadgeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
      case 'Medal': return <Medal className="w-3.5 h-3.5 text-slate-300" />;
      case 'Crown': return <Crown className="w-3.5 h-3.5 text-purple-400" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5 text-amber-300" />;
      default: return <Award className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                LinguaStep
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {profile.current_level}
              </span>
              <button
                onClick={onOpenSettings}
                title="Click to adjust your daily study duration"
                className="cursor-pointer text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-indigo-500/60 hover:text-white transition flex items-center space-x-1"
              >
                <span>⏱️ {profile.daily_minutes || 20}m/day</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              Adaptive English Tutor • 1 Question at a Time
            </p>
          </div>
        </div>

        {/* VISUAL PROGRESS BADGE SYSTEM (IN HEADER) */}
        <div className="flex items-center">
          <button
            onClick={onOpenMilestones}
            title="Click to view all milestone achievements"
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-800/90 via-slate-800 to-slate-800/90 hover:from-slate-700/90 hover:to-slate-700 border border-amber-500/30 hover:border-amber-400/60 shadow-sm transition group"
          >
            {/* Visual Icon with Glowing Ring */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {featuredBadge ? getBadgeIcon(featuredBadge.icon) : <Trophy className="w-3.5 h-3.5 text-amber-400" />}
            </div>

            {/* Badge Title & Progress Label */}
            <div className="text-left hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white group-hover:text-amber-200 transition">
                  {featuredBadge ? featuredBadge.title : (nextBadge ? nextBadge.title : 'Milestone Journey')}
                </span>
                {featuredBadge && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {featuredBadge.tier}
                  </span>
                )}
              </div>

              {/* Progress track or unlocked counter */}
              <div className="flex items-center space-x-2 mt-0.5">
                {nextBadge && !featuredBadge ? (
                  <span className="text-[10px] text-slate-400">
                    Progress: {nextBadge.currentValue}/{nextBadge.targetValue}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400/90 font-medium">
                    {unlockedCount} of {totalBadgesCount} Milestones Reached
                  </span>
                )}
              </div>
            </div>

            {/* Mobile-only badge pill */}
            <div className="sm:hidden flex items-center space-x-1">
              <span className="text-xs font-bold text-amber-300">
                {featuredBadge ? featuredBadge.title.split(' ')[0] : `${unlockedCount}/${totalBadgesCount}`}
              </span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Recurring mistakes alert */}
          <button
            onClick={onOpenMemory}
            title="Inspect recurring errors and review"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Mistakes</span>
            {mistakesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {mistakesCount}
              </span>
            )}
          </button>

          {/* Learning Memory button */}
          <button
            onClick={onOpenMemory}
            title="Open Learning Memory & Spaced Repetition"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Brain className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Memory</span>
          </button>

          {/* Build Next AI Session button */}
          {onBuildNextSession && (
            <button
              onClick={onBuildNextSession}
              title="Ask AI to build the next session with fresh questions"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-500/40 shadow-md transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Build Next Session</span>
            </button>
          )}

          {/* Roadmap & Tomorrow's Plan button */}
          {onOpenRoadmap && (
            <button
              onClick={onOpenRoadmap}
              title="View Learning Roadmap & Tomorrow's Plan"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-200 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition shadow-sm"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Roadmap</span>
            </button>
          )}

          {/* Summary button */}
          {hasActiveSummary && onOpenSummary && (
            <button
              onClick={onOpenSummary}
              title="View today's summary"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Summary</span>
            </button>
          )}

          {/* AI Usage Budget pill */}
          {budgetLimits && (
            <div
              title={`Daily server-side AI budget: ${budgetLimits.userRemaining} of ${budgetLimits.userDailyLimit} requests remaining today`}
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-300"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono">
                {budgetLimits.userRemaining}/{budgetLimits.userDailyLimit} AI
              </span>
            </div>
          )}

          {/* Settings & Profile */}
          <button
            onClick={onOpenSettings}
            title="Learner Profile & Preferences"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* User Account / Sign In */}
          {currentUser ? (
            <div className="flex items-center space-x-1.5 pl-1 border-l border-slate-800">
              <button
                onClick={onOpenAuth}
                title={`Signed in as ${currentUser.name} (${currentUser.authProvider})`}
                className="flex items-center space-x-1.5 p-1 rounded-lg hover:bg-slate-800 transition group"
              >
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full border border-indigo-400/60"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200 hidden md:inline max-w-[90px] truncate group-hover:text-white">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Sign in with Google or continue as guest"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
