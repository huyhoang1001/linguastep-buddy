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
  Award,
  Pencil,
  Globe,
  Volume2,
  Briefcase,
  GraduationCap
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
  completeDiagnosticSession,
  playEnglishSpeech
} from '../services/api.ts';
import { localStore } from '../services/localStore.ts';
import { TutorDeepDiveChat } from './TutorDeepDiveChat.tsx';
import { AIErrorAlert } from './AIErrorAlert.tsx';
import { ClickableSentenceText } from './ClickableSentenceText.tsx';
import { WordPracticeModal } from './WordPracticeModal.tsx';

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

        {/* Assessment Field & Major Focus Selector Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Target Field & Major Focus (Chuyên ngành & Trọng tâm đánh giá)
                </h3>
                <p className="text-[11px] text-slate-400">
                  AI will calibrate and generate vocabulary, cloze sentences, reading texts, and writing scenarios based on your specific discipline.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 flex items-center space-x-1.5 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditingGoal ? 'Close Selector' : 'Change Major / Field'}</span>
            </button>
          </div>

          {isEditingGoal ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-2">
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
                        className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950 border-indigo-500 ring-2 ring-indigo-500/80 text-white shadow-lg shadow-indigo-950/60'
                            : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xl mb-1">{major.icon}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <strong className="text-xs font-bold block text-white leading-tight">
                            {major.name}
                          </strong>
                          <span className="text-[10px] text-indigo-300 block font-medium mt-0.5">
                            {major.nameVi}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
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
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-indigo-300 block">
                    Type your specific field or major:
                  </label>
                  <input
                    type="text"
                    value={customMajorText}
                    onChange={e => setCustomMajorText(e.target.value)}
                    placeholder="E.g., Biotechnology, Architecture, Logistics & Supply Chain..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Specific specialty or daily scenarios */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">
                  2. Your specific role or daily scenarios to emphasize (Optional):
                </label>
                <input
                  type="text"
                  value={majorDetailsText}
                  onChange={e => setMajorDetailsText(e.target.value)}
                  placeholder="E.g., Backend engineer collaborating with US architects; or Financial analyst presenting monthly audit reports..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* General goal summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 block">
                  3. Overall English objective or purpose:
                </label>
                <textarea
                  rows={2}
                  value={goalSummaryText}
                  onChange={e => setGoalSummaryText(e.target.value)}
                  placeholder="E.g., Prepare for job interviews, communicate fluently with global team, write clear incident reviews..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Selected Focus: <strong className="text-indigo-300">{getEffectiveMajorName()}</strong>
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGoalContext}
                    disabled={isSavingGoal}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isSavingGoal ? (
                      <span>Saving Focus...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Apply to Exam</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 p-4 md:p-5 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getEffectiveMajorObj().icon}</span>
                  <strong className="text-sm font-extrabold text-white">
                    {getEffectiveMajorName()}
                  </strong>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    Active Focus
                  </span>
                </div>
                {majorDetailsText && majorDetailsText.trim().length > 0 && (
                  <p className="text-xs text-indigo-200/90 font-medium">
                    <span className="text-slate-400">Specialty / Role:</span> {majorDetailsText}
                  </p>
                )}
                {goalSummaryText && goalSummaryText.trim().length > 0 && (
                  <p className="text-xs text-slate-300">
                    <span className="text-slate-400">Target Objective:</span> {goalSummaryText}
                  </p>
                )}
                {!majorDetailsText && !goalSummaryText && (
                  <p className="text-[11px] text-slate-400 italic">
                    {getEffectiveMajorObj().examples}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditingGoal(true)}
                className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-semibold transition shrink-0 flex items-center space-x-1.5"
              >
                <Pencil className="w-3 h-3 text-indigo-400" />
                <span>Customize Field Focus</span>
              </button>
            </div>
          )}
        </div>

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
                <span className="truncate">Start Express (8 Qs • Tailored to {getEffectiveMajorName()})</span>
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
                  <span className="truncate">Start Standard Exam (13 Qs • Tailored to {getEffectiveMajorName()})</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
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
                <span className="truncate">Start Comprehensive (22 Qs • Tailored to {getEffectiveMajorName()})</span>
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
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {plan.title}
            </span>
            {session.major_or_subject && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Field: {session.major_or_subject}</span>
              </span>
            )}
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

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>Click any word to learn & practice</span>
              </span>
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
              <div className="text-sm md:text-base text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-line">
                <ClickableSentenceText
                  text={currentQuestion.reading_passage.text}
                  onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                />
              </div>
            </div>
          )}

          {/* Question Prompt Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {currentQuestion.question_type === 'reading_comprehension' ? 'Comprehension Question' : currentQuestion.question_type === 'free_writing' ? 'Writing Task' : 'Question Prompt'}
                </span>
                <span className="text-[10px] text-sky-400/80 font-medium flex items-center space-x-1">
                  <span>💡 Click any unfamiliar word to learn & practice</span>
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
                    <div
                      key={opt.id}
                      role="button"
                      tabIndex={isDisabled ? -1 : 0}
                      aria-disabled={isDisabled}
                      onClick={async () => {
                        if (lastEvaluation) return;
                        setUserAnswer(opt.id);
                        await handleSubmitAnswer(opt.id);
                      }}
                      onKeyDown={async (e) => {
                        if (lastEvaluation || isDisabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setUserAnswer(opt.id);
                          await handleSubmitAnswer(opt.id);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between space-x-4 ${buttonClass} ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
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
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
                          ✓ Correct Answer
                        </span>
                      )}
                      {lastEvaluation && isWrongSelected && (
                        <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/30 shrink-0">
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

              {/* Complete Correct Sentence & Meaning Translation */}
              {lastEvaluation.full_correct_sentence && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                      Complete Sentence
                    </span>
                    <button
                      onClick={() => playEnglishSpeech(lastEvaluation.full_correct_sentence.replace(/\*/g, ''))}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
                      title="Listen to full correct sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Listen</span>
                    </button>
                  </div>

                  <div className="text-sm font-semibold text-white leading-relaxed">
                    <ClickableSentenceText
                      text={lastEvaluation.full_correct_sentence}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>

                  {/* Sentence Meaning / Translation */}
                  {(lastEvaluation.sentence_translation || currentQuestion.sentence_translation || currentQuestion.vocab_card?.meaning) && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-xs text-slate-300">
                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                          Ý nghĩa câu / Sentence Meaning:
                        </span>
                        <div className="text-slate-200 italic font-medium leading-relaxed">
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
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200 leading-relaxed">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block mb-1">
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

              {/* Single Clear Explanation (No Duplicate Decisive Clue) */}
              {lastEvaluation.explanation && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 block mb-1">
                    Explanation
                  </span>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                    <ClickableSentenceText
                      text={lastEvaluation.explanation}
                      contextSentence={lastEvaluation.full_correct_sentence || currentQuestion.context_sentence || currentQuestion.prompt}
                      onWordClick={(w, s) => setActiveWordPractice({ word: w, contextSentence: s })}
                    />
                  </div>
                </div>
              )}

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
    </div>
  );
};
