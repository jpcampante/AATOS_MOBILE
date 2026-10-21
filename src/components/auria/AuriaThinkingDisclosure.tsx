import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

/**
 * The saved reasoning above an answer, closed by default (same as the web's
 * "Thinking" disclosure): the answer is what matters; this is for whoever
 * wants to see where it came from.
 */
export function AuriaThinkingDisclosure({ text }: { text: string }) {
  const { ds } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Thinking"
        accessibilityHint={open ? 'Hides the reasoning' : 'Shows the reasoning behind this answer'}
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.label, { color: ds.gray500 }]}>Thinking</Text>
        <AuriaIcon name={open ? 'chevronDown' : 'chevronRight'} size={12} color={ds.gray500} strokeWidth={1.8} />
      </Pressable>
      {open ? (
        <Text style={[styles.text, { color: ds.gray500, borderLeftColor: ds.gray200 }]} selectable>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 6,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
  },
  togglePressed: {
    opacity: 0.6,
  },
  label: {
    ...auriaTypography.label,
    fontSize: 12,
  },
  text: {
    ...auriaTypography.body,
    marginTop: 4,
    paddingLeft: 10,
    borderLeftWidth: 1,
    fontSize: 12,
    lineHeight: 19,
  },
});
