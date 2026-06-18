import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuriaReasoning } from '../../features/auria/types';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type AuriaReasoningBlockProps = {
  reasoning: AuriaReasoning;
};

/** Collapsible chain-of-thought, like "Thought for 6s" → expand to see steps. */
export function AuriaReasoningBlock({ reasoning }: AuriaReasoningBlockProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Hide reasoning' : 'Show reasoning'}
      >
        <AuriaIcon name="sparkles" size={14} color={ds.gray500} strokeWidth={1.7} />
        <Text style={styles.headerText}>Thought for {reasoning.durationSec}s</Text>
        <AuriaIcon name={open ? 'chevronDown' : 'chevronRight'} size={14} color={ds.gray500} strokeWidth={2} />
      </Pressable>

      {open ? (
        <View style={styles.steps}>
          {reasoning.steps.map((step, i) => (
            <View key={`${i}-${step.slice(0, 8)}`} style={styles.step}>
              <View style={styles.dot} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    headerPressed: {
      backgroundColor: ds.gray200,
    },
    headerText: {
      ...auriaTypography.label,
      fontSize: 12.5,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray600,
    },
    steps: {
      marginTop: 8,
      marginLeft: 6,
      paddingLeft: 12,
      borderLeftWidth: 1.5,
      borderLeftColor: ds.gray200,
      gap: 9,
    },
    step: {
      flexDirection: 'row',
      gap: 8,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginTop: 7,
      backgroundColor: ds.gray400,
    },
    stepText: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 13.5,
      lineHeight: 20,
      color: ds.gray600,
    },
  });
}
