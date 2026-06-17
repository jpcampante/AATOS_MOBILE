import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import type { DataSource } from '../../data/insights/types';

/** Small honesty cue: where a number comes from while data is mocked. */
const DOT: Record<DataSource, string> = {
  sample: '#9CA3AF',
  estimated: '#B45309',
  local: '#1D4ED8',
  live: '#047857',
};

export function DataSourceBadge({ source }: { source: DataSource }) {
  const { insights } = useTheme();
  const styles = useMemo(() => createStyles(insights), [insights]);
  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, { backgroundColor: DOT[source] }]} />
      <Text style={styles.text}>{source}</Text>
    </View>
  );
}

function createStyles(insights: ReturnType<typeof useTheme>['insights']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    text: {
      ...auriaTypography.label,
      fontSize: 10,
      fontWeight: '600',
      color: insights.textHint,
    },
  });
}
