import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { heroPlaceholder } from '../../data/insightsMockData';
import { formatMetricValue, insightMetrics } from '../../data/insightsMetrics';
import { myceoCornerStyle, useTheme } from '../../theme';
import { LineChart } from './LineChart';

export function InsightsHero() {
  const [prompt, setPrompt] = useState('');
  const [metricId, setMetricId] = useState(insightMetrics[0].id);
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  const metric = insightMetrics.find((item) => item.id === metricId) ?? insightMetrics[0];
  const lastValue = metric.series[metric.series.length - 1]?.value ?? 0;

  return (
    <View style={styles.shell}>
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={heroPlaceholder}
          placeholderTextColor={insights.textHint}
          style={styles.searchInput}
        />
        <Pressable style={styles.sparkButton}>
          <Text style={styles.sparkIcon}>✦</Text>
        </Pressable>
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.sparkTitle}>✦</Text>
        <View style={styles.copyText}>
          <Text style={styles.headline}>{`Here's a line graph of ${metric.headline}.`}</Text>
          <Text style={styles.subheadline}>Starting from 12 months ago.</Text>
        </View>
      </View>

      <LineChart
        data={metric.series}
        color={insights.accent}
        height={184}
        step={metric.step}
        valueSuffix={metric.unit === 'percent' ? '%' : ''}
      />

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>{metric.metaLabel}</Text>
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
      gap: theme.spacing.lg,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: insights.heroSearchBg,
      ...myceoCornerStyle('inset'),
      paddingHorizontal: 14,
      paddingVertical: 10,
      ...theme.shadow.heroSearch,
    },
    searchIcon: {
      color: insights.textHint,
      fontSize: 16,
      fontWeight: '700',
    },
    searchInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: insights.text,
      paddingVertical: 0,
    },
    sparkButton: {
      width: 28,
      height: 28,
      ...myceoCornerStyle('icon'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: insights.accentBg,
    },
    sparkIcon: {
      color: insights.accent,
      fontSize: 14,
      fontWeight: '700',
    },
    copyBlock: {
      flexDirection: 'row',
      gap: 10,
    },
    sparkTitle: {
      color: insights.text,
      fontSize: 18,
      marginTop: 2,
    },
    copyText: {
      flex: 1,
      gap: 6,
    },
    headline: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700',
      color: insights.text,
    },
    subheadline: {
      fontSize: 14,
      color: insights.textMuted,
      fontWeight: '500',
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaLabel: {
      fontSize: 12,
      color: insights.textMuted,
      fontWeight: '600',
    },
    metaValue: {
      fontSize: 22,
      color: insights.text,
      fontWeight: '800',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      backgroundColor: theme.colors.chipSurface,
      ...myceoCornerStyle('chip'),
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipActive: {
      backgroundColor: insights.accent,
    },
    chipText: {
      fontSize: 12,
      color: insights.textMuted,
      fontWeight: '600',
    },
    chipTextActive: {
      color: insights.surface,
    },
  });
}
