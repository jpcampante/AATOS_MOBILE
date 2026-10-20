import { createHttpClient, type TokenSource } from '../httpClient';

type Call = { url: string; init: RequestInit };

function jsonResponse(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => headers[name] ?? null },
    text: async () => text,
  } as unknown as Response;
}

function setup(responses: Array<Response | Error | 'hang'>, tokens: Partial<TokenSource> = {}) {
  const calls: Call[] = [];
  const queue = [...responses];
  const fetchImpl = (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (next === 'hang') {
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    }
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next as Response);
  };
  const source: TokenSource = {
    getAccessToken: tokens.getAccessToken ?? (async () => 'token-1'),
    refresh: tokens.refresh ?? (async () => 'token-2'),
  };
  const client = createHttpClient({ baseUrl: 'https://api.test', tokens: source, timeoutMs: 50, fetchImpl });
  const header = (i: number, name: string) => (calls[i].init.headers as Record<string, string>)[name];
  return { client, calls, header };
}

describe('createHttpClient', () => {
  it('sends the Bearer token, JSON and no cookies', async () => {
    const { client, calls, header } = setup([jsonResponse(200, { ok: true })]);
    await expect(client.post('/auria/x', { a: 1 })).resolves.toEqual({ ok: true });
    expect(calls[0].url).toBe('https://api.test/auria/x');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe('{"a":1}');
    expect(calls[0].init.credentials).toBe('omit');
    expect(header(0, 'Authorization')).toBe('Bearer token-1');
    expect(header(0, 'Content-Type')).toBe('application/json');
    expect(header(0, 'Accept')).toBe('application/json');
  });

  it('returns undefined for 204', async () => {
    const { client } = setup([jsonResponse(204)]);
    await expect(client.del('/auria/x')).resolves.toBeUndefined();
  });

  it('refreshes once after a 401 and retries with the new token', async () => {
    const { client, calls, header } = setup([jsonResponse(401, { detail: 'expired' }), jsonResponse(200, [1])]);
    await expect(client.get('/auria/x')).resolves.toEqual([1]);
    expect(calls).toHaveLength(2);
    expect(header(1, 'Authorization')).toBe('Bearer token-2');
  });

  it('gives up when the refresh ends the session', async () => {
    const { client, calls } = setup([jsonResponse(401, { detail: 'expired' })], { refresh: async () => null });
    await expect(client.get('/auria/x')).rejects.toMatchObject({ status: 401, code: 'unauthorized' });
    expect(calls).toHaveLength(1);
  });

  it('turns backend errors into AuriaApiError', async () => {
    const { client } = setup([
      jsonResponse(402, { status: 'error', message: 'No active plan.', code: 'insufficient_units', reason_code: 'no_active_plan' }),
    ]);
    await expect(client.post('/auria/x', {})).rejects.toMatchObject({
      name: 'AuriaApiError',
      status: 402,
      code: 'insufficient_units',
      reasonCode: 'no_active_plan',
    });
  });

  it('reports network failures and timeouts with their own codes', async () => {
    await expect(setup([new Error('offline')]).client.get('/x')).rejects.toMatchObject({ code: 'network' });
    await expect(setup(['hang']).client.get('/x')).rejects.toMatchObject({ code: 'timeout' });
  });

  it('reports a caller abort as aborted', async () => {
    const { client } = setup(['hang']);
    const controller = new AbortController();
    const pending = client.get('/x', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'aborted' });
  });

  it('keeps absolute URLs as they are', async () => {
    const { client, calls } = setup([jsonResponse(200, {})]);
    await client.get('https://other.test/billing/');
    expect(calls[0].url).toBe('https://other.test/billing/');
  });
});
