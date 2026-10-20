import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { isAuriaApiError, networkError } from './api/errors';
import { auriaHttp, streamChat } from './api/http';
import { auriaRoutes } from './api/routes';
import { newClientOperationId, type AuriaMode, type StreamChatRequest } from './api/streamChat';
import { conversationReducer, initialConversation, visibleMessages } from './conversationReducer';
import { DEFAULT_MODE, loadMode, saveMode } from './prefs';

let turnSeq = 0;
const nextTurnId = () => `t${(turnSeq += 1)}`;

/** Chats get the first 40 characters as their title, like the web does. */
const TITLE_LENGTH = 40;

export type SendOptions = Pick<StreamChatRequest, 'attachmentUuids' | 'create'>;

/**
 * The open Auria conversation, talking to the real backend: send a message,
 * watch the answer stream in, stop it, start a new chat. One answer at a time.
 */
export function useAuriaConversation() {
  const [state, dispatch] = useReducer(conversationReducer, initialConversation);
  const stateRef = useRef(state);
  stateRef.current = state;
  const abortRef = useRef<AbortController | null>(null);

  const [mode, setModeState] = useState<AuriaMode>(DEFAULT_MODE);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    let active = true;
    void loadMode().then((saved) => {
      if (active) setModeState(saved);
    });
    return () => {
      active = false;
    };
  }, []);

  // Leaving the screen ends the stream; the server keeps what it already saved.
  useEffect(() => () => abortRef.current?.abort(), []);

  const setMode = useCallback((next: AuriaMode) => {
    setModeState(next);
    void saveMode(next);
  }, []);

  /** Returns false when the message was not sent (empty, or an answer is still running). */
  const send = useCallback((text: string, options: SendOptions = {}): boolean => {
    const message = text.trim();
    const current = stateRef.current;
    if (!message || current.live) return false;

    const localId = nextTurnId();
    const isNewChat = !current.chatId;
    dispatch({ type: 'send', localId, text: message, now: Date.now() });

    const controller = new AbortController();
    abortRef.current = controller;
    streamChat(
      {
        message,
        chatId: current.chatId,
        clientOperationId: newClientOperationId(),
        mode: modeRef.current,
        ...options,
      },
      {
        onEvent: (event) => dispatch({ type: 'run', localId, action: { type: 'event', event } }),
        signal: controller.signal,
      },
    )
      .then((result) => {
        if (isNewChat && result.chatId) {
          // Best effort: without it the sidebar shows the server's generic title.
          void auriaHttp.patch(auriaRoutes.chat(result.chatId), { title: message.slice(0, TITLE_LENGTH) }).catch(() => {});
        }
      })
      .catch((err: unknown) => {
        if (isAuriaApiError(err) && err.code === 'aborted') {
          dispatch({ type: 'run', localId, action: { type: 'stop' } });
        } else {
          dispatch({ type: 'run', localId, action: { type: 'fail', error: isAuriaApiError(err) ? err : networkError(err) } });
        }
      })
      .finally(() => {
        if (abortRef.current === controller) abortRef.current = null;
        dispatch({ type: 'settle', localId });
      });
    return true;
  }, []);

  /** Stop the answer being written. What already arrived stays, marked as stopped. */
  const stop = useCallback(() => {
    const live = stateRef.current.live;
    if (!live) return;
    dispatch({ type: 'run', localId: live.localId, action: { type: 'stop' } });
    abortRef.current?.abort();
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'new-chat' });
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'clear-error' }), []);

  const messages = useMemo(() => visibleMessages(state), [state]);

  return {
    chatId: state.chatId,
    messages,
    /** The answer being written, with its status, tools and reasoning. */
    run: state.live?.run ?? null,
    isBusy: state.live !== null,
    error: state.error,
    mode,
    setMode,
    send,
    stop,
    newChat,
    clearError,
  };
}

export type AuriaConversation = ReturnType<typeof useAuriaConversation>;
