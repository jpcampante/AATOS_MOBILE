import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type AuriaFileChipProps = {
  name: string;
  /** Makes the chip a button (e.g. open the file). Without it the chip is a plain label. */
  onPress?: () => void;
  /** Shows a spinner instead of the icon and ignores taps. */
  busy?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Overlays drawn inside the chip (badges, a remove button). */
  children?: ReactNode;
};

/** A non-image file: document icon and its name. Shared by the composer queue and the chat. */
export function AuriaFileChip({ name, onPress, busy = false, accessibilityLabel, style, children }: AuriaFileChipProps) {
  const { ds } = useTheme();
  const content = (
    <>
      {busy ? (
        <ActivityIndicator size="small" color={ds.gray500} testID="file-chip-busy" />
      ) : (
        <AuriaIcon name="document" size={18} color={ds.gray600} strokeWidth={1.8} />
      )}
      <Text style={[styles.name, { color: ds.gray900 }]} numberOfLines={1}>
        {name}
      </Text>
      {children}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.chip, { backgroundColor: ds.gray100 }, style]} accessible accessibilityLabel={accessibilityLabel ?? name}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.chip, { backgroundColor: pressed ? ds.gray200 : ds.gray100 }, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityState={{ busy, disabled: busy }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  name: {
    ...auriaTypography.body,
    flexShrink: 1,
    fontSize: 14,
  },
});
