import { isAuriaApiError } from './errors';
import { auriaHttp } from './http';
import { AURIA_API_URL } from './config';
import { auriaRoutes } from './routes';
import type { ApiChat, ApiMessage, ApiPage } from './types';
import { mapApiChat, mapApiMessage, mapApiPage } from '../mappers';
import type { AuriaChatMessage, AuriaConversation, AuriaPage } from '../types';

export const CHAT_PAGE_SIZE = 30;
/** The server's page size for messages (`ChunkPagination` default; the web uses it too). */
export const MESSAGE_PAGE_SIZE = 20;

const EMPTY_PAGE: AuriaPage<never> = { items: [], count: 0, hasMore: false };

/** Sidebar list (E07). An account that never chatted gets 404: that is an empty list. */
export async function listChats(page: number, signal?: AbortSignal): Promise<AuriaPage<AuriaConversation>> {
  try {
    const data = await auriaHttp.get<ApiPage<ApiChat>>(auriaRoutes.chatsVisualizer(page, CHAT_PAGE_SIZE), { signal });
    return mapApiPage(data, mapApiChat);
  } catch (err) {
    if (isAuriaApiError(err) && err.status === 404) return EMPTY_PAGE;
    throw err;
  }
}

/** One chat (E10), e.g. to reopen the last one by id. */
export async function getChat(chatId: string): Promise<AuriaConversation> {
  return mapApiChat(await auriaHttp.get<ApiChat>(auriaRoutes.chat(chatId)));
}

/** Rename (E11). Never sends `provider`: it is immutable and the web's PATCH must not touch it. */
export const renameChat = (chatId: string, title: string) =>
  auriaHttp.patch<ApiChat>(auriaRoutes.chat(chatId), { title });

/** Delete (E12, owner only). */
export const deleteChat = (chatId: string) => auriaHttp.del(auriaRoutes.chat(chatId));

/** Pin or unpin for the person (E13). */
export const setChatPinned = (chatId: string, pinned: boolean) =>
  pinned ? auriaHttp.post(auriaRoutes.chatPin(chatId)) : auriaHttp.del(auriaRoutes.chatPin(chatId));

/** One page of the active branch of a chat (E16), oldest first. */
export async function listMessages(
  chatId: string,
  page: number,
  signal?: AbortSignal,
): Promise<AuriaPage<AuriaChatMessage>> {
  const data = await auriaHttp.get<ApiPage<ApiMessage>>(
    auriaRoutes.messagesVisualizer(chatId, page, MESSAGE_PAGE_SIZE),
    { signal },
  );
  return mapApiPage(data, (m) => mapApiMessage(m, AURIA_API_URL));
}
