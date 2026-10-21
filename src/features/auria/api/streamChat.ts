import { WEB_POLICY_VERSION } from './config';
import { AuriaApiError, abortedError, connectionLostError, errorFromResponse, networkError } from './errors';
import type { TokenSource } from './httpClient';
import { auriaRoutes } from './routes';
import { createSseDecoder } from './sse';
import { toStreamEvent, type AuriaStreamEvent } from './streamEvents';

export type AuriaMode = 'fast' | 'deep';

export type StreamChatRequest = {
  message: string;
  /** null on the first message: the server creates the chat and sends its id in `chat`. */
  chatId: string | null;
  /** Idempotency key: the server won't run the same turn twice. 8–64 of [A-Za-z0-9-]. */
  clientOperationId: string;
  mode?: AuriaMode;
  webMode?: 'auto' | 'off';
  attachmentUuids?: string[];
  mentions?: { user_public_uid: string; full_name?: string; handle?: string }[];
  subjectUserPublicUid?: string;
  create?: 'doc' | 'sheet' | 'slides';
  openDocumentId?: string;
  moduleScope?: 'tasks' | 'calendar' | 'mail' | 'contacts';
  departmentId?: string;
};

export type StreamChatResult = {
  chatId: string | null;
  userMessageUuid: string | null;
  assistantMessageUuid: string | null;
};

export type StreamChatOptions = {
  onEvent: (event: AuriaStreamEvent) => void;
  signal?: AbortSignal;
};

type StreamResponse = {
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  body: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; cancel?(): Promise<void> } } | null;
};

type StreamFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal; credentials: 'omit' },
) => Promise<StreamResponse>;

const SCOPE_POLICY_VERSION = 1;

export function buildStreamBody(req: StreamChatRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    message: req.message,
    chat_id: req.chatId,
    client_operation_id: req.clientOperationId,
    web_mode: req.webMode ?? 'off',
    web_policy_version: WEB_POLICY_VERSION,
  };
  if (req.mode) body.mode = req.mode;
  if (req.attachmentUuids?.length) body.attachment_uuids = req.attachmentUuids;
  if (req.mentions?.length) body.mentions = req.mentions;
  if (req.subjectUserPublicUid) body.subject_user_public_uid = req.subjectUserPublicUid;
  if (req.create) body.create = req.create;
  if (req.openDocumentId) body.open_document_id = req.openDocumentId;
  if (req.moduleScope) {
    body.module_scope = req.moduleScope;
    body.scope_policy_version = SCOPE_POLICY_VERSION;
  }
  if (req.departmentId) body.department_id = req.departmentId;
  return body;
}

/**
 * One Auria turn over SSE. Every event goes to `onEvent` as it arrives.
 * Resolves after `done` + `saved` (the rest of the body — memory writes — is
 * drained in the background). Rejects with `AuriaApiError`:
 *  - the HTTP error before the stream (e.g. 402 with no plan);
 *  - the `error` event's error;
 *  - `connection_lost` when the body ends without `done`;
 *  - `aborted` when `signal` stops it (the server is not told; tool actions already done stay done).
 */
export function createStreamChat({ baseUrl, tokens, fetchImpl }: { baseUrl: string; tokens: TokenSource; fetchImpl: StreamFetch }) {
  return async function streamChat(req: StreamChatRequest, { onEvent, signal }: StreamChatOptions): Promise<StreamChatResult> {
    const body = JSON.stringify(buildStreamBody(req));
    const open = async (token: string | null) => {
      if (signal?.aborted) throw abortedError();
      try {
        return await fetchImpl(`${baseUrl}${auriaRoutes.systemChatStream}`, {
          method: 'POST',
          // No `Accept: text/event-stream`: the backend only renders JSON and answers 406.
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : null) },
          body,
          signal,
          // Bearer only: a session cookie would make the backend refuse the write (403).
          credentials: 'omit',
        });
      } catch (e) {
        if (signal?.aborted) throw abortedError();
        throw networkError(e);
      }
    };

    let response = await open(await tokens.getAccessToken());
    if (response.status === 401) {
      // A 401 is answered before the turn starts, so retrying can't run it twice.
      const fresh = await tokens.refresh();
      if (fresh) response = await open(fresh);
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        /* keep the text */
      }
      throw errorFromResponse(response.status, parsed, response.headers.get('Retry-After'));
    }
    if (!response.body) throw connectionLostError();

    const result: StreamChatResult = { chatId: req.chatId, userMessageUuid: null, assistantMessageUuid: null };
    let sawDone = false;
    let saved = false;
    let streamError: AuriaApiError | null = null;

    const decoder = createSseDecoder((frame) => {
      const event = toStreamEvent(frame);
      if (!event) return;
      switch (event.type) {
        case 'chat':
          result.chatId = event.chatId;
          result.userMessageUuid = event.userMessageUuid;
          break;
        case 'done':
          sawDone = true;
          break;
        case 'saved':
          result.chatId = event.chatId ?? result.chatId;
          result.userMessageUuid = event.userMessageUuid ?? result.userMessageUuid;
          result.assistantMessageUuid = event.assistantMessageUuid;
          if (sawDone) saved = true;
          break;
        case 'error':
          streamError = event.error;
          result.chatId = event.chatId ?? result.chatId;
          break;
      }
      onEvent(event);
    });

    const reader = response.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) decoder.push(value);
        if (saved && !streamError) {
          // The turn is saved; keep reading quietly so the server can finish (memories).
          void (async () => {
            try {
              while (!(await reader.read()).done);
            } catch {
              /* the connection ended */
            }
          })();
          return result;
        }
      }
      decoder.end();
    } catch (e) {
      if (signal?.aborted) throw abortedError();
      if (streamError) throw streamError;
      throw connectionLostError();
    }

    if (streamError) throw streamError;
    if (!sawDone) throw connectionLostError();
    return result;
  };
}

export type StreamChat = ReturnType<typeof createStreamChat>;

/** An id for `clientOperationId`: 32 hex chars. Not security-sensitive (idempotency only). */
export function newClientOperationId(): string {
  let id = '';
  for (let i = 0; i < 32; i += 1) id += Math.floor(Math.random() * 16).toString(16);
  return id;
}
