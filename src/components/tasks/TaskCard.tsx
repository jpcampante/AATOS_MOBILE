import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../icons';
import {
  formatDueLabel,
  type TaskItem,
  type TaskPriority,
  type TaskSource,
  type TaskStatus,
} from '../../data/tasksMockData';
import { StripedProgress } from './StripedProgress';

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

const PRIORITY_CHIP_BG: Record<TaskPriority, string> = {
  Urgent: '#FF4D4F',
  High: '#4169E1',
  Normal: '#B7F34A',
  Low: '#E5E7EB',
};

const PRIORITY_CHIP_FG: Record<TaskPriority, string> = {
  Urgent: '#FFFFFF',
  High: '#FFFFFF',
  Normal: '#1F2A1A',
  Low: '#4B5563',
};

function cardBackground(priority: TaskPriority): string {
  switch (priority) {
    case 'Urgent':
      return '#FEE2E2';
    case 'High':
      return '#E9EBFF';
    case 'Normal':
      return '#EFF6E1';
    case 'Low':
      return '#F3F4F6';
  }
}

function progressColor(priority: TaskPriority): string {
  switch (priority) {
    case 'Urgent':
      return '#EF4444';
    case 'High':
      return '#4169E1';
    case 'Normal':
      return '#9CCE3F';
    case 'Low':
      return '#9CA3AF';
  }
}

function statusChip(status: TaskStatus): { bg: string; fg: string } {
  switch (status) {
    case 'blocked':
      return { bg: 'rgba(239,68,68,0.14)', fg: '#B91C1C' };
    case 'review':
      return { bg: 'rgba(67,56,202,0.14)', fg: '#3730A3' };
    case 'in_progress':
      return { bg: 'rgba(29,78,216,0.14)', fg: '#1D4ED8' };
    case 'waiting':
      return { bg: 'rgba(146,64,14,0.14)', fg: '#92400E' };
    case 'done':
      return { bg: 'rgba(22,101,52,0.16)', fg: '#166534' };
    case 'todo':
    default:
      return { bg: 'rgba(0,0,0,0.06)', fg: '#374151' };
  }
}

export function TaskCard({ item, onPress }: { item: TaskItem; onPress?: () => void }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const overdue = item.daysLeft != null && item.daysLeft < 0;
  const progress = item.progress ?? (item.status === 'done' ? 100 : item.status === 'in_progress' ? 50 : 0);
  const accent = progressColor(item.priority);
  const bg = cardBackground(item.priority);
  const st = statusChip(item.status);
  const showStatus = item.status !== 'todo' && item.status !== 'in_progress';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: bg }, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.topRow}>
        <View style={[styles.priorityChip, { backgroundColor: PRIORITY_CHIP_BG[item.priority] }]}>
          <Text style={[styles.priorityChipText, { color: PRIORITY_CHIP_FG[item.priority] }]}>
            {item.priority}
          </Text>
        </View>
        {item.isAiSuggestion && item.aiConfidence != null ? (
          <View style={styles.aiBadge}>
            <AuriaIcon name="sparkles" size={12} color={ds.auriaBlue} strokeWidth={2} />
            <Text style={styles.aiBadgeText}>{item.aiConfidence}%</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <AuriaIcon name={SOURCE_ICON[item.source]} size={AURIA_ICON_SIZE.xs} color={'rgba(15,18,22,0.55)'} strokeWidth={1.7} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.relatedItem ?? item.source}
          </Text>
        </View>
        <Text style={[styles.due, overdue && styles.dueOverdue]}>{formatDueLabel(item.daysLeft)}</Text>
      </View>

      <View style={styles.progressBlock}>
        <StripedProgress progress={progress} color={accent} height={14} trackOpacity={0.28} />
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
      </View>

      {(showStatus || item.blockedReason || item.waitingOn || item.reviewLabel) ? (
        <View style={styles.footer}>
          {showStatus ? (
            <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusChipText, { color: st.fg }]}>{STATUS_LABEL[item.status]}</Text>
            </View>
          ) : null}
          {item.blockedReason ? (
            <Text style={styles.contextText} numberOfLines={1}>
              <Text style={styles.contextLabel}>Blocked: </Text>
              {item.blockedReason}
            </Text>
          ) : null}
          {item.waitingOn ? (
            <Text style={styles.contextText} numberOfLines={1}>
              <Text style={styles.contextLabel}>Waiting on </Text>
              {item.waitingOn}
            </Text>
          ) : null}
          {item.reviewLabel ? (
            <Text style={[styles.contextText, styles.contextReview]} numberOfLines={1}>
              {item.reviewLabel}
            </Text>
          ) : null}
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
      borderRadius: 24,
      padding: 18,
      gap: 12,
    },
    cardPressed: {
      opacity: 0.92,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    priorityChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
    },
    priorityChipText: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 0.1,
    },
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.7)',
    },
    aiBadgeText: {
      ...auriaTypography.label,
      fontSize: 10.5,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.auriaBlue,
      letterSpacing: 0.2,
    },
    title: {
      ...auriaTypography.title,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#0F1216',
      letterSpacing: -0.3,
      lineHeight: 22,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
    },
    metaText: {
      ...auriaTypography.body,
      fontSize: 12,
      color: 'rgba(15,18,22,0.65)',
      flexShrink: 1,
    },
    due: {
      ...auriaTypography.body,
      fontSize: 12,
      color: 'rgba(15,18,22,0.65)',
      fontWeight: theme.typography.fontWeight.medium,
    },
    dueOverdue: {
      color: '#B91C1C',
      fontWeight: theme.typography.fontWeight.semibold,
    },
    progressBlock: {
      gap: 6,
    },
    progressMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressLabel: {
      ...auriaTypography.body,
      color: 'rgba(15,18,22,0.55)',
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.medium,
    },
    progressValue: {
      ...auriaTypography.body,
      color: '#0F1216',
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    statusChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusChipText: {
      ...auriaTypography.label,
      fontSize: 10.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: 0.1,
    },
    contextText: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 12,
      color: 'rgba(15,18,22,0.68)',
      lineHeight: 16,
    },
    contextLabel: {
      fontWeight: theme.typography.fontWeight.semibold,
      color: '#0F1216',
    },
    contextReview: {
      fontStyle: 'italic',
      color: '#3730A3',
    },
  });
}
