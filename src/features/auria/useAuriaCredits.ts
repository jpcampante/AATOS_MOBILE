import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getSubscription } from './api/billing';
import {
  creditsCheckFailed,
  creditsFromRefusal,
  creditsFromSubscription,
  type CreditsState,
} from './credits';

/**
 * Whether Auria can be used right now (spec 002, D-08): checked when the screen
 * opens, when the app comes back to the foreground and after each answer.
 * Blocks before sending when the credits ran out; a check that fails also
 * blocks, like the web.
 */
export function useAuriaCredits() {
  const [state, setState] = useState<CreditsState>({ status: 'checking' });
  const canManageRef = useRef(false);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const next = creditsFromSubscription(await getSubscription());
      if (next.status !== 'checking') canManageRef.current = next.canManageBilling;
      setState(next);
    } catch {
      setState(creditsCheckFailed());
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void check();
    });
    return () => sub.remove();
  }, [check]);

  /** Auria answered 402: the balance changed since the last check. */
  const markRefused = useCallback((reasonCode: string | null) => {
    setState(creditsFromRefusal(reasonCode, canManageRef.current));
  }, []);

  return {
    state,
    /** Sending is blocked (out of credits, no plan, or the check failed). */
    blocked: state.status === 'blocked',
    check,
    markRefused,
  };
}

export type AuriaCredits = ReturnType<typeof useAuriaCredits>;
