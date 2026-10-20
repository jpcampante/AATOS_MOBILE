/**
 * Errors from the Auria backend and the client side, and the copy the UI shows
 * for each (plan §5). The backend answers in three shapes:
 *   Auria  {status, message, code, reason_code, ...}
 *   DRF    {detail, code?}
 *   other  {error}
 * Copy is in English, like the rest of the interface (D-03).
 */

/** What the notice offers next to the message. */
export type AuriaErrorAction = 'retry' | 'new_chat' | 'see_plans' | 'ask_owner' | 'reload' | 'wait' | 'none';

export type AuriaErrorCopy = { message: string; action: AuriaErrorAction };

type AuriaApiErrorInit = {
  code: string;
  status?: number;
  reasonCode?: string | null;
  serverMessage?: string | null;
  retryAfter?: number | null;
  body?: unknown;
};

export class AuriaApiError extends Error {
  /** HTTP status, or 0 for client-side failures (network, timeout, connection lost). */
  readonly status: number;
  readonly code: string;
  readonly reasonCode: string | null;
  readonly serverMessage: string | null;
  /** Seconds, from `Retry-After`. */
  readonly retryAfter: number | null;
  readonly body: unknown;

  constructor({ code, status = 0, reasonCode = null, serverMessage = null, retryAfter = null, body }: AuriaApiErrorInit) {
    super(serverMessage || code);
    this.name = 'AuriaApiError';
    this.code = code;
    this.status = status;
    this.reasonCode = reasonCode;
    this.serverMessage = serverMessage;
    this.retryAfter = retryAfter;
    this.body = body;
  }
}

const str = (value: unknown): string | null => (typeof value === 'string' && value ? value : null);

function codeFromStatus(status: number, detail: string | null): string {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 402:
      return 'insufficient_units';
    case 403:
      if (detail && /read-only/i.test(detail)) return /project/i.test(detail) ? 'project_read_only' : 'chat_read_only';
      return 'forbidden';
    case 404:
      return 'not_found';
    case 406:
      return 'not_acceptable';
    case 413:
      return 'file_too_large';
    case 415:
      return 'unsupported_file';
    case 429:
      return 'rate_limited';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

export function errorFromResponse(status: number, body: unknown, retryAfterHeader?: string | null): AuriaApiError {
  const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const detail = str(obj.detail);
  const serverMessage = str(obj.message) ?? detail;
  const explicit = str(obj.code) ?? str(obj.error);
  // A read-only 403 comes without a code; the detail is the only signal.
  const readOnly = status === 403 && detail && /read-only/i.test(detail) ? codeFromStatus(403, detail) : null;
  const retryAfter = retryAfterHeader != null && /^\d+$/.test(retryAfterHeader.trim()) ? Number(retryAfterHeader) : null;
  return new AuriaApiError({
    status,
    code: readOnly ?? explicit ?? codeFromStatus(status, detail),
    reasonCode: str(obj.reason_code),
    serverMessage,
    retryAfter,
    body,
  });
}

export const networkError = (cause?: unknown) =>
  new AuriaApiError({ code: 'network', body: cause instanceof Error ? cause.message : cause });
export const timeoutError = () => new AuriaApiError({ code: 'timeout' });
export const connectionLostError = () => new AuriaApiError({ code: 'connection_lost' });
export const abortedError = () => new AuriaApiError({ code: 'aborted' });

export const isAuriaApiError = (err: unknown): err is AuriaApiError => err instanceof AuriaApiError;

const CREDIT_COPY: Record<string, string> = {
  pool_exhausted: 'Your workspace is out of credits.',
  no_active_plan: 'Your workspace has no active plan.',
  member_limit: "You've used your share of the workspace credits.",
  billing_not_configured: "Billing isn't set up for your workspace yet.",
};

const COPY: Record<string, AuriaErrorCopy> = {
  billing_unavailable: { message: 'Billing is temporarily unavailable. Try again in a moment.', action: 'retry' },
  billing_reservation_inactive: { message: 'Billing could not confirm this request. Try again.', action: 'retry' },
  reservation_conflict: { message: 'Auria is still answering in this chat.', action: 'reload' },
  operation_in_progress: { message: 'Auria is still answering in this chat.', action: 'reload' },
  operation_already_sent: { message: 'This message was already sent.', action: 'reload' },
  provider_timeout: { message: 'Auria took too long to answer. Try again.', action: 'retry' },
  provider_rate_limited: { message: 'Auria is busy right now. Try again in a moment.', action: 'retry' },
  provider_unavailable: { message: 'Auria is unavailable right now. Try again in a few minutes.', action: 'retry' },
  ai_service_unavailable: { message: 'The AI service is unavailable right now. Try again later.', action: 'retry' },
  empty_response: { message: "Auria didn't return an answer. Try again.", action: 'retry' },
  internal_error: { message: 'Something went wrong on our side. Try again.', action: 'retry' },
  server: { message: 'Something went wrong on our side. Try again.', action: 'retry' },
  context_too_long: { message: 'This chat is too long for Auria. Start a new chat to continue.', action: 'new_chat' },
  content_blocked: { message: 'This request was blocked by the content policy.', action: 'none' },
  tool_limit_reached: { message: 'Auria reached the limit of actions for one answer. Try a narrower request.', action: 'retry' },
  no_business_access: { message: "Your account isn't linked to a workspace with access to Auria.", action: 'none' },
  forbidden: { message: "You don't have permission to do this.", action: 'none' },
  chat_read_only: { message: 'This chat is read-only for you.', action: 'none' },
  project_read_only: { message: 'This project is read-only for you.', action: 'none' },
  not_found: { message: 'This chat is no longer available.', action: 'none' },
  unauthorized: { message: 'Your session ended. Sign in again.', action: 'none' },
  token_not_valid: { message: 'Your session ended. Sign in again.', action: 'none' },
  file_too_large: { message: 'Files can be up to 20 MB.', action: 'none' },
  unsupported_file: { message: 'Supported files: images, PDF, TXT, MD, CSV, DOCX, XLSX and JSON.', action: 'none' },
  rate_limited: { message: 'Too many requests. Wait a moment and try again.', action: 'wait' },
  network: { message: "You're offline. Check your connection and try again.", action: 'retry' },
  timeout: { message: 'The request timed out. Try again.', action: 'retry' },
  connection_lost: { message: 'The connection was lost before Auria finished.', action: 'retry' },
  aborted: { message: 'Stopped.', action: 'none' },
};

const GENERIC: AuriaErrorCopy = { message: 'Something went wrong. Try again.', action: 'retry' };

export function describeAuriaError(
  err: AuriaApiError,
  { canManageBilling = false }: { canManageBilling?: boolean } = {},
): AuriaErrorCopy {
  if (err.code === 'insufficient_units') {
    return {
      message: (err.reasonCode && CREDIT_COPY[err.reasonCode]) || "You're out of credits.",
      action: canManageBilling ? 'see_plans' : 'ask_owner',
    };
  }
  return COPY[err.code] ?? GENERIC;
}
