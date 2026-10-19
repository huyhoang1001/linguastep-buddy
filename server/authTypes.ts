export interface UserAccount {
  id: string; // google sub or local guest id
  email: string;
  name: string;
  picture?: string;
  authProvider: 'google' | 'guest';
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSessionResponse {
  user: UserAccount | null;
  googleClientIdConfigured: boolean;
  googleClientId?: string;
  limits: {
    userDailyLimit: number;
    userRemaining: number;
    globalDailyLimit: number;
    globalRemaining: number;
  };
}

export interface AIUsageLogRecord {
  id: string;
  userId: string;
  model: string;
  operation: string;
  estimatedPromptTokens: number;
  estimatedCandidateTokens: number;
  totalEstimatedTokens: number;
  status: 'success' | 'error' | 'rate_limited' | 'cached';
  errorMessage?: string;
  timestamp: string;
}

export interface UserAIUsageSummary {
  userId: string;
  dateKey: string; // YYYY-MM-DD
  requestCount: number;
  estimatedTokens: number;
  lastRequestAt: string;
}

export interface GlobalAIUsageSummary {
  dateKey: string; // YYYY-MM-DD
  requestCount: number;
  estimatedTokens: number;
}
