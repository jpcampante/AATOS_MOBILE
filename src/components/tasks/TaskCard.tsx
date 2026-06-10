import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../icons';
import { formatDueLabel, type TaskItem, type TaskPriority, type TaskSource, type TaskStatus } from '../../data/tasksMockData';

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  waiting: 'Waiting',
  blocked: 'Blocked',
  review: 'Review',
  done: 'Done',
};

const SOURCE_ICON: Record<TaskSource, AuriaIconName> = {
  Manual: 'pin',
  Auria: 'sparkles',
  Email: 'messageSquare',
  Calendar: 'clock',
  Meeting: 'users',
  Document: 'document',
  Sales: 'briefcase',
};

type ChipTone = {
  bg: string;
  fg: string;
};

function priorityTone(priority: TaskPriority, ds: ReturnType<typeof useTheme>['ds']): ChipTone {
  switch (priority) {
    case 'Urgent':
      return { bg: ds.dangerSurface, fg: ds.danger };
    case 'High':
      return { bg: '#FFEDD5', fg: '#9A3412' };
    case 'Normal':
      return { bg: ds.gray100, fg: ds.gray700 };
    case 'Low':
      return { bg: ds.gray100, fg: ds.gray500 };
  }
}

function statusTone(status: TaskStatus, ds: ReturnType<typeof useTheme>['ds']): ChipTone {
  switch (status) {
    case 'blocked':
      return { bg: ds.dangerSurface, fg: ds.danger };
    case 'review':
      return { bg: '#E0E7FF', fg: '#3730A3' };
    case 'in_progress':
      return { bg: '#DBEAFE', fg: '#1D4ED8' };
    case 'waiting':
      return { bg: '#FEF3C7', fg: '#92400E' };
    case 'done':
      return { bg: '#DCFCE7', fg: '#166534' };
    case 'todo':
    default:
      return { bg: ds.gray100, fg: ds.gray700 };
  }
}

export function TaskCard({ item, onPress }: { item: TaskItem; onPress?: () => void }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const pri = priorityTone(item.priority, ds);
  const st = statusTone(item.status, ds);
  const overdue = item.daysLeft != null && item.daysLeft < 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.isAiSuggestion && item.aiConfidence != null ? (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>{item.aiConfidence}%</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: pri.bg }]}>
          <Text style={[styles.chipText, { color: pri.fg }]}>{item.priority}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: st.bg }]}>
          <Text style={[styles.chipText, { color: st.fg }]}>{STATUS_LABEL[item.status]}</Text>
        </View>
        <Text style={[styles.due, overdue && styles.dueOverdue]}>{formatDueLabel(item.daysLeft)}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <AuriaIcon name={SOURCE_ICON[item.source]} size={AURIA_ICON_SIZE.xs} color={ds.gray500} strokeWidth={1.7} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.relatedItem ?? item.source}
          </Text>
        </View>
        <Text style={styles.metaText}>· {item.lastActivity}</Text>
      </View>

      {item.blockedReason ? (
        <View style={styles.blockedRow}>
          <Text style={styles.blockedText} numberOfLines={2}>
            <Text style={styles.blockedLabel}>Blocked: </Text>
            {item.blockedReason}
          </Text>
        </View>
      ) : null}

      {item.waitingOn ? (
        <View style={styles.waitingRow}>
          <Text style={styles.waitingText}>
            <Text style={styles.waitingLabel}>Waiting on </Text>
            {item.waitingOn}
          </Text>
        </View>
      ) : null}

      {item.reviewLabel ? (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewText}>{item.reviewLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: ds.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: ds.gray200,
      padding: 14,
      gap: 10,
    },
    cardPressed: {
      backgroundColor: ds.gray100,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    title: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
      letterSpacing: -0.2,
      lineHeight: 20,
    },
    aiBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: '#EEF2FF',
    },
    aiBadgeText: {
      ...auriaTypography.label,
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.auriaBlue,
      letterSpacing: 0.2,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    chipText: {
      ...auriaTypography.label,
      fontSize: 10.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: 0.1,
    },
    due: {
      ...auriaTypography.body,
      fontSize: 11.5,
      color: ds.gray500,
      fontWeight: theme.typography.fontWeight.medium,
    },
    dueOverdue: {
      color: ds.danger,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
    },
    metaText: {
      ...auriaTypography.body,
      fontSize: 11.5,
      color: ds.gray500,
      flexShrink: 1,
    },
    blockedRow: {
      paddingTop: 2,
    },
    blockedText: {
      ...auriaTypography.body,
      fontSize: 12,
      color: ds.danger,
      lineHeight: 16,
    },
    blockedLabel: {
      fontWeight: theme.typography.fontWeight.semibold,
    },
    waitingRow: {
      paddingTop: 2,
    },
    waitingText: {
      ...auriaTypography.body,
      fontSize: 12,
      color: '#92400E',
      lineHeight: 16,
    },
    waitingLabel: {
      fontWeight: theme.typography.fontWeight.semibold,
    },
    reviewRow: {
      paddingTop: 2,
    },
    reviewText: {
      ...auriaTypography.body,
      fontSize: 12,
      color: '#3730A3',
      lineHeight: 16,
      fontStyle: 'italic',
    },
  });
}
