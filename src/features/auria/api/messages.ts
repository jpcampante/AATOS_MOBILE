import { AURIA_API_URL, AURIA_REPLAY_TIMEOUT_MS, WEB_POLICY_VERSION } from './config';
import { auriaHttp } from './http';
import { auriaRoutes } from './routes';
import type { AuriaMode } from './streamChat';
import type { ApiMessage } from './types';
import { mapApiMessage } from '../mappers';
import type { AuriaChatMessage } from '../types';

export type ReplayOptions = {
  mode: AuriaMode;
  /** Lets the server tell a resend from a new request (`operation_already_sent`). */
  clientOperationId: string;
  signal?: AbortSignal;
};

/** What a retry or edit sends besides its own fields: the mode and, like a turn, web search off (A033 adds the choice). */
const replayBody = ({ mode, clientOperationId }: ReplayOptions) => ({
  mode,
  client_operation_id: clientOperationId,
  web_mode: 'off',
  web_policy_version: WEB_POLICY_VERSION,
});

/**
 * "Retry" (E19): a new version of the answer. `messageUuid` is the answer (or
 * the question of that turn); the server keeps the old version and answers
 * only after writing the new one, so it can take as long as a turn.
 */
export async function regenerateMessage(messageUuid: string, options: ReplayOptions): Promise<AuriaChatMessage | null> {
  const saved = await auriaHttp.post<ApiMessage>(auriaRoutes.regenerate(messageUuid), replayBody(options), {
    signal: options.signal,
    timeoutMs: AURIA_REPLAY_TIMEOUT_MS,
  });
  return mapApiMessage(saved, AURIA_API_URL);
}

/**
 * Edit the person's message (E20): the server answers the new text in a new
 * branch (the old version stays) and returns both messages once written.
 * `content` is saved as is, so it must carry the attachments' markdown.
 */
export async function editMessage(
  messageUuid: string,
  content: string,
  options: ReplayOptions,
): Promise<{ question: AuriaChatMessage | null; answer: AuriaChatMessage | null }> {
  const saved = await auriaHttp.patch<{ user_message: ApiMessage; assistant_message: ApiMessage }>(
    auriaRoutes.editMessage(messageUuid),
    { content, ...replayBody(options) },
    { signal: options.signal, timeoutMs: AURIA_REPLAY_TIMEOUT_MS },
  );
  return {
    question: mapApiMessage(saved.user_message, AURIA_API_URL),
    answer: mapApiMessage(saved.assistant_message, AURIA_API_URL),
  };
}
