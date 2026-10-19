export type AIErrorCode =
  | 'QUOTA_EXHAUSTED'
  | 'RATE_LIMITED'
  | 'AUTH_FAILED'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_REQUEST'
  | 'GENERAL_ERROR';

export interface AIErrorResponse {
  error: string;
  code: AIErrorCode;
  retryable: boolean;
  retryAfterSeconds?: number;
  details?: string;
}

export class AIException extends Error {
  public code: AIErrorCode;
  public retryable: boolean;
  public retryAfterSeconds?: number;
  public userMessage: string;
  public originalStatus?: number | string;

  constructor(
    code: AIErrorCode,
    userMessage: string,
    options?: {
      retryable?: boolean;
      retryAfterSeconds?: number;
      originalStatus?: number | string;
      originalMessage?: string;
    }
  ) {
    super(userMessage);
    this.name = 'AIException';
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = options?.retryable ?? (code === 'RATE_LIMITED' || code === 'SERVICE_UNAVAILABLE' || code === 'TIMEOUT');
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.originalStatus = options?.originalStatus;
  }
}

/**
 * Maps any error from GoogleGenAI SDK, network calls, or usage budget
 * to a standardized AIException with user-safe messaging and retry guidance.
 */
export function classifyGeminiError(err: any): AIException {
  if (err instanceof AIException) {
    return err;
  }

  const status = err?.status;
  const code = err?.code || err?.statusCode;
  const rawMessage = (err?.message || err?.toString() || '').trim();
  const lowerMsg = rawMessage.toLowerCase();

  // 1. Quota & Credit Exhaustion vs Rate Limiting
  const isResourceExhausted =
    status === 'RESOURCE_EXHAUSTED' ||
    code === 429 ||
    status === 429 ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('quota exceeded') ||
    lowerMsg.includes('exceeded your current quota') ||
    lowerMsg.includes('free tier limit') ||
    lowerMsg.includes('credit limit') ||
    lowerMsg.includes('billing account') ||
    lowerMsg.includes('usage limit reached') ||
    lowerMsg.includes('community ai capacity') ||
    lowerMsg.includes('daily free ai limit');

  if (isResourceExhausted) {
    // Check if it is a temporary per-minute rate limit vs total quota / credit exhaustion
    const isPerMinuteRateLimit =
      lowerMsg.includes('per minute') ||
      lowerMsg.includes('tpm') ||
      lowerMsg.includes('rpm') ||
      lowerMsg.includes('rate limit') ||
      lowerMsg.includes('cooldown') ||
      lowerMsg.includes('pace requests');

    if (isPerMinuteRateLimit) {
      // Extract retry-after seconds if present
      let retryAfter = 5;
      const retryMatch = rawMessage.match(/(\d+)\s*(?:s|sec|seconds)/i);
      if (retryMatch) {
        retryAfter = parseInt(retryMatch[1], 10);
      }
      return new AIException(
        'RATE_LIMITED',
        "AI service is temporarily busy due to rate limits. Please wait a moment before trying again.",
        {
          retryable: true,
          retryAfterSeconds: retryAfter,
          originalStatus: status || code,
          originalMessage: rawMessage.slice(0, 100)
        }
      );
    }

    // Otherwise, project quota, credit or daily budget allowance exhausted
    return new AIException(
      'QUOTA_EXHAUSTED',
      "AI usage limit reached. We're unable to process your request right now. Please try again later.",
      {
        retryable: false,
        originalStatus: status || code,
        originalMessage: rawMessage.slice(0, 100)
      }
    );
  }

  // 2. Authentication, API Key, Permission Failures
  const isAuthError =
    status === 'UNAUTHENTICATED' ||
    status === 'PERMISSION_DENIED' ||
    code === 401 ||
    code === 403 ||
    lowerMsg.includes('api key') ||
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('unauthenticated') ||
    lowerMsg.includes('permission_denied') ||
    lowerMsg.includes('forbidden');

  if (isAuthError) {
    return new AIException(
      'AUTH_FAILED',
      "AI service authentication failed. The service is temporarily unable to verify credentials.",
      {
        retryable: false,
        originalStatus: status || code,
        originalMessage: rawMessage.slice(0, 100)
      }
    );
  }

  // 3. Timeouts & Deadlines
  const isTimeout =
    status === 'DEADLINE_EXCEEDED' ||
    code === 408 ||
    code === 504 ||
    lowerMsg.includes('deadline_exceeded') ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('timed out') ||
    err?.name === 'AbortError' ||
    err?.code === 'ETIMEDOUT';

  if (isTimeout) {
    return new AIException(
      'TIMEOUT',
      "The AI request timed out. Please try again in a moment.",
      {
        retryable: true,
        retryAfterSeconds: 3,
        originalStatus: status || code,
        originalMessage: rawMessage.slice(0, 100)
      }
    );
  }

  // 4. Temporary Service Unavailable
  const isUnavailable =
    status === 'UNAVAILABLE' ||
    code === 503 ||
    code === 502 ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('bad gateway');

  if (isUnavailable) {
    return new AIException(
      'SERVICE_UNAVAILABLE',
      "The AI service is temporarily unavailable. Please try again in a few moments.",
      {
        retryable: true,
        retryAfterSeconds: 5,
        originalStatus: status || code,
        originalMessage: rawMessage.slice(0, 100)
      }
    );
  }

  // 5. Bad / Invalid Request
  const isBadRequest =
    status === 'INVALID_ARGUMENT' ||
    code === 400 ||
    lowerMsg.includes('invalid_argument');

  if (isBadRequest) {
    return new AIException(
      'INVALID_REQUEST',
      "The AI request could not be processed due to invalid parameters.",
      {
        retryable: false,
        originalStatus: status || code,
        originalMessage: rawMessage.slice(0, 100)
      }
    );
  }

  // 6. General / Unknown
  return new AIException(
    'GENERAL_ERROR',
    "An error occurred while contacting the AI service. Please try again.",
    {
      retryable: true,
      originalStatus: status || code,
      originalMessage: rawMessage.slice(0, 100)
    }
  );
}
