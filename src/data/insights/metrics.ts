import type { Metric, MetricUnit, Period, Scope, SeriesPoint } from './types';

/**
 * Metric registry for the Explorer. Each metric declares a base monthly series
 * (company scope) and the generator derives the Scope×Period variants below.
 * Everything is mock (`sample`/`estimated`) except acceptance, which is `local`
 * (captured in-app from the Task review flow).
 */

const MONTHS = ['MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'] as const;
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'] as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
const round1 = (v: number) => Math.round(v * 10) / 10;

function scopeFactor(scope: Scope): number {
  return scope === 'company' ? 1 : scope === 'team' ? 0.42 : 0.13;
}

/** Apply scope to a base value: counts/hours scale down; percent shifts slightly. */
function applyScope(value: number, scope: Scope, unit: MetricUnit): number {
  if (unit === 'percent') {
    const offset = scope === 'company' ? 0 : scope === 'team' ? -3 : 2;
    return clamp(Math.round(value + offset), 0, 100);
  }
  const scaled = value * scopeFactor(scope);
  return unit === 'hours' ? round1(scaled) : Math.max(0, Math.round(scaled));
}

function periodSeries(
  base12: number[],
  scope: Scope,
  unit: MetricUnit,
  period: Period,
): SeriesPoint[] {
  const scaled = base12.map((v) => applyScope(v, scope, unit));

  if (period === 'month') {
    return MONTHS.map((label, i) => ({ label, value: scaled[i] }));
  }

  if (period === 'quarter') {
    return QUARTERS.map((label, qi) => {
      const chunk = scaled.slice(qi * 3, qi * 3 + 3);
      const value = unit === 'percent' ? Math.round(avg(chunk)) : unit === 'hours' ? round1(sum(chunk)) : sum(chunk);
      return { label, value };
    });
  }

  // week: 8 points trending between the last two months (weekly-scaled for counts).
  const last = scaled[scaled.length - 1];
  const prev = scaled[scaled.length - 2] ?? last;
  const toWeekly = (v: number) => (unit === 'percent' ? v : unit === 'hours' ? round1(v / 4.3) : Math.round(v / 4.3));
  const start = toWeekly(prev);
  const end = toWeekly(last);
  return WEEKS.map((label, i) => {
    const t = i / (WEEKS.length - 1);
    const value = unit === 'hours' ? round1(start + (end - start) * t) : Math.round(start + (end - start) * t);
    return { label, value };
  });
}

function buildSeries(base12: number[], unit: MetricUnit): Metric['series'] {
  const scopes: Scope[] = ['company', 'team', 'me'];
  const periods: Period[] = ['week', 'month', 'quarter'];
  const out = {} as Metric['series'];
  for (const scope of scopes) {
    out[scope] = {} as Record<Period, ReadonlyArray<SeriesPoint>>;
    for (const period of periods) {
      out[scope][period] = periodSeries(base12, scope, unit, period);
    }
  }
  return out;
}

type MetricSeed = Omit<Metric, 'series'> & { base: number[] };

const SEEDS: MetricSeed[] = [
  {
    id: 'completion-rate',
    chip: 'Completion rate',
    headline: 'task completion rate across projects',
    metaLabel: 'Completion rate',
    unit: 'percent',
    step: 25,
    source: 'sample',
    goodDirection: 'up',
    base: [64, 67, 70, 72, 71, 75, 73, 76, 78, 80, 79, 82],
  },
  {
    id: 'email-backlog',
    chip: 'Email backlog',
    headline: 'email backlog across the company',
    metaLabel: 'Email backlog',
    unit: 'count',
    step: 50,
    source: 'sample',
    goodDirection: 'down',
    base: [120, 110, 130, 95, 90, 80, 100, 88, 75, 70, 82, 64],
  },
  {
    id: 'auria-time-saved',
    chip: 'Auria time saved',
    headline: 'hours saved by Auria',
    metaLabel: 'Hours saved',
    unit: 'hours',
    step: 2,
    source: 'estimated',
    goodDirection: 'up',
    base: [1.2, 1.8, 2.1, 2.6, 3.0, 3.4, 3.1, 3.6, 3.9, 4.2, 4.0, 4.5],
  },
  {
    id: 'auria-acceptance',
    chip: 'Auria acceptance',
    headline: 'Auria suggestion acceptance',
    metaLabel: 'Suggestion acceptance',
    unit: 'percent',
    step: 25,
    // The 12-month trend is estimated; only the current rate (Auria Impact) is
    // captured in-app (`local`).
    source: 'estimated',
    goodDirection: 'up',
    base: [58, 61, 63, 66, 68, 70, 69, 72, 74, 78, 80, 72],
  },
  {
    id: 'auria-usage',
    chip: 'Auria usage',
    headline: 'Auria interactions across the company',
    metaLabel: 'Auria interactions',
    unit: 'count',
    step: 100,
    source: 'sample',
    goodDirection: 'up',
    base: [60, 95, 120, 140, 180, 210, 190, 220, 260, 300, 280, 320],
  },
  {
    id: 'tasks-created',
    chip: 'Tasks created',
    headline: 'tasks created across projects',
    metaLabel: 'Tasks created',
    unit: 'count',
    step: 50,
    source: 'sample',
    goodDirection: 'up',
    base: [90, 110, 105, 130, 140, 155, 145, 150, 168, 175, 162, 180],
  },
  {
    id: 'cycle-time',
    chip: 'Cycle time',
    headline: 'average task cycle time',
    metaLabel: 'Avg cycle time (h)',
    unit: 'hours',
    step: 12,
    source: 'sample',
    goodDirection: 'down',
    base: [52, 48, 50, 44, 46, 40, 42, 38, 36, 34, 37, 32],
  },
  {
    id: 'response-time',
    chip: 'Response time',
    headline: 'average email response time',
    metaLabel: 'Avg response (h)',
    unit: 'hours',
    step: 3,
    source: 'sample',
    goodDirection: 'down',
    base: [8, 7, 7.5, 6, 6.5, 5, 5.5, 4.5, 5, 4, 4.5, 3.5],
  },
];

export const insightMetrics: ReadonlyArray<Metric> = SEEDS.map(({ base, ...rest }) => ({
  ...rest,
  series: buildSeries(base, rest.unit),
}));

export function getMetric(id: string): Metric {
  return insightMetrics.find((m) => m.id === id) ?? insightMetrics[0];
}

export function metricSeries(metric: Metric, scope: Scope, period: Period): ReadonlyArray<SeriesPoint> {
  return metric.series[scope][period];
}

export function formatMetricValue(metric: Metric, value: number): string {
  if (metric.unit === 'percent') return `${value}%`;
  if (metric.unit === 'hours') return `${value}h`;
  return value.toLocaleString();
}
