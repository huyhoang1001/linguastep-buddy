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
  Check,
  PauseCircle,
  ChevronDown,
  FileText,
  Loader2,
  Globe,
  Home
} from 'lucide-react';
import {
  UserProfile,
  LessonPlan,
  Question,
  AnswerEvaluation,
  SectionType,
  TutorAssistantResponse
} from '../types/learning.ts';
import { isAutoAssessQuestion, AUTO_SUBMIT_NOTE } from '../utils/submissionPolicy.ts';
import { VocabularyCard } from './VocabularyCard.tsx';
import { TutorDeepDiveChat } from './TutorDeepDiveChat.tsx';
import { AIErrorAlert } from './AIErrorAlert.tsx';
import { ClickableSentenceText } from './ClickableSentenceText.tsx';
import { WordPracticeModal } from './WordPracticeModal.tsx';
import { AppButton } from './ui/index.ts';
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
  onReturnHome?: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  profile,
  plan,
  onFinishLesson,
  onReturnHome
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
  const [showMobileActivities, setShowMobileActivities] = useState<boolean>(false);

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
    if (!currentQuestion || !ansToUse.trim() || isSubmitting || Boolean(evaluation)) return;
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
          userAnswer: ansToUse
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
        lastUserAnswer: ansToUse,
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
      setLastFailedAction(() => () => handleSubmitAnswer(ansToUse));
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

      // Auto-finish lesson after a short delay to let the chime play
      setTimeout(() => {
        handleFinishEarly();
      }, 1500);
    }
  }, [secondsElapsed, remainingSeconds, hasWarnedNearlyOut, isTimeExpired, targetSeconds]);

  const getSectionTitle = (type: SectionType) => {
    return activeSectionPlan.title || `Part ${currentSectionIndex + 1} — ${type.toUpperCase()}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top lesson pace & duration banner */}
      <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-5 shadow-xs space-y-4 text-[#2D312E] dark:text-[#F4F2EC]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] text-[#1B4332] dark:text-[#84A98C] flex items-center space-x-1.5">
              <span>
                {paceMode === 'quick_10'
                  ? '10-Min Quick Practice'
                  : paceMode === 'deep_30'
                  ? '30-Min Deep Practice'
                  : '20-Min Standard Practice'}
              </span>
            </span>

            <div className={`flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-xl border transition-all ${
              isNearlyOut
                ? 'bg-[#FDF0ED] dark:bg-[#32201C] border-[#E07A5F] text-[#B84728] dark:text-[#F28482] animate-pulse'
                : 'bg-[#FAF7F2] dark:bg-[#252C27] border-[#EBE4D7] dark:border-[#354037] text-[#5C645E] dark:text-[#A7ABA4]'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${isNearlyOut ? 'bg-[#E07A5F] animate-ping' : 'bg-[#52B788]'}`} />
              <span>{formatTimer(secondsElapsed)}</span>
              <span className="text-[#8A938C] dark:text-[#8E978F]">/ ~{durationTarget}m target</span>
              {extraMinutesAdded > 0 && (
                <span className="text-[#E9A825] font-bold ml-1">(+{extraMinutesAdded}m)</span>
              )}
              {isNearlyOut && (
                <span className="text-[#E07A5F] font-bold ml-1 animate-bounce">
                  (Còn {remainingSeconds}s! 🐾)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onReturnHome && (
              <button
                type="button"
                onClick={onReturnHome}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white bg-[#FAF7F2] dark:bg-[#252C27] hover:bg-[#EFF6F1] dark:hover:bg-[#2E3831] border border-[#EBE4D7] dark:border-[#354037] transition cursor-pointer"
                title="Pause and return to home desk"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Desk</span>
              </button>
            )}

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
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isShortSession
                  ? 'bg-[#FEF7E6] dark:bg-[#342A1D] border-[#F5DC9A] text-[#D48B16]'
                  : 'bg-[#FAF7F2] dark:bg-[#252C27] border-[#EBE4D7] dark:border-[#354037] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
              }`}
              title="Toggle shortened 2-part session"
            >
              {isShortSession ? 'Shortened' : 'Shorten'}
            </button>

            <button
              onClick={handleFinishEarly}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white bg-[#FAF7F2] dark:bg-[#252C27] hover:bg-[#EFF6F1] dark:hover:bg-[#2E3831] border border-[#EBE4D7] dark:border-[#354037] transition cursor-pointer"
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
            <span className="text-[#5C645E] dark:text-[#A7ABA4] font-medium">
              Activity {currentSectionIndex + 1} of {activeSections.length}:{' '}
              <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{activeSectionPlan.title}</strong>
            </span>
            <span className="text-[#2D6A4F] dark:text-[#52B788] font-bold">
              Question {Math.min(totalPlannedQuestions, totalAnsweredCount + (evaluation ? 0 : 1))} of {totalPlannedQuestions} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#FAF7F2] dark:bg-[#161A17] border border-[#EBE4D7] dark:border-[#2C332E] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2D6A4F] dark:bg-[#52B788] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Responsive Activity Stepper Tracker */}
        <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#2C332E]">
          {/* Desktop & Tablet Grid Stepper */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-2">
            {activeSections.map((sec, idx) => {
              const isActive = idx === currentSectionIndex;
              const targetCount = sec.target_questions_count || 1;
              const doneCount = sectionProgress[idx] || 0;
              const isSecDone = doneCount >= targetCount;
              const rawTitle = sec.title.split('—')[1] ? sec.title.split('—')[1].trim() : sec.title;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectSection(idx)}
                  className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#1B4332] dark:bg-[#52B788] text-white dark:text-[#0F291E] shadow-2xs'
                      : isSecDone
                      ? 'bg-[#EFF6F1] dark:bg-[#1C2C23] text-[#2D6A4F] dark:text-[#84A98C] border border-[#C2DBC7] dark:border-[#2F4738]'
                      : 'bg-[#FAF7F2] dark:bg-[#242A25] text-[#5C645E] dark:text-[#8A938C] border border-[#EBE4D7] dark:border-[#313B33] hover:text-[#1B4332] dark:hover:text-[#F4F2EC]'
                  }`}
                  title={`${sec.title} (${doneCount}/${targetCount} completed)`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-1">
                    {isSecDone ? (
                      <Check className="w-3.5 h-3.5 text-[#52B788] dark:text-[#0F291E] shrink-0" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                        isActive
                          ? 'bg-white/20 text-white dark:bg-[#0F291E]/20 dark:text-[#0F291E]'
                          : 'bg-[#EBE4D7] dark:bg-[#313B33] text-[#2D312E] dark:text-[#F4F2EC]'
                      }`}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate font-medium">{rawTitle}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-[#0F291E]/20 dark:text-[#0F291E]'
                        : isSecDone
                        ? 'bg-[#DCEDE1] dark:bg-[#264232] text-[#2D6A4F] dark:text-[#84A98C]'
                        : 'bg-[#EBE4D7] dark:bg-[#313B33] text-[#5C645E] dark:text-[#A7ABA4]'
                    }`}
                  >
                    {doneCount}/{targetCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile: Compact Activity Bar with Expandable Steps */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between gap-2 bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] p-2.5 rounded-2xl text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-[#1B4332] dark:bg-[#52B788] text-white dark:text-[#0F291E] flex items-center justify-center text-[11px] font-bold shrink-0">
                  {currentSectionIndex + 1}
                </span>
                <span className="font-bold text-[#1B4332] dark:text-[#F4F2EC] truncate">
                  {activeSectionPlan.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileActivities(!showMobileActivities)}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] text-[11px] font-semibold text-[#2D6A4F] dark:text-[#84A98C] flex items-center gap-1 shrink-0"
              >
                <span>{showMobileActivities ? 'Hide' : 'All steps'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMobileActivities ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showMobileActivities && (
              <div className="grid grid-cols-1 gap-1.5 pt-1 animate-fade-in">
                {activeSections.map((sec, idx) => {
                  const isActive = idx === currentSectionIndex;
                  const targetCount = sec.target_questions_count || 1;
                  const doneCount = sectionProgress[idx] || 0;
                  const isSecDone = doneCount >= targetCount;
                  const rawTitle = sec.title.split('—')[1] ? sec.title.split('—')[1].trim() : sec.title;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSelectSection(idx);
                        setShowMobileActivities(false);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                        isActive
                          ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E]'
                          : isSecDone
                          ? 'bg-[#EFF6F1] dark:bg-[#1C2C23] text-[#2D6A4F] dark:text-[#84A98C] border border-[#C2DBC7] dark:border-[#2F4738]'
                          : 'bg-white dark:bg-[#242A25] text-[#5C645E] dark:text-[#8A938C] border border-[#EBE4D7] dark:border-[#313B33]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                        {isSecDone ? (
                          <Check className="w-3.5 h-3.5 text-[#52B788] dark:text-[#0F291E] shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-[#EBE4D7] dark:bg-[#313B33] text-[#2D312E] dark:text-[#F4F2EC] flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <span className="truncate">{rawTitle}</span>
                      </div>
                      <span className="text-[10px] font-mono shrink-0">
                        {doneCount}/{targetCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

            <AppButton
              onClick={() => setShowNearlyOutOfTimeAlert(false)}
              variant="primary"
              size="md"
              rightIcon={<ArrowRight />}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-none shadow-md"
            >
              Keep Going
            </AppButton>
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
        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
          <div className="w-8 h-8 border-2 border-[#2D6A4F] dark:border-[#52B788] border-t-transparent rounded-full animate-spin" />
          <div>
            <h3 className="text-base font-semibold text-[#1B4332] dark:text-[#F4F2EC]">Preparing today&apos;s session...</h3>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1">
              Pre-loading all activities for instant, lag-free practice
            </p>
          </div>
        </div>
      ) : !currentQuestion ? (
        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
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
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EBE4D7] dark:border-[#2C332E]">
            <div>
              <span className="text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C]">
                {getSectionTitle(currentSection)}
              </span>
              <h2 className="text-lg font-bold text-[#1B4332] dark:text-[#F4F2EC] mt-0.5">
                {currentQuestion.skill_name}
              </h2>
            </div>

            <div className="flex items-center space-x-2 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
              <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] font-medium">
                {currentQuestion.context_topic === 'workplace_tech' ? 'Workplace / Tech' : 'General'}
              </span>
              <span className="px-2 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] font-mono text-[11px]">
                {currentQuestion.difficulty}
              </span>
            </div>
          </div>

          {/* Grammar Concept Intro (if present) */}
          {currentQuestion.concept_intro && (
            <div className="bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#334237] rounded-2xl p-4 text-xs text-[#1B4332] dark:text-[#F4F2EC] flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1B4332] dark:text-[#F4F2EC] font-semibold block mb-0.5">Key Concept</strong>
                <p className="leading-relaxed text-[#5C645E] dark:text-[#A7ABA4]">{currentQuestion.concept_intro}</p>
              </div>
            </div>
          )}

          {/* Reading Passage (if present) */}
          {currentQuestion.reading_passage && (
            <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-6 md:p-8 shadow-xs text-[#2D312E] dark:text-[#F4F2EC]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
                <span className="text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C] flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{currentQuestion.reading_passage.title}</span>
                </span>
                <span className="text-xs text-[#8A938C]">
                  {currentQuestion.reading_passage.word_count} words
                </span>
              </div>
              <div className="text-sm md:text-base leading-relaxed text-[#2D312E] dark:text-[#F4F2EC] font-normal max-w-3xl">
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
          <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-6 md:p-8 shadow-xs text-[#2D312E] dark:text-[#F4F2EC] space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider block">
                  Active Question
                </span>
                <span className="text-[10px] text-[#52796F] dark:text-[#84A98C] font-medium flex items-center space-x-1">
                  <span>💡 Click any word to learn & practice</span>
                </span>
              </div>
              <div className="text-base md:text-lg font-serif font-medium text-[#1B4332] dark:text-[#F4F2EC] whitespace-pre-line leading-relaxed">
                <ClickableSentenceText
                  text={currentQuestion.prompt}
                  onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                />
              </div>
            </div>

            {/* Context sentence callout if available and distinct from prompt */}
            {currentQuestion.context_sentence &&
              currentQuestion.question_type !== 'free_writing' &&
              !currentQuestion.prompt.toLowerCase().includes(currentQuestion.context_sentence.toLowerCase().trim()) && (
              <div className="bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] rounded-2xl p-4 md:p-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] block mb-1">
                  Sentence to Complete
                </span>
                <div className="text-base md:text-lg font-medium text-[#1B4332] dark:text-[#F4F2EC] italic">
                  "<ClickableSentenceText
                    text={currentQuestion.context_sentence}
                    onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                  />"
                </div>
              </div>
            )}

            {/* Auto Submit Note for single-action options */}
            {isAutoAssessQuestion(currentQuestion) && !evaluation && (
              <div className="text-xs font-medium text-[#2D6A4F] dark:text-[#84A98C] flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#EFF6F1] dark:bg-[#1E2B23] border border-[#C2DBC7] dark:border-[#2C4A38]">
                <span className="text-sm shrink-0">💡</span>
                <span>{AUTO_SUBMIT_NOTE}</span>
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

                  let buttonClass = 'bg-[#FAF7F2] dark:bg-[#242A25] border-[#EBE4D7] dark:border-[#313B33] text-[#2D312E] dark:text-[#E8ECE9] hover:border-[#74A892] dark:hover:border-[#52B788]';
                  let badgeClass = 'bg-[#EBE4D7] dark:bg-[#313B33] text-[#2D312E] dark:text-[#F4F2EC]';

                  if (evaluation) {
                    if (isExpectedOpt) {
                      buttonClass = 'bg-[#EFF6F1] dark:bg-[#182F22] border-[#2D6A4F] dark:border-[#40916C] ring-1 ring-[#2D6A4F] text-[#1B4332] dark:text-[#F4F2EC]';
                      badgeClass = 'bg-[#2D6A4F] text-white font-bold';
                    } else if (isWrongSelected) {
                      buttonClass = 'bg-[#FDF0ED] dark:bg-[#32201C] border-[#E07A5F] ring-1 ring-[#E07A5F] text-[#B84728] dark:text-[#F28482]';
                      badgeClass = 'bg-[#E07A5F] text-white font-bold';
                    } else {
                      buttonClass = 'bg-[#FAF7F2] dark:bg-[#202522] border-[#EBE4D7] dark:border-[#2E3730] text-[#8A938C] dark:text-[#7A827A] opacity-60';
                      badgeClass = 'bg-[#EBE4D7] dark:bg-[#2C332E] text-[#8A938C]';
                    }
                  } else if (isSelected) {
                    buttonClass = 'bg-[#EFF6F1] dark:bg-[#1C2C23] border-[#2D6A4F] dark:border-[#52B788] ring-1 ring-[#2D6A4F] text-[#1B4332] dark:text-[#F4F2EC]';
                    badgeClass = 'bg-[#2D6A4F] dark:bg-[#52B788] text-white dark:text-[#0F291E] font-bold';
                  }

                  return (
                    <div
                      key={opt.id}
                      role="button"
                      tabIndex={isDisabled ? -1 : 0}
                      aria-disabled={isDisabled}
                      onClick={async () => {
                        if (evaluation || isSubmitting) return;
                        setUserAnswer(opt.id);
                        await handleSubmitAnswer(opt.id);
                      }}
                      onKeyDown={async (e) => {
                        if (evaluation || isDisabled || isSubmitting) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setUserAnswer(opt.id);
                          await handleSubmitAnswer(opt.id);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between space-x-4 ${buttonClass} ${isDisabled || isSubmitting ? 'cursor-default' : 'cursor-pointer'}`}
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
                        <span className="text-xs font-bold text-[#2D6A4F] dark:text-[#52B788] bg-[#DCEDE1] dark:bg-[#203D2D] px-2.5 py-1 rounded-lg border border-[#C2DBC7] dark:border-[#2F4738] shrink-0">
                          ✓ Correct
                        </span>
                      )}
                      {evaluation && isWrongSelected && (
                        <span className="text-xs font-bold text-[#E07A5F] bg-[#FDF0ED] dark:bg-[#3B2521] px-2.5 py-1 rounded-lg border border-[#F3B3A2] dark:border-[#5C342C] shrink-0">
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
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-enable-grammarly="false"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !evaluation && !isSubmitting && userAnswer.trim()) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  className="w-full bg-[#FAF7F2] dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#313B33] rounded-xl px-4 py-3 text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
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
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder={
                      currentQuestion?.writing_config?.min_words 
                        ? `Write ${currentQuestion.writing_config.min_words} to ${currentQuestion.writing_config.max_words} words in English...`
                        : `Write ${currentQuestion?.writing_config?.min_sentences || 2} to ${currentQuestion?.writing_config?.max_sentences || 3} sentences in English...`
                    }
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    data-enable-grammarly="false"
                    className="w-full bg-[#FAF7F2] dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#313B33] rounded-2xl p-4 text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm md:text-base leading-relaxed"
                  />
                  {speechSupported && !evaluation && (
                    <button
                      onClick={handleToggleVoiceInput}
                      className={`absolute right-3 bottom-3 p-2 rounded-xl transition ${
                        isRecording
                          ? 'bg-[#E07A5F] text-white animate-pulse'
                          : 'bg-[#FAF7F2] dark:bg-[#2C352E] hover:bg-[#EBE4D7] text-[#5C645E] dark:text-[#A7ABA4]'
                      }`}
                      title={isRecording ? 'Listening (click to stop)' : 'Speak your answer (Speech-to-Text)'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                  {currentQuestion?.writing_config?.min_words ? (
                    <span>Words: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{userAnswer.trim().split(/\s+/).filter(Boolean).length}</strong> (target: {currentQuestion.writing_config.min_words}-{currentQuestion.writing_config.max_words})</span>
                  ) : (
                    <span>Sentences: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{countSentences(userAnswer)}</strong> (target: {currentQuestion?.writing_config?.min_sentences || (currentQuestion?.difficulty === 'A1' ? 1 : 3)}-{currentQuestion?.writing_config?.max_sentences || (currentQuestion?.difficulty === 'A1' ? 2 : 5)})</span>
                  )}
                  {speechSupported && (
                    <span className="text-[11px] text-[#8A938C]">
                      Mic uses browser voice dictation
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Answer submission button (for manual submission questions like fill-in-blank / free writing) */}
            {!evaluation && !isAutoAssessQuestion(currentQuestion) && (
              <div className="pt-2 flex justify-end">
                <AppButton
                  disabled={!userAnswer.trim() || isSubmitting}
                  isLoading={isSubmitting}
                  onClick={() => handleSubmitAnswer()}
                  size="md"
                  variant="primary"
                  rightIcon={<ArrowRight />}
                >
                  Check Answer
                </AppButton>
              </div>
            )}
          </div>

          {/* Tutor Controls: Hint, Simplify, Example, Ambiguous */}
          <div className="bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#2D312E] dark:text-[#F4F2EC]">
            <span className="text-[#5C645E] dark:text-[#A7ABA4] font-medium flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
              <span>AI Tutor Assistance:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <AppButton
                size="sm"
                variant="outline"
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('hint')}
              >
                {isLoadingAssist && activeAssistAction === 'hint' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D48B16] mr-1.5" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5 text-[#D48B16] mr-1.5" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'hint'
                    ? 'Getting hint...'
                    : showHint
                    ? 'Hide Hint'
                    : 'I need a hint'}
                </span>
              </AppButton>

              <AppButton
                size="sm"
                variant="outline"
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('simpler_explanation')}
              >
                {isLoadingAssist && activeAssistAction === 'simpler_explanation' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D6A4F] dark:text-[#52B788] mr-1.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788] mr-1.5" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'simpler_explanation'
                    ? 'Explaining simply...'
                    : 'Explain it more simply'}
                </span>
              </AppButton>

              <AppButton
                size="sm"
                variant="outline"
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('another_example')}
              >
                {isLoadingAssist && activeAssistAction === 'another_example' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D6A4F] dark:text-[#52B788] mr-1.5" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788] mr-1.5" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'another_example'
                    ? 'Generating example...'
                    : 'Give me another example'}
                </span>
              </AppButton>

              <AppButton
                size="sm"
                variant="outline"
                disabled={isLoadingAssist}
                onClick={() => handleTutorAction('clarify_ambiguity')}
              >
                {isLoadingAssist && activeAssistAction === 'clarify_ambiguity' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#52796F] mr-1.5" />
                ) : (
                  <HelpCircle className="w-3.5 h-3.5 text-[#52796F] mr-1.5" />
                )}
                <span>
                  {isLoadingAssist && activeAssistAction === 'clarify_ambiguity'
                    ? 'Clarifying...'
                    : 'This seems ambiguous'}
                </span>
              </AppButton>
            </div>

            {/* In-Flight Loading Status Notification Banner */}
            {isLoadingAssist && activeAssistAction && (
              <div className="w-full bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#354037] rounded-xl p-3 flex items-center space-x-2.5 text-xs text-[#2D6A4F] dark:text-[#52B788] animate-pulse mt-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2D6A4F] dark:text-[#52B788] shrink-0" />
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
            <div className="bg-[#FEF7E6] dark:bg-[#2C2417] border border-[#F5DC9A] dark:border-[#524128] rounded-2xl p-4 text-xs text-[#2D312E] dark:text-[#F4F2EC] flex items-start space-x-3">
              <Lightbulb className="w-4 h-4 text-[#D48B16] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#B25E00] dark:text-[#E9A825] font-semibold block mb-0.5">Gentle Clue:</strong>
                <p className="text-[#5C645E] dark:text-[#A7ABA4]">{currentQuestion.hint}</p>
              </div>
            </div>
          )}

          {/* Tutor Assist Live Response Drawer */}
          {tutorAssistData && (
            <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-5 text-[#2D312E] dark:text-[#F4F2EC] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C]">
                <span>Tutor Note</span>
                <button
                  onClick={() => setTutorAssistData(null)}
                  className="text-[#8A938C] hover:text-[#1B4332] dark:hover:text-white p-0.5"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line text-[#2D312E] dark:text-[#F4F2EC]">{tutorAssistData.content}</p>
              {tutorAssistData.example_sentence && (
                <div className="mt-2 bg-[#FAF7F2] dark:bg-[#252C27] p-3 rounded-xl border border-[#EBE4D7] dark:border-[#354037] text-xs text-[#1B4332] dark:text-[#F4F2EC] italic">
                  "{tutorAssistData.example_sentence}"
                </div>
              )}
            </div>
          )}

          {/* FEEDBACK STATE: AFTER ANSWER IS SUBMITTED */}
          {evaluation && (
            <div className={`rounded-3xl p-6 md:p-8 border shadow-xs space-y-5 transition-all ${
              evaluation.verdict === 'correct'
                ? 'bg-[#EFF6F1] dark:bg-[#182C20] border-[#C2DBC7] dark:border-[#2C4A38] text-[#1B4332] dark:text-[#F4F2EC]'
                : evaluation.verdict === 'partially_correct'
                ? 'bg-[#FEF7E6] dark:bg-[#2C2417] border-[#F5DC9A] dark:border-[#524128] text-[#2D312E] dark:text-[#F4F2EC]'
                : evaluation.verdict === 'ambiguous'
                ? 'bg-[#FAF7F2] dark:bg-[#1E2521] border-[#EBE4D7] dark:border-[#2E3C32] text-[#2D312E] dark:text-[#F4F2EC]'
                : 'bg-[#FFF8F6] dark:bg-[#2A1D1A] border-[#F3B3A2] dark:border-[#4E2B24] text-[#2D312E] dark:text-[#F4F2EC]'
            }`}>
              {/* Verdict header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
                <div className="flex items-center space-x-3">
                  {evaluation.verdict === 'correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-[#DCEDE1] dark:bg-[#203D2D] border border-[#C2DBC7] dark:border-[#2F4738] flex items-center justify-center text-[#2D6A4F] dark:text-[#52B788]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : evaluation.verdict === 'partially_correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-[#FEF7E6] dark:bg-[#342A1D] border border-[#F5DC9A] flex items-center justify-center text-[#D48B16]">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  ) : evaluation.verdict === 'ambiguous' ? (
                    <div className="w-10 h-10 rounded-2xl bg-[#EFF6F1] dark:bg-[#242F28] border border-[#C2DBC7] flex items-center justify-center text-[#52796F]">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-[#FDF0ED] dark:bg-[#3B2521] border border-[#F3B3A2] dark:border-[#5C342C] flex items-center justify-center text-[#E07A5F]">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] capitalize">
                      {evaluation.verdict.replace('_', ' ')}
                    </h3>
                    <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                      {evaluation.verdict === 'correct'
                        ? 'Accurate and natural usage.'
                        : 'Review the decisive rule and example below.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete Correct Sentence & Meaning Translation */}
              {evaluation.full_correct_sentence && (
                <div className="bg-white dark:bg-[#202722] border border-[#EBE4D7] dark:border-[#2E3730] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#52B788]">
                      Complete Sentence
                    </span>
                    <button
                      onClick={() => playEnglishSpeech(evaluation.full_correct_sentence.replace(/\*/g, ''))}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#27302A] hover:bg-[#EBE4D7] text-[#2D312E] dark:text-[#F4F2EC] border border-[#EBE4D7] dark:border-[#354037] text-xs transition cursor-pointer"
                      title="Listen to full correct sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                      <span>Listen</span>
                    </button>
                  </div>

                  <div className="text-base font-serif font-semibold text-[#1B4332] dark:text-[#F4F2EC] leading-relaxed">
                    <ClickableSentenceText
                      text={evaluation.full_correct_sentence}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>

                  {/* Sentence Meaning / Translation */}
                  {(evaluation.sentence_translation || currentQuestion?.sentence_translation || currentQuestion?.vocab_card?.meaning) && (
                    <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#2C332E] flex items-start space-x-2 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                      <Globe className="w-3.5 h-3.5 text-[#52796F] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#8A938C] dark:text-[#8E978F] font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                          Ý nghĩa câu / Sentence Meaning:
                        </span>
                        <div className="text-[#2D312E] dark:text-[#D1D7CE] italic font-medium leading-relaxed">
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
                <div className="bg-[#FFF8F6] dark:bg-[#271E1C] border border-[#F3B3A2] dark:border-[#4A2D27] rounded-2xl p-4 text-xs text-[#B84728] dark:text-[#F28482] leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block mb-1">
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

              {/* Single Clear Explanation */}
              {evaluation.explanation && (
                <div className="bg-white dark:bg-[#202722] border border-[#EBE4D7] dark:border-[#2E3730] rounded-2xl p-4 space-y-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#52796F] dark:text-[#84A98C] block mb-1">
                    Explanation
                  </span>
                  <div className="text-sm text-[#2D312E] dark:text-[#D1D7CE] leading-relaxed whitespace-pre-line font-medium">
                    <ClickableSentenceText
                      text={evaluation.explanation}
                      contextSentence={evaluation.full_correct_sentence || currentQuestion?.context_sentence || currentQuestion?.prompt}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>
                </div>
              )}

              {/* Writing specific feedback */}
              {evaluation.corrected_text && (
                <div className="bg-[#EFF6F1] dark:bg-[#1E2B23] border border-[#C2DBC7] dark:border-[#2C4A38] rounded-2xl p-4 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#52B788] block">
                    Natural Native Phrasing
                  </span>
                  <p className="text-sm text-[#1B4332] dark:text-[#F4F2EC] italic font-serif">
                    "{evaluation.corrected_text}"
                  </p>

                  {evaluation.key_corrections && evaluation.key_corrections.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#C2DBC7]/50 dark:border-[#2C4A38]">
                      <span className="text-[11px] font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase">Key Adjustments:</span>
                      {evaluation.key_corrections.map((kc, i) => (
                        <div key={i} className="text-xs text-[#2D312E] dark:text-[#D1D7CE] flex items-start space-x-2">
                          <span className="text-[#E07A5F] line-through">{kc.original}</span>
                          <span>→</span>
                          <span className="text-[#2D6A4F] dark:text-[#52B788] font-semibold">{kc.corrected}</span>
                          <span className="text-[#8A938C]">({kc.reason})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {evaluation.reusable_pattern && (
                    <div className="pt-2 text-xs text-[#E9A825]">
                      <strong>Reusable Pattern: </strong>
                      <code>{evaluation.reusable_pattern}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Useful Phrases for your Passage / Exercise */}
              {evaluation.useful_phrases && evaluation.useful_phrases.length > 0 && (
                <div className="bg-[#EFF6F1] dark:bg-[#1E2B23] border border-[#C2DBC7] dark:border-[#2C4A38] rounded-2xl p-4 space-y-2.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#52B788] flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Useful Collocations & Phrases for this Context</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {evaluation.useful_phrases.map((up, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white dark:bg-[#242E27] border border-[#EBE4D7] dark:border-[#313E34] space-y-1">
                        <div className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center justify-between">
                          <span className="text-[#2D6A4F] dark:text-[#52B788] font-mono">{typeof up === 'string' ? up : up.phrase}</span>
                        </div>
                        {typeof up !== 'string' && up.meaning && (
                          <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
                            <span className="text-[#8A938C]">Meaning: </span>{up.meaning}
                          </p>
                        )}
                        {typeof up !== 'string' && up.how_to_use && (
                          <p className="text-[10px] text-[#8A938C] italic">
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
                <div className="mt-6 pt-6 border-t border-[#EBE4D7] dark:border-[#2C332E]">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#52796F] dark:text-[#84A98C] block mb-3">
                    Vocabulary Learning Card & Definitions (Revealed)
                  </span>
                  <VocabularyCard vocab={currentQuestion.vocab_card} />
                </div>
              )}

              {/* Interactive Tutor Deep-Dive Chat: Ask more & explore nuances before moving on */}
              <TutorDeepDiveChat
                question={currentQuestion}
                userAnswer={userAnswer}
                evaluation={evaluation}
              />

              {/* Action buttons: Next question / Retry */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EBE4D7] dark:border-[#2C332E]">
                {evaluation.verdict !== 'correct' ? (
                  <AppButton
                    onClick={handleRetryQuestion}
                    size="md"
                    variant="secondary"
                    leftIcon={<RotateCcw />}
                  >
                    Try Again
                  </AppButton>
                ) : <div />}

                <AppButton
                  onClick={handleNextQuestionOrSection}
                  size="lg"
                  variant="primary"
                  className="min-w-[160px]"
                  rightIcon={<ArrowRight />}
                >
                  {questionIndexInSection < targetQuestionsInSection - 1
                    ? 'Next Question'
                    : currentSectionIndex < activeSections.length - 1
                    ? 'Next Activity'
                    : 'Finish Lesson'}
                </AppButton>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161A17]/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-[#1E231F] border-2 border-[#2D6A4F] dark:border-[#52B788] rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden text-[#2D312E] dark:text-[#F4F2EC]">
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
              <span className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] dark:text-[#52B788] bg-[#EFF6F1] dark:bg-[#252F28] px-3 py-1 rounded-full border border-[#CDE1D4] dark:border-[#334237]">
                🐾 Meo Meo Thông Báo 🐾
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1B4332] dark:text-[#F4F2EC] tracking-tight">
                Hết Giờ Quy Định Hôm Nay Rồi! ⏰✨
              </h2>
              <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] max-w-sm mx-auto leading-relaxed">
                Sen đã hoàn thành xuất sắc mục tiêu <strong>{durationTarget} phút</strong> học hôm nay cùng {catConfig.catName}!
              </p>
            </div>

            {/* Mini Session Achievement Pill Box */}
            <div className="grid grid-cols-3 gap-2 bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] rounded-2xl p-3 text-center">
              <div>
                <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4] block">Thời gian</span>
                <strong className="text-sm font-bold text-[#B25E00] dark:text-[#E9A825]">{durationTarget}m</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4] block">Câu đã làm</span>
                <strong className="text-sm font-bold text-[#2D6A4F] dark:text-[#52B788]">{lessonAttempts.length} câu</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4] block">Thưởng cá</span>
                <strong className="text-sm font-bold text-[#52B788]">+2 🐟</strong>
              </div>
            </div>

            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic">
              "Giờ sen muốn nghỉ ngơi giữ streak để mèo ru ngủ, hay cộng thêm 5 phút học tiếp nào? Meow~"
            </p>

            {/* Choice Buttons */}
            <div className="space-y-3 pt-1">
              {/* Choice 1: Take a Break & View Summary */}
              <AppButton
                onClick={async () => {
                  setShowTimeOutModal(false);
                  await clearActiveLessonState();
                  const timeSpent = Math.max(1, Math.round(secondsElapsed / 60));
                  onFinishLesson(lessonAttempts, timeSpent);
                }}
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight />}
              >
                <div className="flex items-center space-x-2.5 text-left">
                  <span className="text-xl">😴</span>
                  <div>
                    <span className="block font-bold">Take a Break 🐟</span>
                    <span className="text-[11px] opacity-80 font-normal">View summary & save streak</span>
                  </div>
                </div>
              </AppButton>

              {/* Choice 2: Continue Studying (+5m) */}
              <AppButton
                onClick={() => {
                  setShowTimeOutModal(false);
                  setExtraMinutesAdded(prev => prev + 5);
                  setIsTimeExpired(false);
                  setHasWarnedNearlyOut(false);
                  setShowNearlyOutOfTimeAlert(false);
                }}
                variant="secondary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight />}
              >
                <div className="flex items-center space-x-2.5 text-left">
                  <span className="text-xl">⚡</span>
                  <div>
                    <span className="block font-bold text-[#B25E00] dark:text-[#E9A825]">Study More (+5m) 🐾</span>
                    <span className="text-[11px] opacity-80 font-normal">Keep going with next questions</span>
                  </div>
                </div>
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
