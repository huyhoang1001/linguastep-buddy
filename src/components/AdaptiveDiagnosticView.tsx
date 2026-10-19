import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  PauseCircle,
  FileText,
  Sparkles,
  Clock,
  Mic,
  MicOff,
  Flag,
  BookOpen,
  Layers,
  HelpCircle,
  Check,
  ChevronRight,
  Award
} from 'lucide-react';
import {
  UserProfile,
  Question,
  DiagnosticSession,
  DiagnosticMode,
  AnswerEvaluation,
  WritingRubricScore,
  DiagnosticReport,
  PersonalizedStudyPlan,
  DiagnosticAssessmentPlan
} from '../types/learning.ts';
import { createDiagnosticAssessmentPlan } from '../types/diagnosticPlans.ts';
import {
  getDiagnosticSession,
  startDiagnosticSession,
  getNextDiagnosticQuestion,
  submitDiagnosticAnswer,
  pauseDiagnosticSession,
  completeDiagnosticSession
} from '../services/api.ts';
import { TutorDeepDiveChat } from './TutorDeepDiveChat.tsx';
import { AIErrorAlert } from './AIErrorAlert.tsx';

interface AdaptiveDiagnosticViewProps {
  profile?: UserProfile;
  onAssessmentCompleted: (report: DiagnosticReport, studyPlan: PersonalizedStudyPlan) => void;
  onPaused?: () => void;
}

export const AdaptiveDiagnosticView: React.FC<AdaptiveDiagnosticViewProps> = ({
  profile,
  onAssessmentCompleted,
  onPaused
}) => {
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [startingMode, setStartingMode] = useState<DiagnosticMode | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [lastRubric, setLastRubric] = useState<WritingRubricScore | null>(null);
  const [canStop, setCanStop] = useState<boolean>(false);
  const [mustStop, setMustStop] = useState<boolean>(false);
  const [flagged, setFlagged] = useState<boolean>(false);
  const [pausedMessage, setPausedMessage] = useState<string>('');
  const [aiError, setAiError] = useState<any>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);

  // Section completion transition state
  const [sectionCompletedNotice, setSectionCompletedNotice] = useState<{
    completedSection: string;
    nextSection?: string;
  } | null>(null);

  // Speech recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
    loadExistingSession();
  }, []);

  const loadExistingSession = async () => {
    setIsLoading(true);
    setAiError(null);
    try {
      const data = await getDiagnosticSession();
      if (data.session && data.session.status === 'in_progress') {
        setSession(data.session);
        if (data.session.currentQuestion) {
          setCurrentQuestion(data.session.currentQuestion);
        } else {
          loadNextQuestion();
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setAiError(err);
      setLastFailedAction(() => () => loadExistingSession());
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMode = async (mode: DiagnosticMode) => {
    setStartingMode(mode);
    setAiError(null);
    try {
      const newSession = await startDiagnosticSession(mode, profile);
      setSession(newSession);
      setCurrentQuestion(newSession.currentQuestion || null);
      setUserAnswer('');
      setLastEvaluation(null);
      setLastRubric(null);
      setCanStop(false);
      setMustStop(false);
      setSectionCompletedNotice(null);
    } catch (err) {
      console.error('Failed to start diagnostic:', err);
      setAiError(err);
      setLastFailedAction(() => () => handleStartMode(mode));
    } finally {
      setStartingMode(null);
    }
  };

  const loadNextQuestion = async () => {
    setIsLoading(true);
    setAiError(null);
    setUserAnswer('');
    setLastEvaluation(null);
    setLastRubric(null);
    setFlagged(false);
    setSectionCompletedNotice(null);

    try {
      const data = await getNextDiagnosticQuestion();
      setCurrentQuestion(data.question);
      setSession(data.session);
    } catch (err) {
      console.error('Failed to load next question:', err);
      setAiError(err);
      setLastFailedAction(() => () => loadNextQuestion());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (overrideAnswer?: string) => {
    const ansToUse = overrideAnswer !== undefined ? overrideAnswer : userAnswer;
    if (!currentQuestion || !ansToUse.trim() || isEvaluating) return;
    if (overrideAnswer !== undefined) {
      setUserAnswer(overrideAnswer);
    }

    setIsEvaluating(true);
    setAiError(null);
    try {
      const result = await submitDiagnosticAnswer(currentQuestion, ansToUse);
      setLastEvaluation(result.evaluation);
      if (result.writingRubric) {
        setLastRubric(result.writingRubric);
      }
      setCanStop(result.canStop);
      setMustStop(result.mustStop);

      if (result.isSectionComplete && result.completedSectionName) {
        setSectionCompletedNotice({
          completedSection: result.completedSectionName,
          nextSection: result.nextSectionName
        });
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setAiError(err);
      // Notice: userAnswer is explicitly NOT cleared, preserving student's work
      setLastFailedAction(() => () => handleSubmitAnswer());
    } finally {
      setIsEvaluating(false);
    }
  };

  const handlePause = async () => {
    try {
      await pauseDiagnosticSession();
      setPausedMessage('Assessment progress saved! You can resume whenever you are ready.');
      if (onPaused) onPaused();
    } catch (err) {
      console.error('Failed to pause assessment:', err);
    }
  };

  const handleFinishAssessment = async () => {
    setIsLoading(true);
    setAiError(null);
    try {
      const { report, studyPlan } = await completeDiagnosticSession();
      onAssessmentCompleted(report, studyPlan);
    } catch (err) {
      console.error('Failed to complete assessment:', err);
      setAiError(err);
      setLastFailedAction(() => () => handleFinishAssessment());
    } finally {
      setIsLoading(false);
    }
  };

  const countSentences = (text: string) => {
    if (!text.trim()) return 0;
    const matches = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    return matches ? matches.length : 1;
  };

  const handleToggleVoiceInput = () => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswer(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsRecording(false);
    }
  };

  // ----------------------------------------------------
  // MODE SELECTION SCREEN (TRANSPARENT STRUCTURE & ADVERTISED TIME)
  // ----------------------------------------------------
  if (!session || session.status !== 'in_progress') {
    const quickPlan = createDiagnosticAssessmentPlan('quick');
    const standardPlan = createDiagnosticAssessmentPlan('standard');
    const comprehensivePlan = createDiagnosticAssessmentPlan('comprehensive');

    return (
      <div className="py-6 text-slate-100 space-y-6">
        <div>
          <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
            Official Placement Diagnostic
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Choose Your Diagnostic Assessment Mode
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
            Each mode operates as a real sequential English proficiency exam evaluating <strong>Grammar</strong>, <strong>Vocabulary</strong>, <strong>Reading</strong>, and <strong>Writing</strong>.
            Questions adapt dynamically based on your background and answers to estimate your genuine CEFR benchmark.
          </p>
        </div>

        {pausedMessage && (
          <div className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-2xl text-xs text-emerald-300">
            {pausedMessage}
          </div>
        )}

        {aiError && (
          <AIErrorAlert
            error={aiError}
            onRetry={lastFailedAction || undefined}
            onDismiss={() => setAiError(null)}
          />
        )}

        {/* 3 Explicit Diagnostic Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Quick Mode */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-slate-700 transition shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-sky-400 px-2.5 py-0.5 rounded-full bg-sky-950/60 border border-sky-800/50">
                  Express Calibration
                </span>
                <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>~10 mins</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{quickPlan.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {quickPlan.subtitle}
              </p>

              {/* Section breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Exam Structure:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">1. Grammar</span>
                    <strong className="text-slate-200">3 Qs • ~2.5m</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">2. Vocabulary</span>
                    <strong className="text-slate-200">3 Qs • ~2.5m</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">3. Reading</span>
                    <strong className="text-slate-200">1 Q • ~2m</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">4. Writing</span>
                    <strong className="text-slate-200">1 Q • ~3m</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>Scoring Weights:</span>
                  <span className="text-sky-300 font-mono font-semibold">25% each (100% total)</span>
                </div>
              </div>
            </div>

            <button
              disabled={Boolean(startingMode)}
              onClick={() => handleStartMode('quick')}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              {startingMode === 'quick' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting Express Exam...</span>
                </>
              ) : (
                <span>Start Express (8 Questions • 10m)</span>
              )}
            </button>
          </div>

          {/* 2. Standard Mode (Recommended) */}
          <div className="bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-2xl shadow-indigo-950/60 relative">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500 text-white tracking-widest shadow-md">
              Recommended
            </span>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-indigo-300 px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700">
                  Standard Placement
                </span>
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>~20 mins</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{standardPlan.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {standardPlan.subtitle}
              </p>

              {/* Section breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Exam Structure:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">1. Grammar</span>
                    <strong className="text-white">5 Qs • ~4m</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">2. Vocabulary</span>
                    <strong className="text-white">4 Qs • ~3.5m</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">3. Reading</span>
                    <strong className="text-white">3 Qs • ~5.5m</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">4. Writing</span>
                    <strong className="text-white">1 Task • ~7m</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 pt-1 flex items-center justify-between">
                  <span>Confidence: <strong className="text-emerald-400">High</strong></span>
                  <span className="text-indigo-300 font-mono font-semibold">25% each (100% total)</span>
                </div>
              </div>
            </div>

            <button
              disabled={Boolean(startingMode)}
              onClick={() => handleStartMode('standard')}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
            >
              {startingMode === 'standard' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting Standard Exam...</span>
                </>
              ) : (
                <>
                  <span>Start Standard Exam (13 Questions • 20m)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* 3. Comprehensive Mode */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-slate-700 transition shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/50">
                  Comprehensive Exam
                </span>
                <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>~36 mins</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{comprehensivePlan.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {comprehensivePlan.subtitle}
              </p>

              {/* Section breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Exam Structure:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">1. Grammar</span>
                    <strong className="text-slate-200">8 Qs • ~6.5m</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">2. Vocabulary</span>
                    <strong className="text-slate-200">7 Qs • ~6m</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">3. Reading</span>
                    <strong className="text-slate-200">5 Qs (2 Passages)</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">4. Writing</span>
                    <strong className="text-slate-200">2 Tasks • ~13m</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>Confidence: <strong className="text-amber-400">Very High</strong></span>
                  <span className="text-amber-300 font-mono font-semibold">25% each (100% total)</span>
                </div>
              </div>
            </div>

            <button
              disabled={Boolean(startingMode)}
              onClick={() => handleStartMode('comprehensive')}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              {startingMode === 'comprehensive' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting Comprehensive Exam...</span>
                </>
              ) : (
                <span>Start Comprehensive (22 Questions • 36m)</span>
              )}
            </button>
          </div>
        </div>

        {/* Capability disclosure */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed flex items-start space-x-3">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300 font-semibold block mb-0.5">Honest Proficiency Estimation:</strong>
            All four core literacy skills are evaluated with explicit 25% scoring weights. Speaking and listening will be transparently labeled as <em>Not Assessed</em> until dedicated audio sessions are conducted.
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // IN-PROGRESS EXAM STATE (SEQUENTIAL SECTIONS)
  // ----------------------------------------------------
  const plan = session.plan || createDiagnosticAssessmentPlan(session.mode);
  const totalPlannedQuestions = session.totalQuestions || plan.totalQuestions;
  const historyCount = session.history.length;
  const overallProgressPct = Math.min(100, Math.round((historyCount / totalPlannedQuestions) * 100));

  const currentSection = currentQuestion?.section || plan.sections[session.currentSectionIndex || 0]?.section || 'grammar';
  const activeSectionPlan = plan.sections.find(s => s.section === currentSection) || plan.sections[0];
  const sectionAttemptsCount = session.history.filter(h => h.question.section === currentSection).length;
  const currentSectionIndex = plan.sections.findIndex(s => s.section === currentSection);

  return (
    <div className="py-4 text-slate-100 space-y-6">
      {/* 1. Header with Mode info & Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        {/* Top header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {plan.title}
            </span>
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: ~{plan.targetDurationMinutes} mins</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {(canStop || mustStop || historyCount >= totalPlannedQuestions) && (
              <button
                onClick={handleFinishAssessment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30 flex items-center space-x-1.5"
              >
                <Award className="w-4 h-4" />
                <span>Complete & View Report 🎉</span>
              </button>
            )}

            <button
              onClick={handlePause}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Pause and resume later"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Save & Pause</span>
            </button>
          </div>
        </div>

        {/* 4-Section Sequential Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {plan.sections.map((sec, idx) => {
            const isCompleted = idx < currentSectionIndex || sec.completed;
            const isActive = idx === currentSectionIndex;
            const isUpcoming = idx > currentSectionIndex && !sec.completed;
            const secDoneCount = session.history.filter(h => h.question.section === sec.section).length;

            return (
              <div
                key={sec.section}
                className={`p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500'
                    : isCompleted
                    ? 'bg-slate-800/40 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    Section {idx + 1}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  ) : null}
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate capitalize">
                  {sec.section}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{isCompleted ? `${sec.targetQuestionsCount}/${sec.targetQuestionsCount} done` : isActive ? `${sectionAttemptsCount + 1}/${sec.targetQuestionsCount}` : `${sec.targetQuestionsCount} Qs`}</span>
                  <span className="font-mono text-[10px]">25% wt</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall progress indicator bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Overall Progress: Question {Math.min(totalPlannedQuestions, historyCount + 1)} of {totalPlannedQuestions}</span>
            <span className="font-mono">{overallProgressPct}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${overallProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section Completed Notification Banner (when transitioning) */}
      {sectionCompletedNotice && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-200 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              ✓
            </div>
            <div>
              <strong className="text-emerald-300 font-bold block">
                {sectionCompletedNotice.completedSection} Completed!
              </strong>
              <span>
                {sectionCompletedNotice.nextSection
                  ? `Next up: ${sectionCompletedNotice.nextSection}`
                  : `All sections completed! You can now view your comprehensive diagnostic report.`}
              </span>
            </div>
          </div>
          {sectionCompletedNotice.nextSection && (
            <button
              onClick={loadNextQuestion}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1"
            >
              <span>Continue →</span>
            </button>
          )}
        </div>
      )}

      {/* Error alert for quota exhaustion or temporary errors */}
      {aiError && (
        <AIErrorAlert
          error={aiError}
          onRetry={lastFailedAction || undefined}
          onDismiss={() => setAiError(null)}
          className="mb-4"
        />
      )}

      {/* Active Question Content */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-300 font-medium">Preparing calibrated question for {activeSectionPlan.title}...</p>
        </div>
      ) : currentQuestion ? (
        <div className="space-y-5">
          {/* Question Metadata Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
                <span>{activeSectionPlan.title}</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{currentQuestion.skill_name}</span>
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Level: <strong className="text-slate-200">{currentQuestion.difficulty}</strong> • Item {sectionAttemptsCount + 1} of {activeSectionPlan.targetQuestionsCount}
              </p>
            </div>

            <button
              onClick={() => setFlagged(!flagged)}
              className={`p-1.5 rounded-lg text-xs transition flex items-center space-x-1 ${
                flagged ? 'text-amber-400 bg-amber-950/40' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Flag this question as ambiguous or unclear"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">{flagged ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>

          {/* Reading Passage View (Prominent, High-Readability Passage Box) */}
          {currentQuestion.reading_passage && (
            <div className="bg-slate-900/95 border-2 border-sky-500/30 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-sky-400 font-bold border-b border-slate-800 pb-3">
                <span className="flex items-center space-x-2 text-sm text-white font-bold">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>{currentQuestion.reading_passage.title}</span>
                </span>
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">{currentQuestion.reading_passage.topic}</span>
                  <span>{currentQuestion.reading_passage.word_count} words</span>
                </div>
              </div>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-line">
                {currentQuestion.reading_passage.text}
              </p>
            </div>
          )}

          {/* Question Prompt Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                {currentQuestion.question_type === 'reading_comprehension' ? 'Comprehension Question' : currentQuestion.question_type === 'free_writing' ? 'Writing Task' : 'Question Prompt'}
              </span>
              <p className="text-base md:text-lg font-medium text-white whitespace-pre-line leading-relaxed">
                {currentQuestion.prompt}
              </p>
            </div>

            {/* Context sentence callout if available and distinct from prompt */}
            {currentQuestion.context_sentence &&
              !currentQuestion.prompt.toLowerCase().includes(currentQuestion.context_sentence.toLowerCase().trim()) && (
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 md:p-5 shadow-inner">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Sentence to Complete
                </span>
                <p className="text-base md:text-lg font-medium text-white italic">
                  "{currentQuestion.context_sentence}"
                </p>
              </div>
            )}

            {/* Multiple Choice Options */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map(opt => {
                  const isSelected = userAnswer === opt.id || userAnswer === opt.text ||
                    userAnswer.startsWith(`${opt.id}.`) || userAnswer.startsWith(`${opt.id}:`);
                  const isDisabled = Boolean(lastEvaluation);

                  const isExpectedOpt = Boolean(
                    lastEvaluation && (
                      currentQuestion.expected_answer_ids?.some(id => id.trim().toUpperCase() === opt.id.toUpperCase()) ||
                      lastEvaluation.expected_answer?.toUpperCase().startsWith(opt.id.toUpperCase() + '.') ||
                      lastEvaluation.expected_answer?.toUpperCase().startsWith(opt.id.toUpperCase() + ')') ||
                      lastEvaluation.expected_answer?.toUpperCase() === opt.id.toUpperCase() ||
                      (lastEvaluation.expected_answer && lastEvaluation.expected_answer.trim().toLowerCase() === opt.text.trim().toLowerCase())
                    )
                  );
                  const isWrongSelected = Boolean(lastEvaluation && isSelected && lastEvaluation.verdict !== 'correct');

                  let buttonClass = 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white';
                  let badgeClass = 'bg-slate-700 text-slate-300';

                  if (lastEvaluation) {
                    if (isExpectedOpt) {
                      buttonClass = 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500 text-white';
                      badgeClass = 'bg-emerald-500 text-white font-bold';
                    } else if (isWrongSelected) {
                      buttonClass = 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500 text-white';
                      badgeClass = 'bg-rose-500 text-white font-bold';
                    } else {
                      buttonClass = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                      badgeClass = 'bg-slate-800 text-slate-500';
                    }
                  } else if (isSelected) {
                    buttonClass = 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500 text-white';
                    badgeClass = 'bg-indigo-500 text-white font-bold';
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={isDisabled}
                      onClick={async () => {
                        if (lastEvaluation) return;
                        setUserAnswer(opt.id);
                        await handleSubmitAnswer(opt.id);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between space-x-4 ${buttonClass} ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${badgeClass}`}>
                          {opt.id}
                        </span>
                        <span className="text-sm md:text-base font-medium leading-snug">{opt.text}</span>
                      </div>

                      {lastEvaluation && isExpectedOpt && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
                          ✓ Correct Answer
                        </span>
                      )}
                      {lastEvaluation && isWrongSelected && (
                        <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/30 shrink-0">
                          ✗ Your Choice
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill in the blank input */}
            {currentQuestion.question_type === 'fill_in_blank' && (
              <div>
                <input
                  type="text"
                  disabled={Boolean(lastEvaluation)}
                  placeholder="Type your answer here..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !lastEvaluation && userAnswer.trim()) {
                      handleSubmitAnswer();
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                />
              </div>
            )}

            {/* Free Writing Textarea */}
            {currentQuestion.question_type === 'free_writing' && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={5}
                    disabled={Boolean(lastEvaluation)}
                    placeholder="Write your response in English (e.g. 3 to 5 sentences)..."
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base leading-relaxed"
                  />
                  {speechSupported && !lastEvaluation && (
                    <button
                      onClick={handleToggleVoiceInput}
                      className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={isRecording ? 'Listening (click to stop)' : 'Voice input (Speech-to-Text)'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Sentences: <strong className="text-slate-200">{countSentences(userAnswer)}</strong> (target: 3-4)
                  </span>
                  <span>
                    Word count: <strong className="text-slate-200">{userAnswer.trim().split(/\s+/).filter(Boolean).length}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Submit button (if not evaluated yet) */}
            {!lastEvaluation && (
              <div className="pt-2 flex justify-end">
                <button
                  disabled={!userAnswer.trim() || isEvaluating}
                  onClick={() => handleSubmitAnswer()}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Evaluate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ITEM FEEDBACK STATE (AFTER SUBMISSION) */}
          {lastEvaluation && (
            <div className={`rounded-3xl p-6 md:p-8 border shadow-2xl space-y-5 transition-all ${
              lastEvaluation.verdict === 'correct'
                ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                : lastEvaluation.verdict === 'partially_correct'
                ? 'bg-amber-950/20 border-amber-500/40 text-slate-100'
                : 'bg-rose-950/20 border-rose-500/40 text-slate-100'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {lastEvaluation.verdict === 'correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : lastEvaluation.verdict === 'partially_correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-white capitalize">
                      {lastEvaluation.verdict.replace('_', ' ')}
                    </h4>
                    <span className="text-xs text-slate-400">Answer recorded into diagnostic profile</span>
                  </div>
                </div>

                {/* Next button */}
                {historyCount >= totalPlannedQuestions || mustStop ? (
                  <button
                    onClick={handleFinishAssessment}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30 flex items-center space-x-2"
                  >
                    <span>View Assessment Results 🎉</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={loadNextQuestion}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30 flex items-center space-x-2"
                  >
                    <span>
                      {sectionCompletedNotice?.nextSection
                        ? `Continue to ${sectionCompletedNotice.nextSection} →`
                        : `Next Question (${Math.min(totalPlannedQuestions, historyCount + 1)}/${totalPlannedQuestions}) →`}
                    </span>
                  </button>
                )}
              </div>

              {/* Decisive Clue & Explanation */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                <div>
                  <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">Decisive Clue</span>
                  <p className="text-slate-200 leading-relaxed font-medium">{lastEvaluation.decisive_clue}</p>
                </div>
                {lastEvaluation.contrast_explanation && (
                  <div className="pt-2 border-t border-slate-800 text-rose-300 font-medium leading-relaxed">
                    <span className="text-rose-400 font-bold block mb-0.5">Why your choice was not suitable:</span>
                    <p>{lastEvaluation.contrast_explanation}</p>
                  </div>
                )}
                {lastEvaluation.explanation && !lastEvaluation.contrast_explanation && (
                  <p className="text-slate-400 pt-1 border-t border-slate-800 leading-relaxed">{lastEvaluation.explanation}</p>
                )}
              </div>

              {/* Writing Rubric Breakdown (Scale 1 to 5 across 6 dimensions) */}
              {lastRubric && (
                <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-4 md:p-5 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 block">
                    Writing Rubric Breakdown (Scale 1 to 5)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Grammar Accuracy</span>
                      <strong className="text-emerald-400">{lastRubric.accuracy}/5</strong>
                    </div>
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Vocabulary Range</span>
                      <strong className="text-sky-400">{lastRubric.vocabularyRange}/5</strong>
                    </div>
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Complexity</span>
                      <strong className="text-indigo-300">{lastRubric.sentenceComplexity}/5</strong>
                    </div>
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Coherence</span>
                      <strong className="text-amber-300">{lastRubric.coherence}/5</strong>
                    </div>
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Naturalness</span>
                      <strong className="text-purple-300">{lastRubric.naturalness}/5</strong>
                    </div>
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Task Completion</span>
                      <strong className="text-teal-300">{lastRubric.taskCompletion}/5</strong>
                    </div>
                  </div>

                  {lastRubric.correctedVersion && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Natural Native Phrasing:</span>
                      <p className="text-xs text-indigo-100 italic bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        "{lastRubric.correctedVersion}"
                      </p>
                    </div>
                  )}

                  {lastRubric.keyCorrections && lastRubric.keyCorrections.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-indigo-900/50">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Key Adjustments:</span>
                      {lastRubric.keyCorrections.map((kc, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-rose-400 line-through">{kc.original}</span>
                          <span>→</span>
                          <span className="text-emerald-300 font-semibold">{kc.corrected}</span>
                          <span className="text-slate-400">({kc.reason})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Useful Phrases for Writing or Exercise */}
              {lastEvaluation.useful_phrases && lastEvaluation.useful_phrases.length > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Useful Collocations & Phrases for this Context</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {lastEvaluation.useful_phrases.map((up, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                        <strong className="text-xs text-emerald-300 font-mono block">
                          {typeof up === 'string' ? up : up.phrase}
                        </strong>
                        {typeof up !== 'string' && up.meaning && (
                          <p className="text-[11px] text-slate-300">
                            <span className="text-slate-400">Meaning: </span>{up.meaning}
                          </p>
                        )}
                        {typeof up !== 'string' && up.how_to_use && (
                          <p className="text-[10px] text-slate-400 italic">
                            Tip: {up.how_to_use}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Tutor Deep-Dive Chat (allows asking follow-ups on vocabulary/grammar/writing before moving on) */}
              <TutorDeepDiveChat
                question={currentQuestion}
                userAnswer={userAnswer}
                evaluation={lastEvaluation}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
