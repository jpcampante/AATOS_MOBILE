import {
  creditsCheckFailed,
  creditsFromRefusal,
  creditsFromSubscription,
  creditsMessage,
  resetHint,
  type ApiSubscriptionResponse,
} from '../credits';

const active = (over: Partial<ApiSubscriptionResponse> = {}): ApiSubscriptionResponse => ({
  app: { requires_subscription: true },
  subscription: { status: 'active', plan: { tokens_per_unit: 1000 } },
  balance: { available_units: 50, spendable_units: 40, next_reset_at: '2026-11-01T04:00:00Z' },
  turn_estimates: { auria: 30000 },
  can_manage_billing: true,
  member_share: null,
  ...over,
});

describe('creditsFromSubscription', () => {
  it('lets the person send with an active plan and enough balance', () => {
    expect(creditsFromSubscription(active())).toEqual({ status: 'ok', canManageBilling: true });
  });

  it('blocks with no plan (what the test account returns)', () => {
    expect(
      creditsFromSubscription({ subscription: null, balance: null, turn_estimates: {}, can_manage_billing: true, member_share: null }),
    ).toMatchObject({ status: 'blocked', reason: 'no_active_plan', canManageBilling: true });
    expect(creditsFromSubscription(active({ subscription: { status: 'canceled' } }))).toMatchObject({ reason: 'no_active_plan' });
    expect(creditsFromSubscription(active({ subscription: { status: 'active', is_active: false } }))).toMatchObject({
      reason: 'no_active_plan',
    });
  });

  it('does not require a plan when the app says so', () => {
    expect(creditsFromSubscription({ app: { requires_subscription: false }, subscription: null })).toMatchObject({ status: 'ok' });
  });

  it('blocks a member whose share is zero', () => {
    expect(creditsFromSubscription(active({ member_share: { limited: true, limit_tokens: 0 } }))).toMatchObject({
      reason: 'member_limit',
    });
  });

  it('blocks when the balance is gone or below the cost of one turn', () => {
    expect(creditsFromSubscription(active({ balance: { available_units: 0 } }))).toMatchObject({ reason: 'pool_exhausted' });
    // 25 spendable units × 1000 = 25 000 tokens < 30 000 for one Auria turn.
    expect(creditsFromSubscription(active({ balance: { available_units: 60, spendable_units: 25 } }))).toMatchObject({
      reason: 'pool_exhausted',
    });
    // Uses available_units when spendable_units is missing.
    expect(creditsFromSubscription(active({ balance: { available_units: 31 } }))).toMatchObject({ status: 'ok' });
  });

  it('ignores a missing turn estimate (no turn seen this cycle yet)', () => {
    expect(creditsFromSubscription(active({ turn_estimates: {}, balance: { available_units: 1 } }))).toMatchObject({ status: 'ok' });
  });
});

describe('credits helpers', () => {
  it('fails closed when the check fails', () => {
    expect(creditsCheckFailed()).toMatchObject({ status: 'blocked', reason: 'check_failed' });
  });

  it('turns a 402 into a blocked state', () => {
    expect(creditsFromRefusal('no_active_plan', false)).toMatchObject({ reason: 'no_active_plan', canManageBilling: false });
    expect(creditsFromRefusal(null, true)).toMatchObject({ reason: 'pool_exhausted', canManageBilling: true });
  });

  it('has English copy for every reason', () => {
    for (const reason of ['no_active_plan', 'member_limit', 'pool_exhausted', 'check_failed'] as const) {
      expect(creditsMessage({ status: 'blocked', reason, canManageBilling: false, nextResetAt: null })).toMatch(/[A-Za-z]/);
    }
  });

  it('formats the reset date only when it is in the future', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    expect(resetHint('2026-11-01T12:00:00Z', now)).toBe('Credits reset on Nov 1.');
    expect(resetHint('2026-10-01T12:00:00Z', now)).toBeNull();
    expect(resetHint(null, now)).toBeNull();
  });
});
