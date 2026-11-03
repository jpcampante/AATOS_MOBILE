import { act, renderHook, waitFor } from '@testing-library/react-native';
import { abortedError, AuriaApiError } from '../api/errors';
import { generateImage } from '../api/images';
import { listMessages } from '../api/chats';
import { useAuriaConversation } from '../useAuriaConversation';

jest.mock('../api/http', () => ({ auriaHttp: { patch: jest.fn(() => Promise.resolve()) }, streamChat: jest.fn() }));
jest.mock('../api/messages', () => ({ regenerateMessage: jest.fn(), editMessage: jest.fn(), activateVersion: jest.fn(), setLiked: jest.fn() }));
jest.mock('../api/chats', () => ({ listMessages: jest.fn(), MESSAGE_PAGE_SIZE: 20 }));
jest.mock('../api/images', () => ({ generateImage: jest.fn() }));
jest.mock('../prefs', () => ({ DEFAULT_MODE: 'fast', loadMode: jest.fn(async () => 'fast'), saveMode: jest.fn() }));

const create = generateImage as jest.Mock;
const messages = listMessages as jest.Mock;

const savedPair = {
  count: 2,
  items: [
    { id: 'm1', role: 'user' as const, text: '[Generate image] a cat' },
    { id: 'm2', role: 'assistant' as const, text: '', imageUrl: 'https://host/media/cat.png' },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  messages.mockResolvedValue(savedPair);
});

describe('useAuriaConversation — generate an image (A037)', () => {
  it('asks for the size of the chosen ratio and re-reads the chat the server saved', async () => {
    create.mockResolvedValue({ imageUrl: 'https://host/media/cat.png', revisedPrompt: null, chatId: 'c-img' });
    const { result } = renderHook(() => useAuriaConversation());

    await act(async () => {
      await result.current.generateImage('a cat', '16:9');
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'a cat', size: '1792x1024', chatId: null }));
    await waitFor(() => expect(result.current.chatId).toBe('c-img'));
    expect(result.current.messages.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(result.current.generatingImage).toBe(false);
  });

  it('keeps the composer blocked while the image is being made', async () => {
    let finish: (value: unknown) => void = () => {};
    create.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useAuriaConversation());

    act(() => {
      void result.current.generateImage('a cat', '1:1');
    });
    await waitFor(() => expect(result.current.isBusy).toBe(true));
    expect(result.current.generatingImage).toBe(true);

    // A second request while the first runs is refused.
    await act(async () => {
      await expect(result.current.generateImage('another', '1:1')).resolves.toBe(false);
    });
    expect(create).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish({ imageUrl: 'https://host/media/cat.png', revisedPrompt: null, chatId: 'c-img' });
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });

  it('shows the error when the server refuses', async () => {
    create.mockRejectedValue(new AuriaApiError({ code: 'no_active_plan', status: 402 }));
    const { result } = renderHook(() => useAuriaConversation());

    await act(async () => {
      await expect(result.current.generateImage('a cat', '1:1')).resolves.toBe(false);
    });
    expect(result.current.error).toMatchObject({ code: 'no_active_plan' });
  });

  it('says nothing when the person stopped waiting', async () => {
    create.mockRejectedValue(abortedError());
    const { result } = renderHook(() => useAuriaConversation());

    await act(async () => {
      await result.current.generateImage('a cat', '1:1');
    });
    expect(result.current.error).toBeNull();
  });

  it('does not ask for an empty prompt', async () => {
    const { result } = renderHook(() => useAuriaConversation());
    await act(async () => {
      await expect(result.current.generateImage('   ', '1:1')).resolves.toBe(false);
    });
    expect(create).not.toHaveBeenCalled();
  });
});
