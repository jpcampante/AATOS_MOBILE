import { Platform, ViewStyle } from 'react-native';

/** MyCEO Corner Radius tokens. Values mirror the main AATOS design system. */
export const MYCEO_CORNER_RADIUS = {
  page: 28,
  modal: 28,
  menu: 22,
  card: 22,
  panel: 20,
  inset: 16,
  iconLg: 16,
  icon: 12,
  iconSm: 10,
  chip: 14,
} as const;

export type MyceoCornerRadiusToken = keyof typeof MYCEO_CORNER_RADIUS;

export function myceoCornerStyle(token: MyceoCornerRadiusToken): ViewStyle {
  return {
    borderRadius: MYCEO_CORNER_RADIUS[token],
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  };
}
