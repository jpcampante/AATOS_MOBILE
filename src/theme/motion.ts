import { Easing, Platform } from 'react-native';

/**
 * Shared motion vocabulary for the app. Every animated component pulls its
 * easing curve, duration and (where it springs) its physics from here so the
 * whole product moves with one coherent rhythm instead of a dozen hand-tuned
 * one-offs.
 *
 * Three rules the rest of the app relies on:
 *  - Reach for {@link motionEasing.standard} unless a beat genuinely needs a
 *    different curve.
 *  - Pick a {@link motionDuration} by the *role* of the motion, not its size.
 *  - Pass {@link SUPPORTS_NATIVE_DRIVER} as `useNativeDriver` for any
 *    transform/opacity animation; only layout-bound props (height, width,
 *    non-transform translate via `left`) must stay `false`.
 */

/**
 * react-native-web has no native animation driver. Passing `useNativeDriver:
 * true` there is a no-op that logs a warning and silently runs on the JS
 * thread, so we gate on the platform: native gets the 60fps native driver,
 * web honestly runs on JS.
 */
export const SUPPORTS_NATIVE_DRIVER = Platform.OS !== 'web';

/** Named timing curves. `standard` covers the vast majority of cases. */
export const motionEasing = {
  /** Default ease-out — quick to start, settles gently. The house curve. */
  standard: Easing.out(Easing.cubic),
  /** Softer, shorter ease-out for quick fades. */
  decelerate: Easing.out(Easing.quad),
  /** Ease-in for exits and dismissals — content accelerates as it leaves. */
  accelerate: Easing.in(Easing.cubic),
  /** Gentler ease-in for fast cross-fades. */
  accelerateSoft: Easing.in(Easing.quad),
  /** Expressive settle for hero/menu reveals — a touch of anticipation. */
  emphasized: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

/**
 * Durations in ms, named by the role of the motion. Exits stay quicker than
 * the entrances they reverse; reveals and data take their time.
 */
export const motionDuration = {
  /** Popovers and tiny feedback. */
  micro: 150,
  /** Exits, dismissals and panel switches — leave faster than you arrive. */
  fast: 200,
  /** Small mounts: menus, suggestion refresh-in. */
  swift: 240,
  /** Standard slide: drawers, tab + screen changes. */
  base: 280,
  /** Staggered content reveal. */
  gentle: 320,
  /** Full-screen entrance. */
  reveal: 460,
  /** Data drawing itself in (bars, meters). */
  chart: 480,
  /** Slot-machine headline roll. */
  roll: 540,
  /** A full rotation, e.g. the refresh icon. */
  spin: 620,
} as const;

/**
 * Spring presets (friction/tension API) for tactile pops. Spread one in and
 * add your own `toValue`/`useNativeDriver`:
 *   `Animated.spring(v, { toValue: 1, ...motionSpring.pop, useNativeDriver: SUPPORTS_NATIVE_DRIVER })`
 */
export const motionSpring = {
  /** Selected-tab / icon pop — a little overshoot. */
  pop: { friction: 7, tension: 140 },
  /** Snappier pop for small toggles (star, like). */
  popSharp: { friction: 4, tension: 140 },
  /** Neutral, overshoot-free settle back to rest (e.g. a cancelled swipe). */
  settle: { bounciness: 0 },
} as const;

export type MotionDurationToken = keyof typeof motionDuration;
