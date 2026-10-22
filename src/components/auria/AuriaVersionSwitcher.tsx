import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type AuriaVersionSwitcherProps = {
  /** 1-based, like the server's `version_index`. */
  index: number;
  count: number;
  /** -1 = previous version, 1 = next. Absent: read-only (e.g. an answer is running). */
  onSwitch?: (direction: -1 | 1) => void;
  /** This message is switching right now. */
  busy?: boolean;
};

/** "< 2/3 >": which version of a message is shown, with arrows to the others (E21). */
export function AuriaVersionSwitcher({ index, count, onSwitch, busy = false }: AuriaVersionSwitcherProps) {
  const { ds } = useTheme();
  const canPrev = !!onSwitch && !busy && index > 1;
  const canNext = !!onSwitch && !busy && index < count;

  const arrow = (direction: -1 | 1, enabled: boolean) => (
    <Pressable
      onPress={() => onSwitch?.(direction)}
      disabled={!enabled}
      hitSlop={8}
      style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={direction === -1 ? 'Previous version' : 'Next version'}
      accessibilityState={{ disabled: !enabled }}
    >
      <AuriaIcon
        name={direction === -1 ? 'chevronLeft' : 'chevronRight'}
        size={14}
        color={enabled ? ds.gray600 : ds.gray300}
        strokeWidth={2}
      />
    </Pressable>
  );

  return (
    <View style={styles.wrap} accessibilityLabel={`Version ${index} of ${count}`}>
      {arrow(-1, canPrev)}
      {busy ? (
        <ActivityIndicator size="small" color={ds.gray500} style={styles.spinner} testID="version-switching" />
      ) : (
        <Text style={[styles.label, { color: ds.gray600 }]}>
          {index}/{count}
        </Text>
      )}
      {arrow(1, canNext)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  label: {
    ...auriaTypography.label,
    minWidth: 28,
    textAlign: 'center',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  spinner: {
    width: 28,
    transform: [{ scale: 0.7 }],
  },
});
