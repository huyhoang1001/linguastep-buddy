import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { aiService } from './server/aiService.js';
import { budgetManager } from './server/usageBudget.js';
import { classifyGeminiError, AIException } from './server/aiErrors.js';
import {
  UserProfile,
  LessonPlan,
  Question,
  AnswerEvaluation,
  SectionType,
  LearnerSkillState,
  DiagnosticSession,
  DiagnosticReport
} from './src/types/learning.js';

import cookieParser from 'cookie-parser';
import {
  verifyGoogleIdToken,
  createSessionToken,
  validateSessionToken,
  revokeSessionToken,
  createGuestSession,
  isGoogleAuthAvailable,
  getGoogleClientId
} from './server/authService.js';
import { UserAccount } from './server/authTypes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const SESSION_COOKIE_NAME = 'linguastep_session';

export function extractAuthToken(req: Request): string | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
  return null;
}

export function extractAuthUser(req: Request): UserAccount | null {
  const token = extractAuthToken(req);
  if (!token) return null;
  return validateSessionToken(token);
}

function setSessionCookie(req: Request, res: Response, token: string) {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });
}

function clearSessionCookie(req: Request, res: Response) {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    path: '/'
  });
}

/**
 * Standardized AI Route Error Handler.
 * Returns consistent error payloads across all endpoints.
 */
export function handleAiRouteError(res: Response, err: any) {
  const classified = classifyGeminiError(err);
  const status =
    classified.code === 'QUOTA_EXHAUSTED' || classified.code === 'RATE_LIMITED' ? 429
    : classified.code === 'AUTH_FAILED' ? 401
    : classified.code === 'TIMEOUT' || classified.code === 'SERVICE_UNAVAILABLE' ? 503
    : classified.code === 'INVALID_REQUEST' ? 400
    : 500;

  return res.status(status).json({
    error: classified.userMessage,
    code: classified.code,
    retryable: classified.retryable,
    retryAfterSeconds: classified.retryAfterSeconds
  });
}

/**
 * Middleware: Rate limiting & AI usage budget control.
 * Local-first architecture: The server does NOT store personal learning data,
 * but protects the owner's Gemini API key by tracking client IP requests against
 * per-client and global community daily budget caps.
 */
function checkAIBudget(req: Request, res: Response, next: NextFunction) {
  const customApiKey = req.headers['x-goog-api-key'] || req.headers['x-gemini-api-key'];
  if (customApiKey && typeof customApiKey === 'string' && customApiKey.trim().length > 5) {
    (req as any).customApiKey = customApiKey.trim();
    aiService.setApiKey(customApiKey.trim());
    return next();
  }
  aiService.setApiKey(undefined);

  // Authenticate user via secure session cookie or Bearer token; never trust client-supplied user IDs
  const authUser = extractAuthUser(req);
  (req as any).authUser = authUser;

  let clientId: string;
  if (authUser) {
    clientId = `user_${authUser.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  } else {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'client-default';
    clientId = `ip_${ip.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  }

  const allowance = budgetManager.checkAllowance(clientId);
  if (!allowance.allowed) {
    const isRateLimited = Boolean(allowance.retryAfterSeconds);
    const code = isRateLimited ? 'RATE_LIMITED' : 'QUOTA_EXHAUSTED';
    const errorMsg = allowance.reason || (isRateLimited
      ? 'AI service is temporarily busy due to rate limits. Please wait a moment before trying again.'
      : "AI usage limit reached. We're unable to process your request right now. Please try again later.");

    return res.status(429).json({
      error: errorMsg,
      code,
      retryable: isRateLimited,
      retryAfterSeconds: allowance.retryAfterSeconds
    });
  }

  // Attach clientId for usage recording
  (req as any).clientId = clientId;
  next();
}

// --- API ROUTES ---

// Health & Status (confirms local-first stateless architecture)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    architecture: 'local_first_stateless',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    googleAuthAvailable: isGoogleAuthAvailable(),
    timestamp: new Date().toISOString()
  });
});

// =========================================================================
// AUTHENTICATION ROUTES (GOOGLE IDENTITY SERVICES & GUEST SESSIONS)
// =========================================================================

// Restore or check session
app.get('/api/auth/session', (req: Request, res: Response) => {
  const authUser = extractAuthUser(req);
  let clientId: string;
  if (authUser) {
    clientId = `user_${authUser.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  } else {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'client-default';
    clientId = `ip_${ip.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  }
  const limits = budgetManager.getStats(clientId);

  res.json({
    user: authUser || null,
    googleClientIdConfigured: isGoogleAuthAvailable(),
    googleClientId: getGoogleClientId(),
    limits
  });
});

// Google ID token sign-in (verifies Google signature, sub, audience, expiration)
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential, idToken } = req.body || {};
    const tokenToVerify = credential || idToken;
    if (!tokenToVerify || typeof tokenToVerify !== 'string') {
      return res.status(400).json({ error: 'Google ID token credential is required.' });
    }

    const user = await verifyGoogleIdToken(tokenToVerify);
    const token = createSessionToken(user);
    setSessionCookie(req, res, token);

    const limits = budgetManager.getStats(`user_${user.id.replace(/[^a-zA-Z0-9_]/g, '_')}`);
    res.json({
      user,
      token,
      googleClientIdConfigured: isGoogleAuthAvailable(),
      googleClientId: getGoogleClientId(),
      limits
    });
  } catch (err: any) {
    console.warn('[Auth] Google token verification error:', err?.message);
    res.status(401).json({
      error: err?.message || 'Google authentication failed. Please verify your account.'
    });
  }
});

// Explicit Guest Sign-In
app.post('/api/auth/guest', (req: Request, res: Response) => {
  const { preferredId } = req.body || {};
  const { user, token } = createGuestSession(preferredId);
  setSessionCookie(req, res, token);

  const limits = budgetManager.getStats(`user_${user.id.replace(/[^a-zA-Z0-9_]/g, '_')}`);
  res.json({
    user,
    token,
    googleClientIdConfigured: isGoogleAuthAvailable(),
    googleClientId: getGoogleClientId(),
    limits
  });
});

// Sign Out (invalidates server session and clears cookie)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = extractAuthToken(req);
  if (token) {
    revokeSessionToken(token);
  }
  clearSessionCookie(req, res);
  res.json({ success: true });
});

// Budget stats for caller
app.get('/api/budget/stats', (req: Request, res: Response) => {
  const authUser = extractAuthUser(req);
  let clientId: string;
  if (authUser) {
    clientId = `user_${authUser.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  } else {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'client-default';
    clientId = `ip_${ip.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  }

  const stats = budgetManager.getStats(clientId);
  res.json(stats);
});

// =========================================================================
// STATELESS AI ENDPOINTS (PURE FUNCTIONS - NO SERVER STORAGE OF USER DATA)
// =========================================================================

app.use('/api/ai/', (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    if (aiService.isFallbackActive) {
      res.setHeader('X-AI-Fallback', 'true');
      if (aiService.lastFallbackReason) {
        res.setHeader('X-AI-Fallback-Reason', aiService.lastFallbackReason);
      }
    }
    return originalJson(data);
  };

  res.on('finish', () => {
    if (res.statusCode < 400 && (req as any).clientId && !(req as any).customApiKey) {
      budgetManager.recordUsage((req as any).clientId, 'gemini-3.1-flash-lite', req.path, 100, 100, 'success');
    }
  });

  next();
});

// 0. Verify and test custom Gemini API key
app.post('/api/ai/verify-key', async (req: Request, res: Response) => {
  try {
    const rawKey = req.headers['x-goog-api-key'] || req.headers['x-gemini-api-key'] || req.body?.apiKey;
    if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length < 6) {
      return res.status(400).json({ valid: false, error: 'API key is missing or too short.' });
    }
    const key = rawKey.trim();
    const testClient = new GoogleGenAI({ apiKey: key });
    const response = await testClient.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Respond with the word OK',
      config: { maxOutputTokens: 10 }
    });
    if (response && response.text) {
      aiService.setApiKey(key);
      return res.json({ valid: true, message: 'Gemini API key is verified and active!' });
    }
    return res.status(400).json({ valid: false, error: 'Received empty response from Gemini model.' });
  } catch (err: any) {
    const classified = classifyGeminiError(err);
    return res.status(400).json({ valid: false, error: classified.userMessage || 'Invalid API key.' });
  }
});

// 1. Generate Lesson Plan
app.post('/api/ai/lesson-plan', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { profile, skills = [], recentErrors = [], dailyMinutes, lessonHistory = [], customContext } = req.body;
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({ error: 'Valid learner profile is required in request context.' });
    }

    const plan = await aiService.generateLessonPlan(profile, skills, recentErrors, lessonHistory, customContext);
    res.json(plan);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 1b. Batch Pre-Generate Session Questions
app.post('/api/ai/batch-session-questions', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { plan, profile } = req.body;
    if (!plan || !profile) {
      return res.status(400).json({ error: 'Lesson plan and profile context are required.' });
    }

    const populatedPlan = await aiService.populatePlanQuestions(plan, profile);
    res.json(populatedPlan);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 2. Generate Lesson Question
app.post('/api/ai/lesson-question', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { section, skillName, contextTopic, activityType, questionIndex, totalInActivity, sessionObjective, profile } = req.body;
    if (!section || !profile) {
      return res.status(400).json({ error: 'Section and learner profile context are required.' });
    }

    const question = await aiService.generateQuestion(
      section,
      profile,
      skillName,
      contextTopic,
      activityType,
      questionIndex,
      totalInActivity,
      sessionObjective
    );
    res.json(question);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 3. Evaluate Lesson Answer
app.post('/api/ai/lesson-evaluate', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, profile } = req.body;
    if (!question || userAnswer === undefined || !profile) {
      return res.status(400).json({ error: 'Question, userAnswer, and profile context are required.' });
    }

    const evaluation = await aiService.evaluateAnswer(question, userAnswer, profile);
    // Server does NOT store this attempt. Result is returned for client-side persistence in IndexedDB.
    res.json(evaluation);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 4. Tutor Assistant Actions (hint, simpler explanation, etc.)
app.post('/api/ai/tutor-assist', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { question, action, profile } = req.body;
    if (!question || !action || !profile) {
      return res.status(400).json({ error: 'Question, action, and profile context are required.' });
    }

    const response = await aiService.tutorAssist(question, action, profile);
    res.json(response);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 4b. Tutor Deep-Dive Inquiry (Follow-up chat under each exercise response)
app.post('/api/ai/deep-dive', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { question, userAnswer = '', evaluation, message, history = [], profile } = req.body;
    if (!question || !message || !profile) {
      return res.status(400).json({ error: 'Question, message, and profile context are required.' });
    }

    const response = await aiService.deepDiveInquiry(question, userAnswer, evaluation, message, history, profile);
    res.json(response);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 4c. Word Deep-Dive & Micro-Practice (Clickable words in exam/lesson)
app.post('/api/ai/word-practice', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { word, contextSentence = '', profile, examMajor } = req.body;
    if (!word || !profile) {
      return res.status(400).json({ error: 'Word and profile context are required.' });
    }

    const data = await aiService.generateWordPractice(word, contextSentence, profile, examMajor);
    res.json(data);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 5. Generate Lesson Summary
app.post('/api/ai/lesson-summary', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { lesson, attempts, profile, timeSpentMinutes } = req.body;
    if (!lesson || !Array.isArray(attempts) || !profile) {
      return res.status(400).json({ error: 'Lesson, attempts list, and profile context are required.' });
    }

    const summary = await aiService.generateLessonSummary(lesson, attempts, profile, timeSpentMinutes);
    res.json(summary);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 6. Conversational Discovery Turn
app.post('/api/ai/discovery-turn', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { history = [], userMessage, profile } = req.body;
    if (!userMessage || !profile) {
      return res.status(400).json({ error: 'userMessage and profile context are required.' });
    }

    const result = await aiService.handleDiscoveryTurn(history, userMessage, profile);
    res.json(result);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 7a. Adaptive Diagnostic: Batch Pre-Generate Questions (One-time generation using learner context)
app.post('/api/ai/diagnostic-batch-questions', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { session, profile } = req.body;
    if (!session || !profile) {
      return res.status(400).json({ error: 'Diagnostic session and profile context are required.' });
    }

    const questions = await aiService.generateDiagnosticBatchQuestions(session, profile);
    res.json({ questions });
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 7. Adaptive Diagnostic: Generate Question
app.post('/api/ai/diagnostic-question', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { session, profile } = req.body;
    if (!session || !profile) {
      return res.status(400).json({ error: 'Diagnostic session and profile context are required.' });
    }

    const question = await aiService.generateAdaptiveDiagnosticQuestion(session, profile);
    res.json(question);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 8. Adaptive Diagnostic: Evaluate Answer
app.post('/api/ai/diagnostic-evaluate', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, profile } = req.body;
    if (!question || userAnswer === undefined || !profile) {
      return res.status(400).json({ error: 'Question, userAnswer, and profile context are required.' });
    }

    const result = await aiService.evaluateDiagnosticAnswer(question, userAnswer, profile);
    res.json(result);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 9. Adaptive Diagnostic: Compute Final Report
app.post('/api/ai/diagnostic-report', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { session, profile } = req.body;
    if (!session || !profile) {
      return res.status(400).json({ error: 'Diagnostic session and profile context are required.' });
    }

    const report = await aiService.computeDiagnosticReport(session, profile);
    res.json(report);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// 10. Adaptive Diagnostic: Generate Personalized Study Plan
app.post('/api/ai/diagnostic-study-plan', checkAIBudget, async (req: Request, res: Response) => {
  try {
    const { report, profile } = req.body;
    if (!report || !profile) {
      return res.status(400).json({ error: 'Diagnostic report and profile context are required.' });
    }

    const plan = await aiService.generatePersonalizedStudyPlan(report, profile);
    res.json(plan);
  } catch (err: any) {
    handleAiRouteError(res, err);
  }
});

// =========================================================================
// OPTIONAL LEGACY EXPORT (READ-ONLY DEVELOPER ARCHIVE - NEVER WRITTEN TO)
// =========================================================================

app.get('/api/legacy/export', (req: Request, res: Response) => {
  try {
    const legacyPath = path.resolve(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(legacyPath)) {
      const raw = fs.readFileSync(legacyPath, 'utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="legacy_db_backup.json"');
      res.setHeader('Content-Type', 'application/json');
      return res.send(raw);
    }
    res.status(404).json({ error: 'No legacy db.json file found.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinguaStep local-first server running on http://0.0.0.0:${PORT}`);
  });
}

// Only auto-start when run directly, not when imported by tests
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
