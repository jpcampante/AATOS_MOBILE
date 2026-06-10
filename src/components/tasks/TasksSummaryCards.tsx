import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import type { TasksSummary } from '../../data/tasksMockData';

type SummaryKey = keyof TasksSummary;

const CARDS: Array<{
  key: SummaryKey;
  title: string;
  description: (n: number) => string;
  tone: 'neutral' | 'warn' | 'accent';
}> = [
  { key: 'today', title: 'Today', description: (n) => `${n} need attention`, tone: 'neutral' },
  { key: 'overdue', title: 'Overdue', description: (n) => `${n} behind schedule`, tone: 'warn' },
  { key: 'inProgress', title: 'In progress', description: (n) => `${n} active right now`, tone: 'neutral' },
  { key: 'waiting', title: 'Waiting', description: (n) => `${n} on others`, tone: 'neutral' },
  { key: 'blocked', title: 'Blocked', description: (n) => `${n} need unblocking`, tone: 'warn' },
  { key: 'aiSuggestions', title: 'AI suggested', description: (n) => `${n} for review`, tone: 'accent' },
];

export function TasksSummaryCards({
  summary,
  activeKey,
  onSelect,
}: {
  summary: TasksSummary;
  activeKey?: SummaryKey | null;
  onSelect?: (key: SummaryKey) => void;
}) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <View style={styles.grid}>
      {CARDS.map((card) => {
        const value = summary[card.key];
        const isActive = activeKey === card.key;
        const valueColor =
          card.tone === 'warn' && value > 0
            ? ds.danger
            : card.tone === 'accent'
              ? ds.auriaBlue
              : ds.gray900;

        return (
          <Pressable
            key={card.key}
            onPress={() => onSelect?.(card.key)}
            style={({ pressed }) => [
              styles.card,
              isActive && styles.cardActive,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${card.title}: ${value}`}
          >
            <Text style={styles.label}>{card.title}</Text>
            <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
            <Text style={styles.description} numberOfLines={1}>
              {card.description(value)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    card: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: ds.white,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: ds.gray200,
      gap: 2,
    },
    cardActive: {
      borderColor: ds.gray700,
    },
    cardPressed: {
      backgroundColor: ds.gray100,
    },
    label: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray500,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    value: {
      fontSize: 28,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.6,
      marginTop: 2,
    },
    description: {
      ...auriaTypography.body,
      fontSize: 12,
      color: ds.gray500,
      marginTop: 2,
    },
  });
}
