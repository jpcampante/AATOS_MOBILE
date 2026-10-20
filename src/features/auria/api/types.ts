/**
 * Wire types of the Auria backend, as served by aatos-auria `6567791`
 * (serializers in `auria/serializers/visualizer.py`, `services/chat_canvas_service.py`).
 * Screens never see these: `mappers.ts` turns them into domain types.
 */

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
