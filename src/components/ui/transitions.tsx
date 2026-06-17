import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SUPPORTS_NATIVE_DRIVER, motionDuration, motionEasing } from '../../theme';

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
      duration: motionDuration.reveal,
      easing: motionEasing.emphasized,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
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
