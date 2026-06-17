import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

type PopoverProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Lightweight mount animation (scale + fade + slight drop) shared by the
 * overflow menus, the From account picker and the reaction bar.
 */
export function Popover({ style, children }: PopoverProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
