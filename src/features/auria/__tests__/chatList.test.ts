import {
  canContinueChat,
  latestPages,
  mergePage,
  pinInList,
  providerLabel,
  removeFromList,
  renameInList,
  sortChats,
  touchChat,
} from '../chatList';
import type { AuriaConversation } from '../types';

const chat = (id: string, over: Partial<AuriaConversation> = {}): AuriaConversation => ({
  id,
  title: id.toUpperCase(),
  provider: 'auria_system',
  visibility: 'private',
  ownerPublicUid: 'me',
  isPinned: false,
  lastActivity: '2026-10-01T00:00:00Z',
  messageCount: 2,
  createdAt: '2026-09-01T00:00:00Z',
  ...over,
});

describe('chat list rules', () => {
  it('sorts pinned first, then by last activity', () => {
    const sorted = sortChats([
      chat('old', { lastActivity: '2026-01-01T00:00:00Z' }),
      chat('pinned', { isPinned: true, lastActivity: '2025-01-01T00:00:00Z' }),
      chat('new', { lastActivity: '2026-10-10T00:00:00Z' }),
    ]);
    expect(sorted.map((c) => c.id)).toEqual(['pinned', 'new', 'old']);
  });

  it('merges pages without duplicates, or replaces on refresh', () => {
    const page1 = [chat('a'), chat('b')];
    expect(mergePage(page1, [chat('b'), chat('c')], false).map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(mergePage(page1, [chat('z')], true).map((c) => c.id)).toEqual(['z']);
  });

  it('inserts a new chat on top with its first-message title', () => {
    const list = touchChat([chat('a', { isPinned: true }), chat('b')], 'c-new', '2026-10-20T10:00:00Z', 'Plan my week');
    expect(list.map((c) => c.id)).toEqual(['a', 'c-new', 'b']);
    expect(list[1]).toMatchObject({ title: 'Plan my week', provider: 'auria_system', isPinned: false });
  });

  it('bumps an existing chat without changing its title', () => {
    const list = touchChat([chat('a'), chat('b')], 'b', '2026-10-20T10:00:00Z', 'ignored');
    expect(list[0]).toMatchObject({ id: 'b', title: 'B', lastActivity: '2026-10-20T10:00:00Z' });
  });

  it('renames, pins and removes', () => {
    const list = [chat('a'), chat('b', { lastActivity: '2026-10-02T00:00:00Z' })];
    expect(renameInList(list, 'a', 'Budget')[0].title).toBe('Budget');
    expect(pinInList(list, 'a', true).map((c) => c.id)).toEqual(['a', 'b']);
    expect(removeFromList(list, 'a').map((c) => c.id)).toEqual(['b']);
  });

  it('only continues Auria chats', () => {
    expect(canContinueChat('auria_system')).toBe(true);
    expect(canContinueChat(null)).toBe(true);
    expect(canContinueChat('chatgpt')).toBe(false);
    expect(canContinueChat('aatos')).toBe(false);
    expect(providerLabel('chatgpt')).toBe('ChatGPT');
    expect(providerLabel('auria_system')).toBeNull();
  });

  it('picks the last two message pages', () => {
    expect(latestPages(0, 20)).toEqual([1]);
    expect(latestPages(15, 20)).toEqual([1]);
    expect(latestPages(20, 20)).toEqual([1]);
    expect(latestPages(21, 20)).toEqual([1, 2]);
    expect(latestPages(95, 20)).toEqual([4, 5]);
  });
});
