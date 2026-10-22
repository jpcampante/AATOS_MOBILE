import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test/renderWithTheme';
import { AuriaWorkLiveLine } from '../AuriaWorkLiveLine';

// The shimmer draws one Text per letter: read the whole label from the accessible line.
const line = () => screen.getByLabelText(/^Auria is working\./);

describe('AuriaWorkLiveLine', () => {
  it('reads the request before the first step shows', () => {
    renderWithTheme(<AuriaWorkLiveLine current={null} previous={null} elapsedSec={0} />);
    expect(line()).toHaveProp('accessibilityLabel', 'Auria is working. Reading your request');
    expect(screen.getByText('0s')).toBeTruthy();
  });

  it('shows the current step as happening and the previous one as done', () => {
    renderWithTheme(
      <AuriaWorkLiveLine
        current={{ id: 'b', label: 'Scan your tasks', status: 'done' }}
        previous={{ id: 'a', label: 'Gather workspace context', status: 'running' }}
        elapsedSec={6}
      />,
    );
    expect(line()).toHaveProp('accessibilityLabel', 'Auria is working. Scanning your tasks');
    expect(screen.getByText('Gathered workspace context')).toBeTruthy();
    expect(screen.getByText('6s')).toBeTruthy();
  });

  it('keeps a failed step as failed', () => {
    renderWithTheme(
      <AuriaWorkLiveLine current={{ id: 'a', label: 'Search your email', status: 'error' }} previous={null} elapsedSec={2} />,
    );
    expect(line()).toHaveProp('accessibilityLabel', 'Auria is working. Could not complete search your email');
  });

  it('is not a live region (only the end is announced)', () => {
    renderWithTheme(<AuriaWorkLiveLine current={null} previous={null} elapsedSec={1} />);
    expect(line()).toHaveProp('accessibilityLiveRegion', 'none');
  });
});
