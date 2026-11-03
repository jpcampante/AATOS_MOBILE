import { auriaHttp } from './http';
import { auriaRoutes } from './routes';

/** Web search for a turn (policy v2): the model may search (`auto`) or not (`off`). */
export type WebMode = 'auto' | 'off';

/** What the server says about web search for this person (E48). */
export type WebSearchSettings = {
  /** The server can search at all (provider configured, not switched off globally). */
  available: boolean;
  /** The company switch (an admin can turn search off for everyone). */
  companyEnabled: boolean;
  /** This person's saved choice for the chat (null: never chosen). Absent without a chat. */
  chat: { mode: WebMode | null; revision: number } | null;
};

type ApiSettings = {
  available?: boolean;
  company?: { enabled?: boolean };
  chat?: { mode?: string | null; revision?: number } | null;
};

/** Settings calls are quick or useless: an unknown state is Web Off for the turn. */
const SETTINGS_TIMEOUT_MS = 5_000;

const asMode = (mode: unknown): WebMode | null => (mode === 'auto' || mode === 'off' ? mode : null);

export async function getWebSearchSettings(chatId: string | null): Promise<WebSearchSettings> {
  const data = await auriaHttp.get<ApiSettings>(auriaRoutes.webSearchSettings(chatId), { timeoutMs: SETTINGS_TIMEOUT_MS });
  return {
    available: data.available === true,
    companyEnabled: data.company?.enabled !== false,
    chat: chatId && data.chat ? { mode: asMode(data.chat.mode), revision: data.chat.revision ?? 0 } : null,
  };
}

/**
 * Saves this person's choice for a chat (E49). `revision` is the one read last;
 * a stale one fails with 409 `revision_conflict` (re-read, never resend).
 * Returns the saved choice with its new revision.
 */
export async function saveWebSearchChoice(chatId: string, mode: WebMode, revision: number): Promise<{ mode: WebMode; revision: number }> {
  const data = await auriaHttp.put<{ preference?: { mode?: string; revision?: number } }>(
    auriaRoutes.webSearchPreference,
    { mode, revision, chat_id: chatId },
    { timeoutMs: SETTINGS_TIMEOUT_MS },
  );
  const saved = { mode: asMode(data.preference?.mode), revision: data.preference?.revision ?? -1 };
  // Like the web: only an echo of what was sent, with a newer revision, counts as saved.
  if (saved.mode !== mode || saved.revision <= revision) throw new Error('The search choice was not confirmed.');
  return { mode: saved.mode, revision: saved.revision };
}
