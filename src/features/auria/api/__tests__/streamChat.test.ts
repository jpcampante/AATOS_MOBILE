import type { TokenSource } from '../httpClient';
import { buildStreamBody, createStreamChat, newClientOperationId, type StreamChatRequest } from '../streamChat';
import { toStreamEvent, type AuriaStreamEvent } from '../streamEvents';

const enc = new TextEncoder();
const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

type Chunk = string | Error;

function streamResponse(chunks: Chunk[], status = 200) {
  const queue = [...chunks];
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => null },
    text: async () => '',
    body: {
      getReader: () => ({
        read: async () => {
          const next = queue.shift();
          if (next === undefined) return { done: true };
          if (next instanceof Error) throw next;
          return { done: false, value: enc.encode(next) };
        },
      }),
    },
  };
}

function jsonError(status: number, body: unknown) {
  return { status, ok: false, headers: { get: () => null }, text: async () => JSON.stringify(body), body: null };
}

const REQ: StreamChatRequest = { message: 'Hi', chatId: null, clientOperationId: 'op-12345678', mode: 'fast' };

function setup(responses: unknown[], tokens: Partial<TokenSource> = {}) {
  const calls: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];
  const queue = [...responses];
  const streamChat = createStreamChat({
    baseUrl: 'https://api.test',
    tokens: { getAccessToken: tokens.getAccessToken ?? (async () => 't1'), refresh: tokens.refresh ?? (async () => 't2') },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return queue.shift() as never;
    },
  });
  const events: AuriaStreamEvent[] = [];
  return { streamChat, calls, events, onEvent: (e: AuriaStreamEvent) => events.push(e) };
}

describe('streamChat', () => {
  it('streams a turn and resolves after done + saved', async () => {
    const body = [
      frame('chat', { chat_id: 'c-1', user_message_uuid: 'u-1' }),
      frame('status', { phase: 'started', mode: 'fast' }) + frame('delta', { content: 'Hel' }),
      frame('delta', { content: 'lo' }) + frame('done', { response: 'Hello', reasoning: '' }),
      frame('saved', { chat_id: 'c-1', user_message_uuid: 'u-1', assistant_message_uuid: 'a-1' }),
    ];
    const { streamChat, calls, events, onEvent } = setup([streamResponse(body)]);
    await expect(streamChat(REQ, { onEvent })).resolves.toEqual({
      chatId: 'c-1',
      userMessageUuid: 'u-1',
      assistantMessageUuid: 'a-1',
    });
    expect(events.map((e) => e.type)).toEqual(['chat', 'status', 'delta', 'delta', 'done', 'saved']);
    expect(calls[0].url).toBe('https://api.test/auria/system_llm/chat?stream=1');
    expect(calls[0].init.headers.Authorization).toBe('Bearer t1');
    expect(calls[0].init.headers.Accept).toBeUndefined();
    expect(JSON.parse(calls[0].init.body)).toMatchObject({ message: 'Hi', chat_id: null, mode: 'fast', web_mode: 'off' });
  });

  it('rejects with the HTTP error that comes before the stream', async () => {
    const { streamChat, events, onEvent } = setup([
      jsonError(402, { status: 'error', code: 'insufficient_units', reason_code: 'no_active_plan', message: 'No active plan.' }),
    ]);
    await expect(streamChat(REQ, { onEvent })).rejects.toMatchObject({ status: 402, code: 'insufficient_units', reasonCode: 'no_active_plan' });
    expect(events).toHaveLength(0);
  });

  it('refreshes once after a 401 before the stream starts', async () => {
    const ok = streamResponse([frame('done', { response: 'x' }), frame('saved', { chat_id: 'c' })]);
    const { streamChat, calls, onEvent } = setup([jsonError(401, { detail: 'expired', code: 'token_not_valid' }), ok]);
    await streamChat(REQ, { onEvent });
    expect(calls).toHaveLength(2);
    expect(calls[1].init.headers.Authorization).toBe('Bearer t2');
  });

  it('delivers the error event and rejects with its code', async () => {
    const body = [
      frame('delta', { content: 'partial' }),
      frame('error', { code: 'provider_timeout', message: 'Timed out', chat_id: 'c-9', partial: true }),
    ];
    const { streamChat, events, onEvent } = setup([streamResponse(body)]);
    await expect(streamChat(REQ, { onEvent })).rejects.toMatchObject({ code: 'provider_timeout' });
    const err = events.find((e) => e.type === 'error');
    expect(err).toMatchObject({ type: 'error', chatId: 'c-9', partial: true });
  });

  it('reports connection_lost when the body ends without done', async () => {
    const { streamChat, onEvent } = setup([streamResponse([frame('delta', { content: 'half' })])]);
    await expect(streamChat(REQ, { onEvent })).rejects.toMatchObject({ code: 'connection_lost' });
  });

  it('reports connection_lost when reading fails', async () => {
    const { streamChat, onEvent } = setup([streamResponse([frame('delta', { content: 'a' }), new Error('socket')])]);
    await expect(streamChat(REQ, { onEvent })).rejects.toMatchObject({ code: 'connection_lost' });
  });

  it('reports aborted when the caller stops it', async () => {
    const controller = new AbortController();
    const { streamChat, onEvent } = setup([
      streamResponse([frame('delta', { content: 'a' }), new Error('AbortError')]),
    ]);
    const pending = streamChat(REQ, {
      onEvent: (e) => {
        onEvent(e);
        controller.abort();
      },
      signal: controller.signal,
    });
    await expect(pending).rejects.toMatchObject({ code: 'aborted' });
  });
});

describe('buildStreamBody', () => {
  it('only sends optional fields that are set, and the scope with its version', () => {
    expect(buildStreamBody(REQ)).toEqual({
      message: 'Hi',
      chat_id: null,
      client_operation_id: 'op-12345678',
      web_mode: 'off',
      web_policy_version: 2,
      mode: 'fast',
    });
    expect(buildStreamBody({ ...REQ, moduleScope: 'tasks', attachmentUuids: ['a'], webMode: 'auto' })).toMatchObject({
      module_scope: 'tasks',
      scope_policy_version: 1,
      attachment_uuids: ['a'],
      web_mode: 'auto',
    });
  });
});

describe('toStreamEvent', () => {
  it('ignores unknown events, malformed JSON and empty deltas', () => {
    expect(toStreamEvent({ event: 'telemetry', data: '{}' })).toBeNull();
    expect(toStreamEvent({ event: 'delta', data: 'not json' })).toBeNull();
    expect(toStreamEvent({ event: 'delta', data: '{"content":""}' })).toBeNull();
  });

  it('types tool and delta_reset events', () => {
    expect(toStreamEvent({ event: 'tool', data: '{"name":"list_tasks","status":"done","ok":true,"service":"tasks"}' })).toEqual({
      type: 'tool',
      name: 'list_tasks',
      status: 'done',
      ok: true,
      service: 'tasks',
    });
    expect(toStreamEvent({ event: 'delta_reset', data: '{"chars":12,"reason":"preamble"}' })).toEqual({
      type: 'delta_reset',
      chars: 12,
      reason: 'preamble',
    });
  });
});

describe('newClientOperationId', () => {
  it('matches the backend format', () => {
    expect(newClientOperationId()).toMatch(/^[A-Za-z0-9-]{8,64}$/);
  });
});
