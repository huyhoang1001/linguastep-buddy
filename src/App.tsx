import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  LessonPlan,
  DailySummary,
  Question,
  AnswerEvaluation
} from './types/learning.ts';
import { UserAccount, BudgetLimits } from './types/auth.ts';
import { Header } from './components/Header.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { LessonView } from './components/LessonView.tsx';
import { LessonSummaryModal } from './components/LessonSummaryModal.tsx';
import { MemoryDrawer } from './components/MemoryDrawer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { MilestonesModal } from './components/MilestonesModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CurriculumRoadmapModal } from './components/CurriculumRoadmapModal.tsx';
import {
  getAuthSession,
  loginAsGuest,
  logout,
  getProfile,
  generateLessonPlan,
  generateLessonSummary,
  getMemory,
  clearActiveLessonState
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

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingPhase, setOnboardingPhase] = useState<'discovery' | 'diagnostic' | 'report' | 'plan'>('discovery');
  const [showMemoryDrawer, setShowMemoryDrawer] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState<boolean>(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuildingSession, setIsBuildingSession] = useState<boolean>(false);
  const [appError, setAppError] = useState<any>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);

  // Initialize application
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setIsLoading(true);
    setAppError(null);
    try {
      // 1. Check or establish session
      let session = await getAuthSession();
      setGoogleClientIdConfigured(session.googleClientIdConfigured);
      setGoogleClientId(session.googleClientId || '');

      let user = session.user;
      if (!user) {
        // Automatically create or resume guest learner session (retains existing data)
        const guestResult = await loginAsGuest();
        user = guestResult.user;
        setBudgetLimits(guestResult.limits);
      } else {
        setBudgetLimits(session.limits);
      }
      setCurrentUser(user);

      // 2. Fetch authenticated user profile
      const userProfile = await getProfile();
      setProfile(userProfile);

      // 3. Fetch user memory, mistakes count, and milestone badges
      const mem = await getMemory();
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
    await initApp();
  };

  const refreshMilestones = async () => {
    try {
      const mem = await getMemory();
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
      await refreshMilestones();
    } catch (err) {
      console.error('Failed to generate new plan:', err);
      setAppError(err);
      setLastFailedAction(() => () => handleStartNewLesson(overrideMinutes));
    } finally {
      setIsBuildingSession(false);
    }
  };

  const handleBuildNextSession = async (overrideMinutes?: number) => {
    await clearActiveLessonState();
    await handleStartNewLesson(overrideMinutes);
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-medium">Loading LinguaStep Tutor...</h2>
        <p className="text-xs text-slate-400 mt-1">Checking secure session and persistent learning memory</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner Alert when AI token/quota fallback mode is active */}
      <AIFallbackBanner />

      {/* App Header with Milestone Progress Badge, Budget & Auth */}
      <Header
        profile={profile}
        mistakesCount={mistakesCount}
        featuredBadge={milestonesData?.featuredBadge || null}
        nextBadge={milestonesData?.nextBadge || null}
        unlockedCount={milestonesData?.unlockedBadges.length || 0}
        totalBadgesCount={milestonesData?.allBadges.length || 10}
        currentUser={currentUser}
        budgetLimits={budgetLimits}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenMilestones={() => setShowMilestonesModal(true)}
        onOpenMemory={() => setShowMemoryDrawer(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSummary={() => setShowSummaryModal(true)}
        hasActiveSummary={Boolean(activeSummary)}
        onOpenRoadmap={() => setShowRoadmapModal(true)}
        onRestartOnboarding={() => {
          setOnboardingPhase('discovery');
          setShowOnboarding(true);
        }}
        onBuildNextSession={() => handleBuildNextSession()}
        isBuildingSession={isBuildingSession}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
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

        {activePlan ? (
          <LessonView
            profile={profile}
            plan={activePlan}
            onFinishLesson={handleLessonFinished}
            onOpenSummary={() => setShowSummaryModal(true)}
            onBuildNextSession={() => handleBuildNextSession()}
            isBuildingSession={isBuildingSession}
          />
        ) : (
          <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-xl font-bold text-white">Ready for Your Next AI Session?</h3>
            <p className="text-xs text-slate-400">
              Your previous session is complete. Let our AI build a fresh, personalized practice session tailored to your current skill level and recent learning patterns.
            </p>
            <button
              disabled={isBuildingSession}
              onClick={() => handleBuildNextSession()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 mx-auto"
            >
              {isBuildingSession ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Building Next AI Session...</span>
                </>
              ) : (
                <span>Build Next AI Session</span>
              )}
            </button>
          </div>
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
          onStartNewLesson={handleStartNewLesson}
        />
      )}

      {profile && (
        <CurriculumRoadmapModal
          isOpen={showRoadmapModal}
          onClose={() => setShowRoadmapModal(false)}
          profile={profile}
          activePlan={activePlan}
          activeSummary={activeSummary}
          onStartNewLesson={handleStartNewLesson}
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
    </div>
  );
}
