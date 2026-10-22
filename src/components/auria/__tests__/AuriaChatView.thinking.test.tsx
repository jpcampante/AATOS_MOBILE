import { fireEvent, screen } from '@testing-library/react-native';
import type { AuriaChatMessage } from '../../../features/auria/types';
import { applyWorkEvent, startWorkRun } from '../../../features/auria/work/workRun';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaChatView } from '../AuriaChatView';

const question: AuriaChatMessage = { id: 'u-1', role: 'user', text: 'What are my tasks today?' };
const answer = (over: Partial<AuriaChatMessage> = {}): AuriaChatMessage => ({
  id: 'a-1',
  role: 'assistant',
  text: 'You have 3 tasks.',
  reasoningText: 'I will check the task board first.',
  ...over,
});

describe('AuriaChatView — saved thinking (H2.3)', () => {
  it('shows "Thinking" on an answer reopened from the history and opens the reasoning', () => {
    renderWithTheme(<AuriaChatView messages={[question, answer()]} />);

    fireEvent.press(screen.getByRole('button', { name: 'Thinking' }));

    expect(screen.getByText('I will check the task board first.')).toBeTruthy();
  });

  it('keeps it for a turn that stopped midway', () => {
    const stopped = applyWorkEvent(startWorkRun('tasks', 'fast', 0), { type: 'stopped', at: 3000 });
    renderWithTheme(<AuriaChatView messages={[question, answer({ work: stopped, status: 'stopped' })]} />);

    expect(screen.getByRole('button', { name: 'Thinking' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stopped after 3s · Fast' })).toBeTruthy();
  });

  it('lets the work panel tell a turn that finished here', () => {
    const done = applyWorkEvent(startWorkRun('tasks', 'fast', 0), { type: 'complete', at: 2000 });
    renderWithTheme(<AuriaChatView messages={[question, answer({ work: done })]} />);

    expect(screen.queryByRole('button', { name: 'Thinking' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Reasoned for 2 seconds · Fast' })).toBeTruthy();
  });
});
