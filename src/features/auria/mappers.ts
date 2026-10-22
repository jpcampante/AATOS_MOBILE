import type { ApiChat, ApiMessage, ApiMultimodalContent, ApiPage } from './api/types';
import type { AuriaAttachment, AuriaChatMessage, AuriaConversation, AuriaPage } from './types';

/** Server paths (`/media/…`, `/auria/…`) → absolute URLs on the API host. */
export function absolutizeUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(url)) {
    // Behind its proxy the backend builds `http://` links to itself. Fetching those would send
    // the Bearer token in clear: a link to the API host always uses the API's own scheme.
    const host = (u: string) => u.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
    if (host(url) === host(baseUrl)) return `${baseUrl}${url.replace(/^https?:\/\/[^/]+/i, '')}`;
    return url;
  }
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|heif|bmp)$/i;
const ATTACHMENT_PATH = /\/auria\/(?:chat|canvas\/[^/]+)\/attachments\/([0-9a-f-]{8,})/i;

function attachment(name: string, rawUrl: string, baseUrl: string, isImage: boolean): AuriaAttachment {
  const url = absolutizeUrl(rawUrl, baseUrl);
  const id = ATTACHMENT_PATH.exec(url)?.[1];
  return {
    ...(id ? { id } : null),
    name,
    url,
    isImage,
    // Auria attachments are only served with the Bearer token; /media/ is public.
    // (String check on purpose: no `URL` parsing on the device.)
    private: url.startsWith(`${baseUrl}/auria/`),
  };
}

/**
 * The web inlines a user's uploads in the message text: images as `![name](url)`
 * and other files as `[attachment:name](url)`. Pull them out so the bubble shows
 * the question and the attachments render on their own.
 */
function extractAttachments(text: string, baseUrl: string): { text: string; files: AuriaAttachment[] } {
  const files: AuriaAttachment[] = [];
  const rest = text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, name: string, url: string) => {
      files.push(attachment(name || 'image', url, baseUrl, true));
      return '';
    })
    .replace(/\[attachment:([^\]]*)\]\(([^)\s]+)\)/g, (_m, name: string, url: string) => {
      files.push(attachment(name || 'file', url, baseUrl, IMAGE_EXT.test(name)));
      return '';
    });
  return { text: rest.replace(/\n{3,}/g, '\n\n').trim(), files };
}

export function mapApiChat(chat: ApiChat): AuriaConversation {
  return {
    id: chat.id_chat,
    title: chat.title?.trim() || 'New chat',
    provider: chat.provider || 'auria_system',
    visibility: chat.visibility === 'public' ? 'public' : 'private',
    ownerPublicUid: chat.owner_public_uid ?? null,
    isPinned: chat.is_pinned === true,
    lastActivity: chat.last_activity ?? null,
    messageCount: typeof chat.message_count === 'number' ? chat.message_count : null,
    createdAt: chat.created_time ?? null,
  };
}

export function mapApiPage<A, B>(page: ApiPage<A>, map: (item: A) => B | null): AuriaPage<B> {
  return {
    items: page.results.map(map).filter((item): item is B => item !== null),
    count: page.count,
    hasMore: Boolean(page.next),
  };
}

/** One saved message → what the chat renders. `null` for messages the app doesn't show. */
export function mapApiMessage(msg: ApiMessage, baseUrl: string): AuriaChatMessage | null {
  if (msg.author_role !== 'user' && msg.author_role !== 'assistant') return null;
  const role = msg.author_role;

  let text = '';
  let files: AuriaAttachment[] = [];
  let imageUrl: string | undefined;

  if (msg.content_type === 'image' && typeof msg.content === 'string' && msg.content.trim()) {
    imageUrl = absolutizeUrl(msg.content.trim(), baseUrl);
  } else if (msg.content && typeof msg.content === 'object') {
    const multimodal = msg.content as ApiMultimodalContent;
    text = multimodal.instruction?.trim() ?? '';
    if (multimodal.asset_url) files = [attachment('image', multimodal.asset_url, baseUrl, true)];
  } else if (typeof msg.content === 'string') {
    if (role === 'user') ({ text, files } = extractAttachments(msg.content, baseUrl));
    else text = msg.content.trim();
  }

  if (!text && files.length === 0 && !imageUrl) return null;

  const mapped: AuriaChatMessage = { id: msg.uuid, serverId: msg.uuid, role, text };
  if (msg.created_time) mapped.createdAt = msg.created_time;
  if (msg.reasoning?.trim()) mapped.reasoningText = msg.reasoning.trim();
  if (typeof msg.liked === 'boolean') mapped.liked = msg.liked;
  if (msg.version_count && msg.version_count > 1) {
    mapped.version = { index: msg.version_index ?? 1, count: msg.version_count, ids: msg.versions ?? [] };
  }
  if (files.length) mapped.files = files;
  if (imageUrl) mapped.imageUrl = imageUrl;
  const mentions = (msg.mentions ?? [])
    .filter((m) => typeof m?.user_public_uid === 'string' && m.user_public_uid)
    .map((m) => ({ userPublicUid: m.user_public_uid as string, ...(m.full_name ? { name: m.full_name } : null) }));
  if (mentions.length) mapped.mentions = mentions;
  return mapped;
}
