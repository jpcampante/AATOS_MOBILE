import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuriaApiError } from '../api/errors';
import { listMessages } from '../api/chats';
import { regenerateMessage } from '../api/messages';
import type { AuriaChatMessage } from '../types';
import { useAuriaConversation } from '../useAuriaConversation';

jest.mock('../api/http', () => ({ auriaHttp: { patch: jest.fn() }, streamChat: jest.fn() }));
jest.mock('../api/messages', () => ({ regenerateMessage: jest.fn() }));
jest.mock('../api/chats', () => ({ listMessages: jest.fn(), MESSAGE_PAGE_SIZE: 20 }));
jest.mock('../prefs', () => ({ DEFAULT_MODE: 'fast', loadMode: jest.fn(async () => 'deep'), saveMode: jest.fn() }));

const regenerate = regenerateMessage as jest.Mock;
const list = listMessages as jest.Mock;

const BEFORE: AuriaChatMessage[] = [
  { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' },
  { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.' },
];
const AFTER: AuriaChatMessage[] = [
  BEFORE[0],
  { id: 'a-2', serverId: 'a-2', role: 'assistant', text: 'Three tasks, one urgent.', version: { index: 2, count: 2, ids: ['a-1', 'a-2'] } },
];
const page = (items: AuriaChatMessage[]) => ({ items, count: items.length, hasMore: false });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function openSavedChat() {
  list.mockResolvedValueOnce(page(BEFORE));
  const hook = renderHook(() => useAuriaConversation());
  await act(() => hook.result.current.openChat('c-1', 'auria_system'));
  await waitFor(() => expect(hook.result.current.mode).toBe('deep'));
  return hook;
}

beforeEach(() => jest.clearAllMocks());

describe('useAuriaConversation — retry', () => {
  it('writes a new version on the server and shows it after re-reading the chat', async () => {
    const { result } = await openSavedChat();
    const pending = deferred<AuriaChatMessage | null>();
    regenerate.mockReturnValue(pending.promise);
    list.mockResolvedValueOnce(page(AFTER));

    act(() => {
      expect(result.current.retry('a-1')).toBe(true);
    });
    expect(regenerate).toHaveBeenCalledWith('a-1', expect.objectContaining({ mode: 'deep', clientOperationId: expect.any(String) }));
    expect(result.current.isBusy).toBe(true);
    expect(result.current.messages.map((m) => m.text)).toEqual(['What are my tasks?', '']); // the panel writes

    await act(async () => pending.resolve(AFTER[1]));
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(result.current.messages.map((m) => m.text)).toEqual(['What are my tasks?', 'Three tasks, one urgent.']);
    expect(result.current.error).toBeNull();
  });

  it('keeps the old answer and says why when the server refuses', async () => {
    const { result } = await openSavedChat();
    const refusal = new AuriaApiError({ status: 402, code: 'insufficient_units', reasonCode: 'no_active_plan' });
    regenerate.mockRejectedValue(refusal);

    act(() => {
      result.current.retry('a-1');
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(result.current.messages.map((m) => m.text)).toEqual(['What are my tasks?', 'Three tasks.']);
    expect(result.current.error).toBe(refusal);
    expect(list).toHaveBeenCalledTimes(1); // no re-read
  });

  it('re-reads quietly when the request was already being handled', async () => {
    const { result } = await openSavedChat();
    regenerate.mockRejectedValue(new AuriaApiError({ status: 409, code: 'operation_in_progress' }));
    list.mockResolvedValueOnce(page(AFTER));

    act(() => {
      result.current.retry('a-1');
    });
    await waitFor(() => expect(result.current.messages[1]?.text).toBe('Three tasks, one urgent.'));
    expect(result.current.error).toBeNull();
  });

  it('can be stopped; the chat is re-read since the server may still save it', async () => {
    const { result } = await openSavedChat();
    regenerate.mockImplementation(
      (_id: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_, reject) => signal.addEventListener('abort', () => reject(new AuriaApiError({ code: 'aborted' })))),
    );
    list.mockResolvedValueOnce(page(BEFORE));

    act(() => {
      result.current.retry('a-1');
    });
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(result.current.messages.map((m) => m.text)).toEqual(['What are my tasks?', 'Three tasks.']);
    expect(result.current.error).toBeNull();
  });

  it('does not start for a question, an unknown id, or while busy', async () => {
    const { result } = await openSavedChat();
    regenerate.mockReturnValue(new Promise(() => {}));
    expect(result.current.retry('u-1')).toBe(false);
    expect(result.current.retry('nope')).toBe(false);
    act(() => {
      result.current.retry('a-1');
    });
    expect(result.current.retry('a-1')).toBe(false);
    expect(regenerate).toHaveBeenCalledTimes(1);
  });
});
