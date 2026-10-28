import React, { useState } from 'react';
import {
  BookOpen,
  Brain,
  Sparkles,
  Sliders,
  FileText,
  Trophy,
  Award,
  Medal,
  Crown,
  ChevronRight,
  Zap,
  LogIn,
  LogOut,
  Compass,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types/learning.ts';
import { MilestoneBadge } from '../types/milestone.ts';
import { UserAccount, BudgetLimits } from '../types/auth.ts';
import { CambridgeDictionarySearch } from './CambridgeDictionarySearch.tsx';

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
  isBuildingSession?: boolean;
  onSearchVocabulary?: (word: string) => void;
  onOpenCatStudio?: () => void;
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
  onBuildNextSession,
  isBuildingSession,
  onSearchVocabulary,
  onOpenCatStudio
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState<boolean>(false);

  // 80% AI Quota Warning Threshold Calculations
  const userDailyLimit = budgetLimits?.userDailyLimit || 30;
  const userRemaining = budgetLimits?.userRemaining !== undefined ? budgetLimits.userRemaining : userDailyLimit;
  const userCountToday = budgetLimits?.userCountToday ?? Math.max(0, userDailyLimit - userRemaining);
  const usagePercent = userDailyLimit > 0 ? Math.min(100, Math.round(((userDailyLimit - userRemaining) / userDailyLimit) * 100)) : 0;
  // Trigger warning notification when user reaches >= 80% of daily AI quota
  const isQuotaWarning = userDailyLimit > 0 && (usagePercent >= 80 || userRemaining <= Math.ceil(userDailyLimit * 0.2));
  const isQuotaExhausted = userRemaining === 0;

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
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-30 shadow-md select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand & Profile Pills */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 shrink-0 text-base sm:text-lg">
            🐱
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-amber-300 via-orange-200 to-amber-100 bg-clip-text text-transparent flex items-center space-x-1">
              <span>MeoMeo</span>
              <span className="text-[11px] text-amber-400 font-normal">🐾</span>
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {profile.current_level}
            </span>
            <button
              onClick={onOpenSettings}
              title="Adjust your daily study duration"
              className="cursor-pointer text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-amber-400/60 hover:text-white transition hidden md:flex items-center space-x-1"
            >
              <span>⏱️ {profile.daily_minutes || 20}m</span>
            </button>
          </div>
        </div>

        {/* Center/Right Desktop Controls (Hidden on small screens to prevent overflow) */}
        <div className="hidden lg:flex items-center space-x-2 shrink-0">
          {/* Milestone Widget */}
          <button
            onClick={onOpenMilestones}
            title="View all milestone achievements"
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400/60 shadow-sm transition group"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center shrink-0">
              {featuredBadge ? getBadgeIcon(featuredBadge.icon) : <Trophy className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white max-w-[110px] truncate block group-hover:text-amber-200 transition">
                {featuredBadge ? featuredBadge.title : (nextBadge ? nextBadge.title : 'Milestones')}
              </span>
              <span className="text-[10px] text-amber-400/90 font-medium block">
                {unlockedCount}/{totalBadgesCount} Badges
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
          </button>

          {/* Memory & Mistakes */}
          <button
            onClick={onOpenMemory}
            title="Learning Memory & Mistakes"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Brain className="w-4 h-4 text-sky-400" />
            <span>Memory</span>
            {mistakesCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-rose-500/20 text-rose-300 font-bold rounded-full border border-rose-500/30">
                {mistakesCount}
              </span>
            )}
          </button>

          {/* Roadmap */}
          {onOpenRoadmap && (
            <button
              onClick={onOpenRoadmap}
              title="View Learning Roadmap"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-200 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition flex items-center space-x-1.5"
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Roadmap</span>
            </button>
          )}

          {/* Summary */}
          {hasActiveSummary && onOpenSummary && (
            <button
              onClick={onOpenSummary}
              title="View session summary"
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center space-x-1.5"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Summary</span>
            </button>
          )}

          {/* Cat Studio Customizer */}
          {onOpenCatStudio && (
            <button
              onClick={onOpenCatStudio}
              title="MeoMeo Cat Studio: Tùy chỉnh màu sắc & bạn mèo"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition flex items-center space-x-1.5 shadow-sm"
            >
              <span>🐾</span>
              <span className="hidden xl:inline">Cat Studio</span>
            </button>
          )}
        </div>

        {/* Far Right Action Buttons (Always visible: Build Session, Settings, Auth / Mobile Menu) */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Primary Action: Build Next AI Session */}
          {onBuildNextSession && (
            <button
              disabled={isBuildingSession}
              onClick={onBuildNextSession}
              title="Build the next session with fresh progressive questions"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 border border-indigo-500/40 shadow-md shadow-indigo-600/20 transition"
            >
              {isBuildingSession ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Building...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Build Next Session</span>
                </>
              )}
            </button>
          )}

          {/* 80% AI Quota Warning Pill */}
          {isQuotaWarning && (
            <button
              onClick={onOpenAuth}
              title={`Warning: You have reached ${usagePercent}% of your daily AI limit (${userRemaining} of ${userDailyLimit} requests remaining). Click to monitor remaining tokens.`}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:text-amber-100 text-xs font-bold transition shadow-sm animate-pulse shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{userRemaining}/{userDailyLimit} left</span>
            </button>
          )}

          {/* Settings Icon */}
          <button
            onClick={onOpenSettings}
            title="Learner Profile & Settings"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition hidden sm:block"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Account / User Avatar */}
          {currentUser ? (
            <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-slate-800">
              <button
                onClick={onOpenAuth}
                title={`Signed in as ${currentUser.name}`}
                className="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-slate-800 transition group"
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
                <span className="text-xs font-medium text-slate-200 hidden xl:inline max-w-[80px] truncate group-hover:text-white">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Sign in with Google or guest"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </button>
          )}

          {/* Mobile Dropdown Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Toggle Menu"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 lg:hidden transition"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Warning Notification: Triggers when user reaches >=80% of daily AI quota */}
      {isQuotaWarning && !warningDismissed && (
        <div className="bg-gradient-to-r from-amber-950/95 via-amber-900/90 to-orange-950/95 border-t border-b border-amber-500/40 px-3 sm:px-6 py-2.5 text-xs text-amber-200 shadow-lg backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center space-x-2.5 text-left min-w-0">
              <div className="w-7 h-7 rounded-xl bg-amber-500/25 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0 shadow-inner">
                <AlertTriangle className="w-4 h-4 animate-pulse text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-bold text-white text-xs">
                  <span className="text-amber-300 flex items-center gap-1">
                    <span>⚡</span>
                    <span>{isQuotaExhausted ? 'Daily AI Quota Depleted' : `80% Daily AI Quota Reached (${usagePercent}% Used)`}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-500/40 font-bold">
                    {userRemaining} of {userDailyLimit} requests remaining
                  </span>
                  {budgetLimits?.estimatedTokensUsedToday !== undefined && (
                    <span className="text-[11px] text-slate-300 font-normal">
                      • ~{budgetLimits.estimatedTokensUsedToday.toLocaleString()} tokens consumed today
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-200/90 mt-0.5">
                  {isQuotaExhausted
                    ? 'You have used all daily free AI generation queries for today. Practice drills, offline dictionary lookups, and saved memory review remain fully available!'
                    : `You have reached ${usagePercent}% of your daily AI allowance. Keep an eye on your remaining tokens or connect a personal Gemini key in Settings for unlimited learning.`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs transition shadow-md shadow-amber-600/25 flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Monitor Tokens</span>
              </button>
              <button
                onClick={() => setWarningDismissed(true)}
                className="p-1.5 rounded-xl text-amber-400/80 hover:text-white hover:bg-amber-900/50 transition cursor-pointer"
                title="Dismiss warning notification"
                aria-label="Dismiss warning notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quota Progress Bar Visual Cue */}
          <div className="max-w-7xl mx-auto mt-2 w-full bg-slate-900/90 rounded-full h-1.5 overflow-hidden border border-amber-500/30">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isQuotaExhausted ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Second Line: Dedicated Cambridge Dictionary Search Bar */}
      {onSearchVocabulary && (
        <div className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-sm px-3 sm:px-6 py-2">
          <div className="max-w-4xl mx-auto">
            <CambridgeDictionarySearch
              onSelectWord={onSearchVocabulary}
              placeholder="Tra từ điển Cambridge, gia đình từ & bài tập ngữ pháp (vd: collaborate, analyze, resilience)..."
            />
          </div>
        </div>
      )}

      {/* Mobile Dropdown Drawer for overflow navigation items */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2.5 animate-fadeIn">
          {/* Mobile Quota Warning Box */}
          {isQuotaWarning && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>80% AI Quota Reached</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-bold border border-amber-500/30">
                  {userRemaining}/{userDailyLimit} left
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90">
                {userRemaining} requests remaining today ({usagePercent}% used).
              </p>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth?.(); }}
                className="w-full mt-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition"
              >
                Monitor Remaining Tokens
              </button>
            </div>
          )}

          {onOpenCatStudio && (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenCatStudio(); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-xs font-bold text-amber-300 hover:text-white border border-amber-500/40 shadow-sm"
            >
              <div className="flex items-center space-x-2">
                <span>🐱</span>
                <span>MeoMeo Cat Studio (Tùy chỉnh giao diện)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          <button
            onClick={() => { setMobileMenuOpen(false); onOpenMilestones(); }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 text-xs font-medium text-slate-200 hover:text-white border border-amber-500/30"
          >
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Milestones ({unlockedCount}/{totalBadgesCount})</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => { setMobileMenuOpen(false); onOpenMemory(); }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 text-xs font-medium text-slate-200 hover:text-white border border-slate-700"
          >
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-sky-400" />
              <span>Learning Memory & Mistakes</span>
            </div>
            {mistakesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {mistakesCount} mistakes
              </span>
            )}
          </button>

          {onOpenRoadmap && (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenRoadmap(); }}
              className="w-full flex items-center space-x-2 p-2.5 rounded-xl bg-indigo-500/15 text-xs font-semibold text-indigo-200 border border-indigo-500/30"
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Learning Roadmap & Plan</span>
            </button>
          )}

          {hasActiveSummary && onOpenSummary && (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenSummary(); }}
              className="w-full flex items-center space-x-2 p-2.5 rounded-xl bg-amber-500/10 text-xs font-medium text-amber-200 border border-amber-500/30"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Today's Session Summary</span>
            </button>
          )}

          <button
            onClick={() => { setMobileMenuOpen(false); onOpenSettings(); }}
            className="w-full flex items-center space-x-2 p-2.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 sm:hidden"
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Learner Profile & Settings ({profile.daily_minutes || 20}m/day)</span>
          </button>

          {currentUser ? (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between sm:hidden">
              <div className="flex items-center space-x-2">
                {currentUser.picture ? (
                  <img src={currentUser.picture} alt={currentUser.name} className="w-7 h-7 rounded-full border border-indigo-400/60" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200">{currentUser.name}</span>
              </div>
              {onLogout && (
                <button onClick={() => { setMobileMenuOpen(false); onLogout(); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20">
                  Sign out
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth?.(); }}
              className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white sm:hidden"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in / Guest Session</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
