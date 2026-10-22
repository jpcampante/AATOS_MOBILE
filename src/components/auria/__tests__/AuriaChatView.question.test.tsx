import { fireEvent, screen } from '@testing-library/react-native';
import type { AuriaChatMessage } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaChatView } from '../AuriaChatView';

const question: AuriaChatMessage = { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' };
const answer: AuriaChatMessage = { id: 'a-1', serverId: 'a-1', role: 'assistant', text: 'Three tasks.' };

describe('AuriaChatView — long press on a question (H6.2)', () => {
  it('opens the question actions on long press', () => {
    const onQuestionLongPress = jest.fn();
    renderWithTheme(<AuriaChatView messages={[question, answer]} onQuestionLongPress={onQuestionLongPress} />);

    fireEvent(screen.getByText('What are my tasks?'), 'longPress');

    expect(onQuestionLongPress).toHaveBeenCalledWith(question);
  });

  it('offers the same through the screen reader', () => {
    const onQuestionLongPress = jest.fn();
    renderWithTheme(<AuriaChatView messages={[question, answer]} onQuestionLongPress={onQuestionLongPress} />);

    const bubble = screen.getByHintText('Double tap and hold for options');
    fireEvent(bubble, 'accessibilityAction', { nativeEvent: { actionName: 'longpress' } });

    expect(onQuestionLongPress).toHaveBeenCalledWith(question);
  });

  it('does nothing on the answers, nor without a handler', () => {
    const onQuestionLongPress = jest.fn();
    const { rerender } = renderWithTheme(<AuriaChatView messages={[question, answer]} onQuestionLongPress={onQuestionLongPress} />);
    fireEvent(screen.getByText('Three tasks.'), 'longPress');
    expect(onQuestionLongPress).not.toHaveBeenCalled();

    rerender(<AuriaChatView messages={[question, answer]} />);
    expect(screen.queryByHintText('Double tap and hold for options')).toBeNull();
  });
});
