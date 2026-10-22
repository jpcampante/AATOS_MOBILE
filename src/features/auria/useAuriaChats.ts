import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteChat, listChats, renameChat, setChatPinned } from './api/chats';
import { isAuriaApiError, networkError, type AuriaApiError } from './api/errors';
import { mergePage, pinInList, removeFromList, renameInList, touchChat } from './chatList';
import type { AuriaConversation } from './types';

const asApiError = (err: unknown): AuriaApiError => (isAuriaApiError(err) ? err : networkError(err));

/**
 * The sidebar's conversations, from the server: paginated (30 at a time),
 * pinned first. Rename, pin and delete are optimistic and roll back on failure.
 */
export function useAuriaChats() {
  const [chats, setChats] = useState<AuriaConversation[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<AuriaApiError | null>(null);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  const load = useCallback(async (page: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await listChats(page);
      pageRef.current = page;
      setChats((current) => mergePage(current, result.items, page === 1));
      setHasMore(result.hasMore);
      setError(null);
      setLoaded(true);
    } catch (err) {
      setError(asApiError(err));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const refresh = useCallback(() => load(1), [load]);
  const loadMore = useCallback(() => {
    if (hasMore) void load(pageRef.current + 1);
  }, [hasMore, load]);

  /** Runs an optimistic change; on failure puts the list back and reports the error. */
  const optimistic = useCallback(
    async (next: (list: AuriaConversation[]) => AuriaConversation[], request: () => Promise<unknown>) => {
      const before = chatsRef.current;
      setChats(next(before));
      try {
        await request();
        return true;
      } catch (err) {
        setChats(before);
        setError(asApiError(err));
        return false;
      }
    },
    [],
  );

  const rename = useCallback(
    (chatId: string, title: string) => {
      const clean = title.trim();
      if (!clean) return Promise.resolve(false);
      return optimistic((list) => renameInList(list, chatId, clean), () => renameChat(chatId, clean));
    },
    [optimistic],
  );

  const setPinned = useCallback(
    (chatId: string, pinned: boolean) =>
      optimistic((list) => pinInList(list, chatId, pinned), () => setChatPinned(chatId, pinned)),
    [optimistic],
  );

  const remove = useCallback(
    (chatId: string) => optimistic((list) => removeFromList(list, chatId), () => deleteChat(chatId)),
    [optimistic],
  );

  /** A turn finished in this chat: add it (new chat) or move it up. Local only. */
  const touch = useCallback((chatId: string, titleIfNew: string) => {
    setChats((list) => touchChat(list, chatId, new Date().toISOString(), titleIfNew));
  }, []);

  return {
    chats,
    hasMore,
    loading,
    /** The first page arrived at least once (so an empty list really is empty). */
    loaded,
    error,
    clearError: useCallback(() => setError(null), []),
    refresh,
    loadMore,
    rename,
    setPinned,
    remove,
    touch,
  };
}

export type AuriaChats = ReturnType<typeof useAuriaChats>;
