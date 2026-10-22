import { auriaHttp } from '../http';
import { regenerateMessage } from '../messages';
import { AURIA_REPLAY_TIMEOUT_MS } from '../config';

jest.mock('../http', () => ({ auriaHttp: { post: jest.fn() } }));

const post = auriaHttp.post as jest.Mock;

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
