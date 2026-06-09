import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { InsightsHero } from '../components/insights/InsightsHero';
import {
  InsightsActivityCard,
  InsightsComparisonCard,
  InsightsInsightCard,
  InsightsKpiGrid,
} from '../components/insights/InsightsWidgets';
import { companyDashboard } from '../data/insightsMockData';
import { myceoCornerStyle, useTheme } from '../theme';

export function HomeScreen() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AnimatedScreenBlock index={0}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Insights</Text>
          <Text style={styles.pageSubtitle}>Company command center</Text>
        </View>
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={1}>
        <View style={styles.toolbar}>
          <View style={styles.dashboardPill}>
            <Text style={styles.dashboardPillText}>{companyDashboard.name}</Text>
            <Text style={styles.dashboardChevron}>▾</Text>
          </View>
          <View style={styles.viewPill}>
            <Text style={styles.viewPillText}>View: Default</Text>
          </View>
        </View>
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={2}>
        <InsightsHero />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={3}>
        <InsightsKpiGrid />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={4}>
        <InsightsInsightCard />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={5}>
        <InsightsActivityCard />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={6}>
        <InsightsComparisonCard />
      </AnimatedScreenBlock>
    </ScrollView>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: insights.page,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.lg,
    },
    headerRow: {
      gap: 2,
    },
    pageTitle: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      color: insights.text,
    },
    pageSubtitle: {
      fontSize: theme.typography.fontSize.md,
      color: insights.textMuted,
    },
    toolbar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    dashboardPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...myceoCornerStyle('chip'),
      backgroundColor: insights.filterBarBg,
    },
    dashboardPillText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: insights.text,
    },
    dashboardChevron: {
      fontSize: 10,
      color: insights.textMuted,
    },
    viewPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...myceoCornerStyle('chip'),
      backgroundColor: insights.surface,
    },
    viewPillText: {
      fontSize: theme.typography.fontSize.sm,
      color: insights.textMuted,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });
}
