import { useCallback, useEffect, useRef, useState } from 'react';
import { getWebSearchSettings, saveWebSearchChoice, type WebMode } from './api/webSearch';
import { initialWebSearchState, turnWebMode, WEB_SEARCH_TEXT, type WebSearchState } from './webSearchChoice';

/** What a turn goes out with, and what to tell the person about it (if anything). */
export type WebTurnChoice = { mode: WebMode; notice: string | null };

/**
 * The person's web search choice for the open chat (E48, E49), like the web's
 * `useSearchPreference`. A new chat keeps the choice locally until the server
 * creates it (`bind`). Before each send, `preflight` re-reads it: a choice that
 * changed meanwhile, or can't be checked, makes that turn Web Off.
 */
export function useWebSearchPreference(chatId: string | null) {
  const [state, setState] = useState<WebSearchState>(initialWebSearchState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const chatRef = useRef(chatId);
  chatRef.current = chatId;
  /** A new chat's choice being saved: reading the chat waits for it. */
  const bindingRef = useRef<Promise<unknown> | null>(null);

  const load = useCallback(async () => {
    const forChat = chatRef.current;
    setState((s) => ({ ...s, status: 'loading', notice: null }));
    await bindingRef.current?.catch(() => {});
    try {
      const settings = await getWebSearchSettings(forChat);
      if (chatRef.current !== forChat) return; // another chat opened meanwhile
      setState((s) => ({
        status: 'ready',
        available: settings.available,
        companyEnabled: settings.companyEnabled,
        // A new chat keeps what the person chose locally; a saved chat reads its own.
        mode: forChat ? (settings.chat?.mode ?? null) : s.unsaved ? s.mode : null,
        revision: settings.chat?.revision ?? 0,
        unsaved: forChat ? false : s.unsaved,
        notice: null,
      }));
    } catch {
      if (chatRef.current === forChat) setState((s) => ({ ...s, status: 'error', notice: WEB_SEARCH_TEXT.notLoaded }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [chatId, load]);

  /** Turn search on (`auto`) or off. A saved chat saves it now; a new chat keeps it until `bind`. */
  const choose = useCallback(
    async (mode: WebMode) => {
      const forChat = chatRef.current;
      if (!forChat) {
        setState((s) => ({ ...s, mode, unsaved: true, notice: null }));
        return;
      }
      const { revision } = stateRef.current;
      setState((s) => ({ ...s, status: 'saving', notice: null }));
      try {
        const saved = await saveWebSearchChoice(forChat, mode, revision);
        if (chatRef.current === forChat) setState((s) => ({ ...s, status: 'ready', mode: saved.mode, revision: saved.revision }));
      } catch {
        // Conflict, timeout or refusal: never resend; show what the server has now.
        if (chatRef.current !== forChat) return;
        try {
          const settings = await getWebSearchSettings(forChat);
          if (chatRef.current !== forChat) return;
          setState((s) => ({
            ...s,
            status: 'ready',
            mode: settings.chat?.mode ?? null,
            revision: settings.chat?.revision ?? 0,
            available: settings.available,
            companyEnabled: settings.companyEnabled,
            notice: WEB_SEARCH_TEXT.refreshed,
          }));
        } catch {
          setState((s) => ({ ...s, status: 'error', notice: WEB_SEARCH_TEXT.notSaved }));
        }
      }
    },
    [],
  );

  /** Right before a send, retry or edit: the `web_mode` for that turn (Off when in doubt). */
  const preflight = useCallback(async (): Promise<WebTurnChoice> => {
    const current = stateRef.current;
    const forChat = chatRef.current;
    if (current.status !== 'ready') return { mode: 'off', notice: null };
    if (!forChat) return { mode: turnWebMode(current), notice: null };
    try {
      const settings = await getWebSearchSettings(forChat);
      const mode = settings.chat?.mode ?? null;
      const revision = settings.chat?.revision ?? 0;
      const next: WebSearchState = { ...current, mode, revision, available: settings.available, companyEnabled: settings.companyEnabled };
      if (chatRef.current === forChat) setState(next);
      if (mode !== current.mode || revision !== current.revision) return { mode: 'off', notice: WEB_SEARCH_TEXT.changed };
      return { mode: turnWebMode(next), notice: null };
    } catch {
      return { mode: 'off', notice: WEB_SEARCH_TEXT.uncheckable };
    }
  }, []);

  /**
   * The server created the chat (the stream's `chat` event): save the choice the
   * person made for it, if they made one. Resolves with a notice when it failed.
   */
  const bind = useCallback(async (newChatId: string): Promise<string | null> => {
    const { unsaved, mode } = stateRef.current;
    if (!unsaved || !mode) return null;
    const saving = saveWebSearchChoice(newChatId, mode, 0);
    bindingRef.current = saving;
    try {
      await saving;
      return null;
    } catch {
      return WEB_SEARCH_TEXT.bindFailed;
    } finally {
      if (bindingRef.current === saving) bindingRef.current = null;
    }
  }, []);

  return { state, choose, preflight, bind, reload: load };
}

export type WebSearchPreference = ReturnType<typeof useWebSearchPreference>;
