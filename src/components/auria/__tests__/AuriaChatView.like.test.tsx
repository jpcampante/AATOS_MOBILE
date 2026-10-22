import { fireEvent, screen } from '@testing-library/react-native';
import type { AuriaChatMessage } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaChatView } from '../AuriaChatView';

const question: AuriaChatMessage = { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' };
const answer: AuriaChatMessage = { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.' };

describe('AuriaChatView — like (H6.4)', () => {
  it('likes a saved answer', () => {
    const onToggleLike = jest.fn();
    renderWithTheme(<AuriaChatView messages={[question, answer]} onToggleLike={onToggleLike} />);

    const thumb = screen.getByRole('button', { name: 'Like' });
    expect(thumb).not.toBeSelected();
    fireEvent.press(thumb);
    expect(onToggleLike).toHaveBeenCalledWith('a-1');
  });

  it('shows a liked answer as selected, offering to remove the like', () => {
    renderWithTheme(<AuriaChatView messages={[question, { ...answer, liked: true }]} onToggleLike={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Remove like' })).toBeSelected();
  });

  it('has no thumb for an answer not saved yet', () => {
    renderWithTheme(<AuriaChatView messages={[question, { ...answer, serverId: undefined }]} onToggleLike={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Like' })).toBeNull();
  });
});
