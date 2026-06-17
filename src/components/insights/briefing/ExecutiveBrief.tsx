import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon } from '../../icons';
import { healthScore, pulse } from '../../../data/insights/selectors';
import { DataSourceBadge } from '../DataSourceBadge';

const USER_NAME = 'Marta';
const GOOD = '#1D9E75';
const BAD = '#E5484D';

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Auria's narrative: greeting + pulse + health score (components tap-to-expand). No chart. */
export function ExecutiveBrief() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);
  const [expanded, setExpanded] = useState(false);

  const { attentionCount, topBlocker, movers } = pulse();
  const health = healthScore();
  const bandColor = health.score >= 75 ? GOOD : health.score >= 50 ? '#B45309' : BAD;

  return (
    <View style={styles.card}>
      <Text style={styles.greeting}>{`${greetingFor()}, ${USER_NAME}`}</Text>
      <Text style={styles.headline}>
        {attentionCount} {attentionCount === 1 ? 'thing needs' : 'things need'} attention today
      </Text>
      {topBlocker ? <Text style={styles.subline}>Top: {topBlocker.title}</Text> : null}

      <View style={styles.moversRow}>
        {movers.map((mover, i) => (
          <Text key={mover.text} style={styles.moverText}>
            <Text style={{ color: mover.good ? GOOD : BAD }}>{mover.text}</Text>
            {i < movers.length - 1 ? <Text style={styles.moverDot}>{'  ·  '}</Text> : null}
          </Text>
        ))}
      </View>

      <View style={styles.divider} />

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.healthRow}
        accessibilityRole="button"
        accessibilityLabel="Company health breakdown"
      >
        <View style={styles.healthLeft}>
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
        </View>
        <DataSourceBadge source={health.source} />
      </Pressable>

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
      backgroundColor: insights.surface,
      ...myceoCornerStyle('card'),
      ...theme.shadow.card,
      padding: theme.spacing.lg,
      gap: 4,
    },
    greeting: { ...auriaTypography.body, fontSize: 13, fontWeight: '600', color: insights.textMuted },
    headline: {
      ...auriaTypography.title,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: theme.typography.fontWeight.bold,
      color: insights.text,
    },
    subline: { ...auriaTypography.body, fontSize: 12.5, color: insights.textMuted, marginTop: 1 },
    moversRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    moverText: { ...auriaTypography.body, fontSize: 12.5, fontWeight: '600' },
    moverDot: { color: insights.textHint },
    divider: { height: 1, backgroundColor: insights.divider, marginVertical: 12 },
    healthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    healthLeft: { gap: 1 },
    healthLabel: { ...auriaTypography.body, fontSize: 12, fontWeight: '600', color: insights.textMuted },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    score: { ...auriaTypography.title, fontSize: 30, fontWeight: theme.typography.fontWeight.bold },
    scoreMax: { ...auriaTypography.body, fontSize: 13, fontWeight: '600', color: insights.textHint },
    components: { flexDirection: 'row', gap: 8, marginTop: 12 },
    component: {
      flex: 1,
      backgroundColor: insights.page,
      ...myceoCornerStyle('inset'),
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 2,
    },
    componentValue: { ...auriaTypography.title, fontSize: 16, fontWeight: theme.typography.fontWeight.bold, color: insights.text },
    componentLabel: { ...auriaTypography.body, fontSize: 10, color: insights.textMuted, lineHeight: 13 },
    componentWeight: { ...auriaTypography.label, fontSize: 9, fontWeight: '700', color: insights.textHint },
  });
}
