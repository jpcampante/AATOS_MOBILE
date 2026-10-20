import type { AuriaApiError } from './api/errors';
import { createRun, runReducer, type AuriaRun, type AuriaRunAction } from './runReducer';
import type { AuriaChatMessage } from './types';

/** The open conversation: saved messages, plus the answer being written. */
export type ConversationState = {
  /** null until the server creates the chat on the first message. */
  chatId: string | null;
  messages: AuriaChatMessage[];
  /** One answer at a time. `localId` ties stream events to the turn that started them. */
  live: { localId: string; run: AuriaRun } | null;
  /** Why the last answer failed, for the notice above the composer. */
  error: AuriaApiError | null;
};

export type ConversationAction =
  | { type: 'new-chat' }
  | { type: 'send'; localId: string; text: string; now: number }
  | { type: 'run'; localId: string; action: AuriaRunAction }
  /** The turn ended (finished, stopped or failed): the live answer becomes a message. */
  | { type: 'settle'; localId: string }
  | { type: 'clear-error' };

export const initialConversation: ConversationState = { chatId: null, messages: [], live: null, error: null };

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
  return message;
}

export function conversationReducer(state: ConversationState, action: ConversationAction): ConversationState {
  switch (action.type) {
    case 'new-chat':
      // A live answer belongs to the old chat; the caller aborts it before this.
      return initialConversation;

    case 'send': {
      const text = action.text.trim();
      if (state.live || !text) return state;
      const user: AuriaChatMessage = { id: `${action.localId}-u`, role: 'user', text };
      return {
        ...state,
        error: null,
        messages: [...state.messages, user],
        live: { localId: action.localId, run: createRun(action.now, state.chatId) },
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
      return {
        chatId: run.chatId ?? state.chatId,
        messages: answer ? [...messages, answer] : messages,
        live: null,
        error: run.status === 'error' ? run.error : null,
      };
    }

    case 'clear-error':
      return state.error ? { ...state, error: null } : state;
  }
}

/** Saved messages plus the live answer, in the order the chat shows them. */
export function visibleMessages(state: ConversationState): AuriaChatMessage[] {
  if (!state.live) return state.messages;
  const { localId, run } = state.live;
  return [...state.messages, { id: `${localId}-a`, role: 'assistant', text: run.text, live: true }];
}
