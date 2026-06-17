import { Platform, ViewStyle } from 'react-native';

/** MyCEO Corner Radius tokens. Values mirror the main AATOS design system. */
export const MYCEO_CORNER_RADIUS = {
  page: 34,
  modal: 34,
  menu: 28,
  card: 30,
  panel: 28,
  inset: 22,
  iconLg: 22,
  icon: 16,
  iconSm: 14,
  chip: 18,
} as const;

export type MyceoCornerRadiusToken = keyof typeof MYCEO_CORNER_RADIUS;

export function myceoCornerStyle(token: MyceoCornerRadiusToken): ViewStyle {
  return {
    borderRadius: MYCEO_CORNER_RADIUS[token],
    ...(Platform.OS === 'ios'
      ? { borderCurve: 'continuous' as const }
      : Platform.OS === 'web'
        ? ({ cornerShape: 'squircle' } as object)
        : null),
  } as ViewStyle;
}
