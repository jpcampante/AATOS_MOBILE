import type { AuriaApiError } from './api/errors';
import type { AuriaStreamEvent } from './api/streamEvents';
import type { ApiCanvasDocument } from './api/types';
import { applyWorkEvent, startWorkRun, type WorkEvent, type WorkMode, type WorkRun } from './work/workRun';

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
  /** The "Working for 6s" panel: the steps of this turn. */
  work: WorkRun;
};

/** `at` is when it happened (the panel's clock stops there); defaults to now. */
export type AuriaRunAction =
  | { type: 'event'; event: AuriaStreamEvent; at?: number }
  /** The person tapped Stop. */
  | { type: 'stop'; at?: number }
  /** The request failed outside an `error` event (HTTP error, connection lost). */
  | { type: 'fail'; error: AuriaApiError; at?: number };

/** What the panel needs to know about the turn: the question and the mode it was sent in. */
export type RunRequest = { prompt: string; mode: WorkMode };

export function createRun(now: number, chatId: string | null, request: RunRequest = { prompt: '', mode: 'fast' }): AuriaRun {
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
    work: startWorkRun(request.prompt, request.mode, now),
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

/** The panel step a stream event stands for, if any. */
function workEventFor(event: AuriaStreamEvent, at: number): WorkEvent | null {
  switch (event.type) {
    case 'status':
      return { type: 'status', phase: event.phase, round: event.round, mode: event.mode };
    case 'tool':
      return { type: 'tool', name: event.name, status: event.status, ok: event.ok, service: event.service };
    case 'reasoning':
      return { type: 'reasoning', content: event.content, source: event.source };
    case 'delta':
      return event.content ? { type: 'answer' } : null;
    case 'delta_reset':
      return { type: 'answer_retracted' };
    case 'canvas':
      return { type: 'canvas', name: event.document.title };
    case 'done':
      return { type: 'complete', at };
    case 'error':
      return { type: 'failed', at };
    default:
      return null;
  }
}

function withWork(run: AuriaRun, event: WorkEvent | null): AuriaRun {
  return event ? { ...run, work: applyWorkEvent(run.work, event) } : run;
}

export function runReducer(run: AuriaRun, action: AuriaRunAction): AuriaRun {
  const at = action.at ?? Date.now();
  switch (action.type) {
    case 'event':
      return withWork(applyEvent(run, action.event), workEventFor(action.event, at));
    case 'stop':
      return finished(run) ? run : withWork({ ...run, status: 'stopped' }, { type: 'stopped', at });
    case 'fail':
      return finished(run) ? run : withWork({ ...run, status: 'error', error: action.error }, { type: 'failed', at });
  }
}
