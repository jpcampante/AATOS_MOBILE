/**
 * Typed metric registry for the Insights hero. Each metric drives the hero's
 * line chart, headline and value row. One entry = one selectable chip.
 * Series are mock (12 months) until the backend provides real aggregates.
 */
export type InsightMetricUnit = 'count' | 'percent';

export type InsightMetric = {
  id: string;
  /** Short label for the selector chip. */
  chip: string;
  /** Phrase for the hero headline: "Here's a line graph of {headline}." */
  headline: string;
  /** Label shown in the value row beneath the chart. */
  metaLabel: string;
  unit: InsightMetricUnit;
  /** Rounding step for the y-axis "nice" maximum. */
  step: number;
  series: ReadonlyArray<{ month: string; value: number }>;
};

const MONTHS = ['MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'] as const;

const series = (values: number[]): ReadonlyArray<{ month: string; value: number }> =>
  MONTHS.map((month, i) => ({ month, value: values[i] ?? 0 }));

export const insightMetrics: ReadonlyArray<InsightMetric> = [
  {
    id: 'dau',
    chip: 'Active users',
    headline: 'daily active users across the company',
    metaLabel: 'Daily active users',
    unit: 'count',
    step: 250,
    series: series([320, 380, 420, 480, 580, 620, 540, 490, 510, 620, 980, 680]),
  },
  {
    id: 'emails-sent',
    chip: 'Emails sent',
    headline: 'emails sent across the company',
    metaLabel: 'Emails sent',
    unit: 'count',
    step: 250,
    series: series([820, 910, 870, 960, 1020, 1100, 980, 1040, 1150, 1210, 1180, 1240]),
  },
  {
    id: 'emails-received',
    chip: 'Emails received',
    headline: 'emails received across the company',
    metaLabel: 'Emails received',
    unit: 'count',
    step: 500,
    series: series([1450, 1520, 1480, 1600, 1680, 1720, 1650, 1700, 1810, 1880, 1840, 1920]),
  },
  {
    id: 'auria-usage',
    chip: 'Auria usage',
    headline: 'Auria interactions across the company',
    metaLabel: 'Auria interactions',
    unit: 'count',
    step: 100,
    series: series([60, 95, 120, 140, 180, 210, 190, 220, 260, 300, 280, 320]),
  },
  {
    id: 'auria-accuracy',
    chip: 'Auria accuracy',
    headline: 'Auria suggestion accuracy',
    metaLabel: 'Suggestion accuracy',
    unit: 'percent',
    step: 25,
    series: series([58, 61, 63, 66, 68, 70, 69, 72, 74, 78, 80, 84]),
  },
  {
    id: 'tasks-created',
    chip: 'Tasks created',
    headline: 'tasks created across projects',
    metaLabel: 'Tasks created',
    unit: 'count',
    step: 50,
    series: series([90, 110, 105, 130, 140, 155, 145, 150, 168, 175, 162, 180]),
  },
  {
    id: 'completion-rate',
    chip: 'Completion rate',
    headline: 'task completion rate across projects',
    metaLabel: 'Completion rate',
    unit: 'percent',
    step: 25,
    series: series([64, 67, 70, 72, 71, 75, 73, 76, 78, 80, 79, 82]),
  },
];

export function formatMetricValue(metric: InsightMetric, value: number): string {
  return metric.unit === 'percent' ? `${value}%` : value.toLocaleString();
}
