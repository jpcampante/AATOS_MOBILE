import type { AuriaApiError } from './api/errors';
import type { AuriaStreamEvent } from './api/streamEvents';
import type { ApiCanvasDocument } from './api/types';

/** Where one streamed answer is. `starting` until the server says it is thinking. */
export type AuriaRunStatus = 'starting' | 'thinking' | 'streaming' | 'done' | 'error' | 'stopped';

/** A tool the Auria used in this answer (e.g. `list_tasks` on the `tasks` service). */
export type AuriaRunTool = {
  id: number;
  name: string;
  service?: string;
  status: 'running' | 'done';
  ok?: boolean;
};

/** Everything the chat shows about the answer being written. */
export type AuriaRun = {
  status: AuriaRunStatus;
  startedAt: number;
  mode?: string;
  round: number;
  text: string;
  reasoning: string;
  tools: AuriaRunTool[];
  /** Documents this answer created or changed. */
  documents: ApiCanvasDocument[];
  proposals: Record<string, unknown>[];
  /** The latest web search snapshot (v2). */
  web: Record<string, unknown> | null;
  chatId: string | null;
  userMessageUuid: string | null;
  assistantMessageUuid: string | null;
  /** The server saved the turn (`saved` after `done`). */
  saved: boolean;
  error: AuriaApiError | null;
  /** Source of the last reasoning chunk: `model` chunks join, others start a new line. */
  lastReasoningSource: string | null;
};

export type AuriaRunAction =
  | { type: 'event'; event: AuriaStreamEvent }
  /** The person tapped Stop. */
  | { type: 'stop' }
  /** The request failed outside an `error` event (HTTP error, connection lost). */
  | { type: 'fail'; error: AuriaApiError };

export function createRun(now: number, chatId: string | null): AuriaRun {
  return {
    status: 'starting',
    startedAt: now,
    round: 0,
    text: '',
    reasoning: '',
    tools: [],
    documents: [],
    proposals: [],
    web: null,
    chatId,
    userMessageUuid: null,
    assistantMessageUuid: null,
    saved: false,
    error: null,
    lastReasoningSource: null,
  };
}

/**
 * How many UTF-16 units the last `codePoints` characters of `text` take.
 * The server counts like Python (code points); JS strings count UTF-16 units,
 * so an emoji is 1 there and 2 here.
 */
export function trailingUtf16Units(text: string, codePoints: number): number {
  let units = 0;
  for (let left = Math.floor(codePoints); left > 0 && units < text.length; left -= 1) {
    const end = text.length - 1 - units;
    const low = text.charCodeAt(end);
    const high = end > 0 ? text.charCodeAt(end - 1) : 0;
    const pair = low >= 0xdc00 && low <= 0xdfff && high >= 0xd800 && high <= 0xdbff;
    units += pair ? 2 : 1;
  }
  return units;
}

const finished = (run: AuriaRun) => run.status === 'done' || run.status === 'error' || run.status === 'stopped';

function upsertById<T extends { id?: unknown }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index < 0) return [...list, item];
  const next = list.slice();
  next[index] = item;
  return next;
}

function mergeWeb(prev: Record<string, unknown> | null, next: Record<string, unknown> | null) {
  if (!next) return prev;
  if (!prev || prev.execution_id !== next.execution_id) return next;
  const prevSeq = typeof prev.seq === 'number' ? prev.seq : -1;
  const nextSeq = typeof next.seq === 'number' ? next.seq : Number.MAX_SAFE_INTEGER;
  return nextSeq > prevSeq ? next : prev;
}

function applyEvent(run: AuriaRun, event: AuriaStreamEvent): AuriaRun {
  switch (event.type) {
    case 'chat':
      return { ...run, chatId: event.chatId, userMessageUuid: event.userMessageUuid };
    case 'status':
      if (event.phase === 'started') return { ...run, mode: event.mode ?? run.mode };
      if (event.phase === 'thinking') return { ...run, status: 'thinking', round: event.round ?? run.round + 1 };
      if (event.phase === 'streaming') return { ...run, status: 'streaming' };
      return run;
    case 'reasoning': {
      const join = event.source === 'model' && run.lastReasoningSource === 'model';
      const sep = !run.reasoning || join ? '' : '\n';
      return { ...run, reasoning: run.reasoning + sep + event.content, lastReasoningSource: event.source };
    }
    case 'tool': {
      if (event.status === 'running') {
        const tool: AuriaRunTool = { id: run.tools.length + 1, name: event.name, status: 'running' };
        if (event.service) tool.service = event.service;
        return { ...run, tools: [...run.tools, tool] };
      }
      const index = [...run.tools].reverse().findIndex((t) => t.name === event.name && t.status === 'running');
      if (index < 0) {
        const tool: AuriaRunTool = { id: run.tools.length + 1, name: event.name, status: 'done', ok: event.ok };
        if (event.service) tool.service = event.service;
        return { ...run, tools: [...run.tools, tool] };
      }
      const at = run.tools.length - 1 - index;
      const tools = run.tools.slice();
      tools[at] = { ...tools[at], status: 'done', ok: event.ok, ...(event.service ? { service: event.service } : null) };
      return { ...run, tools };
    }
    case 'delta':
      return { ...run, status: 'streaming', text: run.text + event.content };
    case 'delta_reset': {
      const units = trailingUtf16Units(run.text, event.chars);
      return units > 0 ? { ...run, text: run.text.slice(0, run.text.length - units) } : run;
    }
    case 'web_status':
      return { ...run, web: mergeWeb(run.web, event.web) };
    case 'canvas':
      return { ...run, documents: upsertById(run.documents, event.document) };
    case 'canvas_proposal':
      return { ...run, proposals: upsertById(run.proposals, event.proposal) };
    case 'assignment':
      return run;
    case 'done':
      return {
        ...run,
        status: 'done',
        text: event.response ?? run.text,
        reasoning: event.reasoning?.trim() ? event.reasoning : run.reasoning,
        documents: event.canvasDocuments ?? run.documents,
        web: mergeWeb(run.web, event.web),
      };
    case 'saved':
      return {
        ...run,
        saved: run.status === 'done' || run.saved,
        chatId: event.chatId ?? run.chatId,
        userMessageUuid: event.userMessageUuid ?? run.userMessageUuid,
        assistantMessageUuid: event.assistantMessageUuid ?? run.assistantMessageUuid,
        proposals: event.canvasProposals ?? run.proposals,
      };
    case 'error':
      return { ...run, status: 'error', error: event.error, chatId: event.chatId ?? run.chatId };
  }
}

export function runReducer(run: AuriaRun, action: AuriaRunAction): AuriaRun {
  switch (action.type) {
    case 'event':
      return applyEvent(run, action.event);
    case 'stop':
      return finished(run) ? run : { ...run, status: 'stopped' };
    case 'fail':
      return finished(run) ? run : { ...run, status: 'error', error: action.error };
  }
}
