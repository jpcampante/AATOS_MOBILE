import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TasksSummary } from '../../data/tasksMockData';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../icons';

export type TaskQuickAction = 'today' | 'overdue' | 'aiSuggestions' | 'waiting';

type ActionSpec = {
  key: TaskQuickAction;
  title: string;
  description: string;
  icon: AuriaIconName;
};

const ACTIONS: ActionSpec[] = [
  { key: 'today', title: 'Today focus', description: 'Open priority work', icon: 'clock' },
  { key: 'overdue', title: 'Overdue', description: 'Resolve late tasks', icon: 'arrowPath' },
  { key: 'aiSuggestions', title: 'Review Auria', description: 'Review detected actions', icon: 'sparkles' },
  { key: 'waiting', title: 'Delegated', description: 'Check waiting tasks', icon: 'users' },
];

export function TasksSummaryCards({
  summary,
  onAction,
}: {
  summary: TasksSummary;
  onAction: (action: TaskQuickAction) => void;
}) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <View>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Quick actions</Text>
        <Text style={styles.headingHint}>Tasks tools</Text>
      </View>
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => onAction(action.key)}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}: ${summary[action.key]}`}
          >
            <View style={styles.icon}>
              <AuriaIcon name={action.icon} size={AURIA_ICON_SIZE.xs} color={ds.gray700} strokeWidth={1.9} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{action.title}</Text>
                <Text style={styles.count}>{summary[action.key]}</Text>
              </View>
              <Text style={styles.description} numberOfLines={1}>{action.description}</Text>
            </View>
            <AuriaIcon name="chevronRight" size={12} color={ds.gray400} strokeWidth={2} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    heading: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 9,
    },
    headingTitle: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    headingHint: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 11,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    action: {
      flexBasis: '48%',
      flexGrow: 1,
      minWidth: 0,
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('inset'),
    },
    actionPressed: {
      backgroundColor: ds.gray200,
      transform: [{ scale: 0.985 }],
    },
    icon: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      ...myceoCornerStyle('iconSm'),
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    title: {
      ...auriaTypography.body,
      flexShrink: 1,
      color: ds.gray900,
      fontSize: 11.5,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    count: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.bold,
    },
    description: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 9,
    },
  });
}
