import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test/renderWithTheme';
import { AuriaServiceMark } from '../AuriaServiceMark';

describe('AuriaServiceMark', () => {
  it.each([
    ['gmail', 'gmail'],
    ['outlook', 'outlook'],
    ['outlook-calendar', 'outlook'],
    ['google-contacts', 'google-calendar'],
    ['teams', 'teams'],
    ['google-drive', 'google-drive'],
  ])('shows the product logo for %s', (service, mark) => {
    renderWithTheme(<AuriaServiceMark service={service} />);
    expect(screen.getByTestId(`service-mark-${mark}`, { includeHiddenElements: true })).toBeTruthy();
  });

  it.each(['mail', 'calendar', 'tasks', 'knowledge', 'web', 'workspace'])('shows a neutral glyph for the %s family', (family) => {
    renderWithTheme(<AuriaServiceMark service={family} />);
    expect(screen.getByTestId(`service-mark-${family}`, { includeHiddenElements: true })).toBeTruthy();
  });

  it.each(['salesforce', 'toString', ''])('falls back to the Auria glyph for an unknown service (%s)', (service) => {
    renderWithTheme(<AuriaServiceMark service={service} />);
    expect(screen.getByTestId('service-mark-auria', { includeHiddenElements: true })).toBeTruthy();
  });

  it('is hidden from screen readers (the step label says it)', () => {
    renderWithTheme(<AuriaServiceMark service="gmail" size={14} />);
    const mark = screen.getByTestId('service-mark-gmail', { includeHiddenElements: true });
    expect(mark).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    expect(mark).toHaveStyle({ width: 14, height: 14 });
  });
});
