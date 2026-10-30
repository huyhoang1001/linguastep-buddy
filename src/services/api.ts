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
  WordPracticeData,
  NextSessionCustomContext,
  CompanionChatContext
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

const SESSION_TOKEN_KEY = 'linguastep_session_token';

export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {}
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('lingua_step_gemini_api_key');
    if (customKey && customKey.trim()) {
      headers['x-goog-api-key'] = customKey.trim();
    }
    const token = getStoredSessionToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function verifyCustomApiKey(apiKey: string): Promise<{ valid: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/ai/verify-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      credentials: 'include',
      body: JSON.stringify({ apiKey: apiKey.trim() })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { valid: false, error: data.error || 'Failed to validate API key.' };
    }
    return { valid: true, message: data.message || 'API key verified and connected!' };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error verifying key' };
  }
}

export function saveCustomApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lingua_step_gemini_api_key', key.trim());
  }
}

export function clearCustomApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lingua_step_gemini_api_key');
  }
}

export function getCustomApiKeyMasked(): { hasKey: boolean; masked: string } {
  if (typeof window === 'undefined') return { hasKey: false, masked: '' };
  const key = localStorage.getItem('lingua_step_gemini_api_key');
  if (!key || !key.trim()) return { hasKey: false, masked: '' };
  const trimmed = key.trim();
  const last4 = trimmed.slice(-4);
  return { hasKey: true, masked: `••••••••••••${last4}` };
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
    if (res.ok) {
      window.dispatchEvent(new CustomEvent('ai-budget-updated'));
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
// AUTH & SESSION (SECURE BACKEND COOKIE + BEARER TOKEN + LOCAL-FIRST SCORING)
// =========================================================================

export async function getAuthSession(): Promise<AuthSessionResponse> {
  try {
    const res = await fetch('/api/auth/session', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        localStore.setActiveAccount(data.user.id);
      }
      return {
        user: data.user || null,
        googleClientIdConfigured: Boolean(data.googleClientIdConfigured),
        googleClientId: data.googleClientId || '',
        limits: data.limits
      };
    }
  } catch (err) {
    console.warn('[Auth] Error fetching session from server:', err);
  }

  const limits = await getBudgetStats();
  return {
    user: null,
    googleClientIdConfigured: false,
    limits
  };
}

export async function loginAsGuest(): Promise<{ user: UserAccount; limits: BudgetLimits }> {
  const res = await fetch('/api/auth/guest', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ preferredId: 'learner-primary' })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to initialize guest session.');
  }

  const data = await res.json();
  if (data.token) {
    setStoredSessionToken(data.token);
  }
  localStore.setActiveAccount(data.user.id);
  return { user: data.user, limits: data.limits };
}

export async function loginWithGoogle(credential: string): Promise<{ user: UserAccount; limits: BudgetLimits }> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Google authentication failed.');
  }

  const data = await res.json();
  if (data.token) {
    setStoredSessionToken(data.token);
  }

  // Safely migrate prior guest learning progress to newly signed-in Google account
  await localStore.migrateGuestDataToAccount(data.user.id);
  localStore.setActiveAccount(data.user.id);

  return { user: data.user, limits: data.limits };
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
  } catch (err) {
    console.warn('[Auth] Server logout notification error:', err);
  } finally {
    setStoredSessionToken(null);
    localStore.setActiveAccount('learner-primary');
  }
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

export async function generateLessonPlan(
  dailyMinutes?: number,
  forceRegenerate?: boolean,
  customContext?: NextSessionCustomContext
): Promise<LessonPlan> {
  let profile = await localStore.getProfile();
  const effectiveMinutes = customContext?.dailyMinutes || dailyMinutes;
  if (typeof effectiveMinutes === 'number' && [10, 20, 30].includes(effectiveMinutes)) {
    profile = await localStore.updateProfile({ daily_minutes: effectiveMinutes });
  }

  const shouldForce = forceRegenerate || Boolean(customContext);

  // Check if an in-progress lesson already exists in local storage to prevent wasteful regeneration on refresh
  const existingActive = await localStore.getActiveLesson();
  if (existingActive && existingActive.status === 'in_progress' && !shouldForce) {
    return existingActive.plan;
  }

  const existingLessons = await localStore.getLessons();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLesson = existingLessons.find(l => l.date === todayStr && l.status === 'in_progress');
  if (todayLesson && !shouldForce) {
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
      lessonHistory,
      customContext
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

export async function requestCompanionChat(
  messages: Array<{ role: 'user' | 'cat'; content: string }>,
  lessonContext?: CompanionChatContext
): Promise<{ reply: string; suggestedPills?: string[] }> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/companion-chat', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      messages,
      profile,
      lessonContext
    })
  });

  return parseAIResponse<{ reply: string; suggestedPills?: string[] }>(res, 'Failed to connect with MeoMeo');
}

export async function getWordPractice(
  word: string,
  contextSentence: string = '',
  examMajor?: string
): Promise<WordPracticeData> {
  const profile = await localStore.getProfile();

  const res = await fetch('/api/ai/word-practice', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      word,
      contextSentence,
      profile,
      examMajor
    })
  });

  return parseAIResponse<WordPracticeData>(res, `Failed to analyze vocabulary "${word}"`);
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
    await localStore.updateProfile({ goal_summary: result.confirmationSummary });
  }
  state.updatedAt = new Date().toISOString();

  await localStore.saveDiscoveryState(state);
  return state;
}

export async function confirmDiscovery(customGoalSummary?: string): Promise<{ success: boolean; profile: UserProfile }> {
  const state = await localStore.getDiscoveryState();
  let goalSummaryToUse = customGoalSummary || state?.summary || '';

  // Fallback: Aggregate learner inputs from discovery messages if goalSummaryToUse is still empty
  if (!goalSummaryToUse.trim() && state?.messages) {
    const userInputs = state.messages
      .filter(m => m.sender === 'learner' && m.text.trim().toLowerCase() !== 'skip question')
      .map(m => m.text.trim())
      .filter(Boolean);
    if (userInputs.length > 0) {
      goalSummaryToUse = userInputs.join('; ');
    }
  }

  if (state) {
    state.isConfirmed = true;
    if (goalSummaryToUse) {
      state.summary = goalSummaryToUse;
    }
    await localStore.saveDiscoveryState(state);
  }

  if (goalSummaryToUse) {
    await localStore.updateProfile({ goal_summary: goalSummaryToUse });
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

export async function startDiagnosticSession(mode: DiagnosticMode = 'standard', customProfile?: UserProfile): Promise<DiagnosticSession> {
  const profile = customProfile || await localStore.getProfile();

  // If goal_summary is empty, check discovery state to restore any discovery summary/inputs
  if (!profile.goal_summary || profile.goal_summary.trim().length === 0) {
    const discoveryState = await localStore.getDiscoveryState();
    if (discoveryState?.summary) {
      profile.goal_summary = discoveryState.summary;
      await localStore.updateProfile({ goal_summary: discoveryState.summary });
    } else if (discoveryState?.messages) {
      const userInputs = discoveryState.messages
        .filter(m => m.sender === 'learner' && m.text.trim().toLowerCase() !== 'skip question')
        .map(m => m.text.trim())
        .filter(Boolean);
      if (userInputs.length > 0) {
        profile.goal_summary = userInputs.join('; ');
        await localStore.updateProfile({ goal_summary: profile.goal_summary });
      }
    }
  }

  const baseline = profile.current_level || 'A1';
  const plan = createDiagnosticAssessmentPlan(mode, profile.explanation_language);

  const initialSession: DiagnosticSession = {
    sessionId: `diag-sess-${Date.now()}`,
    mode,
    status: 'in_progress',
    major_or_subject: profile.major_or_subject || 'Software Engineering & IT',
    major_focus_details: profile.major_focus_details || '',
    plan,
    currentSectionIndex: 0,
    questionIndexInSection: 0,
    currentIndex: 1,
    totalQuestions: plan.totalQuestions,
    minQuestions: plan.totalQuestions,
    maxQuestions: plan.totalQuestions,
    history: [],
    currentEstimates: {
      grammar: { category: 'grammar', cefrRange: baseline, confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      vocabulary: { category: 'vocabulary', cefrRange: baseline, confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      reading: { category: 'reading', cefrRange: baseline, confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      writing: { category: 'writing', cefrRange: baseline, confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: [] },
      speaking: { category: 'speaking', cefrRange: 'Not Assessed (Text Diagnostic)', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: ['Speech fluency requires audio session'], recurringErrors: [], unassessedSubskills: ['Spoken spontaneous output', 'Pronunciation'] },
      listening: { category: 'listening', cefrRange: 'Not Assessed (Text Diagnostic)', confidence: 'low', evidenceCount: 0, correctCount: 0, demonstratedStrengths: [], priorityWeaknesses: [], recurringErrors: [], unassessedSubskills: ['Spoken accent comprehension'] }
    },
    overallCEFR: baseline,
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  // Request all assessment questions in ONE single batch call using user context
  try {
    const res = await fetch('/api/ai/diagnostic-batch-questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session: initialSession, profile })
    });
    const batchData = await parseAIResponse<{ questions: Question[] }>(res, 'Failed to pre-generate assessment questions');
    if (batchData && Array.isArray(batchData.questions) && batchData.questions.length > 0) {
      initialSession.pregeneratedQuestions = batchData.questions;
      initialSession.currentQuestion = batchData.questions[0];
    }
  } catch (err: any) {
    if (err instanceof AIClientError && (err.code === 'QUOTA_EXHAUSTED' || err.code === 'RATE_LIMITED' || err.code === 'AUTH_FAILED')) {
      throw err;
    }
    console.warn('[AI] Batch question generation fallback to single item:', err);
  }

  // Fallback to single question endpoint if batch was not generated
  if (!initialSession.currentQuestion) {
    const res = await fetch('/api/ai/diagnostic-question', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session: initialSession, profile })
    });
    const question: Question = await parseAIResponse<Question>(res, 'Failed to start diagnostic assessment');
    initialSession.currentQuestion = question;
  }

  await localStore.saveDiagnosticSession(initialSession);
  return initialSession;
}

export async function getNextDiagnosticQuestion(): Promise<{ question: Question; session: DiagnosticSession }> {
  const session = await localStore.getDiagnosticSession();
  if (!session) throw new Error('No active diagnostic session');

  const profile = await localStore.getProfile();

  // Ensure profile goal_summary is preserved
  if (!profile.goal_summary || profile.goal_summary.trim().length === 0) {
    const discoveryState = await localStore.getDiscoveryState();
    if (discoveryState?.summary) {
      profile.goal_summary = discoveryState.summary;
      await localStore.updateProfile({ goal_summary: discoveryState.summary });
    }
  }

  // Ensure plan exists
  if (!session.plan) {
    session.plan = createDiagnosticAssessmentPlan(session.mode, profile.explanation_language);
    session.totalQuestions = session.plan.totalQuestions;
    session.minQuestions = session.plan.totalQuestions;
    session.maxQuestions = session.plan.totalQuestions;
  }

  // 1. Check if assessment has pre-generated questions in session:
  // ZERO AI roundtrip, ZERO token waste between questions!
  const nextIndex = session.history.length;
  if (session.pregeneratedQuestions && session.pregeneratedQuestions.length > nextIndex) {
    const question = session.pregeneratedQuestions[nextIndex];
    session.currentQuestion = question;
    session.currentIndex = nextIndex + 1;
    session.lastActiveAt = new Date().toISOString();
    await localStore.saveDiagnosticSession(session);
    return { question, session };
  }

  // 2. Fallback to individual generation only if pregeneratedQuestions is unavailable
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

  const isWritingQuestion = question.section === 'writing' || question.question_type === 'free_writing';
  let evaluation: AnswerEvaluation;
  let writingRubric: WritingRubricScore | undefined;

  // Writing and subjective open questions MUST ALWAYS invoke the AI examiner to assess (not by assumption)
  if (isWritingQuestion || !question.options || question.options.length === 0) {
    const res = await fetch('/api/ai/diagnostic-evaluate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question, userAnswer, profile })
    });

    const evalData = await parseAIResponse<{ evaluation: AnswerEvaluation; writingRubric?: WritingRubricScore }>(res, 'Failed to evaluate diagnostic answer');
    evaluation = evalData.evaluation;
    writingRubric = evalData.writingRubric;
  } else {
    // Fast, deterministic evaluation for multiple-choice & fill-in questions (avoids wasting tokens on simple letter/word choices)
    const options = question.options || [];
    const trimmed = userAnswer.trim();
    const expectedOption = options.find(o =>
      question.expected_answer_ids?.some(id => id.trim().toUpperCase() === o.id.toUpperCase())
    ) || options[0];
    const expectedId = expectedOption ? expectedOption.id.toUpperCase() : 'A';
    const expectedText = expectedOption ? expectedOption.text.trim() : (question.expected_answer_text || '');

    const clean = (s: string) => (s || '').trim().toLowerCase().replace(/[.,!?;:'"“”()[\]{}]/g, '').replace(/\s+/g, ' ');
    const normUser = clean(trimmed);
    const normExpected = clean(expectedText);
    const acceptedAlts = (question.accepted_alternatives || []).map(clean);

    const selectedOption = options.find(
      o => o.id.toUpperCase() === trimmed.toUpperCase() || clean(o.text) === normUser
    );
    const selectedId = (selectedOption ? selectedOption.id : trimmed).toUpperCase();

    const isCorrect = (selectedOption && selectedOption.id.toUpperCase() === expectedId) ||
      (selectedId === expectedId) ||
      (normUser === normExpected) ||
      acceptedAlts.includes(normUser);

    evaluation = {
      verdict: isCorrect ? 'correct' : 'incorrect',
      user_answer: selectedOption ? `${selectedOption.id}. ${selectedOption.text}` : userAnswer,
      expected_answer: `${expectedId}. ${expectedText}`,
      full_correct_sentence: question.prompt.includes('____')
        ? question.prompt.replace(/_{2,}/g, `**${expectedText}**`)
        : `${question.prompt} → ${expectedText}`,
      decisive_clue: question.explanation_rule || question.hint || `Option ${expectedId} is the correct answer.`,
      explanation: isCorrect
        ? (question.explanation_rule || `Well done! ${expectedId} is correct.`)
        : `You chose "${selectedOption ? selectedOption.text : trimmed}". The correct choice is "${expectedId}. ${expectedText}". ${question.explanation_rule || ''}`,
      sentence_translation: question.sentence_translation || question.vocab_card?.meaning,
      error_tags: isCorrect ? [] : [question.skill_name || 'Syntax precision'],
      needs_retry: false,
      next_action: 'continue'
    };
  }

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
