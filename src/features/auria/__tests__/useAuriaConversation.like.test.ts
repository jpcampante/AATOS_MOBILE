import { act, renderHook } from '@testing-library/react-native';
import { listMessages } from '../api/chats';
import { setLiked } from '../api/messages';
import type { AuriaChatMessage } from '../types';
import { useAuriaConversation } from '../useAuriaConversation';

jest.mock('../api/http', () => ({ auriaHttp: { patch: jest.fn() }, streamChat: jest.fn() }));
jest.mock('../api/messages', () => ({ regenerateMessage: jest.fn(), editMessage: jest.fn(), activateVersion: jest.fn(), setLiked: jest.fn() }));
jest.mock('../api/chats', () => ({ listMessages: jest.fn(), MESSAGE_PAGE_SIZE: 20 }));
jest.mock('../prefs', () => ({ DEFAULT_MODE: 'fast', loadMode: jest.fn(async () => 'fast'), saveMode: jest.fn() }));

const like = setLiked as jest.Mock;
const list = listMessages as jest.Mock;

const MESSAGES: AuriaChatMessage[] = [
  { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' },
  { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.' },
];

async function openSavedChat() {
  list.mockResolvedValueOnce({ items: MESSAGES, count: 2, hasMore: false });
  const hook = renderHook(() => useAuriaConversation());
  await act(() => hook.result.current.openChat('c-1', 'auria_system'));
  return hook;
}

beforeEach(() => jest.clearAllMocks());

describe('useAuriaConversation — like (E22)', () => {
  it('likes at once and keeps it when the server saves it', async () => {
    const { result } = await openSavedChat();
    let resolveLike!: (v: boolean) => void;
    like.mockReturnValue(new Promise((r) => (resolveLike = r)));

    let saving!: Promise<boolean>;
    act(() => {
      saving = result.current.toggleLike('a-1');
    });
    expect(result.current.messages[1].liked).toBe(true); // before the server answers
    expect(like).toHaveBeenCalledWith('a-1', true);

    await act(async () => {
      resolveLike(true);
      await expect(saving).resolves.toBe(true);
    });
    expect(result.current.messages[1].liked).toBe(true);
  });

  it('puts the thumb back when the server refuses', async () => {
    const { result } = await openSavedChat();
    like.mockRejectedValue(new Error('offline'));
    await act(async () => {
      await expect(result.current.toggleLike('a-1')).resolves.toBe(false);
    });
    expect(result.current.messages[1].liked).toBe(false);
  });

  it('does not like a question', async () => {
    const { result } = await openSavedChat();
    await act(async () => {
      await expect(result.current.toggleLike('u-1')).resolves.toBe(false);
    });
    expect(like).not.toHaveBeenCalled();
  });
});
