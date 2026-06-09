import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { myceoCornerStyle, useTheme } from '../../theme';

type MiniBarChartProps = {
  data: ReadonlyArray<{ month: string; value: number }>;
  barColor?: string;
  maxHeight?: number;
};

export function MiniBarChart({ data, barColor, maxHeight = 96 }: MiniBarChartProps) {
  const { insights } = useTheme();
  const styles = useMemo(() => createStyles(insights), [insights]);
  const fill = barColor ?? insights.accent;
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  return (
    <View style={styles.wrap}>
      <View style={[styles.chartRow, { height: maxHeight }]}>
        {data.map((point) => (
          <View key={point.month} style={styles.barColumn}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(8, (point.value / maxValue) * maxHeight),
                  backgroundColor: fill,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.labelsRow}>
        {data.map((point, index) => (
          <Text key={point.month} style={styles.label} numberOfLines={1}>
            {index % 2 === 0 ? point.month : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

function createStyles(insights: ReturnType<typeof useTheme>['insights']) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
    },
    chartRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
    },
    barColumn: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    bar: {
      ...myceoCornerStyle('iconSm'),
      opacity: 0.88,
    },
    labelsRow: {
      flexDirection: 'row',
      gap: 4,
    },
    label: {
      flex: 1,
      textAlign: 'center',
      fontSize: 9,
      color: insights.textHint,
      fontWeight: '600',
    },
  });
}
