import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon } from '../../icons';
import { healthScore, heroFocus, pulse } from '../../../data/insights/selectors';
import { formatMetricValue, metricSeries } from '../../../data/insights/metrics';
import { LineChart } from '../LineChart';
import { DataSourceBadge } from '../DataSourceBadge';

const USER_NAME = 'Marta';
const GOOD = '#1D9E75';
const BAD = '#E5484D';
const HERO_LINE = '#1D4ED8';

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Zone 1 — the blue Brief hero: Auria narrates (greeting + pulse + health) with
 * a curated sparkline that proves the day's story (heroFocus). The full,
 * interactive Explorer lives lower as a neutral tool.
 */
export function AuriaBriefHero() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);
  const [expanded, setExpanded] = useState(false);

  const { attentionCount, topBlocker, movers } = pulse();
  const health = healthScore();
  const focus = heroFocus();

  const series = metricSeries(focus.metric, 'company', 'month');
  const lastValue = series[series.length - 1]?.value ?? 0;
  const prevValue = series[series.length - 2]?.value ?? lastValue;
  const diff = lastValue - prevValue;
  const deltaGood = focus.metric.goodDirection === 'up' ? diff >= 0 : diff <= 0;
  const deltaPct = prevValue ? Math.round((diff / prevValue) * 100) : 0;

  const topTitle = focus.signal?.title ?? topBlocker?.title;
  const bandColor = health.score >= 75 ? GOOD : health.score >= 50 ? '#B45309' : BAD;

  return (
    <View style={styles.card}>
      <Text style={styles.greeting}>{`${greetingFor()}, ${USER_NAME}`}</Text>
      <Text style={styles.headline}>
        {attentionCount} {attentionCount === 1 ? 'thing needs' : 'things need'} attention today
      </Text>
      {topTitle ? <Text style={styles.subline}>Top: {topTitle}</Text> : null}

      <View style={styles.moversRow}>
        {movers.map((mover, i) => (
          <Text key={mover.text} style={styles.moverText}>
            <Text style={{ color: mover.good ? GOOD : BAD }}>{mover.text}</Text>
            {i < movers.length - 1 ? <Text style={styles.moverDot}>{'  ·  '}</Text> : null}
          </Text>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={styles.healthBlock}
          accessibilityRole="button"
          accessibilityLabel="Company health breakdown"
        >
          <Text style={styles.healthLabel}>Company health</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: bandColor }]}>{health.score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
            <AuriaIcon
              name={expanded ? 'chevronDown' : 'chevronRight'}
              size={13}
              color={insights.textMuted}
              strokeWidth={2.2}
            />
          </View>
          <DataSourceBadge source={health.source} />
        </Pressable>

        <View style={styles.sparkBlock}>
          <View style={styles.sparkTop}>
            <Text style={styles.sparkLabel} numberOfLines={1}>{focus.metric.metaLabel}</Text>
            <DataSourceBadge source={focus.metric.source} />
          </View>
          <LineChart
            data={series}
            color={HERO_LINE}
            height={52}
            step={focus.metric.step}
            variant="spark"
          />
          <View style={styles.sparkBottom}>
            <Text style={styles.sparkValue}>{formatMetricValue(focus.metric, lastValue)}</Text>
            <Text style={[styles.sparkDelta, { color: deltaGood ? GOOD : BAD }]}>
              {diff >= 0 ? '+' : ''}{deltaPct}%
            </Text>
          </View>
        </View>
      </View>

      {expanded ? (
        <View style={styles.components}>
          {health.components.map((c) => (
            <View key={c.label} style={styles.component}>
              <Text style={styles.componentValue}>{c.value}</Text>
              <Text style={styles.componentLabel} numberOfLines={2}>{c.label}</Text>
              <Text style={styles.componentWeight}>{Math.round(c.weight * 100)}%</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: insights.heroShell,
      ...myceoCornerStyle('card'),
      ...theme.shadow.card,
      padding: theme.spacing.lg,
      gap: 4,
    },
    greeting: { fontSize: 13, fontWeight: '600', color: insights.textMuted },
    headline: {
      fontSize: 19,
      lineHeight: 25,
      fontWeight: '800',
      color: insights.text,
      letterSpacing: -0.3,
    },
    subline: { fontSize: 12.5, color: insights.textMuted, marginTop: 1 },
    moversRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    moverText: { fontSize: 12.5, fontWeight: '600' },
    moverDot: { color: insights.textHint },
    divider: { height: 1, backgroundColor: insights.divider, marginVertical: 12, opacity: 0.6 },
    row: { flexDirection: 'row', gap: 14, alignItems: 'stretch' },
    healthBlock: { width: 112, gap: 3, justifyContent: 'center' },
    healthLabel: { fontSize: 12, fontWeight: '600', color: insights.textMuted },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    score: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    scoreMax: { fontSize: 13, fontWeight: '600', color: insights.textHint },
    sparkBlock: { flex: 1, gap: 2, minWidth: 0 },
    sparkTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    sparkLabel: { flex: 1, fontSize: 11.5, fontWeight: '600', color: insights.textMuted },
    sparkBottom: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    sparkValue: { fontSize: 18, fontWeight: '800', color: insights.text },
    sparkDelta: { fontSize: 12, fontWeight: '700' },
    components: { flexDirection: 'row', gap: 8, marginTop: 12 },
    component: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.55)',
      ...myceoCornerStyle('inset'),
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 2,
    },
    componentValue: { fontSize: 16, fontWeight: '800', color: insights.text },
    componentLabel: { fontSize: 10, color: insights.textMuted, lineHeight: 13 },
    componentWeight: { fontSize: 9, fontWeight: '700', color: insights.textHint },
  });
}
