import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  AatosTheme,
  darkTheme,
  dsFromTheme,
  lightTheme,
  type ThemeMode,
} from './aatosTheme';

export type ThemePreference = ThemeMode | 'system';

type ThemeContextValue = {
  theme: AatosTheme;
  ds: ReturnType<typeof dsFromTheme>;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (mode: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  initialPreference?: ThemePreference;
};

export function ThemeProvider({ children, initialPreference = 'light' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);

  const resolvedMode: ThemeMode =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(() => {
    const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;
    return {
      theme,
      ds: dsFromTheme(theme),
      isDark: resolvedMode === 'dark',
      preference,
      setPreference,
    };
  }, [preference, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
