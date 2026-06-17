import { Platform, ViewStyle } from 'react-native';

/**
 * Apple-tuned corner radii, scoped to the Tasks feature only.
 *
 * The global MyCEO scale rounds cards at 22 and sheets at 28 — a soft, modern
 * look. Apple's own cards/sheets sit tighter (~16 cards, ~12–14 sheets), so the
 * Tasks surfaces use these values instead while keeping the exact same
 * continuous (squircle) curvature the rest of the app uses. Nothing here touches
 * the global tokens, so only Tasks adopts the Apple rounding.
 */
export const TASKS_CARD_RADIUS = 16;
export const TASKS_SHEET_RADIUS = 14;

/** Same continuous-corner trick as the global `myceoCornerStyle`. */
const continuousCorner =
  Platform.OS === 'ios'
    ? { borderCurve: 'continuous' as const }
    : Platform.OS === 'web'
      ? ({ cornerShape: 'squircle' } as object)
      : null;

/** Apple-tuned card rounding (all four corners). */
export function tasksCardCorner(): ViewStyle {
  return { borderRadius: TASKS_CARD_RADIUS, ...continuousCorner } as ViewStyle;
}

/** Apple-tuned bottom-sheet rounding (top corners only). */
export function tasksSheetCorner(): ViewStyle {
  return {
    borderTopLeftRadius: TASKS_SHEET_RADIUS,
    borderTopRightRadius: TASKS_SHEET_RADIUS,
    ...continuousCorner,
  } as ViewStyle;
}
