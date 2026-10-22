import { fireEvent, screen } from '@testing-library/react-native';
import type { AuriaChatMessage } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaChatView } from '../AuriaChatView';

const question: AuriaChatMessage = { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' };
const savedAnswer: AuriaChatMessage = { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.' };

describe('AuriaChatView — retry (H6.1)', () => {
  it('offers Retry in the answer menu and retries that answer', () => {
    const onRetry = jest.fn();
    renderWithTheme(<AuriaChatView messages={[question, savedAnswer]} onRetry={onRetry} />);

    fireEvent.press(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledWith('a-1');
  });

  it('has no menu for an answer that is not saved yet', () => {
    const local: AuriaChatMessage = { id: 't1-a', role: 'assistant', text: 'Three tasks.' };
    renderWithTheme(<AuriaChatView messages={[question, local]} onRetry={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
  });

  it('has no menu when the chat cannot continue (no retry handler)', () => {
    renderWithTheme(<AuriaChatView messages={[question, savedAnswer]} />);
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
  });
});
