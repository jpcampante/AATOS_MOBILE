import { Platform, TextStyle } from 'react-native';

/**
 * Auria typography lives here so every Auria surface uses one explicit font
 * contract. On web this is DM Sans — the same brand font the AATOS web app
 * serves — loaded by `ensureWebBrandFont()`.
 */
export const AURIA_FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: 'System',
});

export const auriaTypography = {
  fontFamily: AURIA_FONT_FAMILY,
  title: {
    fontFamily: AURIA_FONT_FAMILY,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  body: {
    fontFamily: AURIA_FONT_FAMILY,
  } satisfies TextStyle,
  label: {
    fontFamily: AURIA_FONT_FAMILY,
    letterSpacing: 0.4,
  } satisfies TextStyle,
} as const;
