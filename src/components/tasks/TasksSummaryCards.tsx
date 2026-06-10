import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import type { TasksSummary } from '../../data/tasksMockData';
import { AuriaIcon } from '../icons';

type SummaryKey = keyof TasksSummary;

type CardSpec = {
  key: SummaryKey;
  title: string;
  description: (n: number) => string;
  bg: string;
  valueColor: string;
};

const CARDS: CardSpec[] = [
  { key: 'today', title: 'Today', description: (n) => `${n} need attention`, bg: '#E9EBFF', valueColor: '#1E2BFF' },
  { key: 'overdue', title: 'Overdue', description: (n) => `${n} behind schedule`, bg: '#FFE3E3', valueColor: '#E0353B' },
  { key: 'inProgress', title: 'In progress', description: (n) => `${n} active right now`, bg: '#EFF6E1', valueColor: '#3F6712' },
  { key: 'waiting', title: 'Waiting', description: (n) => `${n} on others`, bg: '#FFF1D6', valueColor: '#7A4A0E' },
  { key: 'blocked', title: 'Blocked', description: (n) => `${n} need unblocking`, bg: '#F4DCDC', valueColor: '#B0282C' },
  { key: 'aiSuggestions', title: 'AI suggested', description: (n) => `${n} for review`, bg: '#E6F4FF', valueColor: '#1F66B0' },
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
        return (
          <Pressable
            key={card.key}
            onPress={() => onSelect?.(card.key)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: card.bg },
              isActive && styles.cardActive,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${card.title}: ${value}`}
          >
            <View style={styles.topRow}>
              <Text style={styles.label}>{card.title}</Text>
              <View style={styles.arrowBadge}>
                <AuriaIcon name="arrowUp" size={11} color="#0F1216" strokeWidth={2.2} />
              </View>
            </View>
            <Text style={[styles.value, { color: card.valueColor }]}>{value}</Text>
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
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      gap: 4,
    },
    cardActive: {
      transform: [{ scale: 0.98 }],
    },
    cardPressed: {
      opacity: 0.88,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      ...auriaTypography.body,
      fontSize: 12.5,
      fontWeight: theme.typography.fontWeight.medium,
      color: 'rgba(15,18,22,0.62)',
    },
    arrowBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '40deg' }],
    },
    value: {
      fontSize: 36,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -1,
      marginTop: 2,
      lineHeight: 40,
    },
    description: {
      ...auriaTypography.body,
      fontSize: 12,
      color: 'rgba(15,18,22,0.6)',
    },
  });
}
