import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Volume2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Mic,
  MicOff,
  Flame,
  Check,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Globe
} from 'lucide-react';
import {
  UserProfile,
  LessonPlan,
  Question,
  AnswerEvaluation,
  SectionType,
  TutorAssistantResponse
} from '../types/learning.ts';
import { VocabularyCard } from './VocabularyCard.tsx';
import { TutorDeepDiveChat } from './TutorDeepDiveChat.tsx';
import { AIErrorAlert } from './AIErrorAlert.tsx';
import { ClickableSentenceText } from './ClickableSentenceText.tsx';
import { WordPracticeModal } from './WordPracticeModal.tsx';
import {
  generateQuestion,
  generateFullSessionQuestions,
  evaluateAnswer,
  requestTutorAssist,
  playEnglishSpeech,
  getActiveLessonState,
  saveActiveLessonState,
  clearActiveLessonState
} from '../services/api.ts';
import {
  playCorrectMeowChime,
  playMeowSound,
  playUrgentMeowAlert,
  playTimesUpChime
} from '../services/catSoundService.ts';
import { catCustomizationStore } from '../services/catCustomizationStore.ts';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';

interface LessonViewProps {
  profile: UserProfile;
  plan: LessonPlan;
  onFinishLesson: (
    attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>,
    timeSpentMinutes?: number
  ) => void;
  onOpenSummary: () => void;
  onBuildNextSession?: () => void;
  isBuildingSession?: boolean;
}

export const LessonView: React.FC<LessonViewProps> = ({
  profile,
  plan,
  onFinishLesson,
  onOpenSummary,
  onBuildNextSession,
  isBuildingSession
}) => {
  // Current section & question navigation
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [questionIndexInSection, setQuestionIndexInSection] = useState<number>(0);
  const [isShortSession, setIsShortSession] = useState<boolean>(false);

  const activeSections = isShortSession ? plan.sections.slice(0, 2) : plan.sections;
  const clampedSectionIndex = Math.min(currentSectionIndex, Math.max(0, activeSections.length - 1));
  const activeSectionPlan = activeSections[clampedSectionIndex] || plan.sections[0];
  const currentSection = activeSectionPlan.section;
  const targetQuestionsInSection = activeSectionPlan.target_questions_count || 1;

  // Question & State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(true);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [aiError, setAiError] = useState<any>(null);
  const [assistError, setAssistError] = useState<any>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);
  const [lastAssistAction, setLastAssistAction] = useState<'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity' | null>(null);
  const [activeAssistAction, setActiveAssistAction] = useState<'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity' | null>(null);
  const [activeWordPractice, setActiveWordPractice] = useState<{
    word: string;
    contextSentence: string;
  } | null>(null);

  // Questions pre-generated per section: sectionIndex -> Question[]
  const [questionsBySection, setQuestionsBySection] = useState<Record<number, Question[]>>({});

  // Questions completed per section: sectionIndex -> completed count
  const [sectionProgress, setSectionProgress] = useState<Record<number, number>>({});

  // Lesson attempts accumulation
  const [lessonAttempts, setLessonAttempts] = useState<
    Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>
  >([]);

  // Tutor Assist state
  const [tutorAssistData, setTutorAssistData] = useState<TutorAssistantResponse | null>(null);
  const [isLoadingAssist, setIsLoadingAssist] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Voice recording state for writing/speaking
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  // Active session timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [extraMinutesAdded, setExtraMinutesAdded] = useState<number>(0);
  const [hasWarnedNearlyOut, setHasWarnedNearlyOut] = useState<boolean>(false);
  const [showNearlyOutOfTimeAlert, setShowNearlyOutOfTimeAlert] = useState<boolean>(false);
  const [showTimeOutModal, setShowTimeOutModal] = useState<boolean>(false);
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false);
  const [hurryUpQuote, setHurryUpQuote] = useState<string>('');
  const [catConfig, setCatConfig] = useState(catCustomizationStore.getConfig());

  useEffect(() => {
    const handleThemeChange = () => {
      setCatConfig(catCustomizationStore.getConfig());
    };
    window.addEventListener('meomeo:theme-changed', handleThemeChange);
    return () => window.removeEventListener('meomeo:theme-changed', handleThemeChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Check speech recognition capability
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  // Initialize or resume session with batch pre-loaded questions
  useEffect(() => {
    let isMounted = true;
    async function initOrResume() {
      setIsLoadingQuestion(true);
      setAiError(null);
      try {
        let activePlan = plan;
        // Check if plan has sections missing pregenerated questions
        const isMissingQuestions = !activePlan.sections || activePlan.sections.some(s => !s.questions || s.questions.length < (s.target_questions_count || 1));
        if (isMissingQuestions) {
          try {
            activePlan = await generateFullSessionQuestions(plan);
          } catch (e) {
            console.warn('Batch generation failed, falling back to on-demand generation', e);
          }
        }

        // Build question map from plan sections
        const qMap: Record<number, Question[]> = {};
        if (activePlan.sections) {
          activePlan.sections.forEach((sec, idx) => {
            if (sec.questions && sec.questions.length > 0) {
              qMap[idx] = sec.questions;
            }
          });
        }

        if (isMounted) {
          setQuestionsBySection(qMap);
        }

        // Restore active in-progress lesson state if available
        const saved = await getActiveLessonState();
        if (isMounted && saved && saved.lessonId === plan.lesson_id) {
          const secIdx = saved.currentSectionIndex || 0;
          const qIdx = saved.questionIndexInSection || 0;
          setCurrentSectionIndex(secIdx);
          setQuestionIndexInSection(qIdx);
          setSectionProgress(saved.sectionProgress || {});
          setLessonAttempts(saved.attempts || []);
          setSecondsElapsed(saved.secondsElapsed || 0);

          if (saved.currentQuestion) {
            setCurrentQuestion(saved.currentQuestion);
          } else if (qMap[secIdx] && qMap[secIdx][qIdx]) {
            setCurrentQuestion(qMap[secIdx][qIdx]);
          } else {
            await loadQuestionForSection(secIdx, qIdx, qMap);
          }

          if (saved.lastEvaluation) {
            setEvaluation(saved.lastEvaluation);
            setUserAnswer(saved.lastUserAnswer || '');
          }
        } else {
          // Fresh start
          setCurrentSectionIndex(0);
          setQuestionIndexInSection(0);
          if (qMap[0] && qMap[0][0]) {
            setCurrentQuestion(qMap[0][0]);
          } else {
            await loadQuestionForSection(0, 0, qMap);
          }
        }
      } catch (err) {
        console.warn('Failed to initialize session:', err);
        setAiError(err);
      } finally {
        if (isMounted) {
          setIsLoadingQuestion(false);
        }
      }
    }
    initOrResume();
    return () => { isMounted = false; };
  }, [plan.lesson_id]);

  const loadQuestionForSection = async (sectionIdx: number, qIdx: number, mapOverride?: Record<number, Question[]>) => {
    const mapToUse = mapOverride || questionsBySection;
    if (mapToUse[sectionIdx] && mapToUse[sectionIdx][qIdx]) {
      setCurrentQuestion(mapToUse[sectionIdx][qIdx]);
      setIsLoadingQuestion(false);
      return;
    }

    setIsLoadingQuestion(true);
    setAiError(null);
    setEvaluation(null);
    setUserAnswer('');
    setTutorAssistData(null);
    setShowHint(false);

    const secPlan = plan.sections[sectionIdx] || plan.sections[0];
    try {
      const q = await generateQuestion(
        secPlan.section,
        secPlan.skill_target,
        undefined,
        secPlan.activity_type,
        qIdx,
        secPlan.target_questions_count || 1,
        plan.primary_objective
      );
      
      const updatedMap = {
        ...mapToUse,
        [sectionIdx]: [...(mapToUse[sectionIdx] || []), q]
      };
      setQuestionsBySection(updatedMap);
      setCurrentQuestion(q);

      await saveActiveLessonState({
        lessonId: plan.lesson_id,
        plan,
        currentSectionIndex: sectionIdx,
        questionIndexInSection: qIdx,
        currentQuestion: q,
        lastEvaluation: null,
        lastUserAnswer: '',
        attempts: lessonAttempts,
        sectionProgress,
        status: 'in_progress',
        secondsElapsed,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to load question:', err);
      setAiError(err);
      setLastFailedAction(() => () => loadQuestionForSection(sectionIdx, qIdx));
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // INSTANT ACTIVITY TAB SELECTION
  const handleSelectSection = (targetSecIdx: number) => {
    if (targetSecIdx === currentSectionIndex) return;

    setCurrentSectionIndex(targetSecIdx);
    const targetQIdx = 0;
    setQuestionIndexInSection(targetQIdx);

    const secQuestions = questionsBySection[targetSecIdx] || [];
    if (secQuestions[targetQIdx]) {
      setCurrentQuestion(secQuestions[targetQIdx]);
      setEvaluation(null);
      setUserAnswer('');
      setTutorAssistData(null);
      setShowHint(false);
    } else {
      loadQuestionForSection(targetSecIdx, targetQIdx);
    }
  };

  const handleSubmitAnswer = async (overrideAnswer?: string) => {
    const ansToUse = overrideAnswer !== undefined ? overrideAnswer : userAnswer;
    if (!currentQuestion || !ansToUse.trim()) return;
    if (overrideAnswer !== undefined) {
      setUserAnswer(overrideAnswer);
    }

    setIsSubmitting(true);
    setAiError(null);
    try {
      const result = await evaluateAnswer(currentQuestion, ansToUse, plan.lesson_id);
      setEvaluation(result);

      // Cute Cat Chibi sound feedback
      try {
        const catConfig = catCustomizationStore.getConfig();
        if (catConfig.soundEnabled) {
          if (result.verdict === 'correct' && catConfig.meowOnCorrect) {
            playCorrectMeowChime();
          } else if (result.verdict !== 'correct') {
            playMeowSound(0.85);
          }
        }
      } catch (e) {}

      // Record to lesson attempts
      const updatedAttempts = [
        ...lessonAttempts,
        {
          question: currentQuestion,
          evaluation: result,
          userAnswer
        }
      ];
      setLessonAttempts(updatedAttempts);

      // Record section progress count
      const updatedProgress = {
        ...sectionProgress,
        [currentSectionIndex]: Math.min(
          targetQuestionsInSection,
          (sectionProgress[currentSectionIndex] || 0) + 1
        )
      };
      setSectionProgress(updatedProgress);

      // Persist active in-progress state to local storage immediately
      await saveActiveLessonState({
        lessonId: plan.lesson_id,
        plan,
        currentSectionIndex,
        questionIndexInSection,
        currentQuestion,
        lastEvaluation: result,
        lastUserAnswer: userAnswer,
        attempts: updatedAttempts,
        sectionProgress: updatedProgress,
        status: 'in_progress',
        secondsElapsed,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to evaluate answer:', err);
      setAiError(err);
      // Explicitly preserve userAnswer so learner does not lose writing / progress!
      setLastFailedAction(() => () => handleSubmitAnswer());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTutorAction = async (action: 'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity') => {
    if (!currentQuestion || isLoadingAssist) return;
    setLastAssistAction(action);
    if (action === 'hint' && currentQuestion.hint) {
      setShowHint(!showHint);
      return;
    }
    setActiveAssistAction(action);
    setIsLoadingAssist(true);
    setAssistError(null);
    try {
      const res = await requestTutorAssist(currentQuestion, action);
      setTutorAssistData(res);
      if (action === 'hint') {
        setShowHint(true);
      }
    } catch (err) {
      console.error('Tutor assist error:', err);
      setAssistError(err);
    } finally {
      setIsLoadingAssist(false);
      setActiveAssistAction(null);
    }
  };

  const handleNextQuestionOrSection = async () => {
    const activeSections = isShortSession ? plan.sections.slice(0, 2) : plan.sections;
    const currentQArr = questionsBySection[currentSectionIndex] || [];
    const totalQInSec = currentQArr.length > 0 ? currentQArr.length : targetQuestionsInSection;
    
    const isLastQInSec = questionIndexInSection >= totalQInSec - 1;
    const isLastSec = currentSectionIndex >= activeSections.length - 1;

    if (!isLastQInSec) {
      // Advance to next question within the same activity/section (0ms INSTANT)
      const nextQIdx = questionIndexInSection + 1;
      setQuestionIndexInSection(nextQIdx);
      if (currentQArr[nextQIdx]) {
        setCurrentQuestion(currentQArr[nextQIdx]);
        setEvaluation(null);
        setUserAnswer('');
        setTutorAssistData(null);
        setShowHint(false);
      } else {
        loadQuestionForSection(currentSectionIndex, nextQIdx);
      }
    } else if (!isLastSec) {
      // Advance to next section/activity (0ms INSTANT)
      const nextSecIdx = currentSectionIndex + 1;
      setCurrentSectionIndex(nextSecIdx);
      setQuestionIndexInSection(0);

      const nextSecQArr = questionsBySection[nextSecIdx] || [];
      if (nextSecQArr[0]) {
        setCurrentQuestion(nextSecQArr[0]);
        setEvaluation(null);
        setUserAnswer('');
        setTutorAssistData(null);
        setShowHint(false);
      } else {
        loadQuestionForSection(nextSecIdx, 0);
      }
    } else {
      // Done with all planned sections - clear active lesson and finalize
      await clearActiveLessonState();
      const timeSpent = Math.max(1, Math.round(secondsElapsed / 60));
      onFinishLesson(lessonAttempts, timeSpent);
    }
  };

  const handleFinishEarly = async () => {
    await clearActiveLessonState();
    const timeSpent = Math.max(1, Math.round(secondsElapsed / 60));
    onFinishLesson(lessonAttempts, timeSpent);
  };

  const handleRetryQuestion = () => {
    setEvaluation(null);
    setUserAnswer('');
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
      console.warn('Speech recognition start error:', err);
      setIsRecording(false);
    }
  };

  const countSentences = (text: string) => {
    if (!text.trim()) return 0;
    const matches = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    return matches ? matches.length : 1;
  };

  const totalPlannedQuestions = activeSections.reduce(
    (sum, s) => sum + (s.target_questions_count || 1),
    0
  );
  const totalAnsweredCount = lessonAttempts.length;
  const progressPercent = Math.min(
    100,
    Math.round((totalAnsweredCount / (totalPlannedQuestions || 1)) * 100)
  );
  const durationTarget = (plan.estimated_duration_minutes || profile.daily_minutes || 20) + extraMinutesAdded;
  const targetSeconds = durationTarget * 60;
  const remainingSeconds = Math.max(0, targetSeconds - secondsElapsed);
  const isNearlyOut = remainingSeconds <= 60 && remainingSeconds > 0;
  const paceMode = plan.session_pace_mode || (durationTarget <= 12 ? 'quick_10' : durationTarget >= 25 ? 'deep_30' : 'standard_20');

  useEffect(() => {
    // 1. Nearly out of time: Trigger once when <= 60 seconds remaining
    if (remainingSeconds <= 60 && remainingSeconds > 0 && !hasWarnedNearlyOut && secondsElapsed >= 5) {
      setHasWarnedNearlyOut(true);
      setShowNearlyOutOfTimeAlert(true);
      const quotes = [
        'Meo meo! ⏰ Sắp hết giờ rồi sen ơi, chỉ còn 1 phút thôi! Vồ lấy điểm số như vồ chuột nào! 🐟💨',
        'Đồng hồ điểm tic-tac! ⏳ Còn 60 giây nữa, tập trung vuốt đáp án chuẩn xác về đích nào! 🐱⚡',
        'Nhanh lên sen ơi! Đừng để đĩa cá thơm vàng bị nguội, vuốt đáp án chớp nhoáng nào! 🐾🏆',
        'Tốc độ bàn chân mèo kích hoạt! 🚀 Một cú nước rút cuối cùng để chốt trọn vẹn điểm số hôm nay! Meow!'
      ];
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      setHurryUpQuote(q);

      try {
        const currentCfg = catCustomizationStore.getConfig();
        if (currentCfg.soundEnabled) {
          playUrgentMeowAlert();
        }
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('meomeo:hurry-up', { detail: { quote: q } }));
      }
    }

    // 2. Time expired: Trigger modal when target seconds reached
    if (remainingSeconds === 0 && !isTimeExpired && secondsElapsed >= targetSeconds && secondsElapsed >= 5) {
      setIsTimeExpired(true);
      setShowTimeOutModal(true);
      setShowNearlyOutOfTimeAlert(false);

      try {
        const currentCfg = catCustomizationStore.getConfig();
        if (currentCfg.soundEnabled) {
          playTimesUpChime();
        }
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('meomeo:time-up', {
          detail: { quote: '⏰ Hết giờ học rồi meow! Hoàn thành xuất sắc hôm nay, nghỉ ngơi xíu nào sen ơi 🐾💤' }
        }));
      }
    }
  }, [secondsElapsed, remainingSeconds, hasWarnedNearlyOut, isTimeExpired, targetSeconds]);

  const getSectionTitle = (type: SectionType) => {
    return activeSectionPlan.title || `Part ${currentSectionIndex + 1} — ${type.toUpperCase()}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top lesson pace & duration banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
              paceMode === 'quick_10'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : paceMode === 'deep_30'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}>
              <span>
                {paceMode === 'quick_10'
                  ? '⚡ 10-Min Quick Practice'
                  : paceMode === 'deep_30'
                  ? '🔬 30-Min Deep Practice'
                  : '🎯 20-Min Standard Practice'}
              </span>
            </span>

            <div className={`flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-xl border transition-all ${
              isNearlyOut
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 animate-pulse ring-1 ring-rose-500/50'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${isNearlyOut ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{formatTimer(secondsElapsed)}</span>
              <span className="text-slate-500">/ ~{durationTarget}m target</span>
              {extraMinutesAdded > 0 && (
                <span className="text-amber-400 font-bold ml-1">(+{extraMinutesAdded}m)</span>
              )}
              {isNearlyOut && (
                <span className="text-rose-400 font-bold ml-1 animate-bounce">
                  (Còn {remainingSeconds}s! 🐾)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const nextIsShort = !isShortSession;
                setIsShortSession(nextIsShort);
                const nextActiveSections = nextIsShort ? plan.sections.slice(0, 2) : plan.sections;
                if (currentSectionIndex >= nextActiveSections.length) {
                  const newSecIdx = nextActiveSections.length - 1;
                  setCurrentSectionIndex(newSecIdx);
                  setQuestionIndexInSection(0);
                  loadQuestionForSection(newSecIdx, 0);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                isShortSession
                  ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle shortened 2-part session"
            >
              {isShortSession ? '⚡ Shortened (Active)' : '⚡ Shorten today'}
            </button>



            <button
              onClick={handleFinishEarly}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Pause and complete lesson now"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Finish early</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">
              Activity {currentSectionIndex + 1} of {activeSections.length}:{' '}
              <strong className="text-white">{activeSectionPlan.title}</strong>
            </span>
            <span className="text-indigo-300 font-bold">
              Question {Math.min(totalPlannedQuestions, totalAnsweredCount + (evaluation ? 0 : 1))} of {totalPlannedQuestions} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Section Tabs with Questions Completed Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          {activeSections.map((sec, idx) => {
            const isActive = idx === currentSectionIndex;
            const targetCount = sec.target_questions_count || 1;
            const doneCount = sectionProgress[idx] || 0;
            const isSecDone = doneCount >= targetCount;

            return (
              <button
                key={idx}
                onClick={() => handleSelectSection(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : isSecDone
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:text-slate-200'
                }`}
              >
                {isSecDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-700/80 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                )}
                <span>{sec.title.split('—')[1] ? sec.title.split('—')[1].trim() : sec.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-indigo-700 text-indigo-100'
                      : isSecDone
                      ? 'bg-emerald-900/60 text-emerald-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {doneCount}/{targetCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MeoMeo Fun Urgency Encouragement Banner */}
      {showNearlyOutOfTimeAlert && remainingSeconds > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 shadow-2xl animate-bounce-short relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="shrink-0 relative">
                <CatChibiAvatar
                  companionId={catConfig.companionId}
                  accessoryId={catConfig.accessoryId}
                  mood="excited"
                  size="md"
                />
                <span className="absolute -top-1 -right-1 text-sm animate-spin">⏰</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-400/50 flex items-center space-x-1">
                    <span>🐾</span>
                    <span>{catConfig.catName} Cổ Vũ Tăng Tốc!</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
                    ⏳ Còn {remainingSeconds}s
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                  "{hurryUpQuote}"
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNearlyOutOfTimeAlert(false)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold transition shadow-md flex items-center justify-center space-x-1.5 shrink-0"
              title="Tăng tốc làm bài"
            >
              <span>Cố lên MeoMeo! 💨</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Question / Teaching Area */}
      {aiError && (
        <AIErrorAlert
          error={aiError}
          onRetry={lastFailedAction || undefined}
          onDismiss={() => setAiError(null)}
        />
      )}

      {isLoadingQuestion ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h3 className="text-base font-semibold text-white">⚡ Preparing today's cohesive session...</h3>
            <p className="text-xs text-slate-400 mt-1">
              Pre-loading all activities for instant, lag-free practice
            </p>
          </div>
        </div>
      ) : !currentQuestion ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
          <AIErrorAlert
            error={aiError || 'Unable to generate question.'}
            onRetry={lastFailedAction || (() => loadQuestionForSection(currentSectionIndex, questionIndexInSection))}
            onDismiss={() => setAiError(null)}
            className="w-full max-w-xl"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section Heading & Target */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {getSectionTitle(currentSection)}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {currentQuestion.skill_name}
              </h2>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-medium">
                {currentQuestion.context_topic === 'workplace_tech' ? '💼 Workplace / Tech' : '🌱 General'}
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-[11px]">
                {currentQuestion.difficulty}
              </span>
            </div>
          </div>

          {/* Grammar Concept Intro (if present) */}
          {currentQuestion.concept_intro && (
            <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-4 text-xs text-indigo-200 flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-300 font-semibold block mb-0.5">Key Concept</strong>
                <p className="leading-relaxed">{currentQuestion.concept_intro}</p>
              </div>
            </div>
          )}



          {/* Reading Passage (if present) */}
          {currentQuestion.reading_passage && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{currentQuestion.reading_passage.title}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {currentQuestion.reading_passage.word_count} words
                </span>
              </div>
              <div className="text-sm md:text-base leading-relaxed text-slate-200 font-normal">
                <ClickableSentenceText
                  text={currentQuestion.reading_passage.text}
                  onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                />
              </div>
            </div>
          )}

          {/* Error alert for answer evaluation or question failure */}
          {aiError && (
            <AIErrorAlert
              error={aiError}
              onRetry={lastFailedAction || undefined}
              onDismiss={() => setAiError(null)}
              className="mb-4"
            />
          )}

          {/* Question Card: ONE QUESTION AT A TIME */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl text-slate-100 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Question
                </span>
                <span className="text-[10px] text-sky-400/80 font-medium flex items-center space-x-1">
                  <span>💡 Click any word to learn & practice</span>
                </span>
              </div>
              <div className="text-base md:text-lg font-medium text-white whitespace-pre-line leading-relaxed">
                <ClickableSentenceText
                  text={currentQuestion.prompt}
                  onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                />
              </div>
            </div>

            {/* Context sentence callout if available and distinct from prompt */}
            {currentQuestion.context_sentence &&
              !currentQuestion.prompt.toLowerCase().includes(currentQuestion.context_sentence.toLowerCase().trim()) && (
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 md:p-5 shadow-inner">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Sentence to Complete
                </span>
                <div className="text-base md:text-lg font-medium text-white italic">
                  "<ClickableSentenceText
                    text={currentQuestion.context_sentence}
                    onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                  />"
                </div>
              </div>
            )}

            {/* Multiple Choice Options */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map(opt => {
                  const isSelected = userAnswer === opt.id || userAnswer === opt.text ||
                    userAnswer.startsWith(`${opt.id}.`) || userAnswer.startsWith(`${opt.id}:`);
                  const isDisabled = Boolean(evaluation);

                  const isExpectedOpt = Boolean(
                    evaluation && (
                      currentQuestion.expected_answer_ids?.some(id => id.trim().toUpperCase() === opt.id.toUpperCase()) ||
                      evaluation.expected_answer?.toUpperCase().startsWith(opt.id.toUpperCase() + '.') ||
                      evaluation.expected_answer?.toUpperCase().startsWith(opt.id.toUpperCase() + ')') ||
                      evaluation.expected_answer?.toUpperCase() === opt.id.toUpperCase() ||
                      (evaluation.expected_answer && evaluation.expected_answer.trim().toLowerCase() === opt.text.trim().toLowerCase())
                    )
                  );
                  const isWrongSelected = Boolean(evaluation && isSelected && evaluation.verdict !== 'correct');

                  let buttonClass = 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white';
                  let badgeClass = 'bg-slate-700 text-slate-300';

                  if (evaluation) {
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
                    buttonClass = 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500 text-white';
                    badgeClass = 'bg-indigo-500 text-white font-bold';
                  }

                  return (
                    <div
                      key={opt.id}
                      role="button"
                      tabIndex={isDisabled ? -1 : 0}
                      aria-disabled={isDisabled}
                      onClick={async () => {
                        if (evaluation) return;
                        setUserAnswer(opt.id);
                        await handleSubmitAnswer(opt.id);
                      }}
                      onKeyDown={async (e) => {
                        if (evaluation || isDisabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setUserAnswer(opt.id);
                          await handleSubmitAnswer(opt.id);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between space-x-4 ${buttonClass} ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${badgeClass}`}>
                          {opt.id}
                        </span>
                        <span className="text-sm md:text-base font-medium">
                          <ClickableSentenceText
                            text={opt.text}
                            contextSentence={currentQuestion.context_sentence || currentQuestion.prompt}
                            onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                          />
                        </span>
                      </div>

                      {evaluation && isExpectedOpt && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
                          ✓ Correct Answer
                        </span>
                      )}
                      {evaluation && isWrongSelected && (
                        <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/30 shrink-0">
                          ✗ Your Choice
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fill in the blank text input */}
            {currentQuestion.question_type === 'fill_in_blank' && (
              <div>
                <input
                  type="text"
                  disabled={Boolean(evaluation)}
                  placeholder="Type your answer here..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !evaluation && userAnswer.trim()) {
                      handleSubmitAnswer();
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Free Writing / Speaking Textarea */}
            {currentQuestion.question_type === 'free_writing' && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={4}
                    disabled={Boolean(evaluation)}
                    placeholder="Write 2 to 3 sentences in English..."
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base leading-relaxed"
                  />
                  {speechSupported && !evaluation && (
                    <button
                      onClick={handleToggleVoiceInput}
                      className={`absolute right-3 bottom-3 p-2 rounded-xl transition ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={isRecording ? 'Listening (click to stop)' : 'Speak your answer (Speech-to-Text)'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Sentences: <strong className="text-slate-200">{countSentences(userAnswer)}</strong> (target: 2-3)</span>
                  {speechSupported && (
                    <span className="text-[11px] text-slate-500">
                      Mic uses browser voice dictation
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Answer submission button (if not evaluated yet) */}
            {!evaluation && (
              <div className="pt-2 flex justify-end">
                <button
                  disabled={!userAnswer.trim() || isSubmitting}
                  onClick={() => handleSubmitAnswer()}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <span>Check Answer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Tutor Controls: Hint, Simplify, Example, Ambiguous */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">Tutor Assistance:</span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('hint')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
              >
                {isLoadingAssist && activeAssistAction === 'hint' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'hint'
                    ? 'Getting hint...'
                    : showHint
                    ? 'Hide Hint'
                    : 'I need a hint'}
                </span>
              </button>

              <button
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('simpler_explanation')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
              >
                {isLoadingAssist && activeAssistAction === 'simpler_explanation' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'simpler_explanation'
                    ? 'Explaining simply...'
                    : 'Explain it more simply'}
                </span>
              </button>

              <button
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('another_example')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
              >
                {isLoadingAssist && activeAssistAction === 'another_example' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'another_example'
                    ? 'Generating example...'
                    : 'Give me another example'}
                </span>
              </button>

              <button
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('clarify_ambiguity')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5 text-slate-400 hover:text-slate-200"
              >
                {isLoadingAssist && activeAssistAction === 'clarify_ambiguity' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'clarify_ambiguity'
                    ? 'Clarifying...'
                    : 'This seems ambiguous'}
                </span>
              </button>
            </div>

            {/* In-Flight Loading Status Notification Banner */}
            {isLoadingAssist && activeAssistAction && (
              <div className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-indigo-200 animate-pulse mt-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                <span className="font-medium">
                  {activeAssistAction === 'simpler_explanation' && 'AI Tutor is crafting a simpler, clearer explanation...'}
                  {activeAssistAction === 'another_example' && 'AI Tutor is generating another realistic contextual example...'}
                  {activeAssistAction === 'clarify_ambiguity' && 'AI Tutor is analyzing this question to clarify any ambiguity...'}
                  {activeAssistAction === 'hint' && 'AI Tutor is preparing a helpful clue...'}
                </span>
              </div>
            )}

            {/* Tutor Assist Error Alert */}
            {assistError && (
              <AIErrorAlert
                error={assistError}
                onRetry={lastAssistAction ? () => handleTutorAction(lastAssistAction) : undefined}
                onDismiss={() => setAssistError(null)}
                compact
                className="mt-3 w-full"
              />
            )}
          </div>

          {/* Hint Dropdown */}
          {showHint && currentQuestion.hint && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 text-xs text-amber-200 flex items-start space-x-3">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-semibold block mb-0.5">Gentle Clue:</strong>
                <p>{currentQuestion.hint}</p>
              </div>
            </div>
          )}

          {/* Tutor Assist Live Response Drawer */}
          {tutorAssistData && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 text-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-300">
                <span>Tutor Note</span>
                <button
                  onClick={() => setTutorAssistData(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{tutorAssistData.content}</p>
              {tutorAssistData.example_sentence && (
                <div className="mt-2 bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-100 italic">
                  "{tutorAssistData.example_sentence}"
                </div>
              )}
            </div>
          )}

          {/* FEEDBACK STATE: AFTER ANSWER IS SUBMITTED */}
          {evaluation && (
            <div className={`rounded-3xl p-6 md:p-8 border shadow-2xl space-y-5 transition-all ${
              evaluation.verdict === 'correct'
                ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                : evaluation.verdict === 'partially_correct'
                ? 'bg-amber-950/20 border-amber-500/40 text-slate-100'
                : evaluation.verdict === 'ambiguous'
                ? 'bg-sky-950/20 border-sky-500/40 text-slate-100'
                : 'bg-rose-950/20 border-rose-500/40 text-slate-100'
            }`}>
              {/* Verdict header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  {evaluation.verdict === 'correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : evaluation.verdict === 'partially_correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  ) : evaluation.verdict === 'ambiguous' ? (
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white capitalize">
                      {evaluation.verdict.replace('_', ' ')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {evaluation.verdict === 'correct'
                        ? 'Accurate and natural usage.'
                        : 'Review the decisive rule and example below.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete Correct Sentence & Meaning Translation */}
              {evaluation.full_correct_sentence && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">
                      Complete Sentence
                    </span>
                    <button
                      onClick={() => playEnglishSpeech(evaluation.full_correct_sentence.replace(/\*/g, ''))}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
                      title="Listen to full correct sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Listen</span>
                    </button>
                  </div>

                  <div className="text-base font-semibold text-white leading-relaxed">
                    <ClickableSentenceText
                      text={evaluation.full_correct_sentence}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>

                  {/* Sentence Meaning / Translation */}
                  {(evaluation.sentence_translation || currentQuestion?.sentence_translation || currentQuestion?.vocab_card?.meaning) && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-xs text-slate-300">
                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                          Ý nghĩa câu / Sentence Meaning:
                        </span>
                        <div className="text-slate-200 italic font-medium leading-relaxed">
                          <ClickableSentenceText
                            text={evaluation.sentence_translation || currentQuestion?.sentence_translation || currentQuestion?.vocab_card?.meaning || ''}
                            contextSentence={evaluation.full_correct_sentence || currentQuestion?.context_sentence || currentQuestion?.prompt}
                            onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contrast explanation for distractors */}
              {evaluation.contrast_explanation && (
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200 leading-relaxed">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block mb-1">
                    Why your choice was not suitable
                  </span>
                  <div>
                    <ClickableSentenceText
                      text={evaluation.contrast_explanation}
                      contextSentence={currentQuestion?.context_sentence || currentQuestion?.prompt}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>
                </div>
              )}

              {/* Single Clear Explanation (No Duplicate Decisive Clue) */}
              {evaluation.explanation && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 block mb-1">
                    Explanation
                  </span>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                    <ClickableSentenceText
                      text={evaluation.explanation}
                      contextSentence={evaluation.full_correct_sentence || currentQuestion?.context_sentence || currentQuestion?.prompt}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>
                </div>
              )}

              {/* Writing specific feedback: Natural version + corrections */}
              {evaluation.corrected_text && (
                <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-4 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 block">
                    Natural Native Phrasing (Preserving your voice)
                  </span>
                  <p className="text-sm text-indigo-100 italic">
                    "{evaluation.corrected_text}"
                  </p>

                  {evaluation.key_corrections && evaluation.key_corrections.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-indigo-900/50">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Key Adjustments:</span>
                      {evaluation.key_corrections.map((kc, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-rose-400 line-through">{kc.original}</span>
                          <span>→</span>
                          <span className="text-emerald-300 font-semibold">{kc.corrected}</span>
                          <span className="text-slate-400">({kc.reason})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {evaluation.reusable_pattern && (
                    <div className="pt-2 text-xs text-amber-300">
                      <strong>Reusable Pattern: </strong>
                      <code>{evaluation.reusable_pattern}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Useful Phrases for your Passage / Exercise */}
              {evaluation.useful_phrases && evaluation.useful_phrases.length > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 space-y-2.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Useful Collocations & Phrases for this Context</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {evaluation.useful_phrases.map((up, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span className="text-emerald-300 font-mono">{typeof up === 'string' ? up : up.phrase}</span>
                        </div>
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



              {/* Revealed Vocabulary Card & Usage Notes (Shown AFTER answering) */}
              {currentQuestion.vocab_card && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 block mb-3">
                    Vocabulary Learning Card & Definitions (Revealed)
                  </span>
                  <VocabularyCard vocab={currentQuestion.vocab_card} />
                </div>
              )}

              {/* Reinforcement Prompt (Shown AFTER answering) */}
              {currentQuestion.reinforcement_prompt && (
                <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-4 space-y-2 mt-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reinforcement & Further Application</span>
                  </span>
                  <p className="text-sm text-slate-200">
                    <strong className="text-indigo-200">Secondary Context:</strong> "{currentQuestion.reinforcement_prompt.secondary_context}"
                  </p>
                  <p className="text-sm text-slate-200">
                    <strong className="text-indigo-200">Application Tip:</strong> {currentQuestion.reinforcement_prompt.application_prompt} — {currentQuestion.reinforcement_prompt.expected_usage_tip}
                  </p>
                </div>
              )}

              {/* Interactive Tutor Deep-Dive Chat: Ask more & explore nuances before moving on */}
              <TutorDeepDiveChat
                question={currentQuestion}
                userAnswer={userAnswer}
                evaluation={evaluation}
              />

              {/* Action buttons: Next question / Retry */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                {evaluation.verdict !== 'correct' ? (
                  <button
                    onClick={handleRetryQuestion}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                ) : <div />}

                <button
                  onClick={handleNextQuestionOrSection}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
                >
                  <span>
                    {questionIndexInSection < targetQuestionsInSection - 1
                      ? `Next Question in Part ${currentSectionIndex + 1} (${questionIndexInSection + 2}/${targetQuestionsInSection}) →`
                      : currentSectionIndex < activeSections.length - 1
                      ? `Next Activity: ${activeSections[currentSectionIndex + 1]?.title.split('—')[1] ? activeSections[currentSectionIndex + 1]?.title.split('—')[1].trim() : activeSections[currentSectionIndex + 1]?.title} →`
                      : 'Complete Lesson & View Summary 🎉'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dedicated Word Learning & Micro-Practice Modal */}
      {activeWordPractice && (
        <WordPracticeModal
          word={activeWordPractice.word}
          contextSentence={activeWordPractice.contextSentence}
          examMajor={profile.major_or_subject || 'General Professional English'}
          currentQuestionIndex={questionIndexInSection + 1}
          totalQuestions={targetQuestionsInSection}
          onClose={() => setActiveWordPractice(null)}
        />
      )}

      {/* Time's Up Modal: End with Summary or Continue / Take Break Tomorrow */}
      {showTimeOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Decorative top paws & cat avatar */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="relative">
                <CatChibiAvatar
                  companionId={catConfig.companionId}
                  accessoryId={catConfig.accessoryId}
                  mood="happy"
                  size="lg"
                />
                <span className="absolute -top-2 -right-2 text-2xl animate-bounce">⏰</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
                🐾 Meo Meo Thông Báo 🐾
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Hết Giờ Quy Định Hôm Nay Rồi! ⏰✨
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Sen đã hoàn thành xuất sắc mục tiêu <strong>{durationTarget} phút</strong> học hôm nay cùng {catConfig.catName}!
              </p>
            </div>

            {/* Mini Session Achievement Pill Box */}
            <div className="grid grid-cols-3 gap-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Thời gian</span>
                <strong className="text-sm font-bold text-amber-300">{durationTarget}m</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Câu đã làm</span>
                <strong className="text-sm font-bold text-sky-300">{lessonAttempts.length} câu</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Thưởng cá</span>
                <strong className="text-sm font-bold text-emerald-300">+2 🐟</strong>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              "Giờ sen muốn nghỉ ngơi giữ streak để mèo ru ngủ, hay cộng thêm 5 phút học tiếp nào? Meow~"
            </p>

            {/* Choice Buttons */}
            <div className="space-y-3 pt-1">
              {/* Choice 1: Take a Break & View Summary */}
              <button
                onClick={async () => {
                  setShowTimeOutModal(false);
                  await clearActiveLessonState();
                  const timeSpent = Math.max(1, Math.round(secondsElapsed / 60));
                  onFinishLesson(lessonAttempts, timeSpent);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">😴</span>
                  <div className="text-left">
                    <span className="block font-bold">Nghỉ Ngơi & Mai Tiếp Tục 🐟</span>
                    <span className="text-[11px] text-emerald-200 font-normal">Xem tổng kết thành tích & lưu streak hôm nay</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Choice 2: Continue Studying (+5m) */}
              <button
                onClick={() => {
                  setShowTimeOutModal(false);
                  setExtraMinutesAdded(prev => prev + 5);
                  setIsTimeExpired(false);
                  setHasWarnedNearlyOut(false);
                  setShowNearlyOutOfTimeAlert(false);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-amber-400/50 hover:border-amber-400 text-white font-bold text-sm transition flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">⚡</span>
                  <div className="text-left">
                    <span className="block font-bold text-amber-300">Cộng Thêm 5 Phút & Học Tiếp 🐾</span>
                    <span className="text-[11px] text-slate-300 font-normal">Đang hăng say, giải nốt các câu hỏi hôm nay!</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
