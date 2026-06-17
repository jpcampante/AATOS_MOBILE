import { getMetric } from './metrics';
import { insightSignals } from './signals';
import { getAcceptance } from './auriaAcceptance';
import type { DataSource, Metric, Severity, Signal } from './types';

/**
 * Pure derivations over signals + metrics. The same data drives Pulse, Needs
 * You, Risks, Health and Auria Impact — so the surfaces never contradict.
 */

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function latest(metric: Metric): number {
  const s = metric.series.company.month;
  return s[s.length - 1]?.value ?? 0;
}

function previous(metric: Metric): number {
  const s = metric.series.company.month;
  return s[s.length - 2]?.value ?? latest(metric);
}

const bySeverity = (a: Signal, b: Signal) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];

export function needsYou(signals: ReadonlyArray<Signal> = insightSignals): Signal[] {
  return signals.filter((s) => s.type === 'actionable').slice().sort(bySeverity);
}

export function risks(signals: ReadonlyArray<Signal> = insightSignals): Signal[] {
  return signals.filter((s) => s.type === 'trend').slice().sort(bySeverity);
}

export type PulseMover = { text: string; good: boolean };

export type Pulse = {
  attentionCount: number;
  topBlocker?: Signal;
  movers: PulseMover[];
};

export function pulse(signals: ReadonlyArray<Signal> = insightSignals): Pulse {
  const attention = needsYou(signals);

  const completion = getMetric('completion-rate');
  const backlog = getMetric('email-backlog');
  const saved = getMetric('auria-time-saved');

  const completionDiff = latest(completion) - previous(completion);
  const backlogPrev = previous(backlog);
  const backlogPct = backlogPrev ? Math.round(((latest(backlog) - backlogPrev) / backlogPrev) * 100) : 0;

  const movers: PulseMover[] = [
    {
      text: `productivity ${completionDiff >= 0 ? '+' : ''}${completionDiff}pp`,
      good: completionDiff >= 0,
    },
    {
      text: `email backlog ${backlogPct >= 0 ? '+' : ''}${backlogPct}%`,
      good: backlogPct <= 0,
    },
    {
      text: `Auria saved ${latest(saved)}h`,
      good: true,
    },
  ];

  return { attentionCount: attention.length, topBlocker: attention[0], movers };
}

export type HealthComponent = { label: string; weight: number; value: number };
export type Health = { score: number; components: HealthComponent[]; source: DataSource };

export function healthScore(signals: ReadonlyArray<Signal> = insightSignals): Health {
  const completion = clamp(latest(getMetric('completion-rate')), 0, 100);

  const backlog = getMetric('email-backlog');
  const backlogMax = Math.max(...backlog.series.company.month.map((p) => p.value), 1);
  const backlogNorm = clamp(100 - (latest(backlog) / backlogMax) * 100, 0, 100);

  const penalty = signals.reduce(
    (acc, s) => acc + (s.severity === 'high' ? 12 : s.severity === 'medium' ? 6 : 2),
    0,
  );
  const riskNorm = clamp(100 - penalty, 0, 100);

  const auria = clamp(latest(getMetric('auria-acceptance')), 0, 100);

  const components: HealthComponent[] = [
    { label: 'Work completion', weight: 0.35, value: Math.round(completion) },
    { label: 'Communication backlog', weight: 0.25, value: Math.round(backlogNorm) },
    { label: 'Risk / blockers', weight: 0.25, value: Math.round(riskNorm) },
    { label: 'Auria confidence', weight: 0.15, value: Math.round(auria) },
  ];
  const score = Math.round(components.reduce((acc, c) => acc + c.weight * c.value, 0));
  return { score, components, source: 'estimated' };
}

export type ImpactItem = { label: string; value: string; source: DataSource };
export type AuriaImpact = {
  items: ImpactItem[];
  acceptanceRate: { value: number; source: DataSource };
};

/**
 * @param acceptanceLocal optional live in-app acceptance % (from the task review
 * flow). Falls back to the mocked metric value.
 */
export function auriaImpact(acceptanceLocal?: number): AuriaImpact {
  const timeSaved = latest(getMetric('auria-time-saved'));
  const captured = getAcceptance();
  const acceptance = acceptanceLocal ?? captured.rate;
  return {
    items: [
      { label: 'Hours saved', value: `${timeSaved}h`, source: 'estimated' },
      { label: 'Emails triaged', value: '24', source: 'sample' },
      { label: 'Suggestions shown', value: `${captured.shown}`, source: 'local' },
      { label: 'Tasks accepted', value: `${captured.accepted}`, source: 'local' },
      { label: 'Meetings scheduled', value: '3', source: 'sample' },
    ],
    acceptanceRate: { value: acceptance, source: 'local' },
  };
}
