import type { ResolvedFile } from '../attachments';
import { auriaHttp } from './http';
import { auriaRoutes } from './routes';
import type { ApiUploadedAttachment } from './types';

/** Uploads one file (E24, multipart `file` + optional `chat_id`), reporting progress 0–1. */
export function uploadAttachment(
  file: ResolvedFile,
  chatId: string | null,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<ApiUploadedAttachment> {
  return auriaHttp.upload<ApiUploadedAttachment>(auriaRoutes.attachments, {
    file: { uri: file.uri, name: file.name, type: file.type },
    fields: chatId ? { chat_id: chatId } : {},
    onProgress,
    signal,
  });
}

/** Removes an uploaded file the person took out before sending (E27). */
export const deleteAttachment = (uuid: string) => auriaHttp.del(auriaRoutes.attachment(uuid));
