/**
 * The turn's web search result, as the server sends it (`web_status` events and
 * `done.web`) and stores it on a message (`web_result`).
 *
 * Two shapes, like the web's `webPolicy`: the v2 snapshot of the search engine
 * (the one production speaks) and the v1 result kept by older turns. Nothing is
 * invented here: a payload that does not fit the contract is dropped whole, so
 * the chat never shows a source the server did not send.
 */

/** One source the search found. Images only ever come as the server's signed path (A036). */
export type WebSource = {
  index: number;
  url: string;
  title: string;
  domain: string;
  snippet?: string;
  date?: string;
  image?: string;
  icon?: string;
};

export type WebSnapshotStatus = 'searching' | 'done' | 'no_results' | 'failed' | 'unavailable';

/** The v2 snapshot: one per search execution, replaced as `seq` grows. */
export type WebSnapshot = {
  version: 2;
  executionId: string;
  seq: number;
  status: WebSnapshotStatus;
  lastSearchStatus: string | null;
  inProgress: number;
  queries: { index: number; text: string; outcome: string }[];
  attempts: number;
  uncertainAttempts: number;
  sources: WebSource[];
  truncated: boolean;
  failureCode?: string;
};

export type LegacyWebStatus = 'completed' | 'no_sources' | 'needs_query' | 'blocked' | 'failed';

/** The v1 result of older turns: modes, a status and the plain sources. */
export type LegacyWebResult = {
  version: 1;
  requestedMode: string;
  effectiveMode: string;
  status: LegacyWebStatus;
  lastSearchStatus: string | null;
  sources: WebSource[];
};

export type WebResult = WebSnapshot | LegacyWebResult;

export function isWebSnapshot(result: WebResult | undefined): result is WebSnapshot {
  return result?.version === 2;
}

const MAX_SOURCES = 8;
const MAX_SNIPPET = 300;
const V2_STATUSES: WebSnapshotStatus[] = ['searching', 'done', 'no_results', 'failed', 'unavailable'];
const V1_STATUSES: LegacyWebStatus[] = ['completed', 'no_sources', 'needs_query', 'blocked', 'failed'];
const QUERY_OUTCOMES = ['done', 'no_results', 'failed'];

/** Only the server's signed image route is accepted: never a third-party URL. */
const WEB_IMAGE_PATH = /^\/auria\/web-image\/\?(?:u=[A-Za-z0-9%._~-]{1,6200}|p=[A-Za-z0-9%._~-]{1,6200}&k=(?:image|icon))&s=[0-9a-f]{40}$/;

export function isWebImagePath(value: unknown): value is string {
  return typeof value === 'string' && WEB_IMAGE_PATH.test(value);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCount = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max;

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.slice(0, max) : '';

/** A source the person can be shown: a public http(s) URL and an index. */
function parseSource(raw: unknown, index: number): WebSource | null {
  if (!isRecord(raw)) return null;
  const url = raw.url;
  if (typeof url !== 'string' || !/^https?:\/\/[^\s"'\\]+$/i.test(url) || url.length > 2048) return null;
  const domain = text(raw.domain, 253).replace(/^\.+|\.+$/g, '').toLowerCase();
  if (!domain || !/^[a-z0-9.:[\]-]+$/.test(domain)) return null;
  const snippet = text(raw.snippet, MAX_SNIPPET).trim();
  const date = text(raw.date, 40).trim();
  return {
    index,
    url,
    title: text(raw.title, 240).replace(/\s+/g, ' ').trim() || domain,
    domain,
    ...(snippet ? { snippet } : null),
    ...(date ? { date } : null),
    ...(isWebImagePath(raw.image) ? { image: raw.image } : null),
    ...(isWebImagePath(raw.icon) ? { icon: raw.icon } : null),
  };
}

/** The sources, in the server's order; the index is the server's `[n]`. */
function parseSources(raw: unknown): WebSource[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_SOURCES) return null;
  const sources: WebSource[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    const index = isRecord(item) ? item.index : undefined;
    if (!isCount(index, MAX_SOURCES) || index === 0 || seen.has(index)) return null;
    const source = parseSource(item, index);
    if (!source) return null;
    seen.add(index);
    sources.push(source);
  }
  return sources;
}

function parseSnapshot(raw: Record<string, unknown>): WebSnapshot | undefined {
  const status = raw.status;
  const last = raw.last_search_status;
  if (
    typeof raw.execution_id !== 'string' ||
    !raw.execution_id ||
    raw.execution_id.length > 200 ||
    !isCount(raw.seq) ||
    !V2_STATUSES.includes(status as WebSnapshotStatus) ||
    !isCount(raw.in_progress, 3) ||
    !isCount(raw.attempts, 6) ||
    !isCount(raw.uncertain_attempts, 6) ||
    (raw.uncertain_attempts as number) > (raw.attempts as number) ||
    typeof raw.truncated !== 'boolean' ||
    !(last === null || last === undefined || typeof last === 'string') ||
    !Array.isArray(raw.queries) ||
    raw.queries.length > 3
  ) {
    return undefined;
  }
  const sources = parseSources(raw.sources);
  if (!sources) return undefined;
  const queries: WebSnapshot['queries'] = [];
  const seen = new Set<number>();
  for (const item of raw.queries) {
    if (!isRecord(item) || !isCount(item.index, 3) || item.index === 0 || seen.has(item.index)) return undefined;
    if (typeof item.text !== 'string' || item.text.length > 200 || !QUERY_OUTCOMES.includes(item.outcome as string)) {
      return undefined;
    }
    seen.add(item.index);
    queries.push({ index: item.index, text: item.text, outcome: item.outcome as string });
  }
  return {
    version: 2,
    executionId: raw.execution_id,
    seq: raw.seq,
    status: status as WebSnapshotStatus,
    lastSearchStatus: typeof last === 'string' ? last : null,
    inProgress: raw.in_progress,
    queries,
    attempts: raw.attempts,
    uncertainAttempts: raw.uncertain_attempts,
    sources,
    truncated: raw.truncated,
    ...(typeof raw.failure_code === 'string' && raw.failure_code ? { failureCode: raw.failure_code.slice(0, 80) } : null),
  };
}

function parseLegacy(raw: Record<string, unknown>): LegacyWebResult | undefined {
  const status = raw.status;
  if (!V1_STATUSES.includes(status as LegacyWebStatus)) return undefined;
  const sources = parseSources(raw.sources ?? []);
  if (!sources) return undefined;
  const last = raw.last_search_status;
  return {
    version: 1,
    requestedMode: text(raw.requested_mode, 10),
    effectiveMode: text(raw.effective_mode, 10),
    status: status as LegacyWebStatus,
    lastSearchStatus: typeof last === 'string' ? last : null,
    sources,
  };
}

/** Reads a `web` payload (event, `done` or stored message); anything off-contract is dropped. */
export function parseWebResult(raw: unknown): WebResult | undefined {
  if (!isRecord(raw)) return undefined;
  if (raw.version === 2) return parseSnapshot(raw);
  if (raw.web_policy_version === 1 || 'requested_mode' in raw) return parseLegacy(raw);
  return undefined;
}

/**
 * The newer of two payloads for the same turn. A snapshot only replaces another
 * of the same execution when its `seq` grew (the server may send them late or
 * out of order); anything else is the newest the turn has.
 */
export function mergeWebResult(prev: unknown, next: unknown): Record<string, unknown> | null {
  if (!isRecord(next)) return isRecord(prev) ? prev : null;
  if (!isRecord(prev) || prev.execution_id !== next.execution_id) return next;
  const prevSeq = typeof prev.seq === 'number' ? prev.seq : -1;
  const nextSeq = typeof next.seq === 'number' ? next.seq : Number.MAX_SAFE_INTEGER;
  return nextSeq > prevSeq ? next : prev;
}
