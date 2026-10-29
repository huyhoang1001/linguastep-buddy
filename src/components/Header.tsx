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
  AlertTriangle,
  Sun,
  Moon
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
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onGoHome?: () => void;
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
  onOpenCatStudio,
  theme = 'light',
  onToggleTheme,
  onGoHome
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
      case 'Trophy': return <Trophy className="w-3.5 h-3.5 text-[#E9A825]" />;
      case 'Medal': return <Medal className="w-3.5 h-3.5 text-slate-400" />;
      case 'Crown': return <Crown className="w-3.5 h-3.5 text-amber-500" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />;
      default: return <Award className="w-3.5 h-3.5 text-[#2D6A4F]" />;
    }
  };

  return (
    <header className="bg-[#FAF7F2]/95 dark:bg-[#161A17]/95 backdrop-blur-md border-b border-[#EBE4D7] dark:border-[#262E28] text-[#2D312E] dark:text-[#F4F2EC] sticky top-0 z-30 shadow-xs select-none transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Home Link */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            title="Return to Home Study Sanctuary"
            className="flex items-center space-x-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#EAF2ED] dark:bg-[#252F28] border border-[#C2DBC7] dark:border-[#354539] flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform">
              🐱
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-1">
                <span>LinguaStep</span>
                <span className="text-xs font-sans text-[#74A892] font-semibold">Buddy</span>
              </span>
            </div>
          </button>

          {/* Clean Unboxed Metadata Separators */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#5C645E] dark:text-[#A7ABA4] pl-2 border-l border-[#EBE4D7] dark:border-[#262E28]">
            <span className="font-semibold text-[#1B4332] dark:text-[#84A98C]">
              Level {profile.current_level}
            </span>
            <span aria-hidden="true" className="text-[#DDD4BF] dark:text-[#3E4740]">·</span>
            <button
              onClick={onOpenSettings}
              title="Adjust your daily study duration"
              className="cursor-pointer hover:text-[#1B4332] dark:hover:text-white transition flex items-center gap-1"
            >
              <span>⏱️ {profile.daily_minutes || 20}m Daily</span>
            </button>
          </div>
        </div>

        {/* Center/Right Desktop Controls */}
        <div className="hidden lg:flex items-center space-x-2 shrink-0">
          {/* Milestone Widget */}
          <button
            onClick={onOpenMilestones}
            title="View all milestone achievements"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202722] hover:bg-[#FAF7F2] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2E3730] transition group cursor-pointer shadow-2xs"
          >
            <div className="w-6 h-6 rounded-lg bg-[#FEF7E6] dark:bg-[#342A1D] border border-[#F5DC9A] dark:border-[#524128] flex items-center justify-center shrink-0">
              {featuredBadge ? getBadgeIcon(featuredBadge.icon) : <Trophy className="w-3.5 h-3.5 text-[#E9A825]" />}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] max-w-[110px] truncate block">
                {featuredBadge ? featuredBadge.title : (nextBadge ? nextBadge.title : 'Milestones')}
              </span>
              <span className="text-[10px] text-[#8A938C] dark:text-[#8E978F] font-medium block">
                {unlockedCount}/{totalBadgesCount} Badges
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#8A938C] group-hover:text-[#1B4332] dark:group-hover:text-white transition" />
          </button>

          {/* Memory & Mistakes */}
          <button
            onClick={onOpenMemory}
            title="Learning Memory & Retention Matrix"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#2D312E] dark:text-[#D1D7CE] bg-white dark:bg-[#202722] hover:bg-[#FAF7F2] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2E3730] transition cursor-pointer shadow-2xs"
          >
            <Brain className="w-4 h-4 text-[#74A892]" />
            <span>Memory</span>
            {mistakesCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#FDF0ED] dark:bg-[#3B2521] text-[#E07A5F] font-bold rounded-full border border-[#F3B3A2] dark:border-[#5C342C]">
                {mistakesCount}
              </span>
            )}
          </button>

          {/* Roadmap */}
          {onOpenRoadmap && (
            <button
              onClick={onOpenRoadmap}
              title="View Learning Roadmap"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1B4332] dark:text-[#84A98C] bg-[#EFF6F1] dark:bg-[#1D2B22] hover:bg-[#E2EFE6] dark:hover:bg-[#25392D] border border-[#C2DBC7] dark:border-[#2C4A38] transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Compass className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
              <span>Roadmap</span>
            </button>
          )}

          {/* Cat Studio Customizer */}
          {onOpenCatStudio && (
            <button
              onClick={onOpenCatStudio}
              title="MeoMeo Cat Studio: Customize Companion & Theme"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#2D312E] dark:text-[#F4F2EC] bg-white dark:bg-[#202722] hover:bg-[#FAF7F2] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2E3730] transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <span>🐾</span>
              <span className="hidden xl:inline">Cat Desk</span>
            </button>
          )}
        </div>

        {/* Far Right Action Buttons (Always visible: Build Session, Theme Toggle, Settings, Auth / Mobile Menu) */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Primary Action: Build Next AI Session */}
          {onBuildNextSession && (
            <button
              disabled={isBuildingSession}
              onClick={onBuildNextSession}
              title="Build the next session with fresh progressive questions"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] dark:bg-[#52B788] dark:hover:bg-[#40916C] dark:text-[#0F291E] disabled:opacity-50 transition shadow-2xs cursor-pointer"
            >
              {isBuildingSession ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Building...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#E9A825]" />
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
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#FDF0ED] dark:bg-[#34231E] border border-[#E07A5F] text-[#B84728] dark:text-[#F28482] text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
              <span>{userRemaining}/{userDailyLimit} left</span>
            </button>
          )}

          {/* Theme Toggle Button (Light Cream / Dark Forest) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'light' ? 'Night Forest' : 'Cozy Cream'} theme`}
              className="p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] hover:bg-white dark:hover:bg-[#202722] border border-transparent hover:border-[#EBE4D7] dark:hover:border-[#2C332E] transition cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#E9A825]" />}
            </button>
          )}

          {/* Settings Icon */}
          <button
            onClick={onOpenSettings}
            title="Learner Profile & Settings"
            className="p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] hover:bg-white dark:hover:bg-[#202722] border border-transparent hover:border-[#EBE4D7] dark:hover:border-[#2C332E] transition hidden sm:block cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Account / User Avatar */}
          {currentUser ? (
            <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-[#EBE4D7] dark:border-[#2C332E]">
              <button
                onClick={onOpenAuth}
                title={`Signed in as ${currentUser.name}`}
                className="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-white dark:hover:bg-[#202722] transition group cursor-pointer"
              >
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full border border-[#74A892]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#EAF2ED] dark:bg-[#252F28] border border-[#C2DBC7] dark:border-[#354539] flex items-center justify-center text-xs font-bold text-[#1B4332] dark:text-[#84A98C]">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-[#2D312E] dark:text-[#D1D7CE] hidden xl:inline max-w-[80px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 rounded-xl text-[#8A938C] hover:text-[#E07A5F] hover:bg-white dark:hover:bg-[#202722] transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Sign in with Google or guest"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </button>
          )}

          {/* Mobile Dropdown Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Toggle Menu"
            className="p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] hover:bg-white dark:hover:bg-[#202722] border border-[#EBE4D7] dark:border-[#2C332E] lg:hidden transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Warning Notification: Triggers when user reaches >=80% of daily AI quota */}
      {isQuotaWarning && !warningDismissed && (
        <div className="bg-[#FFF8F6] dark:bg-[#271E1C] border-t border-b border-[#F3B3A2] dark:border-[#4A2D27] px-3 sm:px-6 py-2.5 text-xs text-[#B84728] dark:text-[#F28482] shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center space-x-2.5 text-left min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#FDF0ED] dark:bg-[#3B2521] border border-[#F3B3A2] dark:border-[#5C342C] flex items-center justify-center text-[#E07A5F] shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-4 h-4 animate-pulse text-[#E07A5F]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-bold text-[#2D312E] dark:text-[#F4F2EC] text-xs">
                  <span className="text-[#E07A5F] flex items-center gap-1">
                    <span>⚡</span>
                    <span>{isQuotaExhausted ? 'Daily AI Quota Depleted' : `80% Daily AI Quota Reached (${usagePercent}% Used)`}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDF0ED] dark:bg-[#3B2521] text-[#E07A5F] border border-[#F3B3A2] dark:border-[#5C342C] font-bold">
                    {userRemaining} of {userDailyLimit} requests remaining
                  </span>
                  {budgetLimits?.estimatedTokensUsedToday !== undefined && (
                    <span className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] font-normal">
                      • ~{budgetLimits.estimatedTokensUsedToday.toLocaleString()} tokens consumed today
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                  {isQuotaExhausted
                    ? 'You have used all daily free AI generation queries for today. Practice drills, offline dictionary lookups, and saved memory review remain fully available!'
                    : `You have reached ${usagePercent}% of your daily AI allowance. Keep an eye on your remaining tokens or connect a personal Gemini key in Settings for unlimited learning.`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-[#E07A5F] hover:bg-[#CC5836] text-white font-bold text-xs transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Monitor Tokens</span>
              </button>
              <button
                onClick={() => setWarningDismissed(true)}
                className="p-1.5 rounded-xl text-[#8A938C] hover:text-[#2D312E] dark:hover:text-white transition cursor-pointer"
                title="Dismiss warning notification"
                aria-label="Dismiss warning notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quota Progress Bar Visual Cue */}
          <div className="max-w-7xl mx-auto mt-2 w-full bg-[#EBE4D7] dark:bg-[#2C332E] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isQuotaExhausted ? 'bg-[#E07A5F]' : 'bg-[#E9A825]'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Second Line: Dedicated Cambridge Dictionary Search Bar */}
      {onSearchVocabulary && (
        <div className="border-t border-[#EBE4D7] dark:border-[#262E28] bg-[#F5EFEB]/80 dark:bg-[#131714]/80 px-3 sm:px-6 py-2">
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
        <div className="lg:hidden bg-[#FAF7F2] dark:bg-[#161A17] border-b border-[#EBE4D7] dark:border-[#262E28] px-4 py-3 space-y-2.5">
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
