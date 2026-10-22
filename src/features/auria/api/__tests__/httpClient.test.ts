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

  it('lets a slow request wait longer than the client timeout', async () => {
    const { client } = setup(['hang']);
    let settled = false;
    const slow = client.post('/regenerate', {}, { timeoutMs: 200 }).catch((e) => {
      settled = true;
      throw e;
    });
    await new Promise((r) => setTimeout(r, 100)); // past the client's 50 ms
    expect(settled).toBe(false);
    await expect(slow).rejects.toMatchObject({ code: 'timeout' });
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

describe('upload', () => {
  type Reply = { status: number; body?: unknown };

  /** Stand-in for React Native's XMLHttpRequest: records what was sent and answers from a queue. */
  class FakeXhr {
    static sent: FakeXhr[] = [];
    static replies: Reply[] = [];
    method = '';
    url = '';
    headers: Record<string, string> = {};
    withCredentials = true; // what a cookie-sending default would look like
    form: FormData | null = null;
    status = 0;
    responseText = '';
    upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
    onabort: (() => void) | null = null;
    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }
    setRequestHeader(name: string, value: string) {
      this.headers[name] = value;
    }
    getResponseHeader() {
      return null;
    }
    abort() {
      this.onabort?.();
    }
    send(form: FormData) {
      this.form = form;
      FakeXhr.sent.push(this);
      const reply = FakeXhr.replies.shift() ?? { status: 200, body: {} };
      this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
      this.status = reply.status;
      this.responseText = reply.body === undefined ? '' : JSON.stringify(reply.body);
      setTimeout(() => this.onload?.(), 0);
    }
  }

  const realXhr = global.XMLHttpRequest;
  beforeEach(() => {
    FakeXhr.sent = [];
    FakeXhr.replies = [];
    (global as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXhr;
  });
  afterAll(() => {
    global.XMLHttpRequest = realXhr;
  });

  const FILE = { uri: 'file:///photo.jpg', name: 'photo.jpg', type: 'image/jpeg' };

  it('sends the file with the Bearer token and without the device cookies', async () => {
    FakeXhr.replies = [{ status: 201, body: { uuid: 'u-1', url: '/auria/chat/attachments/u-1' } }];
    const { client } = setup([]);
    const progress: number[] = [];

    const result = await client.upload('/auria/chat/attachments', { file: FILE, fields: { chat_id: 'c-1' }, onProgress: (p) => progress.push(p) });

    const xhr = FakeXhr.sent[0];
    expect(result).toEqual({ uuid: 'u-1', url: '/auria/chat/attachments/u-1' });
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('https://api.test/auria/chat/attachments');
    expect(xhr.headers.Authorization).toBe('Bearer token-1');
    // With a session cookie the backend ignores the Bearer token and refuses the write (403).
    expect(xhr.withCredentials).toBe(false);
    expect(progress).toEqual([0.5, 1]);
  });

  it('refreshes once after a 401 and sends again', async () => {
    FakeXhr.replies = [{ status: 401, body: { detail: 'expired' } }, { status: 201, body: { uuid: 'u-2' } }];
    const { client } = setup([]);

    await expect(client.upload('/auria/chat/attachments', { file: FILE })).resolves.toEqual({ uuid: 'u-2' });
    expect(FakeXhr.sent.map((x) => x.headers.Authorization)).toEqual(['Bearer token-1', 'Bearer token-2']);
  });

  it('turns a refused upload into AuriaApiError', async () => {
    FakeXhr.replies = [{ status: 413, body: { error: 'File too large' } }];
    const { client } = setup([]);

    await expect(client.upload('/auria/chat/attachments', { file: FILE })).rejects.toMatchObject({ status: 413 });
  });

  it('does not start when it was already cancelled', async () => {
    const { client } = setup([]);
    const controller = new AbortController();
    controller.abort();

    await expect(client.upload('/auria/chat/attachments', { file: FILE, signal: controller.signal })).rejects.toMatchObject({ code: 'aborted' });
    expect(FakeXhr.sent).toHaveLength(0);
  });
});
