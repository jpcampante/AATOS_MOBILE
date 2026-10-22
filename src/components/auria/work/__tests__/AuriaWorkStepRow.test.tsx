import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test/renderWithTheme';
import { AuriaWorkStepRow } from '../AuriaWorkStepRow';

const step = { id: 's1', label: 'Check your calendar' };

describe('AuriaWorkStepRow', () => {
  it('says what it is doing while it runs', () => {
    renderWithTheme(<AuriaWorkStepRow step={{ ...step, status: 'running', service: 'google-calendar' }} sectionId="research" />);
    expect(screen.getByText('Checking your calendar')).toBeTruthy();
    // The logo shows once the step is done; while it runs, a spinner.
    expect(screen.queryByTestId('service-mark-google-calendar', { includeHiddenElements: true })).toBeNull();
  });

  it('says what it did, with the service logo', () => {
    renderWithTheme(<AuriaWorkStepRow step={{ ...step, status: 'done', service: 'google-calendar' }} sectionId="research" />);
    expect(screen.getByText('Checked your calendar')).toBeTruthy();
    expect(screen.getByTestId('service-mark-google-calendar', { includeHiddenElements: true })).toBeTruthy();
  });

  it('says when a step failed', () => {
    renderWithTheme(<AuriaWorkStepRow step={{ ...step, status: 'error', service: 'gmail' }} sectionId="research" />);
    expect(screen.getByText('Could not complete check your calendar')).toBeTruthy();
    expect(screen.queryByTestId('service-mark-gmail', { includeHiddenElements: true })).toBeNull();
  });
});
