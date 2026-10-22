import { auriaHttp } from '../http';
import { activateVersion, editMessage, regenerateMessage, setLiked } from '../messages';
import { AURIA_REPLAY_TIMEOUT_MS } from '../config';

jest.mock('../http', () => ({ auriaHttp: { post: jest.fn(), patch: jest.fn() } }));

const post = auriaHttp.post as jest.Mock;
const patch = auriaHttp.patch as jest.Mock;

describe('regenerateMessage (E19)', () => {
  it('asks for a new version with the mode, an operation id and web search off, waiting as long as a turn', async () => {
    post.mockResolvedValue({
      uuid: 'a-2',
      author_role: 'assistant',
      content_type: 'text',
      content: 'A better answer.',
      version_index: 2,
      version_count: 2,
      versions: ['a-1', 'a-2'],
    });
    const controller = new AbortController();

    const saved = await regenerateMessage('a-1', { mode: 'deep', clientOperationId: 'op-123456789', signal: controller.signal });

    expect(post).toHaveBeenCalledWith(
      '/auria/chat_importer/messages/a-1/regenerate',
      { mode: 'deep', client_operation_id: 'op-123456789', web_mode: 'off', web_policy_version: 2 },
      { signal: controller.signal, timeoutMs: AURIA_REPLAY_TIMEOUT_MS },
    );
    expect(saved).toMatchObject({ id: 'a-2', serverId: 'a-2', text: 'A better answer.', version: { index: 2, count: 2 } });
  });

  it('passes the server refusal on', async () => {
    post.mockRejectedValue(Object.assign(new Error('No plan'), { status: 402, code: 'insufficient_units' }));
    await expect(regenerateMessage('a-1', { mode: 'fast', clientOperationId: 'op-123456789' })).rejects.toMatchObject({ status: 402 });
  });
});

describe('editMessage (E20)', () => {
  it('saves the new text with its attachments and returns the new question and answer', async () => {
    patch.mockResolvedValue({
      user_message: { uuid: 'u-2', author_role: 'user', content_type: 'text', content: '![a.png](/auria/chat/attachments/11111111-aaaa)\n\nAnd tomorrow?' },
      assistant_message: { uuid: 'a-3', author_role: 'assistant', content_type: 'text', content: 'Two tasks.' },
    });

    const saved = await editMessage('u-1', '![a.png](/auria/chat/attachments/11111111-aaaa)\n\nAnd tomorrow?', {
      mode: 'fast',
      clientOperationId: 'op-123456789',
    });

    expect(patch).toHaveBeenCalledWith(
      '/auria/chat_importer/messages/u-1/edit',
      {
        content: '![a.png](/auria/chat/attachments/11111111-aaaa)\n\nAnd tomorrow?',
        mode: 'fast',
        client_operation_id: 'op-123456789',
        web_mode: 'off',
        web_policy_version: 2,
      },
      { signal: undefined, timeoutMs: AURIA_REPLAY_TIMEOUT_MS },
    );
    expect(saved.question).toMatchObject({ id: 'u-2', text: 'And tomorrow?', files: [expect.objectContaining({ name: 'a.png' })] });
    expect(saved.answer).toMatchObject({ id: 'a-3', text: 'Two tasks.' });
  });
});

describe('activateVersion (E21)', () => {
  it('makes that version the active branch', async () => {
    post.mockResolvedValue({ active_path: [] });
    await activateVersion('a-1');
    expect(post).toHaveBeenCalledWith('/auria/chat_importer/messages/a-1/activate', undefined, { signal: undefined });
  });
});

describe('setLiked (E22)', () => {
  it('sends the value and returns what the server saved', async () => {
    post.mockResolvedValue({ uuid: 'a-1', liked: true });
    await expect(setLiked('a-1', true)).resolves.toBe(true);
    expect(post).toHaveBeenCalledWith('/auria/chat_importer/messages/a-1/like', { liked: true });
  });
});
