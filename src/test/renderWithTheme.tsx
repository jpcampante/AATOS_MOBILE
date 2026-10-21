import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '../theme';

/** Renders a component inside the app's ThemeProvider (light), like the app does. */
export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(<ThemeProvider>{ui}</ThemeProvider>, options);
}
