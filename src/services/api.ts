import {
  UserProfile,
  LessonPlan,
  Question,
  AnswerEvaluation,
  SectionType,
  LearnerSkillState,
  VocabularyItem,
  Attempt,
  DailySummary,
  TutorAssistantResponse,
  LearningDataExport,
  DiscoveryState,
  DiagnosticSession,
  DiagnosticMode,
  DiagnosticReport,
  PersonalizedStudyPlan,
  WritingRubricScore,
  ActiveLessonState,
  DeepDiveInquiryResponse,
  DiagnosticAssessmentPlan
} from '../types/learning.ts';
import { createDiagnosticAssessmentPlan } from '../types/diagnosticPlans.ts';
import { localStore } from './localStore.ts';
import { BudgetLimits, UserAccount, AuthSessionResponse } from '../types/auth.ts';

// Re-export localStore for components that access it directly
export { localStore };

export class AIClientError extends Error {
  public code: string;
  public retryable: boolean;
  public retryAfterSeconds?: number;
  public userMessage: string;

  constructor(message: string, code: string = 'GENERAL_ERROR', retryable = false, retryAfterSeconds?: number) {
    super(message);
    this.name = 'AIClientError';
    this.code = code;
    this.userMessage = message;
    this.retryable = retryable;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('lingua_step_gemini_api_key');
    if (customKey && customKey.trim()) {
      headers['x-goog-api-key'] = customKey.trim();
    }
  }
  return headers;
}

async function parseAIResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (typeof window !== 'undefined') {
    const isFallback = res.headers.get('X-AI-Fallback') === 'true';
    const fallbackReason = res.headers.get('X-AI-Fallback-Reason') || '';
    if (isFallback) {
      window.dispatchEvent(new CustomEvent('ai-fallback-active', {
        detail: { active: true, reason: fallbackReason }
      }));
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data.error || fallbackMessage;
    const code = data.code || (res.status === 429 ? 'QUOTA_EXHAUSTED' : 'GENERAL_ERROR');
    const retryable = data.retryable !== undefined ? data.retryable : (res.status === 429 && Boolean(data.retryAfterSeconds));
    throw new AIClientError(message, code, retryable, data.retryAfterSeconds);
  }
  return res.json();
}

// =========================================================================
// AUTH & SESSION (CLIENT-MANAGED / LOCAL-FIRST)
// =========================================================================

const AUTH_USER_KEY = 'linguastep_auth_user';

export async function getAuthSession(): Promise<AuthSessionResponse> {
  const limits = await getBudgetStats();
  let user: UserAccount | null = null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      user = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local auth user', e);
  }

  if (!user) {
    const profile = await localStore.getProfile();
    user = {
      id: profile.id || 'local-guest-learner',
      name: profile.name || 'Guest Learner',
      email: 'local@linguastep.offline',
      authProvider: 'guest',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch {}
  }

  return {
    user,
    googleClientIdConfigured: false,
    limits
  };
}

export async function loginAsGuest(): Promise<{ user: UserAccount; limits: BudgetLimits }> {
  const profile = await localStore.getProfile();
  const user: UserAccount = {
    id: profile.id || 'local-guest-learner',
    name: profile.name || 'Guest Learner',
    email: 'local@linguastep.offline',
    authProvider: 'guest',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {}
  const limits = await getBudgetStats();
  return { user, limits };
}

export async function loginWithGoogle(credential: string): Promise<{ user: UserAccount; limits: BudgetLimits }> {
  let name = 'Google Learner';
  let email = 'user@gmail.com';
  let picture: string | undefined;
  try {
    const parts = credential.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      name = payload.name || name;
      email = payload.email || email;
      picture = payload.picture;
    }
  } catch (e) {
    console.warn('Could not parse Google credential JWT', e);
  }

  const user: UserAccount = {
    id: `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name,
    email,
    picture,
    authProvider: 'google',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {}
  const limits = await getBudgetStats();
  return { user, limits };
}

export async function logout(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {}
}

// =========================================================================
// BUDGET & SYSTEM STATUS
// =========================================================================

export async function getBudgetStats(): Promise<BudgetLimits> {
  try {
    const res = await fetch('/api/budget/stats', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch budget stats');
    return res.json();
  } catch (err) {
    // Graceful offline fallback
    return {
      userDailyLimit: 30,
      userRemaining: 30,
      globalDailyLimit: 400,
      globalRemaining: 400,
      userCountToday: 0,
      globalCountToday: 0
    };
  }
}

// =========================================================================
// PROFILE & MEMORY (100% LOCAL-FIRST VIA INDEXEDDB)
// =========================================================================

export async function getProfile(): Promise<UserProfile> {
  return localStore.getProfile();
}

export async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  return localStore.updateProfile(profile);
}

export async function getMemory(): Promise<{
  profile: UserProfile;
  skills: LearnerSkillState[];
  vocabulary: VocabularyItem[];
  attempts: Attempt[];
  lessons: LessonPlan[];
  summaries: DailySummary[];
  diagnosticReports?: DiagnosticReport[];
  studyPlan?: PersonalizedStudyPlan;
}> {
  const profile = await localStore.getProfile();
  const skills = await localStore.getSkills();
  const vocabulary = await localStore.getVocabulary();
  const attempts = await localStore.getAttempts();
  const lessons = await localStore.getLessons();
  const summaries = await localStore.getSummaries();
  const diagnosticReports = await localStore.getDiagnosticReports();
  const studyPlan = (await localStore.getStudyPlan()) || undefined;

  return {
    profile,
    skills,
    vocabulary,
    attempts,
    lessons,
    summaries,
    diagnosticReports,
    studyPlan
  };
}

export async function clearMemory(): Promise<{ success: boolean; message: string }> {
  await localStore.resetAll();
  return { success: true, message: 'Local learning data successfully reset.' };
}

export async function importMemory(data: Partial<LearningDataExport>): Promise<void> {
  await localStore.importAll(data as LearningDataExport);
}

export async function exportMemory(): Promise<LearningDataExport> {
  return localStore.exportAll();
}

export function validateImportData(data: any) {
  return localStore.validateImport(data);
}

export function getStorageStatus() {
  return localStore.getStorageStatus();
}

// =========================================================================
// IN-PROGRESS ACTIVE LESSON RESUMPTION (LOCAL-FIRST)
// =========================================================================

export async function getActiveLessonState(): Promise<ActiveLessonState | null> {
  return localStore.getActiveLesson();
}

export async function saveActiveLessonState(state: ActiveLessonState): Promise<ActiveLessonState> {
  return localStore.saveActiveLesson(state);
}

export async function clearActiveLessonState(): Promise<void> {
  return localStore.clearActiveLesson();
}

// =========================================================================
// LESSON GENERATION & EVALUATION (STATELESS AI ENDPOINTS + LOCAL PERSISTENCE)
// =========================================================================

export async function generateLessonPlan(dailyMinutes?: number, forceRegenerate?: boolean): Promise<LessonPlan> {
  let profile = await localStore.getProfile();
  if (typeof dailyMinutes === 'number' && [10, 20, 30].includes(dailyMinutes)) {
    profile = await localStore.updateProfile({ daily_minutes: dailyMinutes });
  }

  // Check if an in-progress lesson already exists in local storage to prevent wasteful regeneration on refresh
  const existingActive = await localStore.getActiveLesson();
  if (existingActive && existingActive.status === 'in_progress' && !forceRegenerate) {
    return existingActive.plan;
  }

  const existingLessons = await localStore.getLessons();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLesson = existingLessons.find(l => l.date === todayStr && l.status === 'in_progress');
  if (todayLesson && !forceRegenerate) {
    return todayLesson;
  }

  const lessonHistory = existingLessons.map(l => ({
    lesson_number: l.lesson_number,
    primary_objective: l.primary_objective,
    date: l.date,
    sections: l.sections?.map(s => ({ title: s.title, skill_target: s.skill_target }))
  }));

  const skills = await localStore.getSkills();
  const recentErrors = skills.flatMap(s => s.recurring_errors);

  const res = await fetch('/api/ai/lesson-plan', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      profile,
      skills,
      recentErrors,
      dailyMinutes: profile.daily_minutes,
      lessonHistory
    })
  });

  const plan: LessonPlan = await parseAIResponse<LessonPlan>(res, 'Failed to generate lesson plan');
  await localStore.saveLesson(plan);

  // Initialize active lesson in local storage for instant resumption
  await localStore.saveActiveLesson({
    lessonId: plan.lesson_id,
    plan,
    currentSectionIndex: 0,
    questionIndexInSection: 0,
    currentQuestion: null,
    lastEvaluation: null,
    lastUserAnswer: '',
    attempts: [],
    sectionProgress: {},
    status: 'in_progress',
    secondsElapsed: 0,
    updatedAt: new Date().toISOString()
  });

  return plan;
}

export async function generateFullSessionQuestions(plan: LessonPlan): Promise<LessonPlan> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/batch-session-questions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan, profile })
  });

  const populatedPlan: LessonPlan = await parseAIResponse<LessonPlan>(res, 'Failed to pre-generate session questions');
  
  // Save vocabulary items from any questions
  if (populatedPlan.sections) {
    for (const sec of populatedPlan.sections) {
      if (sec.questions) {
        for (const q of sec.questions) {
          if (q.vocab_card) {
            await localStore.saveVocabularyItem(q.vocab_card);
          }
        }
      }
    }
  }

  await localStore.saveLesson(populatedPlan);
  return populatedPlan;
}

export async function generateQuestion(
  section: SectionType,
  skillName?: string,
  contextTopic?: 'general' | 'workplace_tech',
  activityType?: string,
  questionIndex?: number,
  totalInActivity?: number,
  sessionObjective?: string
): Promise<Question> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/lesson-question', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      section,
      skillName,
      contextTopic,
      activityType,
      questionIndex,
      totalInActivity,
      sessionObjective,
      profile
    })
  });

  const question: Question = await parseAIResponse<Question>(res, 'Failed to generate question');

  // If question introduces a vocab card, save it locally in IndexedDB
  if (question.vocab_card) {
    await localStore.saveVocabularyItem(question.vocab_card);
  }

  return question;
}

export async function evaluateAnswer(
  question: Question,
  userAnswer: string,
  lessonId?: string
): Promise<AnswerEvaluation> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/lesson-evaluate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      question,
      userAnswer,
      profile
    })
  });

  const evaluation: AnswerEvaluation = await parseAIResponse<AnswerEvaluation>(res, 'Failed to evaluate answer');

  // Persist attempt locally in IndexedDB and update mastery metrics
  const attempt: Attempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    lesson_id: lessonId || 'current-lesson',
    question_id: question.id,
    section: question.section,
    skill_name: question.skill_name,
    user_answer: userAnswer,
    verdict: evaluation.verdict,
    evaluation,
    created_at: new Date().toISOString()
  };

  await localStore.recordAttempt(attempt);

  // If vocabulary question or card, record evidence-based mastery locally
  const targetWord = question.target_word || question.vocab_card?.word;
  if (targetWord || question.section === 'vocabulary') {
    const wordKey = targetWord || question.skill_name.replace(/^Collocations with /i, '').trim();
    const isCorrect = evaluation.verdict === 'correct';
    try {
      const masteryResult = await localStore.recordVocabularyEvidence({
        word: wordKey,
        cardData: question.vocab_card,
        isCorrect,
        contextSentence: question.context_sentence || question.prompt,
        exerciseType: question.vocab_exercise_type || 'contextual_cloze',
        confusedWith: !isCorrect ? userAnswer : undefined
      });
      evaluation.vocab_mastery_update = masteryResult.update;
    } catch (e) {
      console.warn('Failed to record vocabulary evidence:', e);
    }
  }

  return evaluation;
}

export async function requestTutorAssist(
  question: Question,
  action: 'hint' | 'simpler_explanation' | 'another_example' | 'clarify_ambiguity'
): Promise<TutorAssistantResponse> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/tutor-assist', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      question,
      action,
      profile
    })
  });

  return parseAIResponse<TutorAssistantResponse>(res, 'Failed to get tutor assist');
}

export async function tutorDeepDive(
  question: Question,
  userAnswer: string,
  evaluation: AnswerEvaluation | undefined,
  message: string,
  history: Array<{ role: 'user' | 'tutor'; content: string }> = []
): Promise<DeepDiveInquiryResponse> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/deep-dive', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      question,
      userAnswer,
      evaluation,
      message,
      history,
      profile
    })
  });

  return parseAIResponse<DeepDiveInquiryResponse>(res, 'Failed to process tutor inquiry');
}

export async function generateLessonSummary(
  lesson: LessonPlan,
  attempts: Array<{ question: Question; evaluation: AnswerEvaluation; userAnswer: string }>,
  timeSpentMinutes?: number
): Promise<DailySummary> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/lesson-summary', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      lesson,
      attempts,
      profile,
      timeSpentMinutes
    })
  });

  const summary: DailySummary = await parseAIResponse<DailySummary>(res, 'Failed to generate lesson summary');

  // Save summary locally in IndexedDB
  await localStore.saveSummary(summary);

  // Mark lesson completed in local store and clear active lesson progress
  lesson.status = 'completed';
  await localStore.saveLesson(lesson);
  await localStore.clearActiveLesson();

  return summary;
}

export async function saveVocabularyItem(item: Partial<VocabularyItem> & { word: string }): Promise<VocabularyItem> {
  return localStore.saveVocabularyItem(item);
}

// =========================================================================
// CONVERSATIONAL DISCOVERY (STATELESS AI + LOCAL PROGRESSION)
// =========================================================================

export async function getDiscoveryState(): Promise<DiscoveryState> {
  let state = await localStore.getDiscoveryState();
  const profile = await localStore.getProfile();

  if (!state || state.messages.length === 0) {
    const isVi = profile.explanation_language === 'vi';
    state = {
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'tutor',
          text: isVi
            ? 'Xin chào! Mình là gia sư tiếng Anh cá nhân của bạn. Mình ở đây để giúp bạn tiến bộ qua các buổi học 1 câu hỏi tại một thời điểm, giải thích cặn kẽ và ghi nhớ dài hạn.\n\nĐể bắt đầu, mục tiêu học tiếng Anh lớn nhất của bạn lúc này là gì?'
            : 'Hello! I am your personal adaptive English tutor. I will guide you with focused step-by-step questions, clear explanations, and long-term memory tracking.\n\nTo begin, what is your primary English learning goal right now?',
          quickReplies: isVi
            ? ['Giao tiếp công việc & Kỹ thuật', 'Giao tiếp đời sống tự nhiên', 'Viết báo cáo & Đọc tài liệu', 'Cân bằng cả hai']
            : ['Workplace & Tech Communication', 'Natural Conversation', 'Reading & Technical Writing', 'Balanced Mix'],
          dimension: 'goal',
          timestamp: new Date().toISOString()
        }
      ],
      currentDimensionIndex: 1,
      isConfirmed: false,
      summary: '',
      profileDraft: {},
      updatedAt: new Date().toISOString()
    };
    await localStore.saveDiscoveryState(state);
  }

  return state;
}

export async function sendDiscoveryMessage(message: string): Promise<DiscoveryState> {
  let state = await getDiscoveryState();
  const profile = await localStore.getProfile();

  // Pushing learner message locally
  state.messages.push({
    id: `msg-user-${Date.now()}`,
    sender: 'learner',
    text: message.trim(),
    timestamp: new Date().toISOString()
  });

  const res = await fetch('/api/ai/discovery-turn', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      history: state.messages,
      userMessage: message.trim(),
      profile
    })
  });

  const result = await parseAIResponse<any>(res, 'Failed to process discovery turn');

  // Add tutor reply
  state.messages.push({
    id: `msg-tutor-${Date.now()}`,
    sender: 'tutor',
    text: result.tutorReply,
    quickReplies: result.quickReplies,
    dimension: result.dimension,
    timestamp: new Date().toISOString()
  });

  // Update profile draft
  if (result.updatedProfile) {
    state.profileDraft = {
      ...state.profileDraft,
      ...result.updatedProfile
    };
    await localStore.updateProfile(result.updatedProfile);
  }

  state.currentDimensionIndex += 1;
  state.isConfirmed = Boolean(result.isDiscoveryComplete);
  if (result.confirmationSummary) {
    state.summary = result.confirmationSummary;
  }
  state.updatedAt = new Date().toISOString();

  await localStore.saveDiscoveryState(state);
  return state;
}

export async function confirmDiscovery(): Promise<{ success: boolean; profile: UserProfile }> {
  const state = await localStore.getDiscoveryState();
  if (state) {
    state.isConfirmed = true;
    await localStore.saveDiscoveryState(state);
  }
  const profile = await localStore.getProfile();
  return { success: true, profile };
}

// =========================================================================
// ADAPTIVE DIAGNOSTIC ASSESSMENT (LOCAL SESSION + STATELESS AI)
// =========================================================================

export async function getDiagnosticSession(): Promise<{ session: DiagnosticSession | null }> {
  const session = await localStore.getDiagnosticSession();
  return { session };
}

export async function startDiagnosticSession(mode: DiagnosticMode = 'standard'): Promise<DiagnosticSession> {
  const profile = await localStore.getProfile();
  const plan = createDiagnosticAssessmentPlan(mode, profile.explanation_language);

  const initialSession: DiagnosticSession = {
    sessionId: `diag-sess-${Date.now()}`,
    mode,
    status: 'in_progress',
    plan,
    currentSectionIndex: 0,
    questionIndexInSection: 0,
    currentIndex: 1,
    totalQuestions: plan.totalQuestions,
    minQuestions: plan.totalQuestions,
    maxQuestions: plan.totalQuestions,
    history: [],
    currentEstimates: {
      grammar: { category: 'grammar', cefrRange: profile.current_level || 'B2', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      vocabulary: { category: 'vocabulary', cefrRange: profile.current_level || 'B2', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      reading: { category: 'reading', cefrRange: profile.current_level || 'B2', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      writing: { category: 'writing', cefrRange: profile.current_level || 'B2', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      speaking: { category: 'speaking', cefrRange: 'Not Assessed (Text Diagnostic)', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: ['Speech fluency requires audio session'], recurringErrors: [], unassessedSubskills: ['Spoken spontaneous output', 'Pronunciation'] },
      listening: { category: 'listening', cefrRange: 'Not Assessed (Text Diagnostic)', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: ['Spoken accent comprehension'] }
    },
    overallCEFR: profile.current_level || 'B2',
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  // Request initial question from stateless endpoint
  const res = await fetch('/api/ai/diagnostic-question', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ session: initialSession, profile })
  });

  const question: Question = await parseAIResponse<Question>(res, 'Failed to start diagnostic assessment');
  initialSession.currentQuestion = question;

  await localStore.saveDiagnosticSession(initialSession);
  return initialSession;
}

export async function getNextDiagnosticQuestion(): Promise<{ question: Question; session: DiagnosticSession }> {
  const session = await localStore.getDiagnosticSession();
  if (!session) throw new Error('No active diagnostic session');

  const profile = await localStore.getProfile();

  // Ensure plan exists
  if (!session.plan) {
    session.plan = createDiagnosticAssessmentPlan(session.mode, profile.explanation_language);
    session.totalQuestions = session.plan.totalQuestions;
    session.minQuestions = session.plan.totalQuestions;
    session.maxQuestions = session.plan.totalQuestions;
  }

  const res = await fetch('/api/ai/diagnostic-question', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ session, profile })
  });

  const question: Question = await parseAIResponse<Question>(res, 'Failed to get next diagnostic question');
  session.currentQuestion = question;
  session.currentIndex = session.history.length + 1;
  session.lastActiveAt = new Date().toISOString();

  await localStore.saveDiagnosticSession(session);
  return { question, session };
}

export async function submitDiagnosticAnswer(
  question: Question,
  userAnswer: string,
  durationSeconds: number = 0
): Promise<{
  evaluation: AnswerEvaluation;
  writingRubric?: WritingRubricScore;
  canStop: boolean;
  mustStop: boolean;
  historyCount: number;
  minQuestions: number;
  maxQuestions: number;
  isSectionComplete: boolean;
  completedSectionName?: string;
  nextSectionName?: string;
}> {
  const session = await localStore.getDiagnosticSession();
  if (!session) throw new Error('No active diagnostic session');

  const profile = await localStore.getProfile();

  // Ensure plan exists
  if (!session.plan) {
    session.plan = createDiagnosticAssessmentPlan(session.mode, profile.explanation_language);
    session.totalQuestions = session.plan.totalQuestions;
    session.minQuestions = session.plan.totalQuestions;
    session.maxQuestions = session.plan.totalQuestions;
  }

  const res = await fetch('/api/ai/diagnostic-evaluate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ question, userAnswer, profile })
  });

  const { evaluation, writingRubric } = await parseAIResponse<{ evaluation: AnswerEvaluation; writingRubric?: WritingRubricScore }>(res, 'Failed to evaluate diagnostic answer');

  // Record attempt locally in session history
  session.history.push({
    id: `diag-att-${Date.now()}`,
    question,
    userAnswer,
    verdict: evaluation.verdict,
    evaluation,
    writingRubric,
    durationSeconds,
    timestamp: new Date().toISOString()
  });
  session.lastActiveAt = new Date().toISOString();

  // Evaluate section completions
  const plan = session.plan;
  const currentSection = question.section;
  const secAttempts = session.history.filter(h => h.question.section === currentSection);
  const currentSectionPlanIndex = plan.sections.findIndex(s => s.section === currentSection);
  const currentSectionPlan = plan.sections[currentSectionPlanIndex];

  let isSectionComplete = false;
  let completedSectionName: string | undefined;
  let nextSectionName: string | undefined;

  if (currentSectionPlan && secAttempts.length >= currentSectionPlan.targetQuestionsCount) {
    currentSectionPlan.completed = true;
    isSectionComplete = true;
    completedSectionName = currentSectionPlan.title;
    if (currentSectionPlanIndex < plan.sections.length - 1) {
      nextSectionName = plan.sections[currentSectionPlanIndex + 1].title;
      session.currentSectionIndex = currentSectionPlanIndex + 1;
      session.questionIndexInSection = 0;
    }
  }

  const totalAnswered = session.history.length;
  const targetTotal = session.totalQuestions || plan.totalQuestions;
  const mustStop = totalAnswered >= targetTotal;
  const canStop = mustStop || (totalAnswered >= Math.min(session.minQuestions, targetTotal));

  await localStore.saveDiagnosticSession(session);

  return {
    evaluation,
    writingRubric,
    canStop,
    mustStop,
    historyCount: totalAnswered,
    minQuestions: session.minQuestions,
    maxQuestions: targetTotal,
    isSectionComplete,
    completedSectionName,
    nextSectionName
  };
}

export async function pauseDiagnosticSession(): Promise<{ success: boolean; message: string }> {
  const session = await localStore.getDiagnosticSession();
  if (session) {
    session.status = 'paused';
    session.lastActiveAt = new Date().toISOString();
    await localStore.saveDiagnosticSession(session);
  }
  return { success: true, message: 'Assessment saved. You can resume anytime.' };
}

export async function completeDiagnosticSession(): Promise<{
  report: DiagnosticReport;
  studyPlan: PersonalizedStudyPlan;
}> {
  const session = await localStore.getDiagnosticSession();
  if (!session) throw new Error('No active diagnostic session');

  const profile = await localStore.getProfile();
  session.status = 'completed';
  session.completedAt = new Date().toISOString();

  // Compute report
  const repRes = await fetch('/api/ai/diagnostic-report', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ session, profile })
  });

  const report: DiagnosticReport = await parseAIResponse<DiagnosticReport>(repRes, 'Failed to compute diagnostic report');
  await localStore.saveDiagnosticReport(report);

  // Generate personalized study plan
  const planRes = await fetch('/api/ai/diagnostic-study-plan', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ report, profile })
  });

  const studyPlan: PersonalizedStudyPlan = await parseAIResponse<PersonalizedStudyPlan>(planRes, 'Failed to generate personalized study plan');
  await localStore.saveStudyPlan(studyPlan);

  // Update profile level in local storage
  const finalLevel = report.overallCEFR.includes('C1') ? 'C1' : report.overallCEFR.includes('B2') ? 'B2' : 'B1';
  await localStore.updateProfile({
    current_level: finalLevel as any,
    goal_summary: `Calibrated at ${report.overallCEFR} based on adaptive diagnostic assessment.`
  });

  // Clear active session in local store
  await localStore.clearDiagnosticSession();

  return { report, studyPlan };
}

export async function getDiagnosticReports(): Promise<DiagnosticReport[]> {
  return localStore.getDiagnosticReports();
}

// =========================================================================
// PERSONALIZED STUDY PLAN (LOCAL-FIRST)
// =========================================================================

export async function getStudyPlan(): Promise<{ plan: PersonalizedStudyPlan | null }> {
  const plan = await localStore.getStudyPlan();
  return { plan };
}

export async function approveStudyPlan(
  adjustedMinutes?: number,
  adjustedPriorities?: any[]
): Promise<{ success: boolean; plan: PersonalizedStudyPlan; profile: UserProfile }> {
  const plan = await localStore.getStudyPlan();
  if (!plan) throw new Error('No study plan to approve');

  if (adjustedPriorities) {
    plan.prioritizedSkills = adjustedPriorities;
  }
  plan.learnerApprovalStatus = 'approved';
  plan.approvedAt = new Date().toISOString();
  await localStore.saveStudyPlan(plan);

  const updatedProfile = await localStore.updateProfile({
    onboarding_completed: true,
    daily_minutes: adjustedMinutes || plan.dailyRoutineTemplate.reduce((acc, s) => acc + s.minutes, 0)
  });

  return { success: true, plan, profile: updatedProfile };
}

// =========================================================================
// HONEST AUDIO SYNTHESIS
// =========================================================================

export function playEnglishSpeech(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (enVoice) utterance.voice = enVoice;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    return false;
  }
}
