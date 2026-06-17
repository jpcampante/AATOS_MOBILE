import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { formatMetricValue, getMetric, metricSeries } from '../../data/insights/metrics';
import { LineChart } from './LineChart';

const GOOD = '#1D9E75';
const BAD = '#E5484D';

type MetricChartCardProps = {
  metricId: string;
};

/** A pinned metric chart — the "visualize this metric" card the user adds from Customize. */
export function MetricChartCard({ metricId }: MetricChartCardProps) {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  const metric = getMetric(metricId);
  const series = metricSeries(metric, 'company', 'month');
  const lastValue = series[series.length - 1]?.value ?? 0;
  const prevValue = series[series.length - 2]?.value ?? lastValue;
  const diff = lastValue - prevValue;
  const deltaGood = metric.goodDirection === 'up' ? diff >= 0 : diff <= 0;
  const deltaText =
    metric.unit === 'percent'
      ? `${diff >= 0 ? '+' : ''}${Math.round(diff)}pp`
      : `${diff >= 0 ? '+' : ''}${prevValue ? Math.round((diff / prevValue) * 100) : 0}%`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{metric.chip}</Text>
        <Text style={styles.meta}>{metric.metaLabel} · last 12 months</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.value}>{formatMetricValue(metric, lastValue)}</Text>
        <Text style={[styles.delta, { color: deltaGood ? GOOD : BAD }]}>{deltaText}</Text>
        <Text style={styles.hint}>vs previous</Text>
      </View>
      <LineChart
        data={series}
        color={insights.accent}
        height={150}
        step={metric.step}
        valueSuffix={metric.unit === 'percent' ? '%' : metric.unit === 'hours' ? 'h' : ''}
      />
    </View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: insights.surface,
      ...myceoCornerStyle('card'),
      ...theme.shadow.card,
      padding: theme.spacing.lg,
      gap: 10,
    },
    header: { gap: 2 },
    title: {
      ...auriaTypography.title,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.extrabold,
      color: insights.text,
    },
    meta: { ...auriaTypography.body, fontSize: 11.5, color: insights.textMuted, fontWeight: '500' },
    statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    value: {
      ...auriaTypography.title,
      fontSize: 26,
      fontWeight: theme.typography.fontWeight.extrabold,
      color: insights.text,
    },
    delta: { ...auriaTypography.body, fontSize: 13, fontWeight: '700' },
    hint: { ...auriaTypography.body, fontSize: 11, color: insights.textHint, fontWeight: '500' },
  });
}
