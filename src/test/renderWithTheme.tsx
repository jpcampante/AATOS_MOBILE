import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../theme';

/** A phone-sized screen with no notch, so sheets and safe-area paddings render in tests. */
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

const Wrapper = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider initialMetrics={METRICS}>
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

/** Renders a component inside the app's providers (safe area, light theme), like the app does; `rerender` keeps them. */
export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Wrapper, ...options });
}
