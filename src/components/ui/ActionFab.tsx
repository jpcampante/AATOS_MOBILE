import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';
import {
  SUPPORTS_NATIVE_DRIVER,
  auriaTypography,
  myceoCornerStyle,
  useTheme,
} from '../../theme';

/** Light-blue surface shared by every floating action button. */
const FAB_SURFACE = '#DDE8FF';

type ActionFabProps = {
  icon: AuriaIconName;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

/**
 * The single floating action button used across the app (Compose, New task…).
 * It always anchors to the same bottom-right spot and springs in the same way,
 * so it never jumps as you move between tabs — just give it an icon and label.
 */
export function ActionFab({ icon, label, onPress, accessibilityLabel }: ActionFabProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 120,
      delay: 160,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: enter,
          transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
      >
        <AuriaIcon name={icon} size={AURIA_ICON_SIZE.md} color={ds.gray900} strokeWidth={1.9} />
        <Text style={styles.fabText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: { position: 'absolute', right: 16, bottom: 16 },
    fab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 15,
      backgroundColor: FAB_SURFACE,
      ...myceoCornerStyle('iconLg'),
      ...theme.shadow.card,
    },
    fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
    fabText: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
    },
  });
}
