import { AuriaApiError } from './errors';
import type { SseFrame } from './sse';
import type { ApiCanvasDocument } from './types';

/** The events of `POST /auria/system_llm/chat?stream=1` (plan §4), typed. */
export type AuriaStreamEvent =
  | { type: 'chat'; chatId: string; userMessageUuid: string | null }
  | { type: 'status'; phase: string; round?: number; mode?: string; scope?: { module: string; version: number } | null }
  | { type: 'reasoning'; content: string; source: string; tool?: string }
  | { type: 'tool'; name: string; status: 'running' | 'done'; ok?: boolean; service?: string }
  | { type: 'delta'; content: string }
  /** `chars` is counted in Python code points; convert before slicing JS strings. */
  | { type: 'delta_reset'; chars: number; reason: string }
  | { type: 'web_status'; web: Record<string, unknown> }
  | { type: 'canvas'; action: string; document: ApiCanvasDocument }
  | { type: 'canvas_proposal'; proposal: Record<string, unknown> }
  | { type: 'assignment'; data: Record<string, unknown> }
  | {
      type: 'done';
      response: string | null;
      reasoning: string | null;
      canvasDocuments: ApiCanvasDocument[] | null;
      web: Record<string, unknown> | null;
      model: string | null;
    }
  | {
      type: 'saved';
      chatId: string | null;
      userMessageUuid: string | null;
      assistantMessageUuid: string | null;
      canvasDocuments: ApiCanvasDocument[] | null;
      canvasProposals: Record<string, unknown>[] | null;
    }
  | {
      type: 'error';
      error: AuriaApiError;
      chatId: string | null;
      partial: boolean;
      requiredTokens: number | null;
    };

type Obj = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null);
const arr = <T>(v: unknown): T[] | null => (Array.isArray(v) ? (v as T[]) : null);

/** One SSE frame → one typed event, or null for frames the app ignores (unknown, malformed, empty). */
export function toStreamEvent(frame: SseFrame): AuriaStreamEvent | null {
  let payload: Obj | null;
  try {
    payload = obj(JSON.parse(frame.data));
  } catch {
    return null;
  }
  if (!payload) return null;

  switch (frame.event) {
    case 'chat': {
      const chatId = str(payload.chat_id);
      return chatId ? { type: 'chat', chatId, userMessageUuid: str(payload.user_message_uuid) } : null;
    }
    case 'status': {
      const phase = str(payload.phase);
      if (!phase) return null;
      const scope = obj(payload.scope);
      return {
        type: 'status',
        phase,
        round: num(payload.round),
        mode: str(payload.mode) ?? undefined,
        scope: scope ? { module: String(scope.module ?? ''), version: Number(scope.version ?? 0) } : null,
      };
    }
    case 'reasoning': {
      const content = str(payload.content);
      return content
        ? { type: 'reasoning', content, source: str(payload.source) ?? 'model', tool: str(payload.tool) ?? undefined }
        : null;
    }
    case 'tool': {
      const name = str(payload.name);
      if (!name) return null;
      return {
        type: 'tool',
        name,
        status: payload.status === 'done' ? 'done' : 'running',
        ok: typeof payload.ok === 'boolean' ? payload.ok : undefined,
        service: str(payload.service) ?? undefined,
      };
    }
    case 'delta': {
      const content = typeof payload.content === 'string' ? payload.content : '';
      return content ? { type: 'delta', content } : null;
    }
    case 'delta_reset': {
      const chars = Math.max(0, Math.floor(Number(payload.chars) || 0));
      return chars > 0 ? { type: 'delta_reset', chars, reason: str(payload.reason) ?? '' } : null;
    }
    case 'web_status':
      return { type: 'web_status', web: payload };
    case 'canvas': {
      const document = obj(payload.document) as ApiCanvasDocument | null;
      return document && str(document.id)
        ? { type: 'canvas', action: str(payload.action) ?? 'updated', document }
        : null;
    }
    case 'canvas_proposal':
      return str(payload.id) ? { type: 'canvas_proposal', proposal: payload } : null;
    case 'assignment':
      return { type: 'assignment', data: payload };
    case 'done':
      return {
        type: 'done',
        response: typeof payload.response === 'string' ? payload.response : null,
        reasoning: typeof payload.reasoning === 'string' ? payload.reasoning : null,
        canvasDocuments: arr<ApiCanvasDocument>(payload.canvas_documents),
        web: obj(payload.web),
        model: str(payload.model),
      };
    case 'saved':
      return {
        type: 'saved',
        chatId: str(payload.chat_id),
        userMessageUuid: str(payload.user_message_uuid),
        assistantMessageUuid: str(payload.assistant_message_uuid),
        canvasDocuments: arr<ApiCanvasDocument>(payload.canvas_documents),
        canvasProposals: arr<Obj>(payload.canvas_proposals),
      };
    case 'error': {
      const required = num(payload.required_tokens);
      return {
        type: 'error',
        error: new AuriaApiError({
          code: str(payload.code) ?? 'unknown',
          reasonCode: str(payload.reason_code),
          serverMessage: str(payload.message),
          body: payload,
        }),
        chatId: str(payload.chat_id),
        partial: payload.partial === true,
        requiredTokens: required && required > 0 ? required : null,
      };
    }
    default:
      return null;
  }
}
