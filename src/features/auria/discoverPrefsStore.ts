import { useSyncExternalStore } from 'react';
import type { DiscoverTopic, TopicPreference } from './newsTypes';

/**
 * Shared store for Discover topic preferences ("Help us fine-tune your feed").
 * Lives outside React so both the Discover feed and the Settings panel read and
 * write the same state. Tap cycles neutral → more → less → neutral.
 */

type Prefs = Partial<Record<DiscoverTopic, TopicPreference>>;

let prefs: Prefs = {};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getDiscoverPrefs(): Prefs {
  return prefs;
}

export function cycleDiscoverTopic(topic: DiscoverTopic) {
  const current = prefs[topic];
  const next: TopicPreference =
    current === 'more' ? 'less' : current === 'less' ? 'neutral' : 'more';
  prefs = { ...prefs, [topic]: next };
  emit();
}

export function resetDiscoverPrefs() {
  prefs = {};
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** React hook returning the live preferences map. */
export function useDiscoverPrefs(): Prefs {
  return useSyncExternalStore(subscribe, getDiscoverPrefs, getDiscoverPrefs);
}
