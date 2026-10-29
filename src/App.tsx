import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  UserProfile,
  LessonPlan,
  DailySummary,
  Question,
  AnswerEvaluation,
  Attempt,
  LearnerSkillState,
  VocabularyItem
} from './types/learning.ts';
import { UserAccount, BudgetLimits } from './types/auth.ts';
import { Header, NavigationDestination } from './components/Header.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { LessonView } from './components/LessonView.tsx';
import { WordsView } from './components/WordsView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { CommandPaletteModal } from './components/CommandPaletteModal.tsx';
import { LessonSummaryModal } from './components/LessonSummaryModal.tsx';
import { MemoryDrawer } from './components/MemoryDrawer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { MilestonesModal } from './components/MilestonesModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CurriculumRoadmapModal } from './components/CurriculumRoadmapModal.tsx';
import { SessionContextCatalogModal } from './components/SessionContextCatalogModal.tsx';
import { WordPracticeModal } from './components/WordPracticeModal.tsx';
import { CatCustomizerModal } from './components/CatCustomizerModal.tsx';
import { CatCompanionWidget } from './components/CatCompanionWidget.tsx';
import { catCustomizationStore } from './services/catCustomizationStore.ts';
import { CatCustomizationConfig, CAT_THEMES } from './types/catTheme.ts';
import { NextSessionCustomContext } from './types/learning.ts';
import {
  getAuthSession,
  loginAsGuest,
  logout,
  getProfile,
  generateLessonPlan,
  generateLessonSummary,
  getMemory,
  clearActiveLessonState,
  getBudgetStats
} from './services/api.ts';
import { AIErrorAlert } from './components/AIErrorAlert.tsx';
import { AIFallbackBanner } from './components/AIFallbackBanner.tsx';
import { localStore } from './services/localStore.ts';
import { calculateMilestones } from './services/milestoneService.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimits | null>(null);
  const [googleClientIdConfigured, setGoogleClientIdConfigured] = useState<boolean>(false);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);
  const [activeSummary, setActiveSummary] = useState<DailySummary | null>(null);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [milestonesData, setMilestonesData] = useState<ReturnType<typeof calculateMilestones> | null>(null);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([]);
  const [skills, setSkills] = useState<LearnerSkillState[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);

  // Navigation state: 'home' | 'learn' | 'words' | 'progress'
  const [navigationDestination, setNavigationDestination] = useState<NavigationDestination>('home');
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);

  // Global Cmd+K / Ctrl+K shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cohesive Light / Dark theme state with instant DOM sync & system listener
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linguastep_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Keep DOM .dark class in sync with theme state
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system theme changes if user hasn't explicitly saved a preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('linguastep_theme');
      if (!saved) {
        const nextTheme = e.matches ? 'dark' : 'light';
        setTheme(nextTheme);
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('linguastep_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingPhase, setOnboardingPhase] = useState<'discovery' | 'diagnostic' | 'report' | 'plan'>('discovery');
  const [showMemoryDrawer, setShowMemoryDrawer] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState<boolean>(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [activeDictionaryWord, setActiveDictionaryWord] = useState<string | null>(null);

  // Cat Chibi Theme & Customization State
  const [catConfig, setCatConfig] = useState<CatCustomizationConfig>(() => catCustomizationStore.getConfig());
  const [showCatCustomizer, setShowCatCustomizer] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuildingSession, setIsBuildingSession] = useState<boolean>(false);
  const [appError, setAppError] = useState<any>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);

  // Initialize application and listen to Cat Chibi theme changes
  useEffect(() => {
    initApp();

    const handleThemeChange = (e: any) => {
      if (e.detail) setCatConfig(e.detail);
    };
    window.addEventListener('meomeo:theme-changed', handleThemeChange);

    const handleBudgetUpdate = async () => {
      try {
        const stats = await getBudgetStats();
        setBudgetLimits(stats);
      } catch (err) {
        console.warn('Failed to refresh budget stats:', err);
      }
    };
    window.addEventListener('ai-budget-updated', handleBudgetUpdate);

    return () => {
      window.removeEventListener('meomeo:theme-changed', handleThemeChange);
      window.removeEventListener('ai-budget-updated', handleBudgetUpdate);
    };
  }, []);

  const initApp = async () => {
    setIsLoading(true);
    setAppError(null);
    try {
      // 1. Check or establish session with server
      const session = await getAuthSession();
      setGoogleClientIdConfigured(session.googleClientIdConfigured);
      setGoogleClientId(session.googleClientId || '');

      const user = session.user;
      if (!user) {
        // No active server session: require explicit Google Sign-In or "Continue as Guest"
        setCurrentUser(null);
        setProfile(null);
        setActivePlan(null);
        setActiveSummary(null);
        setMilestonesData(null);
        setBudgetLimits(session.limits);
        setShowAuthModal(true);
        setIsLoading(false);
        return;
      }

      // 2. Active session verified: isolate storage by account ID
      localStore.setActiveAccount(user.id);
      setCurrentUser(user);
      setBudgetLimits(session.limits);

      // 3. Fetch authenticated user profile
      const userProfile = await getProfile();
      setProfile(userProfile);

      // 4. Fetch user memory, mistakes count, and milestone badges
      const mem = await getMemory();
      setDailySummaries(mem.summaries || []);
      setRecentAttempts(mem.attempts || []);
      setSkills(mem.skills || []);
      setVocabulary(mem.vocabulary || []);
      const totalErrors = mem.skills?.flatMap(s => s.recurring_errors)?.length || 0;
      setMistakesCount(totalErrors);

      const computedMilestones = calculateMilestones(mem);
      setMilestonesData(computedMilestones);

      if (!userProfile.onboarding_completed) {
        const disc = await localStore.getDiscoveryState();
        const diag = await localStore.getDiagnosticSession();
        if (diag && (diag.status === 'in_progress' || diag.status === 'paused')) {
          setOnboardingPhase('diagnostic');
        } else if (disc && disc.isConfirmed) {
          setOnboardingPhase('diagnostic');
        } else {
          setOnboardingPhase('discovery');
        }
        setShowOnboarding(true);
      } else {
        // Restore active in-progress lesson or load latest without wasteful regeneration
        const active = await localStore.getActiveLesson();
        if (active && active.plan && (active.status === 'in_progress' || active.status === 'paused')) {
          setActivePlan(active.plan);
        } else if (mem.lessons && mem.lessons.length > 0) {
          const inProgress = mem.lessons.find(l => l.status === 'in_progress');
          setActivePlan(inProgress || mem.lessons[mem.lessons.length - 1]);
        } else {
          const newPlan = await generateLessonPlan(userProfile.daily_minutes);
          setActivePlan(newPlan);
        }

        if (mem.summaries && mem.summaries.length > 0) {
          setActiveSummary(mem.summaries[mem.summaries.length - 1]);
        }
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (user: UserAccount, limits: BudgetLimits) => {
    localStore.setActiveAccount(user.id);
    setCurrentUser(user);
    setBudgetLimits(limits);
    setShowAuthModal(false);
    await initApp();
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setProfile(null);
    setActivePlan(null);
    setActiveSummary(null);
    setMilestonesData(null);
    setDailySummaries([]);
    setRecentAttempts([]);
    setSkills([]);
    setVocabulary([]);
    setNavigationDestination('home');
    setShowOnboarding(false);
    setShowAuthModal(true);
  };

  const refreshMilestones = async () => {
    try {
      const mem = await getMemory();
      setDailySummaries(mem.summaries || []);
      setRecentAttempts(mem.attempts || []);
      setSkills(mem.skills || []);
      setVocabulary(mem.vocabulary || []);
      const computed = calculateMilestones(mem);
      setMilestonesData(computed);
      const totalErrors = mem.skills?.flatMap(s => s.recurring_errors)?.length || 0;
      setMistakesCount(totalErrors);
    } catch (err) {
      console.error('Failed to refresh milestones:', err);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setShowSummaryModal(false);
    setActiveSummary(null);
    setIsLoading(true);
    try {
      await localStore.clearActiveLesson();
      const userProfile = await getProfile();
      setProfile(userProfile);
      const newPlan = await generateLessonPlan(userProfile.daily_minutes, true);
      setActivePlan(newPlan);
      setNavigationDestination('home');
      await refreshMilestones();
    } catch (err) {
      console.error('Failed to create initial lesson plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonFinished = async (
    attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>,
    timeSpentMinutes?: number
  ) => {
    if (!activePlan) return;
    setIsLoading(true);
    setAppError(null);
    try {
      const summary = await generateLessonSummary(activePlan, attempts, timeSpentMinutes);
      setActiveSummary(summary);
      setShowSummaryModal(true);

      // Clear active lesson state so completed session is archived
      await clearActiveLessonState();

      // Refresh memory stats & milestones
      await refreshMilestones();
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setAppError(err);
      setLastFailedAction(() => () => handleLessonFinished(attempts, timeSpentMinutes));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewLesson = async (overrideMinutes?: number) => {
    setIsBuildingSession(true);
    setAppError(null);
    try {
      const targetMins = overrideMinutes || profile?.daily_minutes;
      // Pass forceRegenerate = true when explicitly clicking "Start New Lesson"
      const newPlan = await generateLessonPlan(targetMins, true);
      setActivePlan(newPlan);
      setNavigationDestination('learn');
      await refreshMilestones();
    } catch (err) {
      console.error('Failed to generate new plan:', err);
      setAppError(err);
      setLastFailedAction(() => () => handleStartNewLesson(overrideMinutes));
    } finally {
      setIsBuildingSession(false);
    }
  };

  const handleOpenBuildCatalog = () => {
    setShowCatalogModal(true);
  };

  const handleConfirmCustomSession = async (customContext: NextSessionCustomContext) => {
    setIsBuildingSession(true);
    setAppError(null);
    try {
      await clearActiveLessonState();
      const newPlan = await generateLessonPlan(customContext.dailyMinutes, true, customContext);
      setActivePlan(newPlan);
      setNavigationDestination('learn');
      setShowCatalogModal(false);
      setShowSummaryModal(false);
      await refreshMilestones();
    } catch (err) {
      console.error('Failed to generate customized session plan:', err);
      setAppError(err);
      setLastFailedAction(() => () => handleConfirmCustomSession(customContext));
    } finally {
      setIsBuildingSession(false);
    }
  };

  const activeTheme = CAT_THEMES[catConfig.themeId] || CAT_THEMES.calico;

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#161A17] flex flex-col items-center justify-center text-[#2D312E] dark:text-[#F4F2EC]">
        <div className="w-12 h-12 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-3xl mb-2 animate-bounce">🐱🐾</div>
        <h2 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">Loading MeoMeo...</h2>
        <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1">Preparing your cozy study companion session</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#161A17] flex flex-col items-center justify-center text-[#2D312E] dark:text-[#F4F2EC] p-4 relative">
        {catConfig.floatingPaws && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-10">
            <span className="absolute top-12 left-6 text-3xl animate-pulse">🐾</span>
            <span className="absolute top-1/4 right-8 text-4xl animate-bounce-short">🐾</span>
            <span className="absolute bottom-20 left-16 text-4xl animate-pulse">🐾</span>
          </div>
        )}
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          currentUser={null}
          googleClientIdConfigured={googleClientIdConfigured}
          googleClientId={googleClientId}
          limits={budgetLimits}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#161A17] text-[#2D312E] dark:text-[#F4F2EC] flex flex-col font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Floating Cat Paw Prints */}
      {catConfig.floatingPaws && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-10 dark:opacity-5">
          <span className="absolute top-12 left-6 text-3xl animate-pulse">🐾</span>
          <span className="absolute top-1/4 right-8 text-4xl animate-bounce-short">🐾</span>
          <span className="absolute top-1/2 left-4 text-2xl">🐾</span>
          <span className="absolute top-3/4 right-12 text-3xl">🐾</span>
          <span className="absolute bottom-20 left-16 text-4xl animate-pulse">🐾</span>
        </div>
      )}

      {/* Top Banner Alert when AI token/quota fallback mode is active */}
      <AIFallbackBanner />

      {/* App Header with Milestone Progress Badge, Budget & Auth */}
      {/* App Header with MeoMeo Minimal Navigation, Overdue Words Count & Profile */}
      <Header
        currentDestination={navigationDestination}
        onNavigate={(dest) => setNavigationDestination(dest)}
        profile={profile}
        overdueWordsCount={vocabulary.filter(v => v.next_review_at && new Date(v.next_review_at).getTime() <= Date.now()).length}
        currentUser={currentUser}
        budgetLimits={budgetLimits}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenCatStudio={() => setShowCatCustomizer(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenSearchPalette={() => setShowCommandPalette(true)}
      />

      {/* Main Content Area with 4 Primary Destinations */}
      <main className="flex-1 pb-20 md:pb-8">
        {appError && (
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <AIErrorAlert
              error={appError}
              onRetry={lastFailedAction || undefined}
              onDismiss={() => setAppError(null)}
              className="mb-4"
            />
          </div>
        )}

        {navigationDestination === 'learn' ? (
          activePlan ? (
            <LessonView
              profile={profile}
              plan={activePlan}
              onFinishLesson={handleLessonFinished}
              onOpenSummary={() => setShowSummaryModal(true)}
              onBuildNextSession={handleOpenBuildCatalog}
              isBuildingSession={isBuildingSession}
              onReturnHome={() => setNavigationDestination('home')}
            />
          ) : (
            <div className="max-w-xl mx-auto px-4 py-16 text-center">
              <div className="p-8 rounded-3xl bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] shadow-sm">
                <div className="text-4xl mb-3 animate-bounce-short">🐾</div>
                <h2 className="text-2xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] mb-2">
                  Ready for today's session?
                </h2>
                <p className="text-sm text-[#5C645E] dark:text-[#A7ABA4] mb-6 max-w-md mx-auto leading-relaxed">
                  Start an adaptive session curated to your current CEFR tier, overdue spaced reviews, and workplace English goals.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartNewLesson(10)}
                    disabled={isBuildingSession}
                    className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] text-white font-semibold text-sm hover:bg-[#1B4332] transition cursor-pointer"
                  >
                    Quick 10m Session
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartNewLesson(20)}
                    disabled={isBuildingSession}
                    className="px-5 py-2.5 rounded-xl bg-[#52796F] text-white font-semibold text-sm hover:bg-[#2D6A4F] transition cursor-pointer"
                  >
                    Core 20m Session
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenBuildCatalog}
                    disabled={isBuildingSession}
                    className="px-5 py-2.5 rounded-xl border border-[#D8CFBF] dark:border-[#3C443E] text-[#2D312E] dark:text-[#F4F2EC] hover:bg-[#FAF7F2] dark:hover:bg-[#262F28] font-semibold text-sm transition cursor-pointer"
                  >
                    Custom Objectives
                  </button>
                </div>
              </div>
            </div>
          )
        ) : navigationDestination === 'words' ? (
          <WordsView
            vocabulary={vocabulary}
            onPracticeWord={(word) => setActiveDictionaryWord(word)}
            onRefreshMemory={refreshMilestones}
            examMajor={profile.major_or_subject}
          />
        ) : navigationDestination === 'progress' ? (
          <ProgressView
            profile={profile}
            skills={skills}
            summaries={dailySummaries}
            attempts={recentAttempts}
            allBadges={milestonesData?.allBadges || []}
            unlockedBadges={milestonesData?.unlockedBadges || []}
            onStartNewLesson={() => {
              setNavigationDestination('learn');
              handleOpenBuildCatalog();
            }}
          />
        ) : (
          <HomeScreen
            profile={profile}
            activePlan={activePlan}
            dailySummaries={dailySummaries}
            skills={skills}
            vocabulary={vocabulary}
            catConfig={catConfig}
            onStartLesson={(mins) => {
              handleStartNewLesson(mins);
              setNavigationDestination('learn');
            }}
            onResumeLesson={() => setNavigationDestination('learn')}
            onOpenRoadmap={() => setNavigationDestination('progress')}
            onOpenMemory={() => setNavigationDestination('words')}
            onOpenMilestones={() => setNavigationDestination('progress')}
            onOpenCatStudio={() => setShowCatCustomizer(true)}
            onOpenCatalog={handleOpenBuildCatalog}
            onOpenSettings={() => setShowSettingsModal(true)}
            onPracticeWord={(word) => setActiveDictionaryWord(word)}
            isBuildingSession={isBuildingSession}
          />
        )}
      </main>

      {/* Auth Modal (Google & Guest Sign In) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        googleClientIdConfigured={googleClientIdConfigured}
        googleClientId={googleClientId}
        limits={budgetLimits}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Milestones Showcase Modal */}
      {milestonesData && (
        <MilestonesModal
          isOpen={showMilestonesModal}
          onClose={() => setShowMilestonesModal(false)}
          allBadges={milestonesData.allBadges}
          unlockedBadges={milestonesData.unlockedBadges}
          stats={milestonesData.stats}
          summaries={dailySummaries}
          attempts={recentAttempts}
          onJumpToPractice={() => setShowMilestonesModal(false)}
        />
      )}

      {/* Conversational Discovery & Adaptive Diagnostic Modal */}
      {showOnboarding && (
        <OnboardingModal
          currentProfile={profile}
          initialPhase={onboardingPhase}
          onComplete={handleOnboardingComplete}
        />
      )}

      {showSummaryModal && activeSummary && (
        <LessonSummaryModal
          summary={activeSummary}
          onClose={() => setShowSummaryModal(false)}
          onStartNewLesson={async () => {
            setShowSummaryModal(false);
            handleOpenBuildCatalog();
          }}
        />
      )}

      {profile && (
        <SessionContextCatalogModal
          isOpen={showCatalogModal}
          onClose={() => setShowCatalogModal(false)}
          profile={profile}
          isBuilding={isBuildingSession}
          onConfirmBuild={handleConfirmCustomSession}
        />
      )}

      {profile && (
        <CurriculumRoadmapModal
          isOpen={showRoadmapModal}
          onClose={() => setShowRoadmapModal(false)}
          profile={profile}
          activePlan={activePlan}
          activeSummary={activeSummary}
          onStartNewLesson={async () => {
            setShowRoadmapModal(false);
            handleOpenBuildCatalog();
          }}
        />
      )}

      <MemoryDrawer
        isOpen={showMemoryDrawer}
        onClose={() => setShowMemoryDrawer(false)}
        onResetComplete={initApp}
        onRetakeDiagnostic={() => {
          setOnboardingPhase('diagnostic');
          setShowOnboarding(true);
        }}
      />

      <SettingsModal
        profile={profile}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpdated={async (updated) => {
          const durationChanged = updated.daily_minutes !== profile.daily_minutes;
          setProfile(updated);
          if (durationChanged) {
            setIsLoading(true);
            try {
              const newPlan = await generateLessonPlan(updated.daily_minutes, true);
              setActivePlan(newPlan);
            } catch (err) {
              console.error('Failed to regenerate lesson plan for new duration:', err);
            } finally {
              setIsLoading(false);
            }
          }
        }}
        onRetakeOnboarding={() => {
          setOnboardingPhase('discovery');
          setShowOnboarding(true);
        }}
        onDataReset={initApp}
        onDataImported={initApp}
      />

      {/* Cambridge Dictionary Word Practice & Memory Modal */}
      {activeDictionaryWord && profile && (
        <WordPracticeModal
          word={activeDictionaryWord}
          examMajor={profile.major_or_subject || 'General Professional English'}
          onClose={() => setActiveDictionaryWord(null)}
          onSavedToMemory={() => {
            refreshMilestones();
          }}
        />
      )}

      {/* MeoMeo Interactive Cat Companion Widget */}
      <CatCompanionWidget
        config={catConfig}
        onOpenCustomizer={() => setShowCatCustomizer(true)}
        lessonContext={activePlan ? {
          objective: activePlan.primary_objective,
          section: activePlan.sections?.find(s => !s.completed)?.section || 'grammar',
          skillName: activePlan.sections?.find(s => !s.completed)?.skill_target || ''
        } : undefined}
      />

      {/* MeoMeo Cat Studio Customizer Modal */}
      <CatCustomizerModal
        isOpen={showCatCustomizer}
        onClose={() => setShowCatCustomizer(false)}
        currentConfig={catConfig}
        onSaveConfig={(newCfg) => setCatConfig(newCfg)}
      />

      {/* MeoMeo Command Palette Modal (Ctrl/Cmd + K) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(dest) => {
          setNavigationDestination(dest);
          setShowCommandPalette(false);
        }}
        onPracticeWord={(word) => {
          setShowCommandPalette(false);
          setActiveDictionaryWord(word);
        }}
        onOpenSettings={() => {
          setShowCommandPalette(false);
          setShowSettingsModal(true);
        }}
        onOpenCatStudio={() => {
          setShowCommandPalette(false);
          setShowCatCustomizer(true);
        }}
      />

      {/* Full-Screen Loading Overlay when Building New Lesson - Blocks all user interactions */}
      {isBuildingSession && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto cursor-wait"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 text-center">
            <div className="relative mb-5">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Building Your New Lesson...
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curating forward-progressing exercises aligned with your learning profile and skill history. Please wait...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
