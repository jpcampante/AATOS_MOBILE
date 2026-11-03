import { useCallback, useEffect, useRef, useState } from 'react';
import { listChatDocuments } from './api/documents';
import type { AuriaDocument } from './documents';

export type ChatDocumentsState = {
  documents: AuriaDocument[];
  loading: boolean;
  /** The list could not be read; the chat still works. */
  failed: boolean;
};

/**
 * The documents of the open chat (E29). Read when the chat opens and again
 * when the Auria writes one, so the list and the answer's cards agree.
 */
export function useChatDocuments(chatId: string | null) {
  const [state, setState] = useState<ChatDocumentsState>({ documents: [], loading: false, failed: false });
  const chatRef = useRef(chatId);
  chatRef.current = chatId;

  const load = useCallback(async () => {
    const forChat = chatRef.current;
    if (!forChat) {
      setState({ documents: [], loading: false, failed: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, failed: false }));
    try {
      const documents = await listChatDocuments(forChat);
      if (chatRef.current === forChat) setState({ documents, loading: false, failed: false });
    } catch {
      if (chatRef.current === forChat) setState({ documents: [], loading: false, failed: true });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [chatId, load]);

  return { ...state, reload: load };
}
