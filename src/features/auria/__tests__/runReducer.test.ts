import { AuriaApiError, connectionLostError } from '../api/errors';
import type { AuriaStreamEvent } from '../api/streamEvents';
import { createRun, runReducer, trailingUtf16Units, type AuriaRun } from '../runReducer';

const play = (events: AuriaStreamEvent[], run: AuriaRun = createRun(1000, null)) =>
  events.reduce((state, event) => runReducer(state, { type: 'event', event }), run);

describe('runReducer', () => {
  it('follows a full turn with tools', () => {
    const run = play([
      { type: 'chat', chatId: 'c-1', userMessageUuid: 'u-1' },
      { type: 'status', phase: 'started', mode: 'fast' },
      { type: 'status', phase: 'thinking', round: 1 },
      { type: 'reasoning', content: 'Looking at ', source: 'model' },
      { type: 'reasoning', content: 'your tasks.', source: 'model' },
      { type: 'tool', name: 'list_tasks', status: 'running', service: 'tasks' },
      { type: 'reasoning', content: 'list_tasks', source: 'tool', tool: 'list_tasks' },
      { type: 'tool', name: 'list_tasks', status: 'done', ok: true, service: 'tasks' },
      { type: 'status', phase: 'streaming' },
      { type: 'delta', content: 'You have ' },
      { type: 'delta', content: '3 tasks.' },
      { type: 'done', response: 'You have 3 tasks.', reasoning: null, canvasDocuments: null, web: null, model: 'm' },
      { type: 'saved', chatId: 'c-1', userMessageUuid: 'u-1', assistantMessageUuid: 'a-1', canvasDocuments: [], canvasProposals: [] },
    ]);
    expect(run.status).toBe('done');
    expect(run.saved).toBe(true);
    expect(run.mode).toBe('fast');
    expect(run.round).toBe(1);
    expect(run.chatId).toBe('c-1');
    expect(run.assistantMessageUuid).toBe('a-1');
    expect(run.text).toBe('You have 3 tasks.');
    expect(run.reasoning).toBe('Looking at your tasks.\nlist_tasks');
    expect(run.tools).toEqual([{ id: 1, name: 'list_tasks', service: 'tasks', status: 'done', ok: true }]);
  });

  it('removes a preamble on delta_reset, counting code points like the server', () => {
    const run = play([
      { type: 'delta', content: 'Answer. ' },
      { type: 'delta', content: 'Let me check 🎉' },
      // "Let me check 🎉" is 14 code points but 15 UTF-16 units.
      { type: 'delta_reset', chars: 14, reason: 'preamble' },
    ]);
    expect(run.text).toBe('Answer. ');
  });

  it('keeps the streamed text when done has no response', () => {
    const run = play([
      { type: 'delta', content: 'Streamed' },
      { type: 'done', response: null, reasoning: null, canvasDocuments: null, web: null, model: null },
    ]);
    expect(run.text).toBe('Streamed');
  });

  it('upserts documents and proposals by id', () => {
    const doc = { id: 'd-1', title: 'Plan', format: 'markdown', version: 1 };
    const run = play([
      { type: 'canvas', action: 'created', document: doc },
      { type: 'canvas', action: 'updated', document: { ...doc, version: 2 } },
      { type: 'canvas_proposal', proposal: { id: 'p-1', status: 'pending' } },
      { type: 'canvas_proposal', proposal: { id: 'p-1', status: 'applied' } },
    ]);
    expect(run.documents).toEqual([{ ...doc, version: 2 }]);
    expect(run.proposals).toEqual([{ id: 'p-1', status: 'applied' }]);
  });

  it('keeps only newer web snapshots of the same execution', () => {
    const run = play([
      { type: 'web_status', web: { execution_id: 'e', seq: 2, phase: 'searching' } },
      { type: 'web_status', web: { execution_id: 'e', seq: 1, phase: 'stale' } },
      { type: 'web_status', web: { execution_id: 'e', seq: 3, phase: 'done' } },
    ]);
    expect(run.web).toEqual({ execution_id: 'e', seq: 3, phase: 'done' });
  });

  it('keeps the partial text on an error event', () => {
    const error = new AuriaApiError({ code: 'provider_timeout' });
    const run = play([
      { type: 'delta', content: 'Half an ans' },
      { type: 'error', error, chatId: 'c-2', partial: true, requiredTokens: null },
    ]);
    expect(run.status).toBe('error');
    expect(run.error).toBe(error);
    expect(run.text).toBe('Half an ans');
    expect(run.chatId).toBe('c-2');
  });

  it('marks a run stopped by the person', () => {
    const run = runReducer(play([{ type: 'delta', content: 'abc' }]), { type: 'stop' });
    expect(run.status).toBe('stopped');
    expect(run.text).toBe('abc');
  });

  it('turns a failure into an error but never undoes a finished turn', () => {
    const failed = runReducer(play([{ type: 'delta', content: 'x' }]), { type: 'fail', error: connectionLostError() });
    expect(failed.status).toBe('error');
    expect(failed.error?.code).toBe('connection_lost');

    const finished = play([
      { type: 'done', response: 'ok', reasoning: null, canvasDocuments: null, web: null, model: null },
    ]);
    expect(runReducer(finished, { type: 'fail', error: connectionLostError() }).status).toBe('done');
    expect(runReducer(finished, { type: 'stop' }).status).toBe('done');
  });
});

describe('trailingUtf16Units', () => {
  it('counts surrogate pairs as one code point', () => {
    expect(trailingUtf16Units('ab🎉', 1)).toBe(2);
    expect(trailingUtf16Units('ab🎉', 2)).toBe(3);
    expect(trailingUtf16Units('ação', 2)).toBe(2);
    expect(trailingUtf16Units('ab', 10)).toBe(2);
  });
});
