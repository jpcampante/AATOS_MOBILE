import type { Signal } from './types';

/**
 * Mock signals — what changed / needs attention. `actionable` items feed
 * "Needs you", `trend` items feed "Risks"; both feed the Pulse and (via
 * metricId) the Explorer annotation. Seeded to mirror the Today feed plus a few
 * systemic trends.
 */
export const insightSignals: ReadonlyArray<Signal> = [
  {
    id: 'legal-msa-blocked',
    domain: 'projects',
    severity: 'high',
    type: 'actionable',
    title: 'MSA contract blocked',
    detail: 'Legal review · Contract annex B',
    delta: '+3 days blocked',
    source: 'sample',
    metricId: 'cycle-time',
    actionIds: ['open-task', 'ask-auria-msa', 'draft-followup'],
  },
  {
    id: 'supabase-security-email',
    domain: 'email',
    severity: 'high',
    type: 'actionable',
    title: 'Action required: security vulnerabilities',
    detail: 'Supabase · 18:52',
    source: 'sample',
    actionIds: ['reply-email', 'open-mail'],
  },
  {
    id: 'q3-strategy-approval',
    domain: 'tasks',
    severity: 'medium',
    type: 'actionable',
    title: 'Q3 strategy draft awaiting approval',
    detail: 'Strategy_v3.pdf · due today',
    source: 'sample',
    actionIds: ['open-task'],
  },
  {
    id: 'auria-suggestions-pending',
    domain: 'auria',
    severity: 'medium',
    type: 'actionable',
    title: '2 Auria suggestions waiting for approval',
    detail: 'Detected across your workspace',
    source: 'local',
    metricId: 'auria-acceptance',
    actionIds: ['review-suggestions'],
  },
  {
    id: 'email-backlog-spike',
    domain: 'email',
    severity: 'medium',
    type: 'trend',
    title: 'Email backlog rising this week',
    delta: '+12 vs last week',
    source: 'sample',
    metricId: 'email-backlog',
    actionIds: ['open-mail', 'ask-auria-backlog'],
  },
  {
    id: 'auria-accuracy-down',
    domain: 'auria',
    severity: 'medium',
    type: 'trend',
    title: 'Auria acceptance down this week',
    delta: '-6%',
    source: 'local',
    metricId: 'auria-acceptance',
    actionIds: ['review-suggestions'],
  },
  {
    id: 'project-inactive',
    domain: 'projects',
    severity: 'low',
    type: 'trend',
    title: 'Onboarding project inactive 8 days',
    delta: 'no activity',
    source: 'sample',
    actionIds: ['open-tasks'],
  },
];
