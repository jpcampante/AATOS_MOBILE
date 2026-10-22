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
      { type: 'send', localId: 't1', text: '  Hi Auria  ', now: 0, mode: 'deep' },
      ev('t1', { type: 'chat', chatId: 'c-1', userMessageUuid: 'u-1' }),
      ev('t1', { type: 'reasoning', content: 'Thinking it over.', source: 'model' }),
      ev('t1', { type: 'delta', content: 'Hello' }),
    ]);
    expect(live.chatId).toBe('c-1');
    expect(visibleMessages(live)).toEqual([
      { id: 't1-u', role: 'user', text: 'Hi Auria' },
      {
        id: 't1-a',
        role: 'assistant',
        text: 'Hello',
        live: true,
        // The panel follows the turn: the question, the mode, and now writing the answer.
        work: expect.objectContaining({ title: 'Hi Auria', mode: 'deep', status: 'writing', startedAt: 0 }),
      },
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
      {
        id: 't1-a',
        serverId: 'a-1',
        role: 'assistant',
        text: 'Hello!',
        reasoningText: 'Thinking it over.',
        work: expect.objectContaining({ status: 'complete' }),
      },
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
      { type: 'run', localId: 't1', action: { type: 'stop', at: 4000 } },
      { type: 'settle', localId: 't1' },
    ]);
    expect(state.messages[1]).toEqual({
      id: 't1-a',
      role: 'assistant',
      text: 'Partial',
      status: 'stopped',
      work: expect.objectContaining({ status: 'stopped', finishedAt: 4000 }),
    });
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

describe('conversationReducer — saved chats', () => {
  const m = (id: string, role: 'user' | 'assistant' = 'user') => ({ id, serverId: id, role, text: id });

  it('opens a chat, loads its latest pages and then earlier ones', () => {
    const opened = conversationReducer(initialConversation, { type: 'open', chatId: 'c-1', provider: 'auria_system' });
    expect(opened).toMatchObject({ chatId: 'c-1', provider: 'auria_system', messages: [], history: { loading: true } });

    const loaded = conversationReducer(opened, {
      type: 'history-loaded',
      chatId: 'c-1',
      messages: [m('m3'), m('m4', 'assistant')],
      oldestPage: 2,
    });
    expect(loaded.history).toEqual({ loading: false, oldestPage: 2, hasEarlier: true, error: null });

    const earlier = apply(
      [
        { type: 'earlier-loading', chatId: 'c-1' },
        { type: 'earlier-loaded', chatId: 'c-1', messages: [m('m1'), m('m2'), m('m3')], page: 1 },
      ],
      loaded,
    );
    expect(earlier.messages.map((x) => x.id)).toEqual(['m1', 'm2', 'm3', 'm4']);
    expect(earlier.history.hasEarlier).toBe(false);
  });

  it('ignores history that arrives for a chat no longer open', () => {
    const state = apply([
      { type: 'open', chatId: 'c-1', provider: null },
      { type: 'open', chatId: 'c-2', provider: null },
      { type: 'history-loaded', chatId: 'c-1', messages: [m('old')], oldestPage: 1 },
    ]);
    expect(state.chatId).toBe('c-2');
    expect(state.messages).toEqual([]);
  });

  it('keeps a message sent while the history was loading after it', () => {
    const state = apply([
      { type: 'open', chatId: 'c-1', provider: 'auria_system' },
      { type: 'send', localId: 't1', text: 'New question', now: 0 },
      { type: 'history-loaded', chatId: 'c-1', messages: [m('m1'), m('m2', 'assistant')], oldestPage: 1 },
    ]);
    expect(state.messages.map((x) => x.id)).toEqual(['m1', 'm2', 't1-u']);
    expect(state.live?.run.chatId).toBe('c-1');
  });

  it('records a history failure without losing what is on screen', () => {
    const error = new AuriaApiError({ code: 'network' });
    const state = apply([
      { type: 'open', chatId: 'c-1', provider: null },
      { type: 'history-failed', chatId: 'c-1', error },
    ]);
    expect(state.history).toMatchObject({ loading: false, error });
  });

  it('marks a chat created by the first message as an Auria chat', () => {
    const state = apply([
      { type: 'send', localId: 't1', text: 'Hi', now: 0 },
      ev('t1', { type: 'chat', chatId: 'c-9', userMessageUuid: null }),
      ev('t1', done('Hello')),
      { type: 'settle', localId: 't1' },
    ]);
    expect(state.provider).toBe('auria_system');
  });
});

describe('conversationReducer — after a failed turn', () => {
  const failed = () =>
    apply([
      { type: 'send', localId: 't1', text: 'Q', now: 0 },
      ev('t1', { type: 'chat', chatId: 'c-1', userMessageUuid: 'u-1' }),
      ev('t1', { type: 'delta', content: 'Half' }),
      { type: 'run', localId: 't1', action: { type: 'fail', error: connectionLostError() } },
      { type: 'settle', localId: 't1' },
    ]);

  it("takes the server's copy when it has the answer, keeping the notice", () => {
    const state = conversationReducer(failed(), {
      type: 'history-replace',
      chatId: 'c-1',
      messages: [
        { id: 'u-1', serverId: 'u-1', role: 'user', text: 'Q' },
        { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'The full answer' },
      ],
      oldestPage: 1,
    });
    expect(state.messages.map((m) => m.text)).toEqual(['Q', 'The full answer']);
    expect(state.error?.code).toBe('connection_lost');
  });

  it('keeps the partial text when the server saved no answer', () => {
    const before = failed();
    const state = conversationReducer(before, {
      type: 'history-replace',
      chatId: 'c-1',
      messages: [{ id: 'u-1', serverId: 'u-1', role: 'user', text: 'Q' }],
      oldestPage: 1,
    });
    expect(state).toBe(before);
  });
});

describe('conversationReducer — attachments', () => {
  const photo = { id: 'p-1', name: 'photo.jpg', url: 'https://api.test/auria/chat/attachments/p-1', isImage: true, private: true };

  it('shows the question and the files apart in the user bubble', () => {
    const state = conversationReducer(initialConversation, { type: 'send', localId: 't1', text: 'What is this?', now: 0, files: [photo] });
    expect(state.messages[0]).toEqual({ id: 't1-u', role: 'user', text: 'What is this?', files: [photo] });
  });

  it('sends files without text', () => {
    const state = conversationReducer(initialConversation, { type: 'send', localId: 't1', text: '', now: 0, files: [photo] });
    expect(state.messages).toHaveLength(1);
    expect(state.live).not.toBeNull();
  });
});

describe('conversationReducer — retry (E19)', () => {
  const saved = (): ConversationState =>
    apply([
      { type: 'open', chatId: 'c-1', provider: 'auria_system' },
      {
        type: 'history-loaded',
        chatId: 'c-1',
        oldestPage: 1,
        messages: [
          { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' },
          { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.' },
          { id: 'u-2', serverId: 'u-2', role: 'user', text: 'And tomorrow?' },
          { id: 'a-2', serverId: 'a-2', role: 'assistant', text: 'Two.' },
        ],
      },
    ]);

  it('sets the answer and what follows aside and shows the panel writing the new one', () => {
    const state = conversationReducer(saved(), { type: 'replay-start', localId: 'r1', from: 'a-1', now: 0, mode: 'deep' });
    expect(state.live?.replay?.from).toBe('a-1');
    const shown = visibleMessages(state);
    expect(shown.map((m) => m.id)).toEqual(['u-1', 'r1-a']);
    expect(shown[1]).toMatchObject({
      live: true,
      work: expect.objectContaining({ title: 'What are my tasks?', mode: 'deep', status: 'writing' }),
    });
  });

  it('takes the server copy when the new version is saved', () => {
    const replaying = conversationReducer(saved(), { type: 'replay-start', localId: 'r1', from: 'a-2', now: 0 });
    const done = conversationReducer(replaying, {
      type: 'replay-done',
      localId: 'r1',
      chatId: 'c-1',
      oldestPage: 1,
      messages: [
        { id: 'u-2', serverId: 'u-2', role: 'user', text: 'And tomorrow?' },
        { id: 'a-3', serverId: 'a-3', role: 'assistant', text: 'Two, and a call.', version: { index: 2, count: 2, ids: ['a-2', 'a-3'] } },
      ],
    });
    expect(done.live).toBeNull();
    expect(visibleMessages(done).map((m) => m.text)).toEqual(['And tomorrow?', 'Two, and a call.']);
  });

  it('brings the old answer back, with the reason, when it fails', () => {
    const error = new AuriaApiError({ status: 402, code: 'insufficient_units' });
    const replaying = conversationReducer(saved(), { type: 'replay-start', localId: 'r1', from: 'a-2', now: 0 });
    const failed = conversationReducer(replaying, { type: 'replay-failed', localId: 'r1', error });
    expect(failed.live).toBeNull();
    expect(failed.error).toBe(error);
    expect(visibleMessages(failed).map((m) => m.id)).toEqual(['u-1', 'a-1', 'u-2', 'a-2']);
  });

  it('only retries a saved answer, one turn at a time', () => {
    const state = saved();
    expect(conversationReducer(state, { type: 'replay-start', localId: 'r1', from: 'u-1', now: 0 })).toBe(state);
    expect(conversationReducer(state, { type: 'replay-start', localId: 'r1', from: 'nope', now: 0 })).toBe(state);
    const busy = conversationReducer(state, { type: 'replay-start', localId: 'r1', from: 'a-1', now: 0 });
    expect(conversationReducer(busy, { type: 'replay-start', localId: 'r2', from: 'a-2', now: 0 })).toBe(busy);
    expect(conversationReducer(busy, { type: 'send', localId: 't9', text: 'hi', now: 0 })).toBe(busy);
  });

  it('ignores the end of a stale retry', () => {
    const replaying = conversationReducer(saved(), { type: 'replay-start', localId: 'r1', from: 'a-1', now: 0 });
    expect(conversationReducer(replaying, { type: 'replay-failed', localId: 'old', error: null })).toBe(replaying);
  });
});

describe('conversationReducer — edit (E20)', () => {
  const photo = { id: 'p-1', name: 'a.png', url: 'https://api.test/auria/chat/attachments/p-1', isImage: true, private: true };
  const saved = (): ConversationState =>
    apply([
      { type: 'open', chatId: 'c-1', provider: 'auria_system' },
      {
        type: 'history-loaded',
        chatId: 'c-1',
        oldestPage: 1,
        messages: [
          { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?', files: [photo] },
          { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.' },
          { id: 'u-2', serverId: 'u-2', role: 'user', text: 'And tomorrow?' },
          { id: 'a-2', serverId: 'a-2', role: 'assistant', text: 'Two.' },
        ],
      },
    ]);

  it('shows the edited question, with its attachments, and the panel in place of the old turn', () => {
    const state = conversationReducer(saved(), {
      type: 'replay-start',
      localId: 'e1',
      from: 'u-1',
      now: 0,
      question: { text: '  What are my tasks this week?  ', files: [photo] },
    });
    const shown = visibleMessages(state);
    expect(shown.map((m) => m.id)).toEqual(['e1-u', 'e1-a']);
    expect(shown[0]).toEqual({ id: 'e1-u', role: 'user', text: 'What are my tasks this week?', files: [photo] });
    expect(shown[1].work).toMatchObject({ title: 'What are my tasks this week?', status: 'writing' });
  });

  it('brings the original question back when it fails', () => {
    const editing = conversationReducer(saved(), { type: 'replay-start', localId: 'e1', from: 'u-2', now: 0, question: { text: 'And Friday?' } });
    const failed = conversationReducer(editing, { type: 'replay-failed', localId: 'e1', error: null });
    expect(visibleMessages(failed).map((m) => m.text)).toEqual(['What are my tasks?', 'Three tasks.', 'And tomorrow?', 'Two.']);
  });

  it('only edits a saved question, and never to an empty text', () => {
    const state = saved();
    expect(conversationReducer(state, { type: 'replay-start', localId: 'e1', from: 'a-1', now: 0, question: { text: 'x' } })).toBe(state);
    expect(conversationReducer(state, { type: 'replay-start', localId: 'e1', from: 'u-1', now: 0, question: { text: '   ' } })).toBe(state);
  });
});
