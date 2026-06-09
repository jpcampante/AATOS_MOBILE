import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { companyInsight, companyKpis, activitySeries } from '../../data/insightsMockData';
import { contentColors, myceoCornerStyle, useTheme } from '../../theme';
import { MiniBarChart } from './MiniBarChart';

export function InsightsKpiGrid() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  return (
    <View style={styles.grid}>
      {companyKpis.map((kpi) => (
        <View key={kpi.label} style={styles.card}>
          <Text style={styles.value}>{kpi.value}</Text>
          <Text style={styles.delta}>{kpi.delta}</Text>
          <Text style={styles.label}>{kpi.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function InsightsInsightCard() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightEyebrow}>AI insight</Text>
      <Text style={styles.insightTitle}>{companyInsight.title}</Text>
      <Text style={styles.insightBody}>{companyInsight.body}</Text>
      <View style={styles.actionsRow}>
        {companyInsight.actions.map((action) => (
          <View key={action} style={styles.actionPill}>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function InsightsActivityCard() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  return (
    <View style={styles.widgetCard}>
      <Text style={styles.widgetTitle}>Overall activity trend</Text>
      <Text style={styles.widgetSubtitle}>Aggregate index · recent months</Text>
      <MiniBarChart
        data={activitySeries}
        barColor={contentColors.chartBlue[theme.mode]}
        maxHeight={72}
      />
    </View>
  );
}

export function InsightsComparisonCard() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  return (
    <View style={styles.widgetCard}>
      <Text style={styles.widgetTitle}>Cross-data snapshot</Text>
      <Text style={styles.widgetSubtitle}>Tasks vs AI sessions</Text>
      <View style={styles.comparisonRow}>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonValue}>159</Text>
          <Text style={styles.comparisonLabel}>Tasks</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonValue}>240</Text>
          <Text style={styles.comparisonLabel}>AI sessions</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  const cardBase = {
    backgroundColor: insights.surface,
    ...myceoCornerStyle('card'),
    padding: theme.spacing.lg,
  } as const;

  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    card: {
      width: '48%',
      flexGrow: 1,
      ...cardBase,
      gap: 4,
    },
    value: {
      fontSize: 24,
      fontWeight: '800',
      color: insights.text,
    },
    delta: {
      fontSize: 12,
      fontWeight: '700',
      color: insights.positive,
    },
    label: {
      fontSize: 13,
      color: insights.textMuted,
      lineHeight: 18,
    },
    insightCard: {
      ...cardBase,
      gap: 10,
    },
    insightEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: theme.typography.letterSpacing.label,
      textTransform: 'uppercase',
      color: insights.textHint,
    },
    insightTitle: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '700',
      color: insights.text,
    },
    insightBody: {
      fontSize: 14,
      lineHeight: 21,
      color: insights.textMuted,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: 4,
    },
    actionPill: {
      backgroundColor: insights.filterBarBg,
      ...myceoCornerStyle('chip'),
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: insights.text,
    },
    widgetCard: {
      ...cardBase,
      gap: theme.spacing.sm,
    },
    widgetTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: insights.text,
    },
    widgetSubtitle: {
      fontSize: 12,
      color: insights.textMuted,
    },
    comparisonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    comparisonItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    comparisonValue: {
      fontSize: 28,
      fontWeight: '800',
      color: insights.text,
    },
    comparisonLabel: {
      fontSize: 12,
      color: insights.textMuted,
      fontWeight: '600',
    },
    divider: {
      width: 1,
      height: 48,
      backgroundColor: insights.divider,
    },
  });
}
