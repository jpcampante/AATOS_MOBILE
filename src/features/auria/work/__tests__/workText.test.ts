import { applyWorkEvent, startWorkRun } from '../workRun';
import { disclosureLabel, formatElapsed, runIntro, sectionNarrative, stepLabel } from '../workText';

describe('stepLabel', () => {
  it('conjugates the verb by status', () => {
    const step = { id: 's', label: 'Check your calendar' };
    expect(stepLabel({ ...step, status: 'running' })).toBe('Checking your calendar');
    expect(stepLabel({ ...step, status: 'done' })).toBe('Checked your calendar');
    expect(stepLabel({ ...step, status: 'error' })).toBe('Could not complete check your calendar');
    expect(stepLabel({ ...step, status: 'pending' })).toBe('Check your calendar');
  });

  it('says "Working on" for a label without a known verb', () => {
    expect(stepLabel({ id: 's', label: 'Pipeline', status: 'running' })).toBe('Working on pipeline');
  });
});

describe('formatElapsed', () => {
  it('shows seconds, then minutes', () => {
    expect(formatElapsed(0)).toBe('0s');
    expect(formatElapsed(6400)).toBe('6s');
    expect(formatElapsed(60000)).toBe('1m');
    expect(formatElapsed(95000)).toBe('1m 35s');
  });
});

describe('disclosureLabel', () => {
  const base = startWorkRun('x', 'fast', 0);

  it('counts while it works', () => {
    expect(disclosureLabel(base, 6000)).toBe('Working for 6s');
    expect(disclosureLabel(base, 95000)).toBe('Working for 1m 35s');
  });

  it('says how long it reasoned, with the mode', () => {
    const done = applyWorkEvent(base, { type: 'complete', at: 1000 });
    expect(disclosureLabel(done, 1000)).toBe('Reasoned for 1 second · Fast');
    expect(disclosureLabel({ ...done, mode: 'deep' }, 8000)).toBe('Reasoned for 8 seconds · Deep');
    expect(disclosureLabel(done, 75000)).toBe('Reasoned for 1m 15s · Fast');
  });

  it('says when it stopped or failed', () => {
    expect(disclosureLabel(applyWorkEvent(base, { type: 'stopped', at: 12000 }), 12000)).toBe('Stopped after 12s · Fast');
    expect(disclosureLabel(applyWorkEvent(base, { type: 'failed', at: 3000 }), 3000)).toBe('Stopped after 3s · Fast');
  });
});

describe('narrative', () => {
  it('speaks in the present while it works and in the past when done', () => {
    const live = startWorkRun('x', 'fast', 0);
    expect(runIntro(live)).toMatch(/^I’m working through/);
    expect(runIntro(applyWorkEvent(live, { type: 'complete', at: 1 }))).toMatch(/^I worked through/);
  });

  it('tells the document story after a canvas', () => {
    const doc = applyWorkEvent(startWorkRun('x', 'fast', 0), { type: 'canvas', name: 'Plan' });
    expect(runIntro(doc)).toMatch(/editable document/);
    expect(sectionNarrative(doc, 'deliver')).toBe('The final document is packaged and ready to open.');
  });

  it('describes each section by whether it is settled', () => {
    const live = startWorkRun('x', 'fast', 0);
    expect(sectionNarrative(live, 'plan')).toMatch(/^I’m defining the scope/);
    const planned = applyWorkEvent(live, { type: 'status', phase: 'started' });
    expect(sectionNarrative(planned, 'plan')).toMatch(/^The direction is set/);
    expect(sectionNarrative(planned, 'research')).toMatch(/^I’m reading the available context/);
  });
});
