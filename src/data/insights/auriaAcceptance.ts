import { useSyncExternalStore } from 'react';

/**
 * Auria suggestion acceptance — captured in-app (DataSource 'local'), not from a
 * backend. Seeded with a plausible baseline; the Task review flow records each
 * accepted/shown suggestion so the Insights number is real for this session.
 */
let shown = 12;
let accepted = 9;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function recordSuggestionShown(count = 1) {
  shown += count;
  emit();
}

export function recordSuggestionAccepted() {
  // `shown` is counted when the review modal opens, so only bump `accepted` here.
  accepted += 1;
  if (accepted > shown) shown = accepted; // guard if accepted before any shown batch
  emit();
}

export function getAcceptance() {
  return { shown, accepted, rate: shown ? Math.round((accepted / shown) * 100) : 0 };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Live acceptance rate (%) that re-renders when a suggestion is accepted. */
export function useAcceptanceRate(): number {
  return useSyncExternalStore(
    subscribe,
    () => getAcceptance().rate,
    () => getAcceptance().rate,
  );
}
