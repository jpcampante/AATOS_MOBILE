import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AuriaReasoning } from '../../features/auria/types';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { ShimmerText } from './ShimmerText';
import { AuriaThinkingSheet } from './AuriaThinkingSheet';

type AuriaReasoningBlockProps = {
  reasoning: AuriaReasoning;
  onOpenFiles?: () => void;
};

/** The thought chip: a shimmering "Thinking" label that opens the timeline. */
export function AuriaReasoningBlock({ reasoning, onOpenFiles }: AuriaReasoningBlockProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [open, setOpen] = useState(false);

  const label = reasoning.live ? 'Thinking' : `Thought for ${reasoning.durationSec}s`;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
        accessibilityRole="button"
        accessibilityLabel="Show thinking"
      >
        <AuriaIcon name="sparkles" size={14} color={ds.gray500} strokeWidth={1.7} />
        <ShimmerText text={label} style={styles.label} color={ds.gray800} />
        <AuriaIcon name="chevronRight" size={14} color={ds.gray400} strokeWidth={2} />
      </Pressable>

      <AuriaThinkingSheet
        visible={open}
        onClose={() => setOpen(false)}
        reasoning={reasoning}
        onOpenFiles={onOpenFiles}
      />
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: { alignSelf: 'flex-start', maxWidth: '100%' },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 7,
      paddingHorizontal: 11,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    chipPressed: { backgroundColor: ds.gray200 },
    label: {
      ...auriaTypography.label,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });
}
