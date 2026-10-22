import type { AuriaApiError } from './api/errors';
import type { AuriaMode } from './api/streamChat';
import { createRun, runReducer, type AuriaRun, type AuriaRunAction } from './runReducer';
import type { AuriaAttachment, AuriaChatMessage } from './types';
import { applyWorkEvent } from './work/workRun';

/** Loading state of a saved chat's history (oldest-first pages on the server). */
export type HistoryState = {
  loading: boolean;
  /** Oldest page shown so far; "Load earlier" fetches the page before it. */
  oldestPage: number;
  hasEarlier: boolean;
  error: AuriaApiError | null;
};

/** The open conversation: saved messages, plus the answer being written. */
export type ConversationState = {
  /** null until the server creates the chat on the first message. */
  chatId: string | null;
  /** Origin of the open chat (`auria_system`, `chatgpt`…); null for a new chat. */
  provider: string | null;
  messages: AuriaChatMessage[];
  /**
   * One answer at a time. `localId` ties stream events to the turn that started them.
   * A retry or an edit (`replay`) sets aside the message `from` and what follows,
   * showing the edited question (if any) and the answer being written instead.
   */
  live: { localId: string; run: AuriaRun; replay?: Replay } | null;
  /** Why the last answer failed, for the notice above the composer. */
  error: AuriaApiError | null;
  history: HistoryState;
};

/** What a retry or an edit puts on screen while the server writes. */
type Replay = { from: string; question?: AuriaChatMessage };

export type ConversationAction =
  | { type: 'new-chat' }
  /** Open a saved chat: clears the screen and starts loading its latest messages. */
  | { type: 'open'; chatId: string; provider: string | null }
  | { type: 'history-loaded'; chatId: string; messages: AuriaChatMessage[]; oldestPage: number }
  | { type: 'earlier-loading'; chatId: string }
  | { type: 'earlier-loaded'; chatId: string; messages: AuriaChatMessage[]; page: number }
  | { type: 'history-failed'; chatId: string; error: AuriaApiError }
  /** After a failed turn: the server's copy wins when it has an answer after the last question (keeps the notice). */
  | { type: 'history-replace'; chatId: string; messages: AuriaChatMessage[]; oldestPage: number }
  | { type: 'send'; localId: string; text: string; now: number; files?: AuriaAttachment[]; mode?: AuriaMode }
  | { type: 'run'; localId: string; action: AuriaRunAction }
  /** The turn ended (finished, stopped or failed): the live answer becomes a message. */
  | { type: 'settle'; localId: string }
  /**
   * The server is writing a new version: of the answer `from` (retry, E19), or of the
   * question `from` with its new text (edit, E20, `question` given).
   */
  | {
      type: 'replay-start';
      localId: string;
      from: string;
      now: number;
      mode?: AuriaMode;
      question?: { text: string; files?: AuriaAttachment[] };
    }
  /** The new version is saved: the chat as the server has it now (its active branch). */
  | { type: 'replay-done'; localId: string; chatId: string; messages: AuriaChatMessage[]; oldestPage: number }
  /** An answer was liked or unliked (E22): shown at once, and put back if the server refuses. */
  | { type: 'liked'; messageId: string; liked: boolean }
  /** Another version became active (E21): the chat as the server has it now. Ignored during a turn. */
  | { type: 'branch-loaded'; chatId: string; messages: AuriaChatMessage[]; oldestPage: number }
  /** It didn't happen: the old messages come back, with the reason (or none when stopped). */
  | { type: 'replay-failed'; localId: string; error: AuriaApiError | null }
  | { type: 'clear-error' };

const idleHistory: HistoryState = { loading: false, oldestPage: 1, hasEarlier: false, error: null };

export const initialConversation: ConversationState = {
  chatId: null,
  provider: null,
  messages: [],
  live: null,
  error: null,
  history: idleHistory,
};

function settledAnswer(localId: string, run: AuriaRun): AuriaChatMessage | null {
  if (!run.text.trim()) return null; // nothing was written: the error notice says why
  const message: AuriaChatMessage = {
    // Same id as the live bubble, so the view keeps its state (the pacer finishes smoothly).
    id: `${localId}-a`,
    role: 'assistant',
    text: run.text,
  };
  if (run.assistantMessageUuid) message.serverId = run.assistantMessageUuid;
  if (run.reasoning.trim()) message.reasoningText = run.reasoning.trim();
  if (run.status === 'stopped') message.status = 'stopped';
  if (run.status === 'error') message.status = 'error';
  message.work = run.work; // the panel stays above the answer, closed ("Reasoned for 8 seconds")
  return message;
}

/** Older messages go first; a message already on screen is not repeated. */
function prepend(older: AuriaChatMessage[], current: AuriaChatMessage[]): AuriaChatMessage[] {
  const seen = new Set(current.map((m) => m.serverId ?? m.id));
  return [...older.filter((m) => !seen.has(m.serverId ?? m.id)), ...current];
}

export function conversationReducer(state: ConversationState, action: ConversationAction): ConversationState {
  switch (action.type) {
    case 'new-chat':
      // A live answer belongs to the old chat; the caller aborts it before this.
      return initialConversation;

    case 'open':
      return {
        ...initialConversation,
        chatId: action.chatId,
        provider: action.provider,
        history: { ...idleHistory, loading: true },
      };

    case 'history-loaded':
      if (state.chatId !== action.chatId) return state;
      return {
        ...state,
        // A turn sent while history loaded stays after the saved messages.
        messages: prepend(action.messages, state.messages),
        history: { loading: false, oldestPage: action.oldestPage, hasEarlier: action.oldestPage > 1, error: null },
      };

    case 'earlier-loading':
      if (state.chatId !== action.chatId) return state;
      return { ...state, history: { ...state.history, loading: true, error: null } };

    case 'earlier-loaded':
      if (state.chatId !== action.chatId) return state;
      return {
        ...state,
        messages: prepend(action.messages, state.messages),
        history: { loading: false, oldestPage: action.page, hasEarlier: action.page > 1, error: null },
      };

    case 'history-replace': {
      if (state.chatId !== action.chatId || state.live) return state;
      const last = action.messages[action.messages.length - 1];
      if (!last || last.role !== 'assistant') return state; // the server saved nothing better
      return {
        ...state,
        messages: action.messages,
        history: { loading: false, oldestPage: action.oldestPage, hasEarlier: action.oldestPage > 1, error: null },
      };
    }

    case 'history-failed':
      if (state.chatId !== action.chatId) return state;
      return { ...state, history: { ...state.history, loading: false, error: action.error } };

    case 'send': {
      const text = action.text.trim();
      const files = action.files ?? [];
      if (state.live || (!text && files.length === 0)) return state;
      const user: AuriaChatMessage = { id: `${action.localId}-u`, role: 'user', text };
      if (files.length) user.files = files;
      return {
        ...state,
        error: null,
        messages: [...state.messages, user],
        live: {
          localId: action.localId,
          run: createRun(action.now, state.chatId, { prompt: text || (files[0]?.name ?? ''), mode: action.mode ?? 'fast' }),
        },
      };
    }

    case 'run': {
      if (state.live?.localId !== action.localId) return state; // a stale turn
      const run = runReducer(state.live.run, action.action);
      return { ...state, chatId: run.chatId ?? state.chatId, live: { ...state.live, run } };
    }

    case 'settle': {
      if (state.live?.localId !== action.localId) return state;
      const { run } = state.live;
      const userId = `${action.localId}-u`;
      const messages = state.messages.map((m) =>
        m.id === userId && run.userMessageUuid ? { ...m, id: run.userMessageUuid, serverId: run.userMessageUuid } : m,
      );
      const answer = settledAnswer(action.localId, run);
      const chatId = run.chatId ?? state.chatId;
      return {
        ...state,
        chatId,
        provider: state.provider ?? (chatId ? 'auria_system' : null),
        messages: answer ? [...messages, answer] : messages,
        live: null,
        error: run.status === 'error' ? run.error : null,
      };
    }

    case 'replay-start': {
      if (state.live || !state.chatId) return state;
      const at = state.messages.findIndex((m) => m.id === action.from);
      const target = state.messages[at];
      // A retry starts from a saved answer; an edit from a saved question with non-empty new text.
      const editing = action.question !== undefined;
      if (!target?.serverId || target.role !== (editing ? 'user' : 'assistant')) return state;
      if (editing && !action.question?.text.trim()) return state;

      let question: AuriaChatMessage | undefined;
      if (action.question) {
        question = { id: `${action.localId}-u`, role: 'user', text: action.question.text.trim() };
        if (action.question.files?.length) question.files = action.question.files;
      }
      const prompt = question?.text ?? [...state.messages.slice(0, at)].reverse().find((m) => m.role === 'user')?.text ?? '';
      const run = createRun(action.now, state.chatId, { prompt, mode: action.mode ?? 'fast' });
      // No stream comes back: the server is writing the answer, and the panel says just that.
      run.work = applyWorkEvent(run.work, { type: 'answer' });
      return { ...state, error: null, live: { localId: action.localId, run, replay: { from: action.from, question } } };
    }

    case 'replay-done':
      if (state.live?.localId !== action.localId || state.chatId !== action.chatId) return state;
      return {
        ...state,
        messages: action.messages,
        live: null,
        history: { loading: false, oldestPage: action.oldestPage, hasEarlier: action.oldestPage > 1, error: null },
      };

    case 'replay-failed':
      if (state.live?.localId !== action.localId) return state;
      return { ...state, live: null, error: action.error };

    case 'liked':
      if (!state.messages.some((m) => m.id === action.messageId)) return state;
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.messageId ? { ...m, liked: action.liked } : m)),
      };

    case 'branch-loaded':
      if (state.chatId !== action.chatId || state.live) return state;
      return {
        ...state,
        messages: action.messages,
        history: { loading: false, oldestPage: action.oldestPage, hasEarlier: action.oldestPage > 1, error: null },
      };

    case 'clear-error':
      return state.error ? { ...state, error: null } : state;
  }
}

/** Saved messages plus the live answer, in the order the chat shows them. */
export function visibleMessages(state: ConversationState): AuriaChatMessage[] {
  if (!state.live) return state.messages;
  const { localId, run, replay } = state.live;
  const at = replay ? state.messages.findIndex((m) => m.id === replay.from) : -1;
  const kept = at >= 0 ? state.messages.slice(0, at) : state.messages;
  const question = replay?.question ? [replay.question] : [];
  return [...kept, ...question, { id: `${localId}-a`, role: 'assistant', text: run.text, live: true, work: run.work }];
}
