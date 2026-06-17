import { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';
import {
  SUPPORTS_NATIVE_DRIVER,
  liquidGlassTokens,
  motionDuration,
  motionEasing,
  useTheme,
} from '../../theme';

type AuriaRefreshButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function AuriaRefreshButton({
  onPress,
  accessibilityLabel = 'Refresh suggestions',
}: AuriaRefreshButtonProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const spin = useRef(new Animated.Value(0)).current;
  const spinning = useRef(false);

  const handlePress = () => {
    if (spinning.current) return;

    spinning.current = true;
    spin.setValue(0);

    Animated.timing(spin, {
      toValue: 1,
      duration: motionDuration.spin,
      easing: motionEasing.standard,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    }).start(({ finished }) => {
      spinning.current = false;
      if (finished) {
        spin.setValue(0);
      }
    });

    onPress?.();
  };

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Animated.View style={[styles.iconWrap, { transform: [{ rotate }] }]}>
        <AuriaIcon
          name="arrowPath"
          size={AURIA_ICON_SIZE.sm}
          color={ds.gray600}
          strokeWidth={AURIA_ICON_STROKE_NAV}
        />
      </Animated.View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const glass = liquidGlassTokens(theme);
  return StyleSheet.create({
    button: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    buttonPressed: {
      backgroundColor: glass.pressed,
      borderRadius: 21,
      transform: [{ scale: 0.96 }],
    },
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
