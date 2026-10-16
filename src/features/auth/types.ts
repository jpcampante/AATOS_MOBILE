/** Tokens returned by the MyCEO Authenticator (same shape as `/auth/token/`). */
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the access token stops being valid. */
  expiresAt: number;
};

/** The signed-in person, read from the access token claims. */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  initials: string;
  pictureUrl?: string;
};

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

/** Why the person landed back on the sign-in screen, if it wasn't their choice. */
export type SignedOutReason = 'session_ended';

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  reason?: SignedOutReason;
};

/**
 * Stable error codes from the Authenticator, plus the client-side ones
 * (`network`, `timeout`, `server`). Screens map these to copy.
 */
export type AuthErrorCode =
  | 'invalid_email'
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_challenge'
  | 'invalid_code'
  | 'code_expired'
  | 'too_many_attempts'
  | 'challenge_used'
  | 'sso_required'
  | 'signup_closed'
  | 'not_allowed'
  | 'rate_limited'
  | 'invalid_refresh_token'
  | 'invalid_grant'
  | 'network'
  | 'timeout'
  | 'server';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  readonly retryAfter?: number;
  readonly attemptsLeft?: number;
  readonly provider?: string | null;

  constructor(
    code: AuthErrorCode,
    status = 0,
    extra: { retryAfter?: number; attemptsLeft?: number; provider?: string | null } = {},
  ) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.retryAfter = extra.retryAfter;
    this.attemptsLeft = extra.attemptsLeft;
    this.provider = extra.provider;
  }
}

/** Result of asking for a code: either a code went out, or we need a name first. */
export type CodeRequestResult =
  | { kind: 'sent'; challengeId: string; purpose: 'login' | 'signup'; expiresIn: number; resendAfter: number }
  | { kind: 'needName' };
