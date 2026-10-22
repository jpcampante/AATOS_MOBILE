/**
 * The work of one Auria turn, as the "Working for 6s" panel shows it: sections
 * plan / research / create / deliver, each with steps that go from `running`
 * to `done`. Same model as the web (`thinking/workRun.ts`); every step comes
 * from a real stream event:
 *
 *   (send)            → "Understand the request"
 *   status started    → the server builds the turn's context → "Gather workspace context"
 *   status thinking   → a model round → "Plan the work" (later rounds: "Review what the sources returned")
 *   tool running/done → a research step (or create, when it writes)
 *   delta (first)     → "Write the answer" / "Draft the document"
 *   canvas            → "Package the document"
 *
 * Without tools no steps are invented: just the plan and the writing.
 */
import { describeWorkTool } from './workTools';

export type WorkStepStatus = 'pending' | 'running' | 'done' | 'error';
export type WorkSectionId = 'plan' | 'research' | 'create' | 'deliver';
export type WorkRunStatus = 'planning' | 'running' | 'writing' | 'complete' | 'stopped' | 'failed';
export type WorkMode = 'fast' | 'deep';

export type WorkStep = {
  id: string;
  label: string;
  status: WorkStepStatus;
  /** The service touched, as the backend names it (`gmail`, `outlook`, `tasks`…). */
  service?: string;
};

export type WorkSection = { id: WorkSectionId; steps: WorkStep[] };

export type WorkRun = {
  startedAt: number;
  finishedAt?: number;
  status: WorkRunStatus;
  mode: WorkMode;
  /** The request, for the "Scope: …" step. */
  title: string;
  /** A document turn tells a different story than an answer. */
  deliverable: 'answer' | 'document';
  sections: WorkSection[];
  /** Documents delivered by a canvas tool. */
  delivered: string[];
  /** The tail of what the model said before acting, in its own words. */
  said?: string;
};

export type WorkEvent =
  | { type: 'status'; phase: string; round?: number; mode?: string }
  | { type: 'tool'; name: string; status: string; ok?: boolean; service?: string }
  | { type: 'reasoning'; content: string; source: string }
  | { type: 'answer' }
  /** What came out was a preamble and the backend took it back: not the answer. */
  | { type: 'answer_retracted' }
  | { type: 'canvas'; name?: string }
  | { type: 'complete'; at: number }
  | { type: 'stopped'; at: number }
  | { type: 'failed'; at: number };

const SECTION_ORDER: WorkSectionId[] = ['plan', 'research', 'create', 'deliver'];

/** "Summarize my Teams messages this…" (32 characters, capitalized). */
export function buildRunTitle(prompt: string): string {
  const clean = (prompt ?? '').trim().replace(/\s+/g, ' ');
  if (!clean) return 'Run';
  const capped = clean.charAt(0).toUpperCase() + clean.slice(1);
  return capped.length > 32 ? `${capped.slice(0, 32)}…` : capped;
}

export function isWorkRunActive(status: WorkRunStatus): boolean {
  return status === 'planning' || status === 'running' || status === 'writing';
}

export function startWorkRun(
  prompt: string,
  mode: WorkMode,
  startedAt: number,
  deliverable: WorkRun['deliverable'] = 'answer',
): WorkRun {
  const title = buildRunTitle(prompt);
  return {
    startedAt,
    status: 'planning',
    mode,
    title,
    deliverable,
    delivered: [],
    sections: [
      {
        id: 'plan',
        // Running from the moment the person taps send: the panel says something right away.
        steps: [
          { id: 'understand-request', label: 'Understand the request', status: 'running' },
          { id: 'scope-work', label: `Scope: ${title}`, status: 'pending' },
        ],
      },
      { id: 'research', steps: [] },
      { id: 'create', steps: [] },
      { id: 'deliver', steps: [] },
    ],
  };
}

function section(run: WorkRun, id: WorkSectionId): WorkSection {
  return run.sections.find((s) => s.id === id) ?? { id, steps: [] };
}

function withSection(run: WorkRun, id: WorkSectionId, steps: WorkStep[]): WorkRun {
  return { ...run, sections: SECTION_ORDER.map((sid) => (sid === id ? { id, steps } : section(run, sid))) };
}

const settle = (steps: WorkStep[]): WorkStep[] =>
  steps.map((step) => (step.status === 'running' ? { ...step, status: 'done' } : step));

/** Closes what was running in a section (the next step takes its place). */
const settleSection = (run: WorkRun, id: WorkSectionId) => withSection(run, id, settle(section(run, id).steps));

/** Opens a step, without repeating it. */
function openStep(run: WorkRun, id: WorkSectionId, step: { id: string; label: string; service?: string }): WorkRun {
  const steps = section(run, id).steps;
  if (steps.some((s) => s.id === step.id)) return run;
  return withSection(run, id, [...settle(steps), { ...step, status: 'running' }]);
}

/** The end of what the model has been saying: one place, not a history. */
function tailOf(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= 220 ? clean : `…${clean.slice(clean.length - 219).trimStart()}`;
}

/** The plan closes as soon as the model starts acting: it was understood and scoped. */
function closePlan(run: WorkRun): WorkRun {
  const steps = section(run, 'plan').steps;
  if (steps.every((step) => step.status === 'done')) return run;
  return withSection(run, 'plan', steps.map((step) => ({ ...step, status: 'done' as const })));
}

export function applyWorkEvent(run: WorkRun, event: WorkEvent): WorkRun {
  // A finished turn doesn't go back: the first ending wins.
  if (!isWorkRunActive(run.status)) return run;

  switch (event.type) {
    case 'status': {
      if (event.phase === 'started') {
        const mode = event.mode === 'fast' || event.mode === 'deep' ? event.mode : run.mode;
        const next = closePlan({ ...run, mode, status: 'running' });
        return openStep(next, 'research', { id: 'build-context', label: 'Gather workspace context', service: 'workspace' });
      }
      if (event.phase === 'thinking') {
        // The first model round plans; later ones fold in what the tools returned.
        const next = closePlan({ ...run, status: 'running' });
        const first = (event.round ?? 1) <= 1;
        return openStep(
          settleSection(next, 'research'),
          first ? 'plan' : 'research',
          first
            ? { id: 'plan-work', label: 'Plan the work' }
            : { id: `review-${event.round}`, label: 'Review what the sources returned' },
        );
      }
      return run;
    }

    case 'reasoning': {
      const content = (event.content ?? '').trim();
      if (!content || event.source === 'tool') return run;
      // A preamble is a whole sentence; the model's reasoning comes token by token.
      const said = event.source === 'model' ? `${run.said ?? ''}${event.content}` : content;
      return { ...run, said: tailOf(said) };
    }

    case 'tool': {
      if (!event.name) return run;
      const tool = describeWorkTool(event.name);
      const steps = section(run, tool.section).steps;

      if (event.status === 'running') {
        // A tool starting closes what was running: no longer planning or gathering context.
        const next = settleSection(settleSection(closePlan({ ...run, status: 'running' }), 'plan'), 'research');
        return withSection(next, tool.section, [
          ...settle(section(next, tool.section).steps),
          // The service comes from the backend; the local family is only a fallback.
          { id: `${event.name}-${steps.length}`, label: tool.label, status: 'running', service: event.service || tool.service },
        ]);
      }
      if (event.status === 'done') {
        for (let i = steps.length - 1; i >= 0; i -= 1) {
          if (steps[i].status === 'running' && steps[i].id.startsWith(`${event.name}-`)) {
            const copy = steps.slice();
            copy[i] = { ...copy[i], status: event.ok === false ? 'error' : 'done' };
            return withSection(run, tool.section, copy);
          }
        }
      }
      return run;
    }

    case 'answer': {
      if (section(run, 'create').steps.some((step) => step.id === 'write-answer')) return { ...run, status: 'writing' };
      const label = run.deliverable === 'document' ? 'Draft the document' : 'Write the answer';
      const next = settleSection(settleSection(closePlan({ ...run, status: 'writing' }), 'plan'), 'research');
      return withSection(next, 'create', [
        ...settle(section(next, 'create').steps),
        { id: 'write-answer', label, status: 'running' },
      ]);
    }

    case 'answer_retracted': {
      const create = section(run, 'create').steps.filter((s) => !(s.id === 'write-answer' && s.status === 'running'));
      return withSection({ ...run, status: 'running' }, 'create', create);
    }

    case 'canvas': {
      const delivered = event.name ? [...run.delivered, event.name] : run.delivered;
      return withSection({ ...run, delivered, deliverable: 'document' }, 'deliver', [
        ...settle(section(run, 'deliver').steps),
        { id: `deliver-${run.delivered.length}`, label: 'Package the document', status: 'done' },
      ]);
    }

    case 'complete':
    case 'stopped':
    case 'failed': {
      const status: WorkRunStatus =
        event.type === 'complete' ? 'complete' : event.type === 'stopped' ? 'stopped' : 'failed';
      return {
        ...closePlan(run),
        status,
        finishedAt: run.finishedAt ?? event.at,
        sections: run.sections.map((s) => ({
          ...s,
          steps: s.steps.map((step) =>
            step.status === 'running'
              ? // Stopping midway doesn't count as done; a normal ending does.
                { ...step, status: event.type === 'complete' ? ('done' as const) : ('pending' as const) }
              : step,
          ),
        })),
      };
    }
  }
}

/** Sections with a visible step, in panel order. */
export function visibleSections(run: WorkRun): WorkSection[] {
  return SECTION_ORDER.map((id) => section(run, id)).filter((s) => s.steps.some((step) => step.status !== 'pending'));
}

/** The visible steps, in order. */
export function visibleSteps(run: WorkRun): WorkStep[] {
  return visibleSections(run).flatMap((s) => s.steps.filter((step) => step.status !== 'pending'));
}

export function elapsedMs(run: WorkRun, now: number): number {
  return (run.finishedAt ?? now) - run.startedAt;
}

/** The services touched, in order, without repeats: the row of logos above the answer. */
export function usedServices(run: WorkRun): string[] {
  const out: string[] = [];
  for (const s of run.sections) {
    for (const step of s.steps) {
      if (step.service && step.status !== 'pending' && !out.includes(step.service)) out.push(step.service);
    }
  }
  return out;
}
