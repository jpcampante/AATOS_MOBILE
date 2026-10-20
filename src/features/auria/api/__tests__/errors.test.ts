import {
  AuriaApiError,
  connectionLostError,
  describeAuriaError,
  errorFromResponse,
  networkError,
  timeoutError,
} from '../errors';

describe('errorFromResponse', () => {
  it('reads the Auria body ({status, message, code, reason_code})', () => {
    const err = errorFromResponse(402, {
      status: 'error',
      message: 'No active plan. Subscribe to a plan to use the AI.',
      code: 'insufficient_units',
      reason_code: 'no_active_plan',
      required_tokens: 31549,
    });
    expect(err).toBeInstanceOf(AuriaApiError);
    expect(err.status).toBe(402);
    expect(err.code).toBe('insufficient_units');
    expect(err.reasonCode).toBe('no_active_plan');
    expect(err.serverMessage).toBe('No active plan. Subscribe to a plan to use the AI.');
  });

  it('reads the DRF body ({detail, code})', () => {
    const err = errorFromResponse(403, { detail: 'No access to this business.', code: 'no_business_access' });
    expect(err.code).toBe('no_business_access');
    expect(err.serverMessage).toBe('No access to this business.');
  });

  it('reads the integration body ({error})', () => {
    const err = errorFromResponse(400, { error: 'invalid_web_mode' });
    expect(err.code).toBe('invalid_web_mode');
  });

  it('recognises read-only chats and projects from the DRF detail', () => {
    expect(errorFromResponse(403, { detail: 'This chat is read-only for you.' }).code).toBe('chat_read_only');
    expect(errorFromResponse(403, { detail: 'This project is read-only for you.' }).code).toBe('project_read_only');
  });

  it('falls back to a code from the status', () => {
    expect(errorFromResponse(401, { detail: 'Given token not valid for any token type', code: 'token_not_valid' }).code).toBe('token_not_valid');
    expect(errorFromResponse(401, null).code).toBe('unauthorized');
    expect(errorFromResponse(402, null).code).toBe('insufficient_units');
    expect(errorFromResponse(403, { detail: 'You do not have permission to perform this action.' }).code).toBe('forbidden');
    expect(errorFromResponse(404, { detail: 'Not found.' }).code).toBe('not_found');
    expect(errorFromResponse(406, { detail: 'Could not satisfy the request Accept header.' }).code).toBe('not_acceptable');
    expect(errorFromResponse(413, null).code).toBe('file_too_large');
    expect(errorFromResponse(415, null).code).toBe('unsupported_file');
    expect(errorFromResponse(429, null).code).toBe('rate_limited');
    expect(errorFromResponse(500, 'oops').code).toBe('server');
    expect(errorFromResponse(418, null).code).toBe('unknown');
  });

  it('keeps Retry-After in seconds', () => {
    expect(errorFromResponse(429, null, '12').retryAfter).toBe(12);
    expect(errorFromResponse(429, null, 'soon').retryAfter).toBeNull();
  });
});

describe('describeAuriaError', () => {
  const copy = (code: string, extra: Partial<{ status: number; reasonCode: string }> = {}, canManageBilling = false) =>
    describeAuriaError(
      new AuriaApiError({ code, status: extra.status ?? 400, reasonCode: extra.reasonCode ?? null }),
      { canManageBilling },
    );

  it('explains running out of credits and who can fix it', () => {
    expect(copy('insufficient_units', { status: 402, reasonCode: 'pool_exhausted' }, true)).toEqual({
      message: 'Your workspace is out of credits.',
      action: 'see_plans',
    });
    expect(copy('insufficient_units', { status: 402, reasonCode: 'pool_exhausted' }, false).action).toBe('ask_owner');
    expect(copy('insufficient_units', { status: 402, reasonCode: 'no_active_plan' }).message).toBe(
      'Your workspace has no active plan.',
    );
    expect(copy('insufficient_units', { status: 402, reasonCode: 'member_limit' }).message).toBe(
      "You've used your share of the workspace credits.",
    );
    expect(copy('insufficient_units', { status: 402 }).message).toBe("You're out of credits.");
  });

  it('offers a new chat when the conversation is too long', () => {
    expect(copy('context_too_long').action).toBe('new_chat');
  });

  it('reloads instead of resending while a turn is still running', () => {
    expect(copy('reservation_conflict').action).toBe('reload');
    expect(copy('operation_in_progress').action).toBe('reload');
    expect(copy('operation_already_sent').action).toBe('reload');
  });

  it('offers retry for provider and connection failures', () => {
    for (const code of ['provider_timeout', 'provider_rate_limited', 'provider_unavailable', 'ai_service_unavailable', 'empty_response', 'internal_error', 'server']) {
      expect(copy(code).action).toBe('retry');
    }
    expect(describeAuriaError(networkError(new Error('x'))).action).toBe('retry');
    expect(describeAuriaError(timeoutError()).action).toBe('retry');
    expect(describeAuriaError(connectionLostError()).message).toBe('The connection was lost before Auria finished.');
  });

  it('has its own copy for every server code in the plan', () => {
    const codes = [
      'insufficient_units', 'billing_unavailable', 'billing_reservation_inactive', 'reservation_conflict',
      'provider_timeout', 'provider_rate_limited', 'provider_unavailable', 'ai_service_unavailable',
      'context_too_long', 'content_blocked', 'empty_response', 'tool_limit_reached', 'internal_error',
    ];
    const generic = copy('something_new').message;
    for (const code of codes) {
      expect(copy(code).message).not.toBe(generic);
    }
  });

  it('uses a generic message for unknown codes', () => {
    expect(copy('something_new')).toEqual({ message: 'Something went wrong. Try again.', action: 'retry' });
  });
});
