import { savedThinking } from '../thinking';
import type { AuriaChatMessage } from '../types';
import { applyWorkEvent, startWorkRun } from '../work/workRun';

const answer = (over: Partial<AuriaChatMessage> = {}): AuriaChatMessage => ({
  id: 'a-1',
  role: 'assistant',
  text: 'You have 3 tasks.',
  reasoningText: '  Looked at your tasks.\nlist_my_kanban_tasks  ',
  ...over,
});

const work = startWorkRun('tasks', 'fast', 0);

describe('savedThinking', () => {
  it('offers the saved reasoning of an answer from the history', () => {
    expect(savedThinking(answer())).toBe('Looked at your tasks.\nlist_my_kanban_tasks');
  });

  it('offers it for a turn that stopped or failed midway', () => {
    expect(savedThinking(answer({ work: applyWorkEvent(work, { type: 'stopped', at: 1 }) }))).not.toBeNull();
    expect(savedThinking(answer({ work: applyWorkEvent(work, { type: 'failed', at: 1 }) }))).not.toBeNull();
  });

  it('leaves it to the work panel for a turn that finished here', () => {
    expect(savedThinking(answer({ work: applyWorkEvent(work, { type: 'complete', at: 1 }) }))).toBeNull();
  });

  it('shows nothing while the answer is being written, without reasoning, or for the person', () => {
    expect(savedThinking(answer({ live: true }))).toBeNull();
    expect(savedThinking(answer({ reasoningText: '   ' }))).toBeNull();
    expect(savedThinking(answer({ reasoningText: undefined }))).toBeNull();
    expect(savedThinking(answer({ role: 'user' }))).toBeNull();
  });
});
