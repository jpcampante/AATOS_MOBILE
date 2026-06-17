import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native';

/** Strong ease-out (Emil's UI curve) — instant feedback, settles gently. */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type ScreenTransitionProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Slide distance in px (entrance comes up from below). */
  distance?: number;
};

/**
 * Fills its parent and animates the screen in on mount: fade + a short
 * upward slide with a faint scale. Give it a `key` that changes per phase
 * so the entrance replays on navigation.
 */
export function ScreenTransition({ children, style, distance = 14 }: ScreenTransitionProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 460,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        style,
        { opacity: progress, transform: [{ translateY }, { scale }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
