import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { InsightsExplorer } from '../components/insights/InsightsExplorer';
import { MetricChartCard } from '../components/insights/MetricChartCard';
import { ExecutiveBrief } from '../components/insights/briefing/ExecutiveBrief';
import { NeedsYou } from '../components/insights/briefing/NeedsYou';
import { AuriaImpact } from '../components/insights/briefing/AuriaImpact';
import { AskAuria } from '../components/insights/briefing/AskAuria';
import {
  isMetricCard,
  metricIdOf,
  useVisibleHomeCards,
  type LayoutCardId,
} from '../data/insights/homeLayout';
import type { NavigateFn } from '../data/productNavigation';
import { useTheme } from '../theme';

type HomeScreenProps = {
  onNavigate: NavigateFn;
};

/**
 * Insights = "Auria Briefing": Auria narrates (Brief, Impact, Ask), you act
 * (Needs You), the chart proves (Explorer). One signals/metrics source — no
 * repeated numbers.
 */
export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);
  const visibleCards = useVisibleHomeCards();

  // Order/visibility come from the layout store, driven by the Explorer's
  // "Customize" sheet. Metric cards (`metric:<id>`) render a pinned chart.
  const renderCard = (id: LayoutCardId): ReactNode => {
    if (isMetricCard(id)) return <MetricChartCard metricId={metricIdOf(id)} />;
    switch (id) {
      case 'explorer':
        return <InsightsExplorer />;
      case 'brief':
        return <ExecutiveBrief />;
      case 'needsYou':
        return <NeedsYou onNavigate={onNavigate} />;
      case 'impact':
        return <AuriaImpact />;
      case 'askAuria':
        return <AskAuria onNavigate={onNavigate} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
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

        {visibleCards.map((id, i) => (
          <AnimatedScreenBlock key={id} index={i + 1}>
            {renderCard(id)}
          </AnimatedScreenBlock>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  const gradient = {
    backgroundImage:
      theme.mode === 'dark'
        ? 'linear-gradient(180deg, #0E1B31 0%, #111827 46%, #0D1117 100%)'
        : 'linear-gradient(180deg, #EAF4FF 0%, #F7FBFF 44%, #F4F7FF 100%)',
    experimental_backgroundImage:
      theme.mode === 'dark'
        ? 'linear-gradient(180deg, #0E1B31 0%, #111827 46%, #0D1117 100%)'
        : 'linear-gradient(180deg, #EAF4FF 0%, #F7FBFF 44%, #F4F7FF 100%)',
  } as unknown as ViewStyle;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.mode === 'dark' ? '#0E1B31' : '#EAF4FF',
      ...gradient,
    },
    scroll: {
      flex: 1,
      backgroundColor: 'transparent',
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
  });
}
