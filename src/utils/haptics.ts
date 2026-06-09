import { Platform } from 'react-native';

/**
 * Cross-platform haptics.
 * - iOS/Android: uses expo-haptics (Apple Taptic Engine on iOS).
 * - Web: falls back to navigator.vibrate where supported.
 * Loaded lazily so the bundle doesn't break if the module is absent.
 */
let Haptics: typeof import('expo-haptics') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
} catch {
  Haptics = null;
}

function webVibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }
}

/** Light tap — for ticks, text reveals, small state changes. */
export function tapLight() {
  if (Platform.OS === 'web') return webVibrate(8);
  Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — for button presses, selections. */
export function tapMedium() {
  if (Platform.OS === 'web') return webVibrate(12);
  Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Selection change — for toggles, pickers. */
export function tapSelection() {
  if (Platform.OS === 'web') return webVibrate(6);
  Haptics?.selectionAsync();
}

/** Success notification — for sign-in / completion. */
export function tapSuccess() {
  if (Platform.OS === 'web') return webVibrate([10, 30, 10]);
  Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
