import { AuriaApiError, connectionLostError } from '../api/errors';
import type { AuriaStreamEvent } from '../api/streamEvents';
import {
  conversationReducer,
  initialConversation,
  visibleMessages,
  type ConversationAction,
  type ConversationState,
} from '../conversationReducer';

const ev = (localId: string, event: AuriaStreamEvent): ConversationAction => ({
  type: 'run',
  localId,
  action: { type: 'event', event },
});

const apply = (actions: ConversationAction[], state: ConversationState = initialConversation) =>
  actions.reduce(conversationReducer, state);

const done = (response: string): AuriaStreamEvent => ({
  type: 'done',
  response,
  reasoning: null,
  canvasDocuments: null,
  web: null,
  model: null,
});

describe('conversationReducer', () => {
  it('sends the first message, adopts the chat id and settles the answer', () => {
    const live = apply([
      { type: 'send', localId: 't1', text: '  Hi Auria  ', now: 0 },
      ev('t1', { type: 'chat', chatId: 'c-1', userMessageUuid: 'u-1' }),
      ev('t1', { type: 'reasoning', content: 'Thinking it over.', source: 'model' }),
      ev('t1', { type: 'delta', content: 'Hello' }),
    ]);
    expect(live.chatId).toBe('c-1');
    expect(visibleMessages(live)).toEqual([
      { id: 't1-u', role: 'user', text: 'Hi Auria' },
      { id: 't1-a', role: 'assistant', text: 'Hello', live: true },
    ]);

    const settled = apply(
      [
        ev('t1', done('Hello!')),
        ev('t1', {
          type: 'saved',
          chatId: 'c-1',
          userMessageUuid: 'u-1',
          assistantMessageUuid: 'a-1',
          canvasDocuments: null,
          canvasProposals: null,
        }),
        { type: 'settle', localId: 't1' },
      ],
      live,
    );
    expect(settled.live).toBeNull();
    expect(settled.error).toBeNull();
    expect(settled.messages).toEqual([
      { id: 'u-1', serverId: 'u-1', role: 'user', text: 'Hi Auria' },
      { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Hello!', reasoningText: 'Thinking it over.' },
    ]);
  });

  it('keeps the chat id for the next message', () => {
    const state = apply([
      { type: 'send', localId: 't1', text: 'One', now: 0 },
      ev('t1', { type: 'chat', chatId: 'c-1', userMessageUuid: null }),
      ev('t1', done('Ok')),
      { type: 'settle', localId: 't1' },
      { type: 'send', localId: 't2', text: 'Two', now: 1 },
    ]);
    expect(state.live?.run.chatId).toBe('c-1');
  });

  it('allows one answer at a time and ignores empty messages', () => {
    const state = apply([
      { type: 'send', localId: 't1', text: 'One', now: 0 },
      { type: 'send', localId: 't2', text: 'Two', now: 1 },
      { type: 'send', localId: 't3', text: '   ', now: 2 },
    ]);
    expect(state.messages).toHaveLength(1);
    expect(state.live?.localId).toBe('t1');
  });

  it('ignores events from a stale turn', () => {
    const state = apply([
      { type: 'send', localId: 't1', text: 'One', now: 0 },
      ev('old', { type: 'delta', content: 'nope' }),
      { type: 'settle', localId: 'old' },
    ]);
    expect(state.live?.run.text).toBe('');
  });

  it('keeps a stopped answer with its mark', () => {
    const state = apply([
      { type: 'send', localId: 't1', text: 'Long one', now: 0 },
      ev('t1', { type: 'delta', content: 'Partial' }),
      { type: 'run', localId: 't1', action: { type: 'stop' } },
      { type: 'settle', localId: 't1' },
    ]);
    expect(state.messages[1]).toEqual({ id: 't1-a', role: 'assistant', text: 'Partial', status: 'stopped' });
    expect(state.error).toBeNull();
  });

  it('keeps the partial text and the error when a turn fails', () => {
    const error = new AuriaApiError({ code: 'provider_timeout' });
    const state = apply([
      { type: 'send', localId: 't1', text: 'Q', now: 0 },
      ev('t1', { type: 'delta', content: 'Half' }),
      ev('t1', { type: 'error', error, chatId: 'c-1', partial: true, requiredTokens: null }),
      { type: 'settle', localId: 't1' },
    ]);
    expect(state.messages[1]).toMatchObject({ text: 'Half', status: 'error' });
    expect(state.error).toBe(error);
    expect(state.chatId).toBe('c-1');
  });

  it('shows only the error when nothing was written', () => {
    const state = apply([
      { type: 'send', localId: 't1', text: 'Q', now: 0 },
      { type: 'run', localId: 't1', action: { type: 'fail', error: connectionLostError() } },
      { type: 'settle', localId: 't1' },
    ]);
    expect(state.messages).toHaveLength(1);
    expect(state.error?.code).toBe('connection_lost');
  });

  it('clears everything on a new chat', () => {
    const state = apply([
      { type: 'send', localId: 't1', text: 'Q', now: 0 },
      { type: 'new-chat' },
    ]);
    expect(state).toEqual(initialConversation);
  });
});
