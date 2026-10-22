/** The words of the work panel: the same voice as the web (`AuriaWorkPanel.tsx`, `workRun.ts`). */
import { isWorkRunActive, type WorkRun, type WorkSectionId, type WorkStep } from './workRun';

const DONE_VERBS: [RegExp, string][] = [
  [/^Understand\b/i, 'Understood'],
  [/^Plan\b/i, 'Planned'],
  [/^Scope\b/i, 'Scoped'],
  [/^Identify\b/i, 'Identified'],
  [/^Load\b/i, 'Loaded'],
  [/^Gather\b/i, 'Gathered'],
  [/^Check\b/i, 'Checked'],
  [/^Build\b/i, 'Built'],
  [/^Draft\b/i, 'Drafted'],
  [/^Review\b/i, 'Reviewed'],
  [/^Package\b/i, 'Packaged'],
  [/^Create\b/i, 'Created'],
  [/^Prepare\b/i, 'Prepared'],
  [/^Read\b/i, 'Read'],
  [/^Search\b/i, 'Searched'],
  [/^List\b/i, 'Listed'],
  [/^Scan\b/i, 'Scanned'],
  [/^Update\b/i, 'Updated'],
  [/^Send\b/i, 'Sent'],
  [/^Find\b/i, 'Found'],
  [/^Write\b/i, 'Wrote'],
  [/^Work on\b/i, 'Worked on'],
];

const ACTIVE_VERBS: [RegExp, string][] = [
  [/^Understand\b/i, 'Understanding'],
  [/^Plan\b/i, 'Planning'],
  [/^Scope\b/i, 'Scoping'],
  [/^Identify\b/i, 'Identifying'],
  [/^Load\b/i, 'Loading'],
  [/^Gather\b/i, 'Gathering'],
  [/^Check\b/i, 'Checking'],
  [/^Build\b/i, 'Building'],
  [/^Draft\b/i, 'Drafting'],
  [/^Review\b/i, 'Reviewing'],
  [/^Package\b/i, 'Packaging'],
  [/^Create\b/i, 'Creating'],
  [/^Prepare\b/i, 'Preparing'],
  [/^Read\b/i, 'Reading'],
  [/^Search\b/i, 'Searching'],
  [/^List\b/i, 'Listing'],
  [/^Scan\b/i, 'Scanning'],
  [/^Update\b/i, 'Updating'],
  [/^Send\b/i, 'Sending'],
  [/^Find\b/i, 'Finding'],
  [/^Write\b/i, 'Writing'],
  [/^Work on\b/i, 'Working on'],
];

function replaceOpeningVerb(label: string, verbs: [RegExp, string][]): string {
  for (const [pattern, replacement] of verbs) {
    if (pattern.test(label)) return label.replace(pattern, replacement);
  }
  return label;
}

/** "Checking your calendar" while it runs, "Checked your calendar" when done. */
export function stepLabel(step: WorkStep): string {
  if (step.status === 'running') {
    const active = replaceOpeningVerb(step.label, ACTIVE_VERBS);
    return active === step.label ? `Working on ${step.label.toLowerCase()}` : active;
  }
  if (step.status === 'done') return replaceOpeningVerb(step.label, DONE_VERBS);
  if (step.status === 'error') return `Could not complete ${step.label.toLowerCase()}`;
  return step.label;
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

/** The closed line: "Working for 6s" while it runs, "Reasoned for 8 seconds · Fast" when done. */
export function disclosureLabel(run: WorkRun, ms: number): string {
  const time = formatElapsed(ms);
  const mode = run.mode === 'deep' ? 'Deep' : 'Fast';
  if (run.status === 'complete') {
    const seconds = Math.max(0, Math.round(ms / 1000));
    const spelled = seconds < 60 ? `${seconds} second${seconds === 1 ? '' : 's'}` : time;
    return `Reasoned for ${spelled} · ${mode}`;
  }
  if (run.status === 'stopped' || run.status === 'failed') return `Stopped after ${time} · ${mode}`;
  return `Working for ${time}`;
}

export function runIntro(run: WorkRun): string {
  const active = isWorkRunActive(run.status);
  if (run.deliverable === 'document') {
    return active
      ? 'I’m turning your request into an editable document. I’ll shape the structure, build the content, review the result, and keep the final output ready to continue editing here.'
      : 'I turned your request into an editable document, reviewed the structure and content, and prepared the final output for continued editing.';
  }
  return active
    ? 'I’m working through your request. I’ll map what you asked, check the sources that apply, and write the answer here.'
    : 'I worked through your request, checked the sources that applied, and wrote the answer here.';
}

export function sectionNarrative(run: WorkRun, id: WorkSectionId): string {
  const steps = run.sections.find((s) => s.id === id)?.steps ?? [];
  const settled = steps.length > 0 && steps.every((step) => step.status !== 'running');
  const noun = run.deliverable === 'document' ? 'the document' : 'the answer';
  switch (id) {
    case 'plan':
      return settled
        ? `The direction is set. I mapped the request into a clear sequence before creating ${noun}.`
        : 'I’m defining the scope and turning the request into a clear execution plan.';
    case 'research':
      return settled
        ? `I checked the workspace context and recent activity that could strengthen ${noun}.`
        : 'I’m reading the available context and checking what is useful for this request.';
    case 'create':
      if (run.deliverable === 'document') {
        return settled
          ? 'The document is built. I tightened the structure, copy, and overall flow before delivery.'
          : 'The direction is ready. I’m building the document and tightening the structure, copy, and overall flow.';
      }
      return settled
        ? 'The answer is written from what the sources returned.'
        : 'The direction is ready. I’m writing the answer from what the sources returned.';
    case 'deliver':
      return settled
        ? 'The final document is packaged and ready to open.'
        : 'I’m packaging the final document so it stays editable and ready to open here.';
  }
}
