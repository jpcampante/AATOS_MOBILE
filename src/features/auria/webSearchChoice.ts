import type { WebMode } from './api/webSearch';

/** Where the person's web search choice for the open chat stands. */
export type WebSearchState = {
  status: 'loading' | 'ready' | 'saving' | 'error';
  /** The choice (null: never chosen, which is Off). */
  mode: WebMode | null;
  /** Revision of the saved choice (0 for a chat with none yet). */
  revision: number;
  available: boolean;
  companyEnabled: boolean;
  /** A new chat whose choice still has to be saved once the server creates it. */
  unsaved: boolean;
  /** What to tell the person (a refreshed choice, a failure…). */
  notice: string | null;
};

export const initialWebSearchState: WebSearchState = {
  status: 'loading',
  mode: null,
  revision: 0,
  available: false,
  companyEnabled: true,
  unsaved: false,
  notice: null,
};

/** The texts the web shows, so both apps say the same thing. */
export const WEB_SEARCH_TEXT = {
  changed: 'The search choice changed. This message uses Web Off.',
  uncheckable: 'Search settings could not be checked. This message uses Web Off.',
  refreshed: 'The choice was refreshed. Check it before sending.',
  notSaved: 'The choice could not be saved. Retry to check it.',
  notLoaded: 'Search settings could not be loaded. Retry to choose search.',
  bindFailed: 'Your search choice was not saved. Reload the choice before the next send.',
  companyOff: 'Disabled for this company.',
  unavailable: 'Search is unavailable.',
} as const;

/**
 * The `web_mode` a turn goes out with. Anything unknown, still loading or
 * being saved is Off; so is a server without search or a company that turned
 * it off. Only a ready, chosen Auto searches.
 */
export function turnWebMode(state: WebSearchState): WebMode {
  const searchable = state.available && state.companyEnabled;
  return state.status === 'ready' && searchable && state.mode === 'auto' ? 'auto' : 'off';
}

/** Why the switch can't be turned on, or null when it can. */
export function webSearchUnavailableReason(state: WebSearchState): string | null {
  if (!state.companyEnabled) return WEB_SEARCH_TEXT.companyOff;
  if (!state.available) return WEB_SEARCH_TEXT.unavailable;
  return null;
}
