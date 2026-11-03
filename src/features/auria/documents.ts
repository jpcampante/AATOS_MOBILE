/**
 * Documents the Auria writes in a chat (the backend's "canvas"): what the app
 * keeps of one, and how the raw payload becomes it. The documents are read
 * only on the phone (D-07), so nothing here describes an edit.
 */
import type { ApiCanvasDocument } from './api/types';

/** The formats the server stores. Anything else is shown as plain text. */
export type AuriaDocumentFormat = 'markdown' | 'html' | 'plain' | 'sheet-json' | 'deck-json';

export type AuriaDocument = {
  id: string;
  title: string;
  format: AuriaDocumentFormat;
  version: number;
  /** First lines of the document, for the card. */
  preview: string | null;
  chatId: string | null;
  updatedAt: string | null;
  /** The body, once it was read (E31). */
  content?: string;
};

const FORMATS: AuriaDocumentFormat[] = ['markdown', 'html', 'plain', 'sheet-json', 'deck-json'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** What the card calls each format. */
export const DOCUMENT_KIND_LABEL: Record<AuriaDocumentFormat, string> = {
  markdown: 'Document',
  plain: 'Document',
  html: 'Document',
  'sheet-json': 'Spreadsheet',
  'deck-json': 'Presentation',
};

/** Reads a document payload (a `canvas` event, `done.canvas_documents` or E29). */
export function mapApiDocument(raw: unknown): AuriaDocument | null {
  if (!isRecord(raw)) return null;
  const { id, title, format, version } = raw;
  if (typeof id !== 'string' || !id) return null;
  const preview = typeof raw.preview === 'string' ? raw.preview.trim() : '';
  return {
    id,
    title: (typeof title === 'string' && title.trim()) || 'Untitled document',
    format: FORMATS.includes(format as AuriaDocumentFormat) ? (format as AuriaDocumentFormat) : 'plain',
    version: typeof version === 'number' && Number.isFinite(version) ? version : 1,
    preview: preview || null,
    chatId: typeof raw.chat_id === 'string' ? raw.chat_id : null,
    updatedAt: typeof raw.updated_at === 'string' ? raw.updated_at : null,
    ...(typeof raw.content === 'string' ? { content: raw.content } : null),
  };
}

/** The documents of a turn, newest state of each, in the order they appeared. */
export function mapApiDocuments(raw: (ApiCanvasDocument | unknown)[] | null | undefined): AuriaDocument[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map<string, AuriaDocument>();
  for (const item of raw) {
    const document = mapApiDocument(item);
    if (document) byId.set(document.id, document);
  }
  return [...byId.values()];
}
