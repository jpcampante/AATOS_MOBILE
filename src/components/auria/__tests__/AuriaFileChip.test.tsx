import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaFileChip } from '../AuriaFileChip';

describe('AuriaFileChip', () => {
  it('shows the file name as a plain label when it has no action', () => {
    renderWithTheme(<AuriaFileChip name="notes.txt" />);
    expect(screen.getByText('notes.txt')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is a button that calls onPress', () => {
    const onPress = jest.fn();
    renderWithTheme(<AuriaFileChip name="notes.txt" onPress={onPress} accessibilityLabel="Open notes.txt" />);

    fireEvent.press(screen.getByRole('button', { name: 'Open notes.txt' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner and ignores taps while busy', () => {
    const onPress = jest.fn();
    renderWithTheme(<AuriaFileChip name="notes.txt" onPress={onPress} busy accessibilityLabel="Open notes.txt" />);

    const button = screen.getByRole('button', { name: 'Open notes.txt' });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('file-chip-busy')).toBeTruthy();
    expect(button).toBeBusy();
  });

  it('draws overlays passed as children', () => {
    renderWithTheme(
      <AuriaFileChip name="notes.txt">
        <Text>42%</Text>
      </AuriaFileChip>,
    );
    expect(screen.getByText('42%')).toBeTruthy();
  });
});
