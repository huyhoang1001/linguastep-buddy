import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Sparkles,
  BookMarked,
  Layers,
  Search,
  Sun,
  Moon,
  Sliders,
  Cat,
  LogOut,
  LogIn,
  ChevronDown,
  Clock
} from 'lucide-react';
import { UserProfile } from '../types/learning.ts';
import { UserAccount, BudgetLimits } from '../types/auth.ts';
import { StatusBadge } from './ui/StatusBadge.tsx';

export type NavigationDestination = 'home' | 'learn' | 'words' | 'progress';

interface HeaderProps {
  currentDestination: NavigationDestination;
  onNavigate: (destination: NavigationDestination) => void;
  profile: UserProfile;
  overdueWordsCount?: number;
  currentUser?: UserAccount | null;
  budgetLimits?: BudgetLimits | null;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenSettings: () => void;
  onOpenCatStudio: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenSearchPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDestination,
  onNavigate,
  profile,
  overdueWordsCount = 0,
  currentUser,
  budgetLimits,
  theme = 'light',
  onToggleTheme,
  onOpenSettings,
  onOpenCatStudio,
  onOpenAuth,
  onLogout,
  onOpenSearchPalette
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or touch
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearchPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearchPalette]);

  // Quota warning threshold calculation (80% quota check)
  const userDailyLimit = budgetLimits?.userDailyLimit || 30;
  const userRemaining = budgetLimits?.userRemaining !== undefined ? budgetLimits.userRemaining : userDailyLimit;
  const usagePercent = userDailyLimit > 0 ? Math.min(100, Math.round(((userDailyLimit - userRemaining) / userDailyLimit) * 100)) : 0;
  const isQuotaWarning = userDailyLimit > 0 && (usagePercent >= 80 || userRemaining <= Math.ceil(userDailyLimit * 0.2));

  return (
    <>
      {/* 1. Desktop & Mobile Compact Header */}
      <header className="bg-[#FAF7F2]/95 dark:bg-[#161A17]/95 backdrop-blur-md border-b border-[#EBE4D7] dark:border-[#262E28] text-[#2D312E] dark:text-[#F4F2EC] sticky top-0 z-40 select-none transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: Brand Wordmark "meomeo." & CEFR Pill */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              title="meomeo. — Home"
              className="flex items-center space-x-2 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#354539] flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                🐱
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-[#1B4332] dark:text-[#F4F2EC] lowercase">
                meomeo<span className="text-[#E07A5F]">.</span>
              </span>
            </button>

            {/* Subtle CEFR Level Badge */}
            <StatusBadge variant="success">
              Level {profile.current_level}
            </StatusBadge>
          </div>

          {/* Center: Four Primary Destinations (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-[#F4EFEB] dark:bg-[#1B211C] rounded-2xl border border-[#EBE4D7] dark:border-[#2C332E]">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                currentDestination === 'home'
                  ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
                  : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('learn')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                currentDestination === 'learn'
                  ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
                  : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learn</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('words')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 relative ${
                currentDestination === 'words'
                  ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
                  : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Words</span>
              {overdueWordsCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  currentDestination === 'words'
                    ? 'bg-[#E07A5F] text-white'
                    : 'bg-[#FDF0ED] dark:bg-[#342421] text-[#E07A5F] border border-[#F5D5CC] dark:border-[#4E342D]'
                }`}>
                  {overdueWordsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                currentDestination === 'progress'
                  ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
                  : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Progress</span>
            </button>
          </nav>

          {/* Right: Search Shortcut, Theme Quick Toggle, Quota Indicator, & Profile Menu */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#202722] hover:bg-[#FAF7F2] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2E3730] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white transition cursor-pointer shadow-2xs flex items-center space-x-1"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#E6A23C]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#5C645E]" />
                )}
                <span className="hidden sm:inline text-xs font-semibold capitalize">
                  {theme}
                </span>
              </button>
            )}

            {/* Quota Warning Badge Indicator (When >= 80% daily quota used) */}
            {isQuotaWarning && (
              <div
                title={`Daily AI Quota: ${userRemaining} of ${userDailyLimit} remaining today (${usagePercent}% used)`}
                className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] animate-pulse"
              />
            )}

            {/* Profile & Secondary Controls Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#202722] hover:bg-[#FAF7F2] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2E3730] transition cursor-pointer shadow-2xs"
                title="Profile & Study Club Settings"
              >
                <div className="w-6 h-6 rounded-lg bg-[#EFF6F1] dark:bg-[#252F28] flex items-center justify-center text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C]">
                  {currentUser?.name ? currentUser.name.slice(0, 1).toUpperCase() : (profile.name ? profile.name.slice(0, 1).toUpperCase() : 'M')}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-[#1B4332] dark:text-[#F4F2EC] max-w-[80px] truncate">
                  {currentUser?.name || profile.name || 'Friend'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#8A938C]" />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-2xl shadow-xl p-2 z-50 text-xs font-sans space-y-1 animate-fadeIn">
                  {/* User info */}
                  <div className="p-2 border-b border-[#EBE4D7] dark:border-[#2C332E]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] block">
                      MeoMeo Study Club
                    </span>
                    <strong className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] block truncate">
                      {currentUser?.email || profile.name || 'Learner Session'}
                    </strong>
                    <span className="text-[10px] text-[#8A938C]">
                      Level {profile.current_level} &bull; {userRemaining}/{userDailyLimit} daily tokens left
                    </span>
                  </div>

                  {/* Daily Duration Preference */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-[#252C26] transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-[#74A892]" />
                      <span>Daily Session Pace</span>
                    </div>
                    <span className="font-mono text-[#2D6A4F] dark:text-[#84A98C] font-semibold">
                      {profile.daily_minutes || 20}m
                    </span>
                  </button>

                  {/* Cat Companion Studio */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenCatStudio();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-[#252C26] transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Cat className="w-3.5 h-3.5 text-[#E6A23C]" />
                    <span>Cat Companion Studio</span>
                  </button>

                  {/* Theme Switcher */}
                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTheme();
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-[#252C26] transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        {theme === 'dark' ? (
                          <Sun className="w-3.5 h-3.5 text-[#E6A23C]" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-[#5C645E]" />
                        )}
                        <span>Theme</span>
                      </div>
                      <span className="capitalize text-[#8A938C]">
                        {theme}
                      </span>
                    </button>
                  )}

                  {/* Settings Modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-[#252C26] transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#5C645E] dark:text-[#A7ABA4]" />
                    <span>Preferences &amp; Data</span>
                  </button>

                  {/* Auth Actions */}
                  <div className="pt-1 border-t border-[#EBE4D7] dark:border-[#2C332E]">
                    {currentUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-[#FDF0ED] dark:hover:bg-[#342421] text-[#E07A5F] transition flex items-center space-x-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          if (onOpenAuth) onOpenAuth();
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-[#EFF6F1] dark:hover:bg-[#252F28] text-[#2D6A4F] dark:text-[#52B788] transition flex items-center space-x-2 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In with Google</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Dedicated Global Search Row */}
        <div className="border-t border-[#EBE4D7]/80 dark:border-[#262E28] bg-[#F7F3EC]/80 dark:bg-[#181E19]/80 py-2.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex justify-center">
            <button
              type="button"
              onClick={onOpenSearchPalette}
              title="Search dictionary, grammar rules & quick commands (⌘K)"
              className="w-full max-w-3xl flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white dark:bg-[#202722] hover:bg-[#FAF7F2] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2C332E] text-xs text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Search className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate text-xs font-normal text-[#5C645E] dark:text-[#A7ABA4] group-hover:text-[#1B4332] dark:hover:text-[#F4F2EC]">
                  Search Cambridge dictionary, grammar rules &amp; quick commands...
                </span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                <kbd className="font-mono text-[10px] font-semibold bg-[#FAF7F2] dark:bg-[#161A17] border border-[#EBE4D7] dark:border-[#2E3730] px-2 py-0.5 rounded-lg text-[#5C645E] dark:text-[#8A938C] shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Mobile Bottom Navigation Bar (4 Destinations) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#161A17]/95 backdrop-blur-md border-t border-[#EBE4D7] dark:border-[#262E28] text-[#2D312E] dark:text-[#F4F2EC] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg"
      >
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`min-w-[56px] min-h-[44px] flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition cursor-pointer ${
            currentDestination === 'home'
              ? 'text-[#1B4332] dark:text-[#52B788] font-bold'
              : 'text-[#8A938C]'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('learn')}
          className={`min-w-[56px] min-h-[44px] flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition cursor-pointer ${
            currentDestination === 'learn'
              ? 'text-[#1B4332] dark:text-[#52B788] font-bold'
              : 'text-[#8A938C]'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span>Learn</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('words')}
          className={`min-w-[56px] min-h-[44px] flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition cursor-pointer relative ${
            currentDestination === 'words'
              ? 'text-[#1B4332] dark:text-[#52B788] font-bold'
              : 'text-[#8A938C]'
          }`}
        >
          <div className="relative">
            <BookMarked className="w-5 h-5 mb-0.5" />
            {overdueWordsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-[#E07A5F] text-white">
                {overdueWordsCount}
              </span>
            )}
          </div>
          <span>Words</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('progress')}
          className={`min-w-[56px] min-h-[44px] flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition cursor-pointer ${
            currentDestination === 'progress'
              ? 'text-[#1B4332] dark:text-[#52B788] font-bold'
              : 'text-[#8A938C]'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Progress</span>
        </button>
      </nav>
    </>
  );
};
