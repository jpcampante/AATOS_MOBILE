import { useEffect, useState } from 'react';
import type { WorkMode } from './workRun';

/**
 * The web's cadence: each step stays in front for a moment before the next
 * one takes its place (the server sometimes sends several at once). After the
 * last one, a short pause before the line becomes "Reasoned for…".
 */
export const STEP_MS: Record<WorkMode, number> = { fast: 760, deep: 1000 };
export const TAIL_MS = 220;

/**
 * How many steps are on screen, and whether the live line can give way to the
 * closed summary. A finished turn shows everything at once; a live one reveals
 * the steps one by one.
 */
export function useStepReveal(total: number, active: boolean, mode: WorkMode): { shown: number; settled: boolean } {
  const stepMs = STEP_MS[mode];
  const [shown, setShown] = useState(() => (active ? 0 : total));
  const [settled, setSettled] = useState(!active);

  useEffect(() => {
    if (shown >= total) return;
    const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 0 : stepMs);
    return () => clearTimeout(id);
  }, [shown, total, stepMs]);

  useEffect(() => {
    if (active || shown < total) {
      setSettled(false);
      return;
    }
    // The last step also gets its moment in front, then the closing pause.
    const id = setTimeout(() => setSettled(true), stepMs + TAIL_MS);
    return () => clearTimeout(id);
  }, [active, shown, total, stepMs]);

  return { shown: Math.min(shown, total), settled };
}
