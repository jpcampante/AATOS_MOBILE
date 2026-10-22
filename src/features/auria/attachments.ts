/**
 * Rules for files sent to Auria (`POST /auria/chat/attachments`, E24): the
 * backend accepts up to 20 MB of these types (aatos-auria `views/attachments.py`).
 */

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const ACCEPTED = new Set(Object.values(EXTENSION_TYPES));

/** A file picked from the gallery, the camera or the files app. */
export type PickedFile = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

export type ResolvedFile = { uri: string; name: string; type: string; size: number | null; isImage: boolean };

export type AttachmentProblem = 'file_too_large' | 'unsupported_file';

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** Name and MIME type for the upload (pickers may leave either out; the camera gives only a uri). */
export function resolveFile(file: PickedFile, fallbackIndex = 1): ResolvedFile {
  const fromUri = decodeURIComponent(file.uri.split('?')[0].split('/').pop() ?? '');
  const name = (file.name || fromUri || `file-${fallbackIndex}`).trim();
  const byExtension = EXTENSION_TYPES[extensionOf(name)];
  const raw = (file.mimeType || '').toLowerCase();
  // HEIC from the camera roll is not accepted: the picker converts it when asked (see the menu).
  const type = raw && ACCEPTED.has(raw) ? raw : byExtension ?? raw ?? 'application/octet-stream';
  return { uri: file.uri, name, type, size: file.size ?? null, isImage: type.startsWith('image/') };
}

/** null when the backend will take it; otherwise the same code the backend answers (413/415). */
export function attachmentProblem(file: ResolvedFile): AttachmentProblem | null {
  if (file.size != null && file.size > MAX_ATTACHMENT_BYTES) return 'file_too_large';
  if (!ACCEPTED.has(file.type)) return 'unsupported_file';
  return null;
}

/**
 * How an uploaded file travels inside the message, like the web: images as
 * `![name](url)` and other files as `[attachment:name](url)`. The web and the
 * app both read these back to show the attachments in the history.
 */
export function attachmentMarkdown(files: { name: string; url: string; isImage: boolean }[]): string {
  return files
    .map((f) => {
      const name = f.name.replace(/[[\]]/g, '');
      return f.isImage ? `![${name}](${f.url})` : `[attachment:${name}](${f.url})`;
    })
    .join('\n');
}

/** The text sent to Auria: attachments first, then the question (the web's order). */
export function messageWithAttachments(text: string, files: { name: string; url: string; isImage: boolean }[]): string {
  const block = attachmentMarkdown(files);
  if (!block) return text.trim();
  return text.trim() ? `${block}\n\n${text.trim()}` : block;
}
