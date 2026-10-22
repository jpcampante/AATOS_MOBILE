import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaVersionSwitcher } from '../AuriaVersionSwitcher';

describe('AuriaVersionSwitcher', () => {
  it('shows which version is on screen and moves to the others', () => {
    const onSwitch = jest.fn();
    renderWithTheme(<AuriaVersionSwitcher index={2} count={3} onSwitch={onSwitch} />);

    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getByLabelText('Version 2 of 3')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Previous version' }));
    fireEvent.press(screen.getByRole('button', { name: 'Next version' }));
    expect(onSwitch.mock.calls).toEqual([[-1], [1]]);
  });

  it('has no way past the first or the last version', () => {
    const onSwitch = jest.fn();
    const { rerender } = renderWithTheme(<AuriaVersionSwitcher index={1} count={2} onSwitch={onSwitch} />);
    expect(screen.getByRole('button', { name: 'Previous version' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next version' })).toBeEnabled();

    rerender(<AuriaVersionSwitcher index={2} count={2} onSwitch={onSwitch} />);
    expect(screen.getByRole('button', { name: 'Next version' })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: 'Next version' }));
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it('waits while switching, and is read-only without a handler', () => {
    const { rerender } = renderWithTheme(<AuriaVersionSwitcher index={2} count={3} onSwitch={jest.fn()} busy />);
    expect(screen.getByTestId('version-switching')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous version' })).toBeDisabled();

    rerender(<AuriaVersionSwitcher index={2} count={3} />);
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next version' })).toBeDisabled();
  });
});
