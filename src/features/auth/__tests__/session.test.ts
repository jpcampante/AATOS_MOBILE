import { refreshFailureEndsSession, SessionManager, type SessionApi } from '../session';
import type { TokenStore } from '../tokenStore';
import { AuthError, type AuthTokens } from '../types';
import { makeToken } from '../__fixtures__/token';

const NOW = 1_800_000_000_000;
const access = (name: string) => makeToken({ public_uid: 'u-1', email: 'ana@empresa.test', name });
const tokens = (n: number, expiresInMs = 60 * 60 * 1000): AuthTokens => ({
  accessToken: access(`Ana ${n}`),
  refreshToken: `refresh-${n}`,
  expiresAt: NOW + expiresInMs,
});

function memoryStore(initial: AuthTokens | null = null): TokenStore & { value: AuthTokens | null } {
  return {
    value: initial,
    async load() {
      return this.value;
    },
    async save(t) {
      this.value = t;
    },
    async clear() {
      this.value = null;
    },
  };
}

function api(overrides: Partial<SessionApi> = {}): SessionApi {
  return {
    refreshTokens: jest.fn(async () => tokens(2)),
    checkSession: jest.fn(async () => true),
    logoutCurrent: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe('refreshFailureEndsSession', () => {
  it('ends only on a dead refresh token', () => {
    expect(refreshFailureEndsSession(new AuthError('invalid_refresh_token', 401))).toBe(true);
    expect(refreshFailureEndsSession(new AuthError('invalid_grant', 400))).toBe(true);
    expect(refreshFailureEndsSession(new AuthError('network'))).toBe(false);
    expect(refreshFailureEndsSession(new AuthError('server', 503))).toBe(false);
    expect(refreshFailureEndsSession(new AuthError('rate_limited', 429))).toBe(false);
    expect(refreshFailureEndsSession(new Error('boom'))).toBe(false);
  });
});

describe('SessionManager', () => {
  it('starts signed out without stored tokens', async () => {
    const session = new SessionManager(memoryStore(), api(), () => NOW);
    await session.load();
    expect(session.getState()).toEqual({ status: 'signedOut', user: null });
  });

  it('restores a stored session without touching the network', async () => {
    const remote = api();
    const session = new SessionManager(memoryStore(tokens(1)), remote, () => NOW);
    await session.load();
    expect(session.getState()).toMatchObject({ status: 'signedIn', user: { name: 'Ana 1' } });
    expect(remote.refreshTokens).not.toHaveBeenCalled();
  });

  it('signs in and persists the tokens', async () => {
    const store = memoryStore();
    const session = new SessionManager(store, api(), () => NOW);
    await session.signIn(tokens(1));
    expect(store.value?.refreshToken).toBe('refresh-1');
    expect(session.getState().status).toBe('signedIn');
  });

  it('returns the current access token while it is fresh', async () => {
    const remote = api();
    const session = new SessionManager(memoryStore(tokens(1)), remote, () => NOW);
    await session.load();
    expect(await session.getAccessToken()).toBe(tokens(1).accessToken);
    expect(remote.refreshTokens).not.toHaveBeenCalled();
  });

  it('refreshes once for concurrent callers when about to expire', async () => {
    const remote = api();
    const store = memoryStore(tokens(1, 60 * 1000));
    const session = new SessionManager(store, remote, () => NOW);
    await session.load();

    const [a, b] = await Promise.all([session.getAccessToken(), session.getAccessToken()]);

    expect(remote.refreshTokens).toHaveBeenCalledTimes(1);
    expect(remote.refreshTokens).toHaveBeenCalledWith('refresh-1');
    expect(a).toBe(tokens(2).accessToken);
    expect(b).toBe(a);
    expect(store.value?.refreshToken).toBe('refresh-2');
  });

  it('ends the session with a notice when the refresh token is dead', async () => {
    const store = memoryStore(tokens(1, 0));
    const session = new SessionManager(
      store,
      api({ refreshTokens: jest.fn(async () => Promise.reject(new AuthError('invalid_refresh_token', 401))) }),
      () => NOW,
    );
    await session.load();

    expect(await session.getAccessToken()).toBeNull();
    expect(session.getState()).toEqual({ status: 'signedOut', user: null, reason: 'session_ended' });
    expect(store.value).toBeNull();
  });

  it('keeps the session when refresh fails because of the network', async () => {
    const store = memoryStore(tokens(1, 0));
    const session = new SessionManager(
      store,
      api({ refreshTokens: jest.fn(async () => Promise.reject(new AuthError('network'))) }),
      () => NOW,
    );
    await session.load();

    await session.getAccessToken();

    expect(session.getState().status).toBe('signedIn');
    expect(store.value?.refreshToken).toBe('refresh-1');
  });

  it('ends the session when the server says it is gone', async () => {
    const session = new SessionManager(memoryStore(tokens(1)), api({ checkSession: jest.fn(async () => false) }), () => NOW);
    await session.load();
    await session.revalidate();
    expect(session.getState()).toMatchObject({ status: 'signedOut', reason: 'session_ended' });
  });

  it('keeps the session when the check cannot reach the server', async () => {
    const session = new SessionManager(
      memoryStore(tokens(1)),
      api({ checkSession: jest.fn(async () => Promise.reject(new AuthError('network'))) }),
      () => NOW,
    );
    await session.load();
    await session.revalidate();
    expect(session.getState().status).toBe('signedIn');
  });

  it('signs out locally even when the server call fails', async () => {
    const store = memoryStore(tokens(1));
    const remote = api({ logoutCurrent: jest.fn(async () => Promise.reject(new AuthError('network'))) });
    const session = new SessionManager(store, remote, () => NOW);
    await session.load();

    await session.signOut();

    expect(remote.logoutCurrent).toHaveBeenCalledWith(tokens(1).accessToken, 'refresh-1');
    expect(session.getState()).toEqual({ status: 'signedOut', user: null, reason: undefined });
    expect(store.value).toBeNull();
  });

  it('drops a refresh that finishes after sign out', async () => {
    let finish: (t: AuthTokens) => void = () => undefined;
    const store = memoryStore(tokens(1, 0));
    const session = new SessionManager(
      store,
      api({ refreshTokens: jest.fn(() => new Promise<AuthTokens>((resolve) => (finish = resolve))) }),
      () => NOW,
    );
    await session.load();

    const pending = session.refresh();
    await session.signOut();
    finish(tokens(2));
    await pending;

    expect(session.getState().status).toBe('signedOut');
    expect(store.value).toBeNull();
  });
});
