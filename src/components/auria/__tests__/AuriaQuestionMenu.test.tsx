import { fireEvent, screen } from '@testing-library/react-native';
import type { AuriaChatMessage } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaQuestionMenu } from '../AuriaQuestionMenu';

const question: AuriaChatMessage = { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' };

describe('AuriaQuestionMenu', () => {
  it('copies or edits the question, closing the sheet first', () => {
    const onClose = jest.fn();
    const onCopy = jest.fn();
    const onEdit = jest.fn();
    renderWithTheme(<AuriaQuestionMenu message={question} onClose={onClose} onCopy={onCopy} onEdit={onEdit} />);

    expect(screen.getByRole('header', { name: 'What are my tasks?' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    expect(onClose).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalledWith(question);

    fireEvent.press(screen.getByRole('button', { name: 'Copy' }));
    expect(onCopy).toHaveBeenCalledWith(question);
  });

  it('has no Edit when the chat cannot continue or the message is not saved', () => {
    const { rerender } = renderWithTheme(<AuriaQuestionMenu message={question} onClose={jest.fn()} onCopy={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();

    rerender(<AuriaQuestionMenu message={{ ...question, serverId: undefined }} onClose={jest.fn()} onCopy={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('shortens a long question in the title and closes from the backdrop', () => {
    const onClose = jest.fn();
    renderWithTheme(
      <AuriaQuestionMenu message={{ ...question, text: 'x'.repeat(100) }} onClose={onClose} onCopy={jest.fn()} />,
    );
    expect(screen.getByRole('header', { name: `${'x'.repeat(80)}…` })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    renderWithTheme(<AuriaQuestionMenu message={null} onClose={jest.fn()} onCopy={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
  });
});
