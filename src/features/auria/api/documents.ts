import { auriaHttp } from './http';
import { auriaRoutes } from './routes';
import { isAuriaApiError } from './errors';
import { mapApiDocument, mapApiDocuments, type AuriaDocument } from '../documents';

type ApiDocumentsResponse = { documents?: unknown[] };
type ApiDocumentResponse = { document?: unknown };

/**
 * The documents of a chat (E29), newest first as the server orders them. A
 * chat with none — or one the server does not know — is an empty list.
 */
export async function listChatDocuments(chatId: string, signal?: AbortSignal): Promise<AuriaDocument[]> {
  try {
    const data = await auriaHttp.get<ApiDocumentsResponse>(auriaRoutes.chatDocuments(chatId), { signal });
    return mapApiDocuments(data.documents);
  } catch (err) {
    if (isAuriaApiError(err) && err.status === 404) return [];
    throw err;
  }
}

/** One document with its body (E31), to read it in the app. */
export async function getChatDocument(chatId: string, documentId: string, signal?: AbortSignal): Promise<AuriaDocument> {
  const data = await auriaHttp.get<ApiDocumentResponse>(auriaRoutes.chatDocument(chatId, documentId), { signal });
  const document = mapApiDocument(data.document);
  if (!document) throw new Error('The server did not return the document.');
  return document;
}
