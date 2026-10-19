export interface UserAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  authProvider: 'google' | 'guest';
  createdAt: string;
  lastLoginAt: string;
}

export interface BudgetLimits {
  userDailyLimit: number;
  userRemaining: number;
  globalDailyLimit: number;
  globalRemaining: number;
  userCountToday: number;
  globalCountToday: number;
}

export interface AuthSessionResponse {
  user: UserAccount | null;
  googleClientIdConfigured: boolean;
  googleClientId?: string;
  limits: BudgetLimits;
}
