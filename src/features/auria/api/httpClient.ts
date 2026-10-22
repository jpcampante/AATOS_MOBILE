import { AuriaApiError, abortedError, errorFromResponse, networkError, timeoutError } from './errors';

/** Where the Bearer token comes from: the 001 session in the app, a stub in tests. */
export type TokenSource = {
  getAccessToken(): Promise<string | null>;
  /** Forces a refresh; resolves to the new token, or null when the session ended. */
  refresh(): Promise<string | null>;
};

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type RequestOptions = {
  body?: unknown;
  signal?: AbortSignal;
  /** Overrides the client's timeout for a request that is slow on purpose. */
  timeoutMs?: number;
};

export type UploadFile = { uri: string; name: string; type: string };

export type UploadOptions = {
  file: UploadFile;
  fields?: Record<string, string>;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

type ClientConfig = {
  baseUrl: string;
  tokens: TokenSource;
  timeoutMs: number;
  fetchImpl?: FetchLike;
};

/**
 * JSON client for MyCEO services: Bearer token, one refresh-and-retry on 401,
 * a timeout, and backend errors turned into `AuriaApiError`.
 * Never sends cookies and never `Accept: text/event-stream` (the backend answers 406).
 */
export function createHttpClient({ baseUrl, tokens, timeoutMs, fetchImpl }: ClientConfig) {
  const doFetch: FetchLike = fetchImpl ?? ((url, init) => fetch(url, init));
  const url = (path: string) => (/^https?:\/\//.test(path) ? path : `${baseUrl}${path}`);

  async function send(method: string, path: string, token: string | null, opts: RequestOptions): Promise<Response> {
    // Cancelled while waiting for the token: an aborted signal fires no event, so don't start.
    if (opts.signal?.aborted) throw abortedError();
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeoutMs ?? timeoutMs);
    const onCallerAbort = () => controller.abort();
    opts.signal?.addEventListener('abort', onCallerAbort);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

    try {
      return await doFetch(url(path), {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: controller.signal,
        credentials: 'omit',
      });
    } catch (e) {
      if (timedOut) throw timeoutError();
      if (opts.signal?.aborted) throw abortedError();
      throw networkError(e);
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onCallerAbort);
    }
  }

  async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    let response = await send(method, path, await tokens.getAccessToken(), opts);
    if (response.status === 401) {
      const fresh = await tokens.refresh();
      if (fresh) response = await send(method, path, fresh, opts);
    }
    return readBody<T>(response);
  }

  /** Multipart upload through XHR, the only RN API that reports upload progress. */
  function upload<T>(path: string, opts: UploadOptions): Promise<T> {
    const attempt = (token: string | null) =>
      new Promise<{ status: number; text: string; retryAfter: string | null }>((resolve, reject) => {
        if (opts.signal?.aborted) return reject(abortedError());
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url(path));
        // Never send the device's cookies: with a session cookie the backend authenticates by
        // cookie and refuses writes from an untrusted Origin (403), ignoring the Bearer token.
        xhr.withCredentials = false;
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) opts.onProgress?.(e.loaded / e.total);
        };
        xhr.onload = () =>
          resolve({ status: xhr.status, text: xhr.responseText, retryAfter: xhr.getResponseHeader('Retry-After') });
        xhr.onerror = () => reject(networkError());
        xhr.ontimeout = () => reject(timeoutError());
        xhr.onabort = () => reject(abortedError());
        opts.signal?.addEventListener('abort', () => xhr.abort());

        const form = new FormData();
        for (const [key, value] of Object.entries(opts.fields ?? {})) form.append(key, value);
        // React Native's FormData takes {uri, name, type} for files.
        form.append('file', opts.file as unknown as Blob);
        xhr.send(form);
      });

    return (async () => {
      let result = await attempt(await tokens.getAccessToken());
      if (result.status === 401) {
        const fresh = await tokens.refresh();
        if (fresh) result = await attempt(fresh);
      }
      const body = parseJson(result.text);
      if (result.status < 200 || result.status >= 300) throw errorFromResponse(result.status, body, result.retryAfter);
      opts.onProgress?.(1);
      return body as T;
    })();
  }

  return {
    url,
    get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body }),
    patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, { ...opts, body }),
    del: <T = void>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
    upload,
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;

function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function readBody<T>(response: Response): Promise<T> {
  const text = response.status === 204 ? '' : await response.text().catch(() => '');
  const body = parseJson(text);
  if (!response.ok) throw errorFromResponse(response.status, body, response.headers.get('Retry-After'));
  return body as T;
}

export { AuriaApiError };
