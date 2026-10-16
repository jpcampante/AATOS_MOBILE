import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as authApi from './authApi';
import { SessionManager } from './session';
import { getInstallId, secureTokenStore } from './tokenStore';
import type { AuthState, AuthUser, CodeRequestResult } from './types';

/** One session per app process, shared by the provider and `authFetch`. */
export const sessionManager = new SessionManager(secureTokenStore, authApi);

type AuthContextValue = AuthState & {
  requestCode(email: string, fullName?: string): Promise<CodeRequestResult>;
  verifyCode(challengeId: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  clearReason(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(sessionManager.subscribe, sessionManager.getState);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        authApi.setDeviceUserAgent(await getInstallId());
      } catch {
        // Keep the generic User-Agent; the session still works.
      }
      if (!cancelled) await sessionManager.load();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void sessionManager.revalidate();
    });
    return () => sub.remove();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      requestCode: (email, fullName) => authApi.requestCode(email, fullName),
      verifyCode: async (challengeId, code) => {
        const tokens = await authApi.verifyCode(challengeId, code);
        await sessionManager.signIn(tokens);
      },
      signOut: () => sessionManager.signOut(),
      clearReason: () => sessionManager.clearReason(),
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

const NO_USER: AuthUser = { id: '', email: '', name: '', firstName: '', lastName: '', initials: '' };

/** The signed-in person. Screens behind the login can rely on it being set. */
export function useCurrentUser(): AuthUser {
  return useAuth().user ?? NO_USER;
}
