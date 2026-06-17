import { useMemo, useSyncExternalStore } from 'react';
import type { AuriaIconName } from '../../components/icons';
import { insightMetrics } from './metrics';

/**
 * Home (Insights) layout — which cards show and in what order.
 * Two kinds of card live in one ordered list:
 *  - Section cards (the briefing: Explorer, Brief, Needs You, Impact, Ask Auria).
 *  - Metric chart cards (`metric:<id>`) the user pins from the "Add a chart" picker.
 * Captured in-app (DataSource 'local', no backend yet) and persists for the session.
 * (Cross-restart persistence -> wire AsyncStorage in hydrate()/persist() later.)
 */

export type SectionCardId = 'explorer' | 'brief' | 'needsYou' | 'impact' | 'askAuria';
export type MetricCardId = `metric:${string}`;
export type LayoutCardId = SectionCardId | MetricCardId;

const METRIC_PREFIX = 'metric:';
export const metricCardId = (metricId: string): MetricCardId => `${METRIC_PREFIX}${metricId}` as MetricCardId;
export const isMetricCard = (id: LayoutCardId): id is MetricCardId => id.startsWith(METRIC_PREFIX);
export const metricIdOf = (id: MetricCardId): string => id.slice(METRIC_PREFIX.length);

export type HomeCardMeta = {
  id: SectionCardId;
  title: string;
  description: string;
  icon: AuriaIconName;
  /** The Explorer is Auria's voice + holds Customize — always present. */
  removable: boolean;
};

/** Catalog of the briefing section cards. */
export const HOME_CARD_META: Record<SectionCardId, HomeCardMeta> = {
  explorer: {
    id: 'explorer',
    title: 'Auria Explorer',
    description: 'The blue chart — pick a metric, scope and period.',
    icon: 'sparkles',
    removable: false,
  },
  brief: {
    id: 'brief',
    title: 'Executive Brief',
    description: 'Greeting, movers and company health.',
    icon: 'newspaper',
    removable: true,
  },
  needsYou: {
    id: 'needsYou',
    title: 'Needs You',
    description: 'Your queue of decisions and risks.',
    icon: 'flag',
    removable: true,
  },
  impact: {
    id: 'impact',
    title: 'Auria Impact',
    description: 'Suggestion acceptance and time saved.',
    icon: 'checkCircle',
    removable: true,
  },
  askAuria: {
    id: 'askAuria',
    title: 'Ask Auria',
    description: 'Jump into Auria with a ready prompt.',
    icon: 'messageSquare',
    removable: true,
  },
};

export const DEFAULT_ORDER: SectionCardId[] = ['explorer', 'brief', 'needsYou', 'impact', 'askAuria'];

export type HomeLayout = {
  /** Section cards (all present) + pinned metric chart cards, in display order. */
  order: LayoutCardId[];
  /** Section cards the user turned off (metric cards are simply absent from order). */
  hiddenSections: SectionCardId[];
};

let state: HomeLayout = { order: [...DEFAULT_ORDER], hiddenSections: [] };
const listeners = new Set<() => void>();

function setState(next: HomeLayout) {
  state = next;
  listeners.forEach((l) => l());
}

export function getLayout(): HomeLayout {
  return state;
}

/** Move a card from one slot to another (drag-to-reorder). Works for any card. */
export function moveCard(from: number, to: number) {
  if (from === to || from < 0 || to < 0) return;
  const order = [...state.order];
  if (from >= order.length || to >= order.length) return;
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);
  setState({ ...state, order });
}

/** Show or hide a section card. Pinned (non-removable) sections can't be hidden. */
export function setSectionVisible(id: SectionCardId, visible: boolean) {
  if (!visible && !HOME_CARD_META[id]?.removable) return;
  const hiddenSections = state.hiddenSections.filter((h) => h !== id);
  if (!visible) hiddenSections.push(id);
  setState({ ...state, hiddenSections });
}

export function toggleSection(id: SectionCardId) {
  setSectionVisible(id, state.hiddenSections.includes(id));
}

/** Pin a metric's chart as a card (appended after the current cards). */
export function addMetricCard(metricId: string) {
  const cid = metricCardId(metricId);
  if (state.order.includes(cid)) return;
  setState({ ...state, order: [...state.order, cid] });
}

export function removeMetricCard(metricId: string) {
  const cid = metricCardId(metricId);
  if (!state.order.includes(cid)) return;
  setState({ ...state, order: state.order.filter((id) => id !== cid) });
}

/** Metrics not yet pinned — what the "Add a chart" picker offers. */
export function availableMetrics(order: LayoutCardId[]) {
  return insightMetrics.filter((m) => !order.includes(metricCardId(m.id)));
}

export function resetLayout() {
  setState({ order: [...DEFAULT_ORDER], hiddenSections: [] });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Full layout (order + hidden sections) — re-renders on any change. */
export function useHomeLayout(): HomeLayout {
  return useSyncExternalStore(subscribe, getLayout, getLayout);
}

/** Ordered ids that are currently visible — exactly what HomeScreen renders. */
export function useVisibleHomeCards(): LayoutCardId[] {
  const { order, hiddenSections } = useHomeLayout();
  return useMemo(
    () => order.filter((id) => isMetricCard(id) || !hiddenSections.includes(id)),
    [order, hiddenSections],
  );
}
