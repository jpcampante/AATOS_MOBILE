import { act, renderHook, waitFor } from '@testing-library/react-native';
import { streamChat } from '../api/http';
import type { StreamChatOptions, StreamChatRequest } from '../api/streamChat';
import { useAuriaConversation } from '../useAuriaConversation';

jest.mock('../api/http', () => ({ auriaHttp: { patch: jest.fn(() => Promise.resolve()) }, streamChat: jest.fn() }));
jest.mock('../api/messages', () => ({ regenerateMessage: jest.fn(), editMessage: jest.fn(), activateVersion: jest.fn(), setLiked: jest.fn() }));
jest.mock('../api/chats', () => ({ listMessages: jest.fn(), MESSAGE_PAGE_SIZE: 20 }));
jest.mock('../prefs', () => ({ DEFAULT_MODE: 'fast', loadMode: jest.fn(async () => 'fast'), saveMode: jest.fn() }));

const stream = streamChat as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useAuriaConversation — send with web search (A033)', () => {
  it('sends the web search choice and tells when the server created the chat', async () => {
    stream.mockImplementation(async (_req: StreamChatRequest, { onEvent }: StreamChatOptions) => {
      onEvent({ type: 'chat', chatId: 'c-new', userMessageUuid: 'u-1' });
      onEvent({ type: 'done', response: 'Hi', reasoning: null, canvasDocuments: null, web: null, model: null });
      return { chatId: 'c-new', userMessageUuid: 'u-1', assistantMessageUuid: 'a-1' };
    });
    const onChatCreated = jest.fn();
    const { result } = renderHook(() => useAuriaConversation());

    act(() => {
      result.current.send('Latest news on AI?', { webMode: 'auto', onChatCreated });
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));

    expect(stream.mock.calls[0][0]).toMatchObject({ message: 'Latest news on AI?', chatId: null, webMode: 'auto' });
    expect(onChatCreated).toHaveBeenCalledTimes(1);
    expect(onChatCreated).toHaveBeenCalledWith('c-new');
  });

  it('goes Off without a choice and does not report a chat that already existed', async () => {
    stream.mockImplementation(async (_req: StreamChatRequest, { onEvent }: StreamChatOptions) => {
      onEvent({ type: 'chat', chatId: 'c-new', userMessageUuid: 'u-1' });
      onEvent({ type: 'done', response: 'Hi', reasoning: null, canvasDocuments: null, web: null, model: null });
      return { chatId: 'c-new', userMessageUuid: 'u-1', assistantMessageUuid: 'a-1' };
    });
    const onChatCreated = jest.fn();
    const { result } = renderHook(() => useAuriaConversation());

    act(() => {
      result.current.send('First', {});
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(stream.mock.calls[0][0].webMode).toBe('off');

    act(() => {
      result.current.send('Second', { onChatCreated });
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(stream.mock.calls[1][0].chatId).toBe('c-new');
    expect(onChatCreated).not.toHaveBeenCalled();
  });
});
