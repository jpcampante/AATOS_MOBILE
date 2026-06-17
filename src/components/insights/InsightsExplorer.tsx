import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import {
  formatMetricValue,
  getMetric,
  insightMetrics,
  metricSeries,
} from '../../data/insights/metrics';
import { insightSignals } from '../../data/insights/signals';
import type { Period, Scope } from '../../data/insights/types';
import { LineChart } from './LineChart';
import { CustomizeHomeSheet } from './CustomizeHomeSheet';
import { AuriaIcon } from '../icons';

const GOOD = '#1D9E75';
const BAD = '#E5484D';
const OVERLAY_COLOR = '#2563EB';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'team', label: 'Team' },
  { key: 'me', label: 'Me' },
];
const SCOPE_CONTEXT: Record<Scope, string> = {
  company: 'across the company',
  team: 'in your team',
  me: 'for you',
};
const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'W' },
  { key: 'month', label: 'M' },
  { key: 'quarter', label: 'Q' },
];
const PERIOD_SUB: Record<Period, string> = {
  week: 'last 8 weeks',
  month: 'last 12 months',
  quarter: 'last 4 quarters',
};

/** A sensible correlate to overlay per metric (tells a story, not just a line). */
const CORRELATE: Record<string, string> = {
  'auria-usage': 'email-backlog',
  'email-backlog': 'auria-usage',
  'completion-rate': 'cycle-time',
  'cycle-time': 'completion-rate',
  'auria-acceptance': 'auria-usage',
  'auria-time-saved': 'email-backlog',
};

/** Zone — the Explorer (blue hero). Pick a metric, scope and period; overlay to compare. */
export function InsightsExplorer() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  const [metricId, setMetricId] = useState(insightMetrics[0].id);
  const [scope, setScope] = useState<Scope>('company');
  const [period, setPeriod] = useState<Period>('month');
  const [compare, setCompare] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const metric = getMetric(metricId);
  const series = metricSeries(metric, scope, period);
  const lastValue = series[series.length - 1]?.value ?? 0;
  const prevValue = series[series.length - 2]?.value ?? lastValue;
  const diff = lastValue - prevValue;
  const deltaGood = metric.goodDirection === 'up' ? diff >= 0 : diff <= 0;
  const deltaText =
    metric.unit === 'percent'
      ? `${diff >= 0 ? '+' : ''}${Math.round(diff)}pp`
      : `${diff >= 0 ? '+' : ''}${prevValue ? Math.round((diff / prevValue) * 100) : 0}%`;

  const overlayId = CORRELATE[metric.id];
  const overlay = compare && overlayId ? getMetric(overlayId) : null;
  const overlaySeries = overlay ? metricSeries(overlay, scope, period) : undefined;

  const matchedSignal =
    insightSignals.find((s) => s.metricId === metric.id && s.delta) ??
    insightSignals.find((s) => s.metricId === metric.id);
  const annotationLabel = matchedSignal?.delta ?? (matchedSignal ? 'flagged' : undefined);

  // Lowercase the metric name mid-sentence, but keep proper nouns (Auria).
  const metricPhrase = /^Auria/.test(metric.chip)
    ? metric.chip
    : metric.chip.charAt(0).toLowerCase() + metric.chip.slice(1);

  return (
    <View style={styles.shell}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.headline}>
            Here's {metricPhrase} {SCOPE_CONTEXT[scope]}.
          </Text>
          <Text style={styles.subheadline}>Auria tracked this over the {PERIOD_SUB[period]}.</Text>
        </View>
        <Pressable
          onPress={() => setCustomizeOpen(true)}
          style={({ pressed }) => [styles.customizeBtn, pressed && styles.customizePressed]}
          accessibilityRole="button"
          accessibilityLabel="Customize your insights"
          hitSlop={6}
        >
          <AuriaIcon name="settings" size={16} color={insights.text} strokeWidth={1.9} />
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statValue}>{formatMetricValue(metric, lastValue)}</Text>
        <Text style={[styles.statDelta, { color: deltaGood ? GOOD : BAD }]}>{deltaText}</Text>
        <Text style={styles.statHint}>vs previous</Text>
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

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: insights.accent }]} />
          <Text style={styles.legendText}>{metric.metaLabel}</Text>
        </View>
        {overlay ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendLineDashed, { borderColor: OVERLAY_COLOR }]} />
            <Text style={styles.legendText}>{overlay.metaLabel}</Text>
          </View>
        ) : null}
      </View>

      {overlay ? (
        <Text style={styles.compareHint}>Shapes compared on separate scales — trend, not absolute values.</Text>
      ) : null}

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

      <CustomizeHomeSheet visible={customizeOpen} onClose={() => setCustomizeOpen(false)} />
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
    headerCopy: { flex: 1, gap: 3 },
    customizeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: insights.heroSearchBg,
      ...myceoCornerStyle('icon'),
    },
    customizePressed: { opacity: 0.6 },
    headline: {
      ...auriaTypography.title,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: theme.typography.fontWeight.extrabold,
      color: insights.text,
    },
    subheadline: { ...auriaTypography.body, fontSize: 12.5, color: insights.textMuted, fontWeight: '500' },
    statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    statValue: {
      ...auriaTypography.title,
      fontSize: 30,
      fontWeight: theme.typography.fontWeight.extrabold,
      color: insights.text,
    },
    statDelta: { ...auriaTypography.body, fontSize: 13, fontWeight: '700' },
    statHint: { ...auriaTypography.body, fontSize: 11, color: insights.textHint, fontWeight: '500' },
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
      paddingHorizontal: 12,
      paddingVertical: 6,
      ...myceoCornerStyle('chip'),
    },
    segBtnActive: { backgroundColor: insights.accent },
    segText: { ...auriaTypography.body, fontSize: 12, fontWeight: '600', color: insights.textMuted },
    segTextActive: { color: insights.surface },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendLine: { width: 14, height: 3, borderRadius: 2 },
    legendLineDashed: { width: 14, height: 0, borderTopWidth: 2, borderStyle: 'dashed' },
    legendText: { ...auriaTypography.body, fontSize: 12, color: insights.textMuted, fontWeight: '600' },
    compareHint: {
      ...auriaTypography.body,
      fontSize: 10.5,
      color: insights.textHint,
      fontStyle: 'italic',
      marginTop: -4,
    },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    chip: {
      backgroundColor: theme.colors.chipSurface,
      ...myceoCornerStyle('chip'),
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipActive: { backgroundColor: insights.accent },
    chipText: { ...auriaTypography.body, fontSize: 12, fontWeight: '600', color: insights.textMuted },
    chipTextActive: { color: insights.surface },
    compareChip: { borderWidth: 1, borderColor: OVERLAY_COLOR, backgroundColor: 'transparent' },
    compareChipActive: { backgroundColor: OVERLAY_COLOR, borderColor: OVERLAY_COLOR },
    compareTextActive: { color: '#FFFFFF' },
  });
}
