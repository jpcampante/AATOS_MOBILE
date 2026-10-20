import { REFRESH_MARGIN_MS } from './config';
import { userFromToken } from './jwt';
import type { TokenStore } from './tokenStore';
import { AuthError, type AuthState, type AuthTokens } from './types';

export type SessionApi = {
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
  checkSession(accessToken: string): Promise<boolean>;
  logoutCurrent(accessToken: string, refreshToken: string): Promise<void>;
};

/**
 * A refresh failure only ends the session when the server says the refresh
 * token is dead (same rule as the web app). Network errors, 5xx and 429 keep
 * the session and are retried later — being offline must not sign anyone out.
 */
export function refreshFailureEndsSession(error: unknown): boolean {
  if (!(error instanceof AuthError)) return false;
  if (error.status !== 400 && error.status !== 401) return false;
  return ['invalid_refresh_token', 'invalid_grant', 'invalid_request'].includes(error.code);
}

/**
 * Owns the session: tokens in the secure store, the derived user, and refresh.
 * The refresh token rotates on every use, so only one refresh may run at a
 * time — concurrent callers share the same in-flight promise.
 */
export class SessionManager {
  private state: AuthState = { status: 'loading', user: null };
  private tokens: AuthTokens | null = null;
  private refreshing: Promise<AuthTokens | null> | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private readonly store: TokenStore,
    private readonly api: SessionApi,
    private readonly now: () => number = Date.now,
  ) {}

  getState = (): AuthState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setState(next: AuthState) {
    this.state = next;
    this.listeners.forEach((l) => l());
  }

  /** Reads the stored session at startup. Never touches the network. */
  async load(): Promise<void> {
    let stored: AuthTokens | null = null;
    try {
      stored = await this.store.load();
    } catch {
      stored = null;
    }
    const user = stored ? userFromToken(stored.accessToken) : null;
    if (!stored || !user) {
      this.tokens = null;
      this.setState({ status: 'signedOut', user: null });
      return;
    }
    this.tokens = stored;
    this.setState({ status: 'signedIn', user });
  }

  async signIn(tokens: AuthTokens): Promise<void> {
    const user = userFromToken(tokens.accessToken);
    if (!user) throw new AuthError('server');
    await this.store.save(tokens);
    this.tokens = tokens;
    this.setState({ status: 'signedIn', user });
  }

  /** Ends the session on this device; the server call is best effort. */
  async signOut(): Promise<void> {
    const current = this.tokens;
    await this.end();
    if (current) {
      await this.api.logoutCurrent(current.accessToken, current.refreshToken).catch(() => undefined);
    }
  }

  private async end(reason?: AuthState['reason']) {
    this.tokens = null;
    this.refreshing = null;
    await this.store.clear().catch(() => undefined);
    this.setState({ status: 'signedOut', user: null, reason });
  }

  /** A valid access token, refreshing first when it is about to expire. */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) return null;
    if (this.tokens.expiresAt - this.now() > REFRESH_MARGIN_MS) return this.tokens.accessToken;
    const refreshed = await this.refresh();
    return refreshed?.accessToken ?? null;
  }

  /** Single-flight refresh. Resolves `null` when there is no session afterwards. */
  refresh(): Promise<AuthTokens | null> {
    if (!this.tokens) return Promise.resolve(null);
    if (this.refreshing) return this.refreshing;
    const used = this.tokens;
    this.refreshing = (async () => {
      try {
        const next = await this.api.refreshTokens(used.refreshToken);
        // Signed out (or replaced) while the request was in flight: drop it.
        if (this.tokens !== used) return this.tokens;
        await this.signIn(next);
        return next;
      } catch (error) {
        if (refreshFailureEndsSession(error) && this.tokens === used) {
          await this.end('session_ended');
          return null;
        }
        // Transient: keep the current tokens; the next call retries.
        return this.tokens;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  /** Called when the app returns to the foreground. */
  async revalidate(): Promise<void> {
    if (!this.tokens) return;
    const token = await this.getAccessToken();
    if (!token) return;
    try {
      const alive = await this.api.checkSession(token);
      if (!alive) await this.end('session_ended');
    } catch {
      // Offline or server hiccup: keep the session.
    }
  }

  clearReason() {
    if (this.state.reason) this.setState({ ...this.state, reason: undefined });
  }
}
