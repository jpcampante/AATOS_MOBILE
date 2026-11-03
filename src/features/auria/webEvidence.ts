/**
 * What the chat shows about this turn's web search: the one-line state, the
 * source cards and the full list. Same texts as the web's `WebEvidence`, so an
 * answer reads the same in both apps.
 */
import { isWebSnapshot, type WebResult, type WebSource } from './webResult';

/** How many sources become cards above the full list (the rest stay in the list). */
export const MAX_WEB_CARDS = 4;

/** The state line, by status (v2 and v1 share this table, like the web). */
const STATUS_LABEL: Record<string, string> = {
  searching: 'Searching the web…',
  done: 'Web sources',
  completed: 'Web sources',
  no_results: 'Search returned no usable sources.',
  no_sources: 'Search returned no usable sources.',
  needs_query: 'Tell Auria what to search publicly.',
  blocked: 'Web is off for this turn.',
  failed: 'Web search could not complete.',
  unavailable: 'Web search was not performed.',
};

/** Why a search could not run or finish (`failure_code`). */
const FAILURE_TEXT: Record<string, string> = {
  off_user: 'Web is off for this turn.',
  off_scope: 'Web is off in this area.',
  off_company: 'Web search is disabled for this company.',
  disabled_admin: 'Web search is disabled.',
  provider_not_configured: 'Web search is unavailable.',
  needs_query: 'No public search query was available.',
  query_rejected: 'The search query could not be used.',
  pii_blocked: 'The search query could not be sent.',
  turn_limit: 'The search limit for this turn was reached.',
  billing_unavailable: 'Search billing is unavailable.',
  provider_auth: 'Search access is unavailable.',
  provider_rate_limited: 'The search provider is busy.',
  provider_timeout: 'Search timed out.',
  provider_error: 'Search could not complete.',
  generation_incomplete: 'The answer was interrupted.',
  client_upgrade_required: 'Search requires a newer client.',
};

export type WebEvidenceView = {
  /** The state line; hidden once the cards say it themselves. */
  label: string;
  showLabel: boolean;
  searching: boolean;
  /** Why it could not complete, when the server said so. */
  failure: string | null;
  /** Sources kept from an earlier search of the same turn. */
  keptNote: boolean;
  cards: WebSource[];
  sources: WebSource[];
  /** The summary of the expandable list ("4 sources · 2 search attempts"). */
  summary: string;
  /** Attempts whose cost the server could not confirm, as a note. */
  uncertainNote: string | null;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Everything the evidence block shows, derived from the parsed result. */
export function webEvidenceView(result: WebResult): WebEvidenceView {
  const v2 = isWebSnapshot(result);
  const { sources } = result;
  const done = result.status === 'done' || result.status === 'completed';
  const cards = v2 ? sources.slice(0, MAX_WEB_CARDS) : [];
  const last = result.lastSearchStatus;
  const summary = v2
    ? `${plural(sources.length, 'source', 'sources')} · ${plural(result.attempts, 'search attempt', 'search attempts')}`
    : plural(sources.length, 'source', 'sources');
  return {
    label: STATUS_LABEL[result.status] ?? 'Web sources',
    // With cards the label is redundant; a search still running always says so.
    showLabel: !(done && cards.length > 0),
    searching: result.status === 'searching',
    failure: v2 && result.failureCode ? FAILURE_TEXT[result.failureCode] ?? 'Search could not complete.' : null,
    keptNote: sources.length > 0 && !!last && last !== 'done' && last !== 'completed',
    cards,
    sources,
    summary,
    uncertainNote:
      v2 && result.uncertainAttempts > 0
        ? `${plural(result.uncertainAttempts, 'attempt has', 'attempts have')} an uncertain outcome.`
        : null,
  };
}

/** The site name shown on cards and chips: the domain without "www.". */
export function siteName(source: WebSource): string {
  return source.domain.replace(/^www\./, '');
}

/** A date like "13 Oct 2026"; a plain YYYY-MM-DD is read as a calendar day (no time-zone shift). */
export function sourceDate(value?: string): string {
  if (!value) return '';
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 20);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
