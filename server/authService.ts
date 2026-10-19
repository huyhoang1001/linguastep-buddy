import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { UserAccount } from './authTypes.js';

function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return clientId ? new OAuth2Client(clientId) : new OAuth2Client();
}

// In-memory token to UserAccount map
const sessionTokens = new Map<string, { user: UserAccount; expiresAt: number }>();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isGoogleAuthAvailable(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return Boolean(clientId && clientId !== 'MY_GOOGLE_CLIENT_ID');
}

export function getGoogleClientId(): string {
  return isGoogleAuthAvailable() ? (process.env.GOOGLE_CLIENT_ID || '') : '';
}

/**
 * Verifies a Google ID token from client-side Google Identity Services (One Tap or Sign-in button).
 * Cryptographically checks Google signature, audience, and expiration.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<UserAccount> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';

  // Allow controlled mock tokens in test environment
  if (process.env.NODE_ENV === 'test' && idToken.startsWith('test_mock_google_')) {
    const sub = idToken.replace('test_mock_google_', '');
    return {
      id: `google_${sub}`,
      email: `${sub}@gmail.com`,
      name: `Google Learner ${sub}`,
      authProvider: 'google',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }

  if (!clientId || clientId === 'MY_GOOGLE_CLIENT_ID') {
    throw new Error('Google Client ID is not configured on the server. Set GOOGLE_CLIENT_ID in your environment.');
  }

  const client = getClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub) {
    throw new Error('Invalid Google credential payload.');
  }

  const user: UserAccount = {
    id: `google_${payload.sub}`,
    email: payload.email || '',
    name: payload.name || payload.given_name || 'Google Learner',
    picture: payload.picture,
    authProvider: 'google',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  return user;
}

/**
 * Creates or retrieves a persistent session token for an authenticated user.
 */
export function createSessionToken(user: UserAccount): string {
  const token = `lst_${crypto.randomBytes(32).toString('hex')}`;
  sessionTokens.set(token, {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return token;
}

/**
 * Validates session token and returns the verified UserAccount.
 */
export function validateSessionToken(token: string): UserAccount | null {
  if (!token) return null;
  const session = sessionTokens.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessionTokens.delete(token);
    return null;
  }

  return session.user;
}

/**
 * Revokes a session token on sign out.
 */
export function revokeSessionToken(token: string): void {
  if (token) {
    sessionTokens.delete(token);
  }
}

/**
 * Creates a guest session for public evaluation if desired, clearly isolated by guest ID.
 */
export function createGuestSession(preferredId?: string): { user: UserAccount; token: string } {
  const guestId = preferredId || 'learner-primary';
  const user: UserAccount = {
    id: guestId,
    email: `${guestId}@linguastep.local`,
    name: guestId === 'learner-primary' ? 'Primary Learner' : 'Guest Learner',
    authProvider: 'guest',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  const token = createSessionToken(user);
  return { user, token };
}

export function clearSessionsForTest(): void {
  sessionTokens.clear();
}

