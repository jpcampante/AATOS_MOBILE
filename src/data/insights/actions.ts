import type { InsightAction } from './types';

/**
 * Catalog of next steps a signal can offer. Signals reference these by id.
 * `navigate` switches tab; `auria` opens the Auria tab with a pre-filled prompt;
 * `modal` opens an in-place modal.
 */
export const insightActions: Record<string, InsightAction> = {
  'open-task': { id: 'open-task', label: 'Open task', kind: 'navigate', target: 'tasks' },
  'open-tasks': { id: 'open-tasks', label: 'Open in Tasks', kind: 'navigate', target: 'tasks' },
  'review-suggestions': { id: 'review-suggestions', label: 'Review', kind: 'navigate', target: 'tasks' },
  'reply-email': { id: 'reply-email', label: 'Reply', kind: 'navigate', target: 'integrations' },
  'open-mail': { id: 'open-mail', label: 'Open in Mail', kind: 'navigate', target: 'integrations' },
  'ask-auria-msa': {
    id: 'ask-auria-msa',
    label: 'Ask Auria',
    kind: 'auria',
    target: 'auria',
    payload: { prompt: 'What is blocking the MSA contract and how do I unblock it?' },
  },
  'draft-followup': {
    id: 'draft-followup',
    label: 'Draft follow-up',
    kind: 'auria',
    target: 'auria',
    payload: { prompt: 'Draft a follow-up email for the MSA contract that has been blocked for 3 days.' },
  },
  'ask-auria-backlog': {
    id: 'ask-auria-backlog',
    label: 'Ask Auria',
    kind: 'auria',
    target: 'auria',
    payload: { prompt: 'Why did the email backlog go up this week and what should I clear first?' },
  },
};

export function getAction(id: string): InsightAction | undefined {
  return insightActions[id];
}

export function resolveActions(ids: string[]): InsightAction[] {
  return ids.map((id) => insightActions[id]).filter((a): a is InsightAction => Boolean(a));
}
