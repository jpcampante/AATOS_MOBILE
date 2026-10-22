import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaEditingBanner } from '../AuriaEditingBanner';

describe('AuriaEditingBanner', () => {
  it('says what is being edited and cancels', () => {
    const onCancel = jest.fn();
    renderWithTheme(<AuriaEditingBanner original="What are my tasks?" onCancel={onCancel} />);

    expect(screen.getByText('Editing message')).toBeTruthy();
    expect(screen.getByText('What are my tasks?')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Cancel editing' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
