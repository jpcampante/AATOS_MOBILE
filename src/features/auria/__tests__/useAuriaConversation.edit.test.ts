import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuriaApiError } from '../api/errors';
import { listMessages } from '../api/chats';
import { AURIA_API_URL } from '../api/config';
import { editMessage } from '../api/messages';
import type { AuriaAttachment, AuriaChatMessage } from '../types';
import { useAuriaConversation } from '../useAuriaConversation';

jest.mock('../api/http', () => ({ auriaHttp: { patch: jest.fn() }, streamChat: jest.fn() }));
jest.mock('../api/messages', () => ({ regenerateMessage: jest.fn(), editMessage: jest.fn() }));
jest.mock('../api/chats', () => ({ listMessages: jest.fn(), MESSAGE_PAGE_SIZE: 20 }));
jest.mock('../prefs', () => ({ DEFAULT_MODE: 'fast', loadMode: jest.fn(async () => 'fast'), saveMode: jest.fn() }));

const edit = editMessage as jest.Mock;
const list = listMessages as jest.Mock;

const photo: AuriaAttachment = {
  id: 'p-1',
  name: 'board.png',
  url: `${AURIA_API_URL}/auria/chat/attachments/p-1`,
  isImage: true,
  private: true,
};
const BEFORE: AuriaChatMessage[] = [
  { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What is on this board?', files: [photo] },
  { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three columns.' },
];
const AFTER: AuriaChatMessage[] = [
  { id: 'u-2', serverId: 'u-2', role: 'user', text: 'Which column is late?', files: [photo] },
  { id: 'a-2', serverId: 'a-2', role: 'assistant', text: 'Review is late.' },
];
const page = (items: AuriaChatMessage[]) => ({ items, count: items.length, hasMore: false });

async function openSavedChat() {
  list.mockResolvedValueOnce(page(BEFORE));
  const hook = renderHook(() => useAuriaConversation());
  await act(() => hook.result.current.openChat('c-1', 'auria_system'));
  return hook;
}

beforeEach(() => jest.clearAllMocks());

describe('useAuriaConversation — edit', () => {
  it('sends the new text with the attachment markdown and shows the server copy afterwards', async () => {
    const { result } = await openSavedChat();
    edit.mockResolvedValue({ question: AFTER[0], answer: AFTER[1] });
    list.mockResolvedValueOnce(page(AFTER));

    act(() => {
      expect(result.current.edit('u-1', '  Which column is late?  ')).toBe(true);
    });
    // While the server writes: the edited question, then the panel.
    expect(result.current.messages.map((m) => [m.role, m.text])).toEqual([
      ['user', 'Which column is late?'],
      ['assistant', ''],
    ]);
    expect(result.current.messages[0].files).toEqual([photo]);
    expect(edit).toHaveBeenCalledWith(
      'u-1',
      '![board.png](/auria/chat/attachments/p-1)\n\nWhich column is late?',
      expect.objectContaining({ mode: 'fast', clientOperationId: expect.any(String) }),
    );

    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(result.current.messages.map((m) => m.text)).toEqual(['Which column is late?', 'Review is late.']);
  });

  it('puts the original question back when the server refuses', async () => {
    const { result } = await openSavedChat();
    const refusal = new AuriaApiError({ status: 402, code: 'insufficient_units' });
    edit.mockRejectedValue(refusal);

    act(() => {
      result.current.edit('u-1', 'Which column is late?');
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(result.current.messages.map((m) => m.text)).toEqual(['What is on this board?', 'Three columns.']);
    expect(result.current.error).toBe(refusal);
  });

  it('does not edit an answer, to an empty text, or while busy', async () => {
    const { result } = await openSavedChat();
    edit.mockReturnValue(new Promise(() => {}));
    expect(result.current.edit('a-1', 'x')).toBe(false);
    expect(result.current.edit('u-1', '   ')).toBe(false);
    act(() => {
      result.current.edit('u-1', 'Again?');
    });
    expect(result.current.edit('u-1', 'Once more?')).toBe(false);
    expect(edit).toHaveBeenCalledTimes(1);
  });
});
