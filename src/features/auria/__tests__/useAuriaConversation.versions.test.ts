import { act, renderHook, waitFor } from '@testing-library/react-native';
import { listMessages } from '../api/chats';
import { activateVersion } from '../api/messages';
import type { AuriaChatMessage } from '../types';
import { useAuriaConversation } from '../useAuriaConversation';

jest.mock('../api/http', () => ({ auriaHttp: { patch: jest.fn() }, streamChat: jest.fn() }));
jest.mock('../api/messages', () => ({ regenerateMessage: jest.fn(), editMessage: jest.fn(), activateVersion: jest.fn() }));
jest.mock('../api/chats', () => ({ listMessages: jest.fn(), MESSAGE_PAGE_SIZE: 20 }));
jest.mock('../prefs', () => ({ DEFAULT_MODE: 'fast', loadMode: jest.fn(async () => 'fast'), saveMode: jest.fn() }));

const activate = activateVersion as jest.Mock;
const list = listMessages as jest.Mock;

const question: AuriaChatMessage = { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' };
const SECOND: AuriaChatMessage[] = [
  question,
  { id: 'a-2', serverId: 'a-2', role: 'assistant', text: 'Three, one urgent.', version: { index: 2, count: 2, ids: ['a-1', 'a-2'] } },
];
const FIRST: AuriaChatMessage[] = [
  question,
  { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.', version: { index: 1, count: 2, ids: ['a-1', 'a-2'] } },
];
const page = (items: AuriaChatMessage[]) => ({ items, count: items.length, hasMore: false });

async function openSavedChat() {
  list.mockResolvedValueOnce(page(SECOND));
  const hook = renderHook(() => useAuriaConversation());
  await act(() => hook.result.current.openChat('c-1', 'auria_system'));
  return hook;
}

beforeEach(() => jest.clearAllMocks());

describe('useAuriaConversation — versions (E21)', () => {
  it('activates the previous version and shows that branch', async () => {
    const { result } = await openSavedChat();
    activate.mockResolvedValue(undefined);
    list.mockResolvedValueOnce(page(FIRST));

    let switching!: Promise<boolean>;
    act(() => {
      switching = result.current.switchVersion('a-2', -1);
    });
    expect(result.current.switchingVersionOf).toBe('a-2');
    await act(async () => {
      await expect(switching).resolves.toBe(true);
    });

    expect(activate).toHaveBeenCalledWith('a-1');
    expect(result.current.messages[1].text).toBe('Three tasks.');
    expect(result.current.switchingVersionOf).toBeNull();
  });

  it('keeps the screen as it was when the server refuses', async () => {
    const { result } = await openSavedChat();
    activate.mockRejectedValue(new Error('offline'));

    let ok = true;
    await act(async () => {
      ok = await result.current.switchVersion('a-2', -1);
    });
    expect(ok).toBe(false);
    expect(result.current.messages[1].text).toBe('Three, one urgent.');
    expect(result.current.switchingVersionOf).toBeNull();
  });

  it('does not go past the last version or switch a message without versions', async () => {
    const { result } = await openSavedChat();
    await act(async () => {
      await expect(result.current.switchVersion('a-2', 1)).resolves.toBe(false);
      await expect(result.current.switchVersion('u-1', -1)).resolves.toBe(false);
    });
    expect(activate).not.toHaveBeenCalled();
  });
});
