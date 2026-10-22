import type { AuriaConversation } from './types';

/**
 * Pure rules for the sidebar list: the server's order (pinned first, then the
 * most recent activity) kept while the person renames, pins, deletes or chats.
 */

const time = (c: AuriaConversation) => Date.parse(c.lastActivity ?? c.createdAt ?? '') || 0;

export function sortChats(chats: AuriaConversation[]): AuriaConversation[] {
  return [...chats].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || time(b) - time(a));
}

/** Adds a page from the server, dropping duplicates (a chat can move between pages). */
export function mergePage(current: AuriaConversation[], page: AuriaConversation[], replace: boolean): AuriaConversation[] {
  if (replace) return page;
  const seen = new Set(current.map((c) => c.id));
  return [...current, ...page.filter((c) => !seen.has(c.id))];
}

/** A chat that just had a turn: insert it (new chat) or bump it to the top of its group. */
export function touchChat(
  chats: AuriaConversation[],
  chatId: string,
  nowIso: string,
  titleIfNew: string,
): AuriaConversation[] {
  const existing = chats.find((c) => c.id === chatId);
  const touched: AuriaConversation = existing
    ? { ...existing, lastActivity: nowIso }
    : {
        id: chatId,
        title: titleIfNew.trim() || 'New chat',
        provider: 'auria_system',
        visibility: 'private',
        ownerPublicUid: null,
        isPinned: false,
        lastActivity: nowIso,
        messageCount: null,
        createdAt: nowIso,
      };
  return sortChats([touched, ...chats.filter((c) => c.id !== chatId)]);
}

export const renameInList = (chats: AuriaConversation[], chatId: string, title: string) =>
  chats.map((c) => (c.id === chatId ? { ...c, title } : c));

export const pinInList = (chats: AuriaConversation[], chatId: string, pinned: boolean) =>
  sortChats(chats.map((c) => (c.id === chatId ? { ...c, isPinned: pinned } : c)));

export const removeFromList = (chats: AuriaConversation[], chatId: string) => chats.filter((c) => c.id !== chatId);

/** Only Auria chats can be continued: the Auria engine refuses chats from other origins. */
export const canContinueChat = (provider: string | null | undefined) => !provider || provider === 'auria_system';

/** Badge for chats that came from somewhere else. */
export function providerLabel(provider: string | null | undefined): string | null {
  switch (provider) {
    case 'chatgpt':
    case 'openai':
      return 'ChatGPT';
    case 'anthropic':
      return 'Claude';
    case 'google':
      return 'Gemini';
    case 'aatos':
      return 'AATOS';
    case 'other':
      return 'Imported';
    default:
      return null;
  }
}

/**
 * Which message pages to load to show the latest messages: the server pages
 * oldest-first, so the end of a chat is on the last pages. Loads the last two
 * (like the web), so a short last page still fills the screen.
 */
export function latestPages(count: number, pageSize: number): number[] {
  const last = Math.max(1, Math.ceil(count / pageSize));
  return last > 1 ? [last - 1, last] : [1];
}
