import { fireEvent, screen } from '@testing-library/react-native';
import type { AuriaChatMessage } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaChatView } from '../AuriaChatView';

const question: AuriaChatMessage = {
  id: 'u-2',
  serverId: 'u-2',
  role: 'user',
  text: 'What are my tasks this week?',
  version: { index: 2, count: 2, ids: ['u-1', 'u-2'] },
};
const answer: AuriaChatMessage = {
  id: 'a-3',
  serverId: 'a-3',
  role: 'assistant',
  text: 'Five tasks.',
  version: { index: 1, count: 3, ids: ['a-3', 'a-4', 'a-5'] },
};

describe('AuriaChatView — versions (H6.3)', () => {
  it('shows `< n/m >` on an edited question and a retried answer', () => {
    renderWithTheme(<AuriaChatView messages={[question, answer]} onSwitchVersion={jest.fn()} />);
    expect(screen.getByLabelText('Version 2 of 2')).toBeTruthy();
    expect(screen.getByLabelText('Version 1 of 3')).toBeTruthy();
  });

  it('switches the version of that message', () => {
    const onSwitchVersion = jest.fn();
    renderWithTheme(<AuriaChatView messages={[question, answer]} onSwitchVersion={onSwitchVersion} />);

    const [questionPrev, answerPrev] = screen.getAllByRole('button', { name: 'Previous version' });
    const [, answerNext] = screen.getAllByRole('button', { name: 'Next version' });
    fireEvent.press(questionPrev);
    fireEvent.press(answerNext);
    expect(answerPrev).toBeDisabled();
    expect(onSwitchVersion.mock.calls).toEqual([
      ['u-2', -1],
      ['a-3', 1],
    ]);
  });

  it('shows the spinner on the message that is switching', () => {
    renderWithTheme(<AuriaChatView messages={[question, answer]} onSwitchVersion={jest.fn()} switchingVersionOf="a-3" />);
    expect(screen.getByTestId('version-switching')).toBeTruthy();
    expect(screen.getByText('2/2')).toBeTruthy();
  });

  it('shows nothing for a message with a single version', () => {
    renderWithTheme(<AuriaChatView messages={[{ ...question, version: undefined }]} onSwitchVersion={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Previous version' })).toBeNull();
  });
});
