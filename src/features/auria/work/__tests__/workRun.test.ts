import { describeWorkTool } from '../workTools';
import {
  applyWorkEvent,
  buildRunTitle,
  elapsedMs,
  startWorkRun,
  usedServices,
  visibleSections,
  visibleSteps,
  type WorkEvent,
  type WorkRun,
} from '../workRun';

const PROMPT = 'Summarize my Teams messages this week';
const run = (events: WorkEvent[], base?: WorkRun): WorkRun =>
  events.reduce(applyWorkEvent, base ?? startWorkRun(PROMPT, 'fast', 1000));

const labels = (r: WorkRun, section: string) =>
  r.sections.find((s) => s.id === section)!.steps.map((s) => `${s.label}:${s.status}`);

describe('workRun', () => {
  it('starts with the plan, already understanding the request', () => {
    const r = startWorkRun(PROMPT, 'fast', 1000);
    expect(labels(r, 'plan')).toEqual(['Understand the request:running', 'Scope: Summarize my Teams messages this…:pending']);
    expect(r.status).toBe('planning');
    expect(visibleSections(r).map((s) => s.id)).toEqual(['plan']);
  });

  it('`started` closes the plan and gathers the workspace context', () => {
    const r = run([{ type: 'status', phase: 'started', mode: 'deep' }]);
    expect(labels(r, 'plan')).toEqual(['Understand the request:done', 'Scope: Summarize my Teams messages this…:done']);
    expect(labels(r, 'research')).toEqual(['Gather workspace context:running']);
    expect(r.mode).toBe('deep');
  });

  it('the first model round plans the work', () => {
    const r = run([{ type: 'status', phase: 'thinking', round: 1 }]);
    expect(labels(r, 'plan')).toEqual([
      'Understand the request:done',
      'Scope: Summarize my Teams messages this…:done',
      'Plan the work:running',
    ]);
    expect(r.status).toBe('running');
  });

  it('later rounds review what the tools returned', () => {
    const r = run([
      { type: 'status', phase: 'thinking', round: 1 },
      { type: 'tool', name: 'list_emails', status: 'running', service: 'gmail' },
      { type: 'tool', name: 'list_emails', status: 'done', ok: true, service: 'gmail' },
      { type: 'status', phase: 'thinking', round: 2 },
    ]);
    expect(labels(r, 'research')).toEqual(['Read recent emails:done', 'Review what the sources returned:running']);
    expect(labels(r, 'plan')).toContain('Plan the work:done');
  });

  it('keeps the backend service on the step for the row of logos', () => {
    const r = run([
      { type: 'tool', name: 'list_emails', status: 'running', service: 'outlook' },
      { type: 'tool', name: 'list_emails', status: 'done', ok: true, service: 'outlook' },
      { type: 'tool', name: 'list_calendar_events', status: 'running', service: 'google-calendar' },
    ]);
    expect(usedServices(r)).toEqual(['outlook', 'google-calendar']);
  });

  it('falls back to the local family without a backend service', () => {
    expect(usedServices(run([{ type: 'tool', name: 'list_emails', status: 'running' }]))).toEqual(['mail']);
  });

  it('keeps what the model said, not the tool narration', () => {
    const r = run([
      { type: 'reasoning', content: "I'll check both inboxes first.", source: 'preamble' },
      { type: 'reasoning', content: 'Reading recent emails', source: 'tool' },
    ]);
    expect(r.said).toBe("I'll check both inboxes first.");
  });

  it('joins the model reasoning token by token and keeps only its tail', () => {
    const r = run([
      { type: 'reasoning', content: 'Look', source: 'model' },
      { type: 'reasoning', content: 'ing at the tasks', source: 'model' },
    ]);
    expect(r.said).toBe('Looking at the tasks');
    const long = run([{ type: 'reasoning', content: 'x'.repeat(300), source: 'preamble' }]);
    expect(long.said).toHaveLength(220);
    expect(long.said?.startsWith('…')).toBe(true);
  });

  it('marks a failed tool as an error', () => {
    const r = run([
      { type: 'tool', name: 'search_emails', status: 'running' },
      { type: 'tool', name: 'search_emails', status: 'done', ok: false },
    ]);
    expect(labels(r, 'research')).toEqual(['Search your email:error']);
  });

  it('writing the answer is a create step; a retracted preamble removes it', () => {
    const writing = run([{ type: 'answer' }]);
    expect(labels(writing, 'create')).toEqual(['Write the answer:running']);
    expect(writing.status).toBe('writing');
    expect(run([{ type: 'answer' }], writing)).toEqual(writing);

    const retracted = applyWorkEvent(writing, { type: 'answer_retracted' });
    expect(labels(retracted, 'create')).toEqual([]);
    expect(retracted.status).toBe('running');
  });

  it('a delivered document changes the story', () => {
    const r = run([{ type: 'canvas', name: 'Teams Summary' }, { type: 'answer' }]);
    expect(r.deliverable).toBe('document');
    expect(r.delivered).toEqual(['Teams Summary']);
    expect(labels(r, 'deliver')).toEqual(['Package the document:done']);
    expect(labels(r, 'create')).toEqual(['Draft the document:running']);
  });

  it('on complete, running steps are done and the clock stops', () => {
    const r = run([
      { type: 'tool', name: 'list_my_kanban_tasks', status: 'running' },
      { type: 'answer' },
      { type: 'complete', at: 7000 },
    ]);
    expect(r.status).toBe('complete');
    expect(r.finishedAt).toBe(7000);
    expect(labels(r, 'research')).toEqual(['Scan your tasks:done']);
    expect(labels(r, 'create')).toEqual(['Write the answer:done']);
    expect(elapsedMs(r, 99999)).toBe(6000);
  });

  it('a stop does not count the half-done step as done', () => {
    const r = run([
      { type: 'tool', name: 'search_documents', status: 'running' },
      { type: 'stopped', at: 13000 },
    ]);
    expect(labels(r, 'research')).toEqual(['Search your documents:pending']);
    expect(r.status).toBe('stopped');
  });

  it('late events do not bring a finished turn back', () => {
    const finished = run([{ type: 'complete', at: 2000 }]);
    expect(applyWorkEvent(finished, { type: 'tool', name: 'list_emails', status: 'running' })).toBe(finished);
    expect(applyWorkEvent(finished, { type: 'failed', at: 3000 })).toBe(finished);
  });

  it('lists the visible steps in order', () => {
    const r = run([{ type: 'status', phase: 'started' }, { type: 'tool', name: 'list_emails', status: 'running' }]);
    expect(visibleSteps(r).map((s) => s.label)).toEqual([
      'Understand the request',
      'Scope: Summarize my Teams messages this…',
      'Gather workspace context',
      'Read recent emails',
    ]);
  });
});

describe('buildRunTitle', () => {
  it('capitalizes, collapses spaces and cuts at 32 characters', () => {
    expect(buildRunTitle('  what   are my tasks? ')).toBe('What are my tasks?');
    expect(buildRunTitle('')).toBe('Run');
    expect(buildRunTitle('a'.repeat(40))).toBe(`A${'a'.repeat(31)}…`);
  });
});

describe('describeWorkTool', () => {
  it.each([
    ['list_emails', 'research', 'Read recent emails'],
    ['list_calendar_events', 'research', 'Check your calendar'],
    ['list_my_kanban_tasks', 'research', 'Scan your tasks'],
    ['create_kanban_task', 'create', 'Update the tasks'],
    ['create_canvas_document', 'create', 'Build the document'],
    ['search_web', 'research', 'Search the web'],
    ['gather_context', 'research', 'Gather workspace context'],
  ])('%s → %s / %s', (name, section, label) => {
    expect(describeWorkTool(name)).toMatchObject({ section, label });
  });

  it('still says something about an unknown tool', () => {
    expect(describeWorkTool('get_sales_pipeline')).toMatchObject({ section: 'research', label: 'Read sales pipeline' });
    expect(describeWorkTool('send_invoice')).toMatchObject({ section: 'create', label: 'Send invoice' });
    expect(describeWorkTool('pipeline')).toMatchObject({ label: 'Work on pipeline' });
  });
});
