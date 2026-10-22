/**
 * Whether the person can send to Auria, from the billing service's
 * subscription (`GET /billing/subscription/?app=aatos`). Same rules as the web
 * (`aatos/src/services/billing/api.ts`): spec 002, D-08.
 */

export type ApiSubscriptionResponse = {
  app?: { requires_subscription?: boolean } | null;
  subscription?: {
    status?: string;
    is_active?: boolean;
    plan?: { tokens_per_unit?: number } | null;
  } | null;
  balance?: {
    available_units?: number;
    spendable_units?: number;
    next_reset_at?: string | null;
  } | null;
  turn_estimates?: Record<string, number> | null;
  can_manage_billing?: boolean;
  member_share?: { limited?: boolean; limit_tokens?: number } | null;
};

/** Why sending is blocked; the same `reason_code`s the Auria answers with on 402. */
export type CreditsBlockReason = 'no_active_plan' | 'member_limit' | 'pool_exhausted' | 'check_failed';

export type CreditsState =
  | { status: 'checking' }
  | { status: 'ok'; canManageBilling: boolean }
  | { status: 'blocked'; reason: CreditsBlockReason; canManageBilling: boolean; nextResetAt: string | null };

const AURIA_APP = 'auria';

export function creditsFromSubscription(response: ApiSubscriptionResponse): CreditsState {
  const canManageBilling = response.can_manage_billing === true;
  const nextResetAt = response.balance?.next_reset_at ?? null;
  const blocked = (reason: CreditsBlockReason): CreditsState => ({ status: 'blocked', reason, canManageBilling, nextResetAt });

  if (response.app?.requires_subscription === false) return { status: 'ok', canManageBilling };

  const subscription = response.subscription;
  const active = subscription
    ? typeof subscription.is_active === 'boolean'
      ? subscription.is_active
      : subscription.status === 'active'
    : false;
  if (!active) return blocked('no_active_plan');

  // The owner gave this member a zero share: Auria is off for them until they get one.
  if (response.member_share?.limited === true && response.member_share.limit_tokens === 0) return blocked('member_limit');

  const units = response.balance?.spendable_units ?? response.balance?.available_units ?? 0;
  const remaining = Math.max(0, units) * (subscription?.plan?.tokens_per_unit ?? 0);
  const minTurn = response.turn_estimates?.[AURIA_APP];
  const minTurnTokens = typeof minTurn === 'number' && minTurn > 0 ? minTurn : null;
  if (remaining <= 0 || (minTurnTokens != null && remaining < minTurnTokens)) return blocked('pool_exhausted');

  return { status: 'ok', canManageBilling };
}

/** The web blocks when the check itself fails (fail-closed); so does the app. */
export const creditsCheckFailed = (): CreditsState => ({
  status: 'blocked',
  reason: 'check_failed',
  canManageBilling: false,
  nextResetAt: null,
});

/** A 402 from Auria means the balance changed since the last check. */
export function creditsFromRefusal(reasonCode: string | null, canManageBilling: boolean): CreditsState {
  const reason: CreditsBlockReason =
    reasonCode === 'no_active_plan' || reasonCode === 'member_limit' ? reasonCode : 'pool_exhausted';
  return { status: 'blocked', reason, canManageBilling, nextResetAt: null };
}

export function creditsMessage(state: Extract<CreditsState, { status: 'blocked' }>): string {
  switch (state.reason) {
    case 'no_active_plan':
      return 'Your workspace has no active plan, so Auria is paused.';
    case 'member_limit':
      return "You're out of credits: your share of the workspace credits is used up.";
    case 'check_failed':
      return "Couldn't check your credits. Try again.";
    case 'pool_exhausted':
    default:
      return "You're out of credits. Auria is paused until credits are added.";
  }
}

/** "Resets on Nov 1" — when the plan's credits come back. */
export function resetHint(nextResetAt: string | null, now = new Date()): string | null {
  if (!nextResetAt) return null;
  const at = new Date(nextResetAt);
  if (Number.isNaN(at.getTime()) || at <= now) return null;
  const month = at.toLocaleString('en-US', { month: 'short' });
  return `Credits reset on ${month} ${at.getDate()}.`;
}
