import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../../icons';
import { auriaImpact } from '../../../data/insights/selectors';
import { useAcceptanceRate } from '../../../data/insights/auriaAcceptance';
import { DataSourceBadge } from '../DataSourceBadge';

/** Zone 3 — what Auria did this week. Acceptance rate is the trust metric. */
export function AuriaImpact() {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);

  const acceptanceRate = useAcceptanceRate();
  const impact = useMemo(() => auriaImpact(acceptanceRate), [acceptanceRate]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <AuriaIcon name="sparkles" size={AURIA_ICON_SIZE.sm} color="#2563EB" strokeWidth={1.9} />
        </View>
        <Text style={styles.title}>Auria impact this week</Text>
      </View>

      <View style={styles.acceptance}>
        <View style={styles.acceptanceLeft}>
          <View style={styles.acceptanceValueRow}>
            <Text style={styles.acceptanceValue}>{impact.acceptanceRate.value}%</Text>
            <DataSourceBadge source={impact.acceptanceRate.source} />
          </View>
          <Text style={styles.acceptanceLabel}>Suggestion acceptance</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {impact.items.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={styles.itemTop}>
              <Text style={styles.itemValue}>{item.value}</Text>
              <DataSourceBadge source={item.source} />
            </View>
            <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
          </View>
        ))}
      </View>
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
      gap: 12,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    headerIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EEF3FF',
      ...myceoCornerStyle('iconSm'),
    },
    title: { ...auriaTypography.title, fontSize: 16, fontWeight: theme.typography.fontWeight.bold, color: insights.text },
    acceptance: {
      backgroundColor: insights.page,
      ...myceoCornerStyle('inset'),
      padding: 12,
    },
    acceptanceLeft: { gap: 2 },
    acceptanceValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    acceptanceValue: { ...auriaTypography.title, fontSize: 28, fontWeight: theme.typography.fontWeight.bold, color: insights.text },
    acceptanceLabel: { ...auriaTypography.body, fontSize: 12, fontWeight: '600', color: insights.textMuted },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    item: {
      width: '48%',
      flexGrow: 1,
      backgroundColor: insights.page,
      ...myceoCornerStyle('inset'),
      padding: 11,
      gap: 2,
    },
    itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemValue: { ...auriaTypography.title, fontSize: 18, fontWeight: theme.typography.fontWeight.bold, color: insights.text },
    itemLabel: { ...auriaTypography.body, fontSize: 11.5, color: insights.textMuted },
  });
}
