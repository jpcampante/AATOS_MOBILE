import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { InsightsHero } from '../components/insights/InsightsHero';
import { ExecutiveBrief } from '../components/insights/briefing/ExecutiveBrief';
import { NeedsYou } from '../components/insights/briefing/NeedsYou';
import { AuriaImpact } from '../components/insights/briefing/AuriaImpact';
import { AskAuria } from '../components/insights/briefing/AskAuria';
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
        <ExecutiveBrief />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={2}>
        <NeedsYou onNavigate={onNavigate} />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={3}>
        <AuriaImpact />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={4}>
        <InsightsHero />
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={5}>
        <AskAuria onNavigate={onNavigate} />
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
  });
}
