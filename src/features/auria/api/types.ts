/**
 * Wire types of the Auria backend, as served by aatos-auria `6567791`
 * (serializers in `auria/serializers/visualizer.py`, `services/chat_canvas_service.py`).
 * Screens never see these: `mappers.ts` turns them into domain types.
 */

/** DRF page (`ChunkPagination`: `?page=N&limit=M`, at most 100). */
export type ApiPage<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** `GET /auria/chat_importer/chats/visualizer` item (`ChatSerializer`). */
export type ApiChat = {
  id_chat: string;
  title: string | null;
  provider: string | null;
  visibility?: 'private' | 'public' | null;
  owner_public_uid?: string | null;
  created_time?: string | null;
  last_activity?: string | null;
  message_count?: number | null;
  is_pinned?: boolean;
};

/** `content` of a `multimodal_text` message (imported chats), parsed by the server. */
export type ApiMultimodalContent = {
  asset_pointer?: string;
  asset_url?: string;
  instruction?: string;
};

/** `GET /auria/chat_importer/messages/<chat>/visualizer` item (`MessageSerializer`). */
export type ApiMessage = {
  uuid: string;
  author_name?: string | null;
  author_role: string;
  /** `text` | `image` (content is the image URL) | `multimodal_text` | … */
  content_type: string | null;
  content: string | ApiMultimodalContent | null;
  created_time?: string | null;
  is_edited?: boolean;
  edited_at?: string | null;
  liked?: boolean;
  mentions?: { user_public_uid?: string; full_name?: string; handle?: string }[] | null;
  reasoning?: string | null;
  execution_policy?: Record<string, unknown> | null;
  web_result?: Record<string, unknown> | null;
  parent_uuid?: string | null;
  version_index?: number;
  version_count?: number;
  versions?: string[];
  chat_id?: string;
};

/** `POST /auria/chat/attachments` → 201. */
export type ApiUploadedAttachment = {
  status?: string;
  uuid: string;
  filename: string;
  mime_type: string;
  url: string;
};

/** A document the Auria created or changed in a chat (canvas). */
export type ApiCanvasDocument = {
  id: string;
  chat_id?: string | null;
  chat_title?: string | null;
  title: string;
  /** `markdown` | `html` | `plain` | `sheet-json` | `deck-json`. */
  format: string;
  version: number;
  in_library?: boolean;
  owner_public_uid?: string | null;
  preview?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  content?: string;
  metadata?: Record<string, unknown> | null;
};
