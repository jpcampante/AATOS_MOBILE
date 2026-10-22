import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';

type AuriaEditingBannerProps = {
  /** The text being edited, as it was. */
  original: string;
  onCancel: () => void;
};

/** Above the composer while a question is being edited: what is being edited, and a way out. */
export function AuriaEditingBanner({ original, onCancel }: AuriaEditingBannerProps) {
  const { ds } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: ds.gray100 }]} accessibilityLiveRegion="polite">
      <AuriaIcon name="pencil" size={16} color={ds.gray600} strokeWidth={1.8} />
      <View style={styles.texts}>
        <Text style={[styles.label, { color: ds.gray900 }]}>Editing message</Text>
        <Text style={[styles.original, { color: ds.gray500 }]} numberOfLines={1}>
          {original}
        </Text>
      </View>
      <Pressable
        onPress={onCancel}
        hitSlop={8}
        style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Cancel editing"
      >
        <AuriaIcon name="close" size={16} color={ds.gray600} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: AURIA_CONTENT_HORIZONTAL_INSET,
    marginBottom: 6,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 16,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...auriaTypography.label,
    fontSize: 13,
  },
  original: {
    ...auriaTypography.label,
    fontSize: 12,
  },
  cancel: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
