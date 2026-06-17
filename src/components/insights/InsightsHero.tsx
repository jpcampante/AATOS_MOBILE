import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { myceoCornerStyle, useTheme } from '../../theme';
import {
  formatMetricValue,
  getMetric,
  insightMetrics,
  metricSeries,
} from '../../data/insights/metrics';
import { insightSignals } from '../../data/insights/signals';
import type { Period, Scope } from '../../data/insights/types';
import { LineChart } from './LineChart';
import { DataSourceBadge } from './DataSourceBadge';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'team', label: 'Team' },
  { key: 'me', label: 'Me' },
];
const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'W' },
  { key: 'month', label: 'M' },
  { key: 'quarter', label: 'Q' },
];
const PERIOD_SUB: Record<Period, string> = {
  week: 'Last 8 weeks.',
  month: 'Last 12 months.',
  quarter: 'Last 4 quarters.',
};
const OVERLAY_COLOR = '#2563EB';

/** A sensible correlate to overlay per metric (tells a story, not just a line). */
const CORRELATE: Record<string, string> = {
  'auria-usage': 'email-backlog',
  'email-backlog': 'auria-usage',
  'completion-rate': 'cycle-time',
  'cycle-time': 'completion-rate',
  'auria-acceptance': 'auria-usage',
  'auria-time-saved': 'email-backlog',
};

/** Zone 4 — the Explorer. Pick a metric, scope and period; overlay to compare. */
export function InsightsHero() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  const [metricId, setMetricId] = useState(insightMetrics[0].id);
  const [scope, setScope] = useState<Scope>('company');
  const [period, setPeriod] = useState<Period>('month');
  const [compare, setCompare] = useState(false);

  const metric = getMetric(metricId);
  const series = metricSeries(metric, scope, period);
  const lastValue = series[series.length - 1]?.value ?? 0;

  const overlayId = CORRELATE[metric.id];
  const overlay = compare && overlayId ? getMetric(overlayId) : null;
  const overlaySeries = overlay ? metricSeries(overlay, scope, period) : undefined;

  const matchedSignal =
    insightSignals.find((s) => s.metricId === metric.id && s.delta) ??
    insightSignals.find((s) => s.metricId === metric.id);
  const annotationLabel = matchedSignal?.delta ?? (matchedSignal ? 'flagged' : undefined);

  return (
    <View style={styles.shell}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.headline}>{`Here's a line graph of ${metric.headline}.`}</Text>
          <Text style={styles.subheadline}>{PERIOD_SUB[period]}</Text>
        </View>
        <DataSourceBadge source={metric.source} />
      </View>

      <View style={styles.controls}>
        <View style={styles.segment}>
          {SCOPES.map((opt) => {
            const active = opt.key === scope;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setScope(opt.key)}
                style={[styles.segBtn, active && styles.segBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.segText, active && styles.segTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.segment}>
          {PERIODS.map((opt) => {
            const active = opt.key === period;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setPeriod(opt.key)}
                style={[styles.segBtn, active && styles.segBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.segText, active && styles.segTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <LineChart
        data={series}
        color={insights.accent}
        height={184}
        step={metric.step}
        valueSuffix={metric.unit === 'percent' ? '%' : metric.unit === 'hours' ? 'h' : ''}
        series2={overlaySeries}
        color2={OVERLAY_COLOR}
        annotationLabel={annotationLabel}
      />

      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: insights.accent }]} />
            <Text style={styles.metaLabel}>{metric.metaLabel}</Text>
          </View>
          {overlay ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendLineDashed, { borderColor: OVERLAY_COLOR }]} />
              <Text style={styles.metaLabel}>{overlay.metaLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.metaValue}>{formatMetricValue(metric, lastValue)}</Text>
      </View>

      <View style={styles.chipsRow}>
        {insightMetrics.map((item) => {
          const active = item.id === metric.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setMetricId(item.id)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.chip}</Text>
            </Pressable>
          );
        })}
        {overlayId ? (
          <Pressable
            onPress={() => setCompare((c) => !c)}
            style={[styles.chip, styles.compareChip, compare && styles.compareChipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: compare }}
          >
            <Text style={[styles.chipText, compare && styles.compareTextActive]}>
              {compare ? '✓ Compare' : '+ Compare'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    shell: {
      backgroundColor: insights.heroShell,
      ...myceoCornerStyle('card'),
      padding: theme.spacing.lg,
      gap: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    headerCopy: { flex: 1, gap: 4 },
    headline: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: insights.text },
    subheadline: { fontSize: 13, color: insights.textMuted, fontWeight: '500' },
    controls: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: insights.heroSearchBg,
      ...myceoCornerStyle('chip'),
      padding: 2,
    },
    segBtn: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      ...myceoCornerStyle('chip'),
    },
    segBtnActive: { backgroundColor: insights.accent },
    segText: { fontSize: 12, fontWeight: '600', color: insights.textMuted },
    segTextActive: { color: insights.surface },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    metaLeft: { gap: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendLine: { width: 14, height: 3, borderRadius: 2 },
    legendLineDashed: { width: 14, height: 0, borderTopWidth: 2, borderStyle: 'dashed' },
    metaLabel: { fontSize: 12, color: insights.textMuted, fontWeight: '600' },
    metaValue: { fontSize: 22, color: insights.text, fontWeight: '800' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    chip: {
      backgroundColor: theme.colors.chipSurface,
      ...myceoCornerStyle('chip'),
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipActive: { backgroundColor: insights.accent },
    chipText: { fontSize: 12, fontWeight: '600', color: insights.textMuted },
    chipTextActive: { color: insights.surface },
    compareChip: { borderWidth: 1, borderColor: OVERLAY_COLOR, backgroundColor: 'transparent' },
    compareChipActive: { backgroundColor: OVERLAY_COLOR, borderColor: OVERLAY_COLOR },
    compareTextActive: { color: '#FFFFFF' },
  });
}
