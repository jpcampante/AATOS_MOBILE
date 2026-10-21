import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaThinkingDisclosure } from '../AuriaThinkingDisclosure';

describe('AuriaThinkingDisclosure', () => {
  it('starts closed and opens the reasoning on tap', () => {
    renderWithTheme(<AuriaThinkingDisclosure text="Looked at your tasks first." />);
    const toggle = screen.getByRole('button', { name: 'Thinking' });
    expect(toggle).toBeCollapsed();
    expect(screen.queryByText('Looked at your tasks first.')).toBeNull();

    fireEvent.press(toggle);
    expect(toggle).toBeExpanded();
    expect(screen.getByText('Looked at your tasks first.')).toBeTruthy();

    fireEvent.press(toggle);
    expect(screen.queryByText('Looked at your tasks first.')).toBeNull();
  });
});
