import React, { useState, useEffect } from 'react';
import {
  XCircle,
  AlertTriangle,
  ArrowRight,
  PauseCircle,
  Sparkles,
  Clock,
  Mic,
  MicOff,
  Flag,
  BookOpen,
  CheckCircle2,
  Check,
  Award,
  Pencil,
  Globe,
  Volume2,
  Briefcase
} from 'lucide-react';
import {
  playUrgentMeowAlert,
  playTimesUpChime
} from '../services/catSoundService.ts';
import { catCustomizationStore } from '../services/catCustomizationStore.ts';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';
import {
  UserProfile,
  Question,
  DiagnosticSession,
  DiagnosticMode,
  AnswerEvaluation,
  WritingRubricScore,
  DiagnosticReport,
  PersonalizedStudyPlan
} from '../types/learning.ts';
import { createDiagnosticAssessmentPlan } from '../types/diagnosticPlans.ts';
import {
  getDiagnosticSession,
  startDiagnosticSession,
  getNextDiagnosticQuestion,
  submitDiagnosticAnswer,
  pauseDiagnosticSession,
  completeDiagnosticSession,
  playEnglishSpeech
} from '../services/api.ts';
import { localStore } from '../services/localStore.ts';
import { TutorDeepDiveChat } from './TutorDeepDiveChat.tsx';
import { AIErrorAlert } from './AIErrorAlert.tsx';
import { ClickableSentenceText } from './ClickableSentenceText.tsx';
import { WordPracticeModal } from './WordPracticeModal.tsx';
import { isAutoAssessQuestion, AUTO_SUBMIT_NOTE } from '../utils/submissionPolicy.ts';
import { AppButton } from './ui/AppButton.tsx';

export interface CuratedMajor {
  id: string;
  name: string;
  nameVi: string;
  icon: string;
  description: string;
  examples: string;
}

export const CURATED_MAJORS: CuratedMajor[] = [
  {
    id: 'software_tech',
    name: 'Software Engineering & IT',
    nameVi: 'CNTT, Phần mềm & DevOps',
    icon: '💻',
    description: 'Web/mobile dev, Cloud, DevOps, AI, system architecture & code reviews',
    examples: 'E.g., Pull request comments, incident debriefs, API design reviews, daily standups'
  },
  {
    id: 'finance_business',
    name: 'Finance, Banking & Accounting',
    nameVi: 'Tài chính, Ngân hàng & Kế toán',
    icon: '📊',
    description: 'Corporate finance, auditing, commercial banking, investments & risk assessment',
    examples: 'E.g., Quarterly earnings briefs, balance sheet audits, investment memorandums'
  },
  {
    id: 'data_analytics',
    name: 'Data Science & Business Intelligence',
    nameVi: 'Khoa học dữ liệu & Phân tích',
    icon: '📈',
    description: 'Data analytics, predictive modeling, machine learning, SQL & KPI dashboards',
    examples: 'E.g., A/B test results, conversion funnel anomalies, executive dashboard insights'
  },
  {
    id: 'product_management',
    name: 'Product Management & Business Analysis',
    nameVi: 'Quản lý sản phẩm & Phân tích nghiệp vụ',
    icon: '🚀',
    description: 'Feature specifications, user story estimation, roadmap trade-offs & sprints',
    examples: 'E.g., PRD documentation, backlog grooming, stakeholder alignment, release notes'
  },
  {
    id: 'marketing_media',
    name: 'Marketing, Media & Communications',
    nameVi: 'Marketing, Truyền thông & Sáng tạo',
    icon: '📣',
    description: 'Digital campaigns, branding strategy, copywriting, PR, social media & ad funnels',
    examples: 'E.g., Campaign creative briefs, pitch decks, press releases, social media copy'
  },
  {
    id: 'healthcare_medicine',
    name: 'Healthcare, Medicine & Pharmacy',
    nameVi: 'Y tế, Y khoa & Dược phẩm',
    icon: '🩺',
    description: 'Clinical practice, patient consultation, pharmaceutical trials & health management',
    examples: 'E.g., Patient medical charts, clinical trials, pharmacology consults, medical summaries'
  },
  {
    id: 'engineering_manufacturing',
    name: 'Engineering & Manufacturing',
    nameVi: 'Kỹ thuật cơ khí, Điện tử & Sản xuất',
    icon: '⚙️',
    description: 'Industrial engineering, hardware testing, quality control & safety standards',
    examples: 'E.g., Technical root cause analysis, equipment specs, factory safety guidelines'
  },
  {
    id: 'law_compliance',
    name: 'Law & Corporate Compliance',
    nameVi: 'Luật pháp & Pháp chế doanh nghiệp',
    icon: '⚖️',
    description: 'Commercial contracts, corporate compliance, dispute negotiation & legal drafting',
    examples: 'E.g., Service level agreements, compliance audit findings, risk disclosures'
  },
  {
    id: 'human_resources',
    name: 'Human Resources & Talent Acquisition',
    nameVi: 'Nhân sự & Tuyển dụng quốc tế',
    icon: '👥',
    description: 'Recruitment, employee relations, performance appraisals & organizational culture',
    examples: 'E.g., Interview scorecards, employee policy handbooks, talent acquisition briefs'
  },
  {
    id: 'sales_business_dev',
    name: 'Sales, Business Development & CS',
    nameVi: 'Kinh doanh B2B & Chăm sóc khách hàng',
    icon: '🤝',
    description: 'Client proposals, contract negotiations, customer onboarding & QBR meetings',
    examples: 'E.g., B2B solution proposals, enterprise sales discovery, customer onboarding calls'
  },
  {
    id: 'hospitality_tourism',
    name: 'Hospitality, Aviation & Tourism',
    nameVi: 'Khách sạn, Du lịch & Hàng không',
    icon: '✈️',
    description: 'Guest relations, travel operations, aviation protocol & event management',
    examples: 'E.g., VIP guest service protocols, airline passenger communications, itinerary plans'
  },
  {
    id: 'academic_research',
    name: 'Academic Research & Higher Education',
    nameVi: 'Nghiên cứu khoa học & Học thuật',
    icon: '🎓',
    description: 'Scientific papers, literature citations, thesis defense & academic conferences',
    examples: 'E.g., Peer-reviewed research abstracts, conference slide presentations, thesis abstracts'
  },
  {
    id: 'other_custom',
    name: 'Other / Custom Field',
    nameVi: 'Chuyên ngành / Lĩnh vực khác',
    icon: '✨',
    description: 'Specify your unique subject, industry, or academic major',
    examples: 'Type your own major or field of specialization'
  }
];

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

  // Active diagnostic timer state
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [hasWarnedNearlyOut, setHasWarnedNearlyOut] = useState<boolean>(false);
  const [showNearlyOutOfTimeAlert, setShowNearlyOutOfTimeAlert] = useState<boolean>(false);
  const [showTimeOutModal, setShowTimeOutModal] = useState<boolean>(false);
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false);
  const [hurryUpQuote, setHurryUpQuote] = useState<string>('');
  const [catConfig, setCatConfig] = useState(() => catCustomizationStore.getConfig());

  // Active vocabulary learning & micro-practice panel state
  const [activeWordPractice, setActiveWordPractice] = useState<{
    word: string;
    contextSentence: string;
  } | null>(null);

  // Goal & Major context editing state
  const initialMajor = profile?.major_or_subject || 'Software Engineering & IT';
  const isKnownCurated = CURATED_MAJORS.some(m => m.id !== 'other_custom' && m.name.toLowerCase() === initialMajor.toLowerCase());

  const [selectedMajorId, setSelectedMajorId] = useState<string>(
    isKnownCurated
      ? (CURATED_MAJORS.find(m => m.name.toLowerCase() === initialMajor.toLowerCase())?.id || 'software_tech')
      : 'other_custom'
  );
  const [customMajorText, setCustomMajorText] = useState<string>(isKnownCurated ? '' : initialMajor);
  const [majorDetailsText, setMajorDetailsText] = useState<string>(profile?.major_focus_details || '');
  const [goalSummaryText, setGoalSummaryText] = useState<string>(profile?.goal_summary || '');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);

  useEffect(() => {
    if (profile?.goal_summary) {
      setGoalSummaryText(profile.goal_summary);
    }
    if (profile?.major_or_subject) {
      const known = CURATED_MAJORS.find(m => m.name.toLowerCase() === profile.major_or_subject?.toLowerCase());
      if (known && known.id !== 'other_custom') {
        setSelectedMajorId(known.id);
        setCustomMajorText('');
      } else {
        setSelectedMajorId('other_custom');
        setCustomMajorText(profile.major_or_subject);
      }
    }
    if (profile?.major_focus_details) {
      setMajorDetailsText(profile.major_focus_details);
    }
  }, [profile?.goal_summary, profile?.major_or_subject, profile?.major_focus_details]);

  const getEffectiveMajorName = (): string => {
    if (selectedMajorId === 'other_custom') {
      return customMajorText.trim() || 'General Professional English';
    }
    const found = CURATED_MAJORS.find(m => m.id === selectedMajorId);
    return found ? found.name : 'Software Engineering & IT';
  };

  const getEffectiveMajorObj = (): CuratedMajor => {
    const found = CURATED_MAJORS.find(m => m.id === selectedMajorId);
    if (found) return found;
    return {
      id: 'other_custom',
      name: customMajorText.trim() || 'Custom Field',
      nameVi: 'Chuyên ngành tùy chỉnh',
      icon: '✨',
      description: 'Custom specialization configured by learner',
      examples: customMajorText.trim() || 'Custom workplace focus'
    };
  };

  const handleSaveGoalContext = async () => {
    setIsSavingGoal(true);
    const finalMajor = getEffectiveMajorName();
    try {
      await localStore.updateProfile({
        goal_summary: goalSummaryText.trim(),
        major_or_subject: finalMajor,
        major_focus_details: majorDetailsText.trim()
      });
      if (profile) {
        profile.goal_summary = goalSummaryText.trim();
        profile.major_or_subject = finalMajor;
        profile.major_focus_details = majorDetailsText.trim();
      }
      setIsEditingGoal(false);
    } catch (err) {
      console.error('Failed to save goal context:', err);
    } finally {
      setIsSavingGoal(false);
    }
  };
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

    const handleThemeChange = () => {
      setCatConfig(catCustomizationStore.getConfig());
    };
    window.addEventListener('meomeo:theme-changed', handleThemeChange);
    return () => window.removeEventListener('meomeo:theme-changed', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.status]);

  const assessmentPlanForTimer = session?.plan || (session?.mode ? createDiagnosticAssessmentPlan(session.mode) : null);
  const durationTarget = assessmentPlanForTimer?.targetDurationMinutes || 20;
  const targetSeconds = durationTarget * 60;
  const remainingSeconds = Math.max(0, targetSeconds - secondsElapsed);
  const isNearlyOut = remainingSeconds <= 60 && remainingSeconds > 0;

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;

    // 1. Nearly out of time: Trigger once when <= 60 seconds remaining
    if (remainingSeconds <= 60 && remainingSeconds > 0 && !hasWarnedNearlyOut && secondsElapsed >= 5) {
      setHasWarnedNearlyOut(true);
      setShowNearlyOutOfTimeAlert(true);
      const quotes = [
        'Meo meo! ⏰ Sắp hết giờ kiểm tra rồi sen ơi! Cố gắng chốt đáp án nhanh nào! 🐟💨',
        'Đồng hồ điểm tic-tac! ⏳ Còn 1 phút nữa thôi, tập trung cao độ về đích nào! 🐱⚡',
        'Nhanh chân lên sen ơi! Hoàn thành bài đánh giá để nhận thưởng cá thơm ngon nào! 🐾🏆'
      ];
      setHurryUpQuote(quotes[Math.floor(Math.random() * quotes.length)]);

      try {
        if (catConfig.soundEnabled) playUrgentMeowAlert();
      } catch (e) {}
    }

    // 2. Time expired: Trigger modal & auto-finalize
    if (remainingSeconds === 0 && !isTimeExpired && secondsElapsed >= targetSeconds && secondsElapsed >= 5) {
      setIsTimeExpired(true);
      setShowTimeOutModal(true);
      setShowNearlyOutOfTimeAlert(false);

      try {
        if (catConfig.soundEnabled) playTimesUpChime();
      } catch (e) {}

      // Auto-finish assessment after a short delay to let the chime play
      setTimeout(() => {
        handleFinishAssessment();
      }, 1500);
    }
  }, [secondsElapsed, remainingSeconds, hasWarnedNearlyOut, isTimeExpired, targetSeconds, session?.status, catConfig.soundEnabled]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
      const finalMajor = getEffectiveMajorName();
      const activeProfile = profile || await localStore.getProfile();
      activeProfile.major_or_subject = finalMajor;
      activeProfile.major_focus_details = majorDetailsText.trim();
      if (goalSummaryText.trim()) {
        activeProfile.goal_summary = goalSummaryText.trim();
      }

      await localStore.updateProfile({
        major_or_subject: activeProfile.major_or_subject,
        major_focus_details: activeProfile.major_focus_details,
        goal_summary: activeProfile.goal_summary
      });

      const newSession = await startDiagnosticSession(mode, activeProfile);
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
    if (!currentQuestion || !ansToUse.trim() || isEvaluating || Boolean(lastEvaluation)) return;
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
      setLastFailedAction(() => () => handleSubmitAnswer(ansToUse));
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
      <div className="py-6 text-[#2D312E] dark:text-[#F4F2EC] space-y-6">
        <div>
          <span className="text-xs uppercase font-bold text-[#2D6A4F] dark:text-[#52B788] tracking-wider">
            Official Placement Diagnostic
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1B4332] dark:text-[#F4F2EC] mt-1">
            Choose Your Diagnostic Assessment Mode
          </h2>
          <p className="text-xs md:text-sm text-[#3D4E45] dark:text-[#A7B3AB] mt-1.5 leading-relaxed max-w-3xl">
            Each mode operates as a real sequential English proficiency exam evaluating <strong>Grammar</strong>, <strong>Vocabulary</strong>, <strong>Reading</strong>, and <strong>Writing</strong>.
            Questions adapt dynamically based on your background and answers to estimate your genuine CEFR benchmark.
          </p>
        </div>

        {pausedMessage && (
          <div className="bg-[#EFF6F1] dark:bg-[#203227] border border-[#CDE1D4] dark:border-[#2F4738] p-4 rounded-2xl text-xs text-[#2D6A4F] dark:text-[#52B788]">
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

        {/* Assessment Field & Major Focus Selector Banner */}
        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-5 md:p-6 shadow-xs space-y-4 text-[#2D312E] dark:text-[#F4F2EC]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE4D7] dark:border-[#2C332E] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#354539] flex items-center justify-center text-[#2D6A4F] dark:text-[#52B788]">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B4332] dark:text-[#F4F2EC]">
                  Target Field & Major Focus (Chuyên ngành & Trọng tâm đánh giá)
                </h3>
                <p className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB]">
                  AI will calibrate and generate vocabulary, cloze sentences, reading texts, and writing scenarios based on your specific discipline.
                </p>
              </div>
            </div>

            <AppButton
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              size="sm"
              variant="secondary"
              leftIcon={<Pencil />}
            >
              {isEditingGoal ? 'Close' : 'Change Major'}
            </AppButton>
          </div>

          {isEditingGoal ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] block mb-2">
                  1. Select your main major, discipline, or industry focus:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {CURATED_MAJORS.map(major => {
                    const isSelected = selectedMajorId === major.id;
                    return (
                      <button
                        key={major.id}
                        type="button"
                        onClick={() => setSelectedMajorId(major.id)}
                        className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#EFF6F1] dark:bg-[#203227] border-[#2D6A4F] dark:border-[#52B788] ring-2 ring-[#2D6A4F] dark:ring-[#52B788] text-[#1B4332] dark:text-[#F4F2EC] shadow-xs'
                            : 'bg-[#FAF7F2] dark:bg-[#252C27] hover:bg-[#EBE4D7] dark:hover:bg-[#2C352E] border-[#EBE4D7] dark:border-[#333D35] text-[#2D312E] dark:text-[#F4F2EC]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xl mb-1">{major.icon}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#2D6A4F] dark:bg-[#52B788] text-white dark:text-[#0F291E] flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <strong className="text-xs font-bold block text-[#1B4332] dark:text-[#F4F2EC] leading-tight">
                            {major.name}
                          </strong>
                          <span className="text-[10px] text-[#2D6A4F] dark:text-[#52B788] block font-medium mt-0.5">
                            {major.nameVi}
                          </span>
                          <p className="text-[10px] text-[#3D4E45] dark:text-[#A7B3AB] mt-1 line-clamp-2 leading-relaxed">
                            {major.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Major Input if 'other_custom' is chosen */}
              {selectedMajorId === 'other_custom' && (
                <div className="bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] rounded-2xl p-3.5 space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-[#2D6A4F] dark:text-[#52B788] block">
                    Type your specific field or major:
                  </label>
                  <input
                    type="text"
                    value={customMajorText}
                    onChange={e => setCustomMajorText(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="E.g., Biotechnology, Architecture, Logistics & Supply Chain..."
                    className="w-full bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#313B33] rounded-xl px-3.5 py-2 text-xs text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              )}

              {/* Specific specialty or daily scenarios */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] block">
                  2. Your specific role or daily scenarios to emphasize (Optional):
                </label>
                <input
                  type="text"
                  value={majorDetailsText}
                  onChange={e => setMajorDetailsText(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="E.g., Backend engineer collaborating with US architects; or Financial analyst presenting monthly audit reports..."
                  className="w-full bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#313B33] rounded-xl px-3.5 py-2.5 text-xs text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              {/* General goal summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] block">
                  3. Overall English objective or purpose:
                </label>
                <textarea
                  rows={2}
                  value={goalSummaryText}
                  onChange={e => setGoalSummaryText(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="E.g., Prepare for job interviews, communicate fluently with global team, write clear incident reviews..."
                  className="w-full bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#313B33] rounded-xl p-3 text-xs text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB]">
                  Selected Focus: <strong className="text-[#2D6A4F] dark:text-[#52B788]">{getEffectiveMajorName()}</strong>
                </span>
                <div className="flex space-x-2">
                    <AppButton
                      onClick={() => setIsEditingGoal(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </AppButton>
                    <AppButton
                      onClick={handleSaveGoalContext}
                      disabled={isSavingGoal}
                      isLoading={isSavingGoal}
                      variant="primary"
                      size="sm"
                      leftIcon={<Check />}
                    >
                      Save Focus
                    </AppButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-4 md:p-5 rounded-2xl border border-[#EBE4D7] dark:border-[#354037] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getEffectiveMajorObj().icon}</span>
                  <strong className="text-sm font-extrabold text-[#1B4332] dark:text-[#F4F2EC]">
                    {getEffectiveMajorName()}
                  </strong>
                  <span className="text-[10px] font-bold text-[#2D6A4F] dark:text-[#52B788] bg-[#EFF6F1] dark:bg-[#203227] px-2 py-0.5 rounded-full border border-[#CDE1D4] dark:border-[#2F4738]">
                    Active Focus
                  </span>
                </div>
                {majorDetailsText && majorDetailsText.trim().length > 0 && (
                  <p className="text-xs text-[#2D312E] dark:text-[#F4F2EC] font-medium">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB]">Specialty / Role:</span> {majorDetailsText}
                  </p>
                )}
                {goalSummaryText && goalSummaryText.trim().length > 0 && (
                  <p className="text-xs text-[#3D4E45] dark:text-[#A7B3AB]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB]">Target Objective:</span> {goalSummaryText}
                  </p>
                )}
                {!majorDetailsText && !goalSummaryText && (
                  <p className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB] italic">
                    {getEffectiveMajorObj().examples}
                  </p>
                )}
              </div>

              <AppButton
                onClick={() => setIsEditingGoal(true)}
                variant="outline"
                size="sm"
                leftIcon={<Pencil />}
              >
                Customize Field
              </AppButton>
            </div>
          )}
        </div>

        {/* 3 Explicit Diagnostic Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Quick Mode */}
          <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-[#2D6A4F] dark:hover:border-[#52B788] transition shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[#2D6A4F] dark:text-[#52B788] px-2.5 py-0.5 rounded-full bg-[#EFF6F1] dark:bg-[#203227] border border-[#CDE1D4] dark:border-[#2F4738]">
                  Express Calibration
                </span>
                <span className="text-xs font-semibold text-[#3D4E45] dark:text-[#A7B3AB] flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                  <span>~10 mins</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1B4332] dark:text-[#F4F2EC]">{quickPlan.title}</h3>
              <p className="text-xs text-[#3D4E45] dark:text-[#A7B3AB] mt-1 leading-relaxed">
                {quickPlan.subtitle}
              </p>

              {/* Section breakdown */}
              <div className="mt-4 pt-4 border-t border-[#EBE4D7] dark:border-[#2C332E] space-y-2">
                <div className="text-[11px] font-semibold text-[#3D4E45] dark:text-[#A7B3AB] uppercase tracking-wider">Exam Structure:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">1. Grammar</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">3 <span translate="no" className="notranslate">Qs</span> • ~2.5m</strong>
                  </div>
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">2. Vocabulary</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">3 <span translate="no" className="notranslate">Qs</span> • ~2.5m</strong>
                  </div>
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">3. Reading</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">1 Q • ~2m</strong>
                  </div>
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">4. Writing</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">1 Q • ~3m</strong>
                  </div>
                </div>

                <div className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB] pt-1 flex items-center justify-between">
                  <span>Scoring Weights:</span>
                  <span className="text-[#2D6A4F] dark:text-[#52B788] font-mono font-semibold">25% each (100% total)</span>
                </div>
              </div>
            </div>

            <AppButton
              disabled={Boolean(startingMode)}
              onClick={() => handleStartMode('quick')}
              variant="secondary"
              fullWidth
              size="md"
            >
              {startingMode === 'quick' ? (
                <span>Starting Express Exam...</span>
              ) : (
                <span className="truncate">Start Express Exam</span>
              )}
            </AppButton>
          </div>

          {/* 2. Standard Mode (Recommended) */}
          <div className="bg-[#EFF6F1] dark:bg-[#203227] border-2 border-[#2D6A4F] dark:border-[#52B788] rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-sm relative">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#2D6A4F] dark:bg-[#52B788] text-white dark:text-[#0F291E] tracking-widest shadow-xs">
              Recommended
            </span>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[#2D6A4F] dark:text-[#52B788] px-2.5 py-0.5 rounded-full bg-white dark:bg-[#19211C] border border-[#CDE1D4] dark:border-[#2F4738]">
                  Standard Placement
                </span>
                <span className="text-xs font-semibold text-[#3D4E45] dark:text-[#A7B3AB] flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                  <span>~20 mins</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1B4332] dark:text-[#F4F2EC]">{standardPlan.title}</h3>
              <p className="text-xs text-[#3D4E45] dark:text-[#A7B3AB] mt-1 leading-relaxed">
                {standardPlan.subtitle}
              </p>

              {/* Section breakdown */}
              <div className="mt-4 pt-4 border-t border-[#CDE1D4] dark:border-[#2F4738] space-y-2">
                <div className="text-[11px] font-semibold text-[#2D6A4F] dark:text-[#52B788] uppercase tracking-wider">Exam Structure:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-[#1E231F] p-2 rounded-xl border border-[#CDE1D4] dark:border-[#2F4738]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">1. Grammar</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">5 <span translate="no" className="notranslate">Qs</span> • ~4m</strong>
                  </div>
                  <div className="bg-white dark:bg-[#1E231F] p-2 rounded-xl border border-[#CDE1D4] dark:border-[#2F4738]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">2. Vocabulary</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">4 <span translate="no" className="notranslate">Qs</span> • ~3.5m</strong>
                  </div>
                  <div className="bg-white dark:bg-[#1E231F] p-2 rounded-xl border border-[#CDE1D4] dark:border-[#2F4738]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">3. Reading</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">3 <span translate="no" className="notranslate">Qs</span> • ~5.5m</strong>
                  </div>
                  <div className="bg-white dark:bg-[#1E231F] p-2 rounded-xl border border-[#CDE1D4] dark:border-[#2F4738]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">4. Writing</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">1 Task • ~7m</strong>
                  </div>
                </div>

                <div className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB] pt-1 flex items-center justify-between">
                  <span>Confidence: <strong className="text-[#2D6A4F] dark:text-[#52B788]">High</strong></span>
                  <span className="text-[#2D6A4F] dark:text-[#52B788] font-mono font-semibold">25% each (100% total)</span>
                </div>
              </div>
            </div>

            <AppButton
              disabled={Boolean(startingMode)}
              onClick={() => handleStartMode('standard')}
              variant="primary"
              fullWidth
              size="md"
              rightIcon={!startingMode && <ArrowRight />}
            >
              {startingMode === 'standard' ? (
                <span>Starting Standard Exam...</span>
              ) : (
                <span className="truncate">Start Standard Exam</span>
              )}
            </AppButton>
          </div>

          {/* 3. Comprehensive Mode */}
          <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-[#2D6A4F] dark:hover:border-[#52B788] transition shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[#B87A24] dark:text-[#E6A23C] px-2.5 py-0.5 rounded-full bg-[#FEF7E6] dark:bg-[#2E2519] border border-[#F2E3C6] dark:border-[#4B3E2C]">
                  Comprehensive Exam
                </span>
                <span className="text-xs font-semibold text-[#3D4E45] dark:text-[#A7B3AB] flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#B87A24] dark:text-[#E6A23C]" />
                  <span>~36 mins</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1B4332] dark:text-[#F4F2EC]">{comprehensivePlan.title}</h3>
              <p className="text-xs text-[#3D4E45] dark:text-[#A7B3AB] mt-1 leading-relaxed">
                {comprehensivePlan.subtitle}
              </p>

              {/* Section breakdown */}
              <div className="mt-4 pt-4 border-t border-[#EBE4D7] dark:border-[#2C332E] space-y-2">
                <div className="text-[11px] font-semibold text-[#3D4E45] dark:text-[#A7B3AB] uppercase tracking-wider">Exam Structure:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">1. Grammar</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">8 <span translate="no" className="notranslate">Qs</span> • ~6.5m</strong>
                  </div>
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">2. Vocabulary</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">7 <span translate="no" className="notranslate">Qs</span> • ~6m</strong>
                  </div>
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">3. Reading</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">5 <span translate="no" className="notranslate">Qs</span> (2 Passages)</strong>
                  </div>
                  <div className="bg-[#FAF7F2] dark:bg-[#252C27] p-2 rounded-xl border border-[#EBE4D7] dark:border-[#313B33]">
                    <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">4. Writing</span>
                    <strong className="text-[#1B4332] dark:text-[#F4F2EC]">2 Tasks • ~13m</strong>
                  </div>
                </div>

                <div className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB] pt-1 flex items-center justify-between">
                  <span>Confidence: <strong className="text-[#B87A24] dark:text-[#E6A23C]">Very High</strong></span>
                  <span className="text-[#B87A24] dark:text-[#E6A23C] font-mono font-semibold">25% each (100% total)</span>
                </div>
              </div>
            </div>

            <AppButton
              disabled={Boolean(startingMode)}
              onClick={() => handleStartMode('comprehensive')}
              variant="secondary"
              fullWidth
              size="md"
            >
              {startingMode === 'comprehensive' ? (
                <span>Starting Comprehensive Exam...</span>
              ) : (
                <span className="truncate">Start Comprehensive Exam</span>
              )}
            </AppButton>
          </div>
        </div>

        {/* Capability disclosure */}
        <div className="bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] rounded-2xl p-4 text-xs text-[#3D4E45] dark:text-[#A7B3AB] leading-relaxed flex items-start space-x-3">
          <Sparkles className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#1B4332] dark:text-[#F4F2EC] font-semibold block mb-0.5">Honest Proficiency Estimation:</strong>
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
    <div className="py-4 text-[#2D312E] dark:text-[#F4F2EC] space-y-6">
      {/* 1. Header with Mode info & Stepper */}
      <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        {/* Top header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-[#EFF6F1] dark:bg-[#203227] text-[#2D6A4F] dark:text-[#52B788] border border-[#CDE1D4] dark:border-[#2F4738]">
              {plan.title}
            </span>
            {session.major_or_subject && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFF6F1] dark:bg-[#203227] text-[#2D6A4F] dark:text-[#52B788] border border-[#CDE1D4] dark:border-[#2F4738] flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                <span>Field: {session.major_or_subject}</span>
              </span>
            )}
            <span className="text-xs text-[#3D4E45] dark:text-[#A7B3AB] flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[#3D4E45] dark:text-[#A7B3AB]" />
              <span>Target: ~{plan.targetDurationMinutes} mins</span>
            </span>

            <div className={`flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-xl border transition-all ${
              isNearlyOut
                ? 'bg-[#FDF0ED] dark:bg-[#32201C] border-[#E07A5F] text-[#B84728] dark:text-[#F28482] animate-pulse'
                : 'bg-[#FAF7F2] dark:bg-[#252C27] border-[#EBE4D7] dark:border-[#354037] text-[#5C645E] dark:text-[#A7ABA4]'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${isNearlyOut ? 'bg-[#E07A5F] animate-ping' : 'bg-[#52B788]'}`} />
              <span>{formatTimer(secondsElapsed)}</span>
              <span className="text-[#8A938C] dark:text-[#8E978F]">/ ~{durationTarget}m target</span>
              {isNearlyOut && (
                <span className="text-[#E07A5F] font-bold ml-1 animate-bounce">
                  (Còn {remainingSeconds}s! 🐾)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {(canStop || mustStop || historyCount >= totalPlannedQuestions) && (
              <AppButton
                onClick={handleFinishAssessment}
                variant="primary"
                size="sm"
                leftIcon={<Award />}
              >
                Complete Exam
              </AppButton>
            )}

            <AppButton
              onClick={handlePause}
              variant="secondary"
              size="sm"
              leftIcon={<PauseCircle />}
              title="Pause and resume later"
            >
              Save & Pause
            </AppButton>
          </div>
        </div>

        {/* 4-Section Sequential Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {plan.sections.map((sec, idx) => {
            const isCompleted = idx < currentSectionIndex || sec.completed;
            const isActive = idx === currentSectionIndex;


            return (
              <div
                key={sec.section}
                className={`p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-[#EFF6F1] dark:bg-[#203227] border-[#2D6A4F] dark:border-[#52B788] ring-1 ring-[#2D6A4F] dark:ring-[#52B788]'
                    : isCompleted
                    ? 'bg-[#F7FAF8] dark:bg-[#1C2620] border-[#CDE1D4] dark:border-[#2C3B31] text-[#2D6A4F] dark:text-[#84A98C]'
                    : 'bg-[#FAF7F2] dark:bg-[#252C27] border-[#EBE4D7] dark:border-[#313B33] text-[#5C645E] dark:text-[#8A938C]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#2D6A4F] dark:text-[#52B788]' : isCompleted ? 'text-[#2D6A4F] dark:text-[#84A98C]' : 'text-[#8A938C]'
                  }`}>
                    Section {idx + 1}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F] dark:bg-[#52B788] animate-ping" />
                  ) : null}
                </div>
                <div className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] mt-0.5 truncate capitalize">
                  {sec.section}
                </div>
                <div className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB] mt-1 flex items-center justify-between">
                  <span>{isCompleted ? `${sec.targetQuestionsCount}/${sec.targetQuestionsCount} done` : isActive ? `${sectionAttemptsCount + 1}/${sec.targetQuestionsCount}` : <>{sec.targetQuestionsCount} <span translate="no" className="notranslate">Qs</span></>}</span>
                  <span className="font-mono text-[10px]">25% wt</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall progress indicator bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[#3D4E45] dark:text-[#A7B3AB] font-medium">
            <span>Overall Progress: Question {Math.min(totalPlannedQuestions, historyCount + 1)} of {totalPlannedQuestions}</span>
            <span className="font-mono">{overallProgressPct}%</span>
          </div>
          <div className="w-full bg-[#FAF7F2] dark:bg-[#161A17] border border-[#EBE4D7] dark:border-[#2C332E] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2D6A4F] dark:bg-[#52B788] h-full rounded-full transition-all duration-300"
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
            <AppButton
              onClick={loadNextQuestion}
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight />}
            >
              Continue
            </AppButton>
          )}
        </div>
      )}

      {/* MeoMeo Fun Urgency Encouragement Banner */}
      {showNearlyOutOfTimeAlert && remainingSeconds > 0 && (
        <div className="mb-6 bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 shadow-2xl animate-bounce-short relative overflow-hidden">
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
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-3 bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl shadow-xs">
          <div className="w-9 h-9 border-2 border-[#2D6A4F] dark:border-[#52B788] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#3D4E45] dark:text-[#A7B3AB] font-medium">Preparing calibrated question for {activeSectionPlan.title}...</p>
        </div>
      ) : currentQuestion ? (
        <div className="space-y-5">
          {/* Question Metadata Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#EBE4D7] dark:border-[#2C332E]">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52B788] flex items-center space-x-2">
                <span>{activeSectionPlan.title}</span>
                <span>•</span>
                <span className="text-[#1B4332] dark:text-[#F4F2EC] font-medium">{currentQuestion.skill_name}</span>
              </span>
              <p className="text-xs text-[#3D4E45] dark:text-[#A7B3AB] mt-0.5">
                Target Level: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{currentQuestion.difficulty}</strong> • Item {sectionAttemptsCount + 1} of {activeSectionPlan.targetQuestionsCount}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB] hidden sm:flex items-center space-x-1.5 bg-[#FAF7F2] dark:bg-[#252C27] px-2.5 py-1 rounded-full border border-[#EBE4D7] dark:border-[#354037]">
                <Sparkles className="w-3 h-3 text-[#2D6A4F] dark:text-[#52B788]" />
                <span>Click any word to learn & practice</span>
              </span>
              <button
                onClick={() => setFlagged(!flagged)}
                className={`p-1.5 rounded-lg text-xs transition flex items-center space-x-1 cursor-pointer ${
                  flagged ? 'text-[#B87A24] bg-[#FEF7E6] dark:bg-[#2E2519]' : 'text-[#8A938C] hover:text-[#1B4332] dark:hover:text-white'
                }`}
                title="Flag this question as ambiguous or unclear"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">{flagged ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>
          </div>

          {/* Reading Passage View (Prominent, High-Readability Passage Box) */}
          {currentQuestion.reading_passage && (
            <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-6 md:p-8 space-y-4 shadow-xs text-[#2D312E] dark:text-[#F4F2EC]">
              <div className="flex items-center justify-between text-xs font-bold border-b border-[#EBE4D7] dark:border-[#2C332E] pb-3">
                <span className="flex items-center space-x-2 text-sm text-[#1B4332] dark:text-[#F4F2EC] font-bold">
                  <BookOpen className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
                  <span>{currentQuestion.reading_passage.title}</span>
                </span>
                <div className="flex items-center space-x-2 text-[#3D4E45] dark:text-[#A7B3AB] text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#252C27] font-medium">{currentQuestion.reading_passage.topic}</span>
                  <span>{currentQuestion.reading_passage.word_count} words</span>
                </div>
              </div>
              <div className="text-sm md:text-base text-[#2D312E] dark:text-[#F4F2EC] leading-relaxed font-normal tracking-wide whitespace-pre-line">
                <ClickableSentenceText
                  text={currentQuestion.reading_passage.text}
                  onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                />
              </div>
            </div>
          )}

          {/* Question Prompt Card */}
          <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-6 md:p-8 shadow-xs text-[#2D312E] dark:text-[#F4F2EC] space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#3D4E45] dark:text-[#A7B3AB] uppercase tracking-wider block">
                  {currentQuestion.question_type === 'reading_comprehension' ? 'Comprehension Question' : currentQuestion.question_type === 'free_writing' ? 'Writing Task' : 'Question Prompt'}
                </span>
                <span className="text-[10px] text-[#2D6A4F] dark:text-[#52B788] font-medium flex items-center space-x-1">
                  <span>💡 Click any unfamiliar word to learn & practice</span>
                </span>
              </div>
              <div className="text-base md:text-lg font-medium text-[#1B4332] dark:text-[#F4F2EC] whitespace-pre-line leading-relaxed">
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52B788] block mb-1">
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
            {isAutoAssessQuestion(currentQuestion) && !lastEvaluation && (
              <div className="text-xs font-medium text-[#2D6A4F] dark:text-[#52B788] flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#EFF6F1] dark:bg-[#203227] border border-[#CDE1D4] dark:border-[#2F4738]">
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

                  let buttonClass = 'bg-[#FAF7F2] dark:bg-[#242A25] border-[#EBE4D7] dark:border-[#313B33] text-[#2D312E] dark:text-[#E8ECE9] hover:border-[#2D6A4F] dark:hover:border-[#52B788]';
                  let badgeClass = 'bg-[#EBE4D7] dark:bg-[#313B33] text-[#2D312E] dark:text-[#F4F2EC]';

                  if (lastEvaluation) {
                    if (isExpectedOpt) {
                      buttonClass = 'bg-[#EFF6F1] dark:bg-[#182F22] border-[#2D6A4F] dark:border-[#40916C] ring-1 ring-[#2D6A4F] text-[#1B4332] dark:text-[#F4F2EC]';
                      badgeClass = 'bg-[#2D6A4F] text-white font-bold';
                    } else if (isWrongSelected) {
                      buttonClass = 'bg-[#FDF0ED] dark:bg-[#32201C] border-[#E07A5F] ring-1 ring-[#E07A5F] text-[#B84728] dark:text-[#F28482]';
                      badgeClass = 'bg-[#E07A5F] text-white font-bold';
                    } else {
                      buttonClass = 'bg-[#FAF7F2] dark:bg-[#202522] border-[#EBE4D7] dark:border-[#2E3730] text-[#8A938C] opacity-60';
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
                        if (lastEvaluation || isEvaluating) return;
                        setUserAnswer(opt.id);
                        await handleSubmitAnswer(opt.id);
                      }}
                      onKeyDown={async (e) => {
                        if (lastEvaluation || isDisabled || isEvaluating) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setUserAnswer(opt.id);
                          await handleSubmitAnswer(opt.id);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between space-x-4 ${buttonClass} ${isDisabled || isEvaluating ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${badgeClass}`}>
                          {opt.id}
                        </span>
                        <span className="text-sm md:text-base font-medium leading-snug">
                          <ClickableSentenceText
                            text={opt.text}
                            contextSentence={currentQuestion.context_sentence || currentQuestion.prompt}
                            onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                          />
                        </span>
                      </div>

                      {lastEvaluation && isExpectedOpt && (
                        <span className="text-xs font-bold text-[#2D6A4F] dark:text-[#52B788] bg-[#EFF6F1] dark:bg-[#203227] px-2.5 py-1 rounded-lg border border-[#CDE1D4] dark:border-[#2F4738] shrink-0">
                          ✓ Correct Answer
                        </span>
                      )}
                      {lastEvaluation && isWrongSelected && (
                        <span className="text-xs font-bold text-[#E07A5F] bg-[#FDF0ED] dark:bg-[#33211E] px-2.5 py-1 rounded-lg border border-[#F5D5CC] dark:border-[#4E312B] shrink-0">
                          ✗ Your Choice
                        </span>
                      )}
                    </div>
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
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="Type your answer here..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !lastEvaluation && !isEvaluating && userAnswer.trim()) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  className="w-full bg-[#FAF7F2] dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#313B33] rounded-2xl px-4 py-3.5 text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm md:text-base"
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
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder={
                      currentQuestion?.writing_config?.min_words 
                        ? `Write ${currentQuestion.writing_config.min_words} to ${currentQuestion.writing_config.max_words} words in English...`
                        : `Write ${currentQuestion?.writing_config?.min_sentences || 3} to ${currentQuestion?.writing_config?.max_sentences || 5} sentences in English...`
                    }
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    className="w-full bg-[#FAF7F2] dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#313B33] rounded-2xl p-4 text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm md:text-base leading-relaxed"
                  />
                  {speechSupported && !lastEvaluation && (
                    <button
                      onClick={handleToggleVoiceInput}
                      className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition cursor-pointer ${
                        isRecording
                          ? 'bg-[#E07A5F] text-white animate-pulse'
                          : 'bg-[#FAF7F2] dark:bg-[#2C352E] hover:bg-[#EBE4D7] text-[#3D4E45] dark:text-[#A7B3AB]'
                      }`}
                      title={isRecording ? 'Listening (click to stop)' : 'Voice input (Speech-to-Text)'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#3D4E45] dark:text-[#A7B3AB]">
                  {currentQuestion?.writing_config?.min_words ? (
                    <span>
                      Words: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{userAnswer.trim().split(/\s+/).filter(Boolean).length}</strong> (target: {currentQuestion.writing_config.min_words}-{currentQuestion.writing_config.max_words})
                    </span>
                  ) : (
                    <span>
                      Sentences: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{countSentences(userAnswer)}</strong> (target: {currentQuestion?.writing_config?.min_sentences || (currentQuestion?.difficulty === 'A1' ? 1 : 3)}-{currentQuestion?.writing_config?.max_sentences || (currentQuestion?.difficulty === 'A1' ? 2 : 5)})
                    </span>
                  )}
                  <span>
                    Word count: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{userAnswer.trim().split(/\s+/).filter(Boolean).length}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Submit button (if not evaluated yet and manual submission) */}
            {!lastEvaluation && !isAutoAssessQuestion(currentQuestion) && (
              <div className="pt-2 flex justify-end">
                <AppButton
                  disabled={!userAnswer.trim() || isEvaluating}
                  isLoading={isEvaluating}
                  onClick={() => handleSubmitAnswer()}
                  size="md"
                  variant="primary"
                  rightIcon={<ArrowRight />}
                >
                  Submit
                </AppButton>
              </div>
            )}
          </div>

          {/* ITEM FEEDBACK STATE (AFTER SUBMISSION) */}
          {lastEvaluation && (
            <div className={`rounded-3xl p-6 md:p-8 border shadow-xs space-y-5 transition-all ${
              lastEvaluation.verdict === 'correct'
                ? 'bg-[#EFF6F1] dark:bg-[#182C20] border-[#C2DBC7] dark:border-[#2C4A38] text-[#1B4332] dark:text-[#F4F2EC]'
                : lastEvaluation.verdict === 'partially_correct'
                ? 'bg-[#FEF7E6] dark:bg-[#2C2417] border-[#F5DC9A] dark:border-[#524128] text-[#2D312E] dark:text-[#F4F2EC]'
                : 'bg-[#FFF8F6] dark:bg-[#2A1D1A] border-[#F3B3A2] dark:border-[#4E2B24] text-[#2D312E] dark:text-[#F4F2EC]'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {lastEvaluation.verdict === 'correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-[#DCEDE1] dark:bg-[#203D2D] border border-[#C2DBC7] dark:border-[#2F4738] flex items-center justify-center text-[#2D6A4F] dark:text-[#52B788]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : lastEvaluation.verdict === 'partially_correct' ? (
                    <div className="w-10 h-10 rounded-2xl bg-[#FEF7E6] dark:bg-[#342A1D] border border-[#F5DC9A] flex items-center justify-center text-[#D48B16]">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-[#FDF0ED] dark:bg-[#3B2521] border border-[#F3B3A2] dark:border-[#5C342C] flex items-center justify-center text-[#E07A5F]">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-[#1B4332] dark:text-[#F4F2EC] capitalize">
                      {lastEvaluation.verdict.replace('_', ' ')}
                    </h4>
                    <span className="text-xs text-[#3D4E45] dark:text-[#A7B3AB]">Answer recorded into diagnostic profile</span>
                  </div>
                </div>

                {/* Next button */}
                {historyCount >= totalPlannedQuestions || mustStop ? (
                  <AppButton
                    onClick={handleFinishAssessment}
                    size="md"
                    variant="primary"
                    rightIcon={<ArrowRight />}
                  >
                    Finish Exam
                  </AppButton>
                ) : (
                  <AppButton
                    onClick={loadNextQuestion}
                    size="md"
                    variant="primary"
                    rightIcon={<ArrowRight />}
                  >
                    {sectionCompletedNotice?.nextSection
                      ? 'Next Section'
                      : 'Next Question'}
                  </AppButton>
                )}
              </div>

              {/* Complete Correct Sentence & Meaning Translation */}
              {lastEvaluation.full_correct_sentence && (
                <div className="bg-white dark:bg-[#202722] border border-[#EBE4D7] dark:border-[#2E3730] rounded-2xl p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#52B788]">
                      Complete Sentence
                    </span>
                    <button
                      onClick={() => playEnglishSpeech(lastEvaluation.full_correct_sentence.replace(/\*/g, ''))}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#27302A] hover:bg-[#EBE4D7] text-[#2D312E] dark:text-[#F4F2EC] border border-[#EBE4D7] dark:border-[#354037] text-xs transition cursor-pointer"
                      title="Listen to full correct sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                      <span>Listen</span>
                    </button>
                  </div>

                  <div className="text-sm font-semibold text-[#1B4332] dark:text-[#F4F2EC] leading-relaxed">
                    <ClickableSentenceText
                      text={lastEvaluation.full_correct_sentence}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>

                  {/* Sentence Meaning / Translation */}
                  {(lastEvaluation.sentence_translation || currentQuestion.sentence_translation || currentQuestion.vocab_card?.meaning) && (
                    <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#2C332E] flex items-start space-x-2 text-xs text-[#3D4E45] dark:text-[#A7B3AB]">
                      <Globe className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#3D4E45] dark:text-[#A7B3AB] font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                          Ý nghĩa câu / Sentence Meaning:
                        </span>
                        <div className="text-[#2D312E] dark:text-[#F4F2EC] italic font-medium leading-relaxed">
                          <ClickableSentenceText
                            text={lastEvaluation.sentence_translation || currentQuestion.sentence_translation || currentQuestion.vocab_card?.meaning || ''}
                            contextSentence={lastEvaluation.full_correct_sentence || currentQuestion.context_sentence || currentQuestion.prompt}
                            onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contrast explanation for distractors */}
              {lastEvaluation.contrast_explanation && (
                <div className="bg-[#FFF8F6] dark:bg-[#271E1C] border border-[#F3B3A2] dark:border-[#4A2D27] rounded-2xl p-4 text-xs text-[#B84728] dark:text-[#F28482] leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block mb-1">
                    Why your choice was not suitable
                  </span>
                  <div>
                    <ClickableSentenceText
                      text={lastEvaluation.contrast_explanation}
                      contextSentence={currentQuestion.context_sentence || currentQuestion.prompt}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>
                </div>
              )}

              {/* Single Clear Explanation */}
              {lastEvaluation.explanation && (
                <div className="bg-white dark:bg-[#202722] border border-[#EBE4D7] dark:border-[#2E3730] rounded-2xl p-4 text-xs space-y-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#52B788] block mb-1">
                    Explanation
                  </span>
                  <div className="text-sm text-[#2D312E] dark:text-[#F4F2EC] leading-relaxed whitespace-pre-line font-medium">
                    <ClickableSentenceText
                      text={lastEvaluation.explanation}
                      contextSentence={lastEvaluation.full_correct_sentence || currentQuestion.context_sentence || currentQuestion.prompt}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>
                </div>
              )}

              {/* Writing Rubric Breakdown */}
              {lastRubric && (
                <div className="bg-[#EFF6F1] dark:bg-[#1E2B23] border border-[#C2DBC7] dark:border-[#2C4A38] rounded-2xl p-4 md:p-5 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#52B788] block">
                    Writing Rubric Breakdown (Scale 1 to 5)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-white dark:bg-[#242E27] p-2.5 rounded-xl border border-[#EBE4D7] dark:border-[#313E34]">
                      <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">Grammar Accuracy</span>
                      <strong className="text-[#2D6A4F] dark:text-[#52B788]">{lastRubric.accuracy}/5</strong>
                    </div>
                    <div className="bg-white dark:bg-[#242E27] p-2.5 rounded-xl border border-[#EBE4D7] dark:border-[#313E34]">
                      <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">Vocabulary Range</span>
                      <strong className="text-[#2D6A4F] dark:text-[#52B788]">{lastRubric.vocabularyRange}/5</strong>
                    </div>
                    <div className="bg-white dark:bg-[#242E27] p-2.5 rounded-xl border border-[#EBE4D7] dark:border-[#313E34]">
                      <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">Complexity</span>
                      <strong className="text-[#2D6A4F] dark:text-[#52B788]">{lastRubric.sentenceComplexity}/5</strong>
                    </div>
                    <div className="bg-white dark:bg-[#242E27] p-2.5 rounded-xl border border-[#EBE4D7] dark:border-[#313E34]">
                      <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">Coherence</span>
                      <strong className="text-[#B87A24] dark:text-[#E6A23C]">{lastRubric.coherence}/5</strong>
                    </div>
                    <div className="bg-white dark:bg-[#242E27] p-2.5 rounded-xl border border-[#EBE4D7] dark:border-[#313E34]">
                      <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">Naturalness</span>
                      <strong className="text-[#2D6A4F] dark:text-[#52B788]">{lastRubric.naturalness}/5</strong>
                    </div>
                    <div className="bg-white dark:bg-[#242E27] p-2.5 rounded-xl border border-[#EBE4D7] dark:border-[#313E34]">
                      <span className="text-[#3D4E45] dark:text-[#A7B3AB] block text-[10px]">Task Completion</span>
                      <strong className="text-[#2D6A4F] dark:text-[#52B788]">{lastRubric.taskCompletion}/5</strong>
                    </div>
                  </div>

                  {lastRubric.correctedVersion && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-[#3D4E45] dark:text-[#A7B3AB] block mb-0.5">Natural Native Phrasing:</span>
                      <p className="text-xs text-[#1B4332] dark:text-[#F4F2EC] italic bg-white dark:bg-[#242E27] p-3 rounded-xl border border-[#EBE4D7] dark:border-[#313E34]">
                        "{lastRubric.correctedVersion}"
                      </p>
                    </div>
                  )}

                  {lastRubric.keyCorrections && lastRubric.keyCorrections.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#C2DBC7]/50 dark:border-[#2C4A38]">
                      <span className="text-[11px] font-semibold text-[#3D4E45] dark:text-[#A7B3AB] uppercase">Key Adjustments:</span>
                      {lastRubric.keyCorrections.map((kc, i) => (
                        <div key={i} className="text-xs text-[#2D312E] dark:text-[#F4F2EC] flex items-start space-x-2">
                          <span className="text-[#E07A5F] line-through">{kc.original}</span>
                          <span>→</span>
                          <span className="text-[#2D6A4F] dark:text-[#52B788] font-semibold">{kc.corrected}</span>
                          <span className="text-[#8A938C]">({kc.reason})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Useful Phrases for Writing or Exercise */}
              {lastEvaluation.useful_phrases && lastEvaluation.useful_phrases.length > 0 && (
                <div className="bg-[#EFF6F1] dark:bg-[#1E2B23] border border-[#C2DBC7] dark:border-[#2C4A38] rounded-2xl p-4 space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#2D6A4F] dark:text-[#52B788] flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Useful Collocations & Phrases for this Context</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {lastEvaluation.useful_phrases.map((up, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-[#242E27] border border-[#EBE4D7] dark:border-[#313E34] space-y-0.5">
                        <strong className="text-xs text-[#2D6A4F] dark:text-[#52B788] font-mono block">
                          {typeof up === 'string' ? up : up.phrase}
                        </strong>
                        {typeof up !== 'string' && up.meaning && (
                          <p className="text-[11px] text-[#3D4E45] dark:text-[#A7B3AB]">
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

              {/* Interactive Tutor Deep-Dive Chat */}
              <TutorDeepDiveChat
                question={currentQuestion}
                userAnswer={userAnswer}
                evaluation={lastEvaluation}
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Dedicated Word Learning & Micro-Practice Modal */}
      {activeWordPractice && (
        <WordPracticeModal
          word={activeWordPractice.word}
          contextSentence={activeWordPractice.contextSentence}
          examMajor={session.major_or_subject || getEffectiveMajorName()}
          currentQuestionIndex={sectionAttemptsCount + 1}
          totalQuestions={activeSectionPlan?.targetQuestionsCount || totalPlannedQuestions}
          onClose={() => setActiveWordPractice(null)}
        />
      )}

      {/* Time's Up Modal: End with Results or Take Break */}
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
                Hết Giờ Làm Bài Rồi! ⏰✨
              </h2>
              <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] max-w-sm mx-auto leading-relaxed">
                Sen đã đạt đến giới hạn thời gian <strong>{durationTarget} phút</strong> cho bài đánh giá năng lực này cùng {catConfig.catName}!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] dark:bg-[#252C27] border border-[#EBE4D7] dark:border-[#354037] rounded-2xl p-3 text-center">
              <div>
                <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4] block uppercase">Thời gian</span>
                <strong className="text-sm font-bold text-[#B25E00] dark:text-[#E9A825]">{durationTarget}m</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4] block uppercase">Câu đã làm</span>
                <strong className="text-sm font-bold text-[#2D6A4F] dark:text-[#52B788]">{historyCount} câu</strong>
              </div>
            </div>

            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic">
              "Dù chưa xong hết nhưng MeoMeo đã có đủ dữ liệu để đánh giá trình độ của sen rồi. Xem kết quả thôi nào! Meow~"
            </p>

            <AppButton
              onClick={() => {
                setShowTimeOutModal(false);
                handleFinishAssessment();
              }}
              size="lg"
              variant="primary"
              fullWidth
              rightIcon={<ArrowRight />}
            >
              <div className="flex items-center space-x-2.5 text-left">
                <span className="text-xl">🏆</span>
                <div>
                  <span className="block font-bold">Xem Kết Quả Đánh Giá 🐟</span>
                  <span className="text-[11px] opacity-80 font-normal">Tổng kết năng lực & nhận lộ trình học tập</span>
                </div>
              </div>
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
};
