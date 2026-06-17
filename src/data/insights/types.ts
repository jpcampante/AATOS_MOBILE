import type { ProductTabId } from '../productNavigation';

/**
 * Single source of truth for the Insights "Auria Briefing".
 * Three separate entities: Metric (proof), Signal (change/risk), Action (next step).
 * Nothing in the UI invents data — everything derives from these + selectors.
 */

/** Where a number comes from — keeps the UI honest while data is mocked. */
export type DataSource = 'sample' | 'estimated' | 'local' | 'live';

export type Scope = 'company' | 'team' | 'me';
export type Period = 'week' | 'month' | 'quarter';

export type MetricUnit = 'count' | 'percent' | 'hours';

export type SeriesPoint = { label: string; value: number };

/** A numeric series that proves a narrative — feeds the Explorer. */
export type Metric = {
  id: string;
  /** Short label for the selector chip. */
  chip: string;
  /** Phrase for the Explorer headline: "Here's a line graph of {headline}." */
  headline: string;
  /** Label shown in the value row beneath the chart. */
  metaLabel: string;
  unit: MetricUnit;
  /** Rounding step for the y-axis "nice" maximum. */
  step: number;
  source: DataSource;
  /** Which direction is "good" — drives delta color + health score inversion. */
  goodDirection: 'up' | 'down';
  series: Record<Scope, Record<Period, ReadonlyArray<SeriesPoint>>>;
};

export type SignalDomain = 'tasks' | 'email' | 'auria' | 'calendar' | 'projects';
export type Severity = 'low' | 'medium' | 'high';
/** actionable = your queue (Needs you) · trend = systemic (Risks). */
export type SignalType = 'actionable' | 'trend';

/** Something changed / needs attention — feeds Pulse, Needs You and Risks. */
export type Signal = {
  id: string;
  domain: SignalDomain;
  severity: Severity;
  type: SignalType;
  title: string;
  detail?: string;
  delta?: string;
  source: DataSource;
  /** Which metric proves this signal (chart annotation). */
  metricId?: string;
  /** Which actions the user can take (ids into the action catalog). */
  actionIds: string[];
};

export type ActionKind = 'navigate' | 'auria' | 'modal';

/** The next step a signal offers. */
export type InsightAction = {
  id: string;
  label: string;
  kind: ActionKind;
  /** Tab for 'navigate'/'auria', or a modal id for 'modal'. */
  target: ProductTabId | string;
  payload?: { prompt?: string; [key: string]: unknown };
};
