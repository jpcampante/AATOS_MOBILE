import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { NewTaskModal } from '../components/tasks/NewTaskModal';
import { TaskCard } from '../components/tasks/TaskCard';
import { TasksSection } from '../components/tasks/TasksSection';
import { TasksSummaryCards } from '../components/tasks/TasksSummaryCards';
import { AuriaIcon, AURIA_ICON_SIZE } from '../components/icons';
import {
  aiSuggestionTasks,
  overdueTasks,
  taskFilters,
  tasksAiOverview,
  tasksSummary,
  taskWorkspaces,
  todayFocusTasks,
  waitingTasks,
  type TaskItem,
} from '../data/tasksMockData';
import { auriaProfileInitials } from '../data/auriaMockData';
import { auriaTypography, useTheme } from '../theme';

type FilterId = (typeof taskFilters)[number]['id'];

export function TasksScreen() {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [filter, setFilter] = useState<FilterId>('all');
  const [workspace, setWorkspace] = useState('all');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<TaskItem[]>([]);

  const matchesWorkspace = (task: TaskItem) => workspace === 'all' || task.workspace === workspace;
  const today = [...localTasks, ...todayFocusTasks].filter(matchesWorkspace);
  const overdue = overdueTasks.filter(matchesWorkspace);
  const ai = aiSuggestionTasks.filter(matchesWorkspace);
  const waiting = waitingTasks.filter(matchesWorkspace);
  const showAll = filter === 'all';
  const workspaceLabel = taskWorkspaces.find((item) => item.id === workspace)?.label ?? 'All workspaces';
  const aiSummary = useMemo(() => {
    const urgent = [...today, ...overdue].filter((task) => task.priority === 'Urgent' || task.priority === 'High').length;
    if (overdue.length > 0) {
      return `Auria read ${today.length + overdue.length + ai.length + waiting.length} tasks in ${workspaceLabel}. ${overdue.length} overdue and ${urgent} high-priority tasks need attention first.`;
    }
    return `Auria read ${today.length + ai.length + waiting.length} tasks in ${workspaceLabel}. The queue is on schedule; ${ai.length} AI suggestions are ready for review.`;
  }, [ai.length, overdue, today, waiting.length, workspaceLabel]);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedScreenBlock index={0}>
          <View style={styles.topRow}>
            <View style={styles.greetingBlock}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{auriaProfileInitials}</Text>
              </View>
              <View>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.greetingName}>Marta</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setNewTaskOpen(true)}
              style={({ pressed }) => [styles.newTaskButton, pressed && styles.newTaskButtonPressed]}
              accessibilityLabel="New task"
              accessibilityRole="button"
            >
              <AuriaIcon name="plus" size={AURIA_ICON_SIZE.sm} color={ds.white} strokeWidth={2.4} />
              <Text style={styles.newTaskText}>New task</Text>
            </Pressable>
          </View>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={1}>
          <Text style={styles.pageTitle}>Track your tasks</Text>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={2}>
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIcon}>
                <AuriaIcon name="sparkles" size={AURIA_ICON_SIZE.sm} color="#0F1216" strokeWidth={1.9} />
              </View>
              <View style={styles.aiHeaderText}>
                <Text style={styles.aiKicker}>Auria</Text>
                <Text style={styles.aiTitle}>{tasksAiOverview.title}</Text>
              </View>
            </View>
            <Text style={styles.aiSummary}>{aiSummary}</Text>
            <Pressable
              style={({ pressed }) => [styles.aiAction, pressed && styles.aiActionPressed]}
              onPress={() => setFilter(overdue.length ? 'overdue' : 'ai')}
              accessibilityRole="button"
            >
              <Text style={styles.aiActionText}>{tasksAiOverview.action}</Text>
              <AuriaIcon name="chevronRight" size={AURIA_ICON_SIZE.xs} color="#0F1216" strokeWidth={2.2} />
            </Pressable>
          </View>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={3}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Workspaces</Text>
            <Text style={styles.sectionHint}>{workspaceLabel}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workspaceRow}>
            {taskWorkspaces.map((item) => {
              const active = workspace === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setWorkspace(item.id)}
                  style={[styles.workspaceChip, active && styles.workspaceChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.workspaceText, active && styles.workspaceTextActive]}>{item.label}</Text>
                  <View style={[styles.workspaceBadge, active && styles.workspaceBadgeActive]}>
                    <Text style={[styles.workspaceCount, active && styles.workspaceCountActive]}>{item.count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={4}>
          <TasksSummaryCards summary={tasksSummary} />
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={5}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {taskFilters.map((item) => {
              const active = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </AnimatedScreenBlock>

        {(showAll || filter === 'today') && today.length ? (
          <TasksSection title="Today focus" subtitle="Priority work waiting on you." count={today.length}>
            {today.map((task) => <TaskCard key={task.id} item={task} />)}
          </TasksSection>
        ) : null}
        {(showAll || filter === 'overdue') && overdue.length ? (
          <TasksSection title="Overdue" subtitle="Pick up where you left off." count={overdue.length}>
            {overdue.map((task) => <TaskCard key={task.id} item={task} />)}
          </TasksSection>
        ) : null}
        {(showAll || filter === 'ai') && ai.length ? (
          <TasksSection title="AI suggestions" subtitle="Tasks identified by Auria." count={ai.length}>
            {ai.map((task) => <TaskCard key={task.id} item={task} />)}
          </TasksSection>
        ) : null}
        {(showAll || filter === 'waiting') && waiting.length ? (
          <TasksSection title="Waiting on others" count={waiting.length}>
            {waiting.map((task) => <TaskCard key={task.id} item={task} />)}
          </TasksSection>
        ) : null}
      </ScrollView>
      <NewTaskModal visible={newTaskOpen} workspace={workspace} onClose={() => setNewTaskOpen(false)} onCreate={(task) => setLocalTasks((items) => [task, ...items])} />
    </>
  );
}

function createStyles(ds: ReturnType<typeof useTheme>['ds'], theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: ds.pageSurface },
    scrollContent: { padding: 18, paddingBottom: 40, gap: 20 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    greetingBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: ds.auriaBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...auriaTypography.label,
      color: ds.white,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
    },
    greeting: {
      ...auriaTypography.body,
      color: 'rgba(15,18,22,0.55)',
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
    greetingName: {
      ...auriaTypography.title,
      color: '#0F1216',
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    newTaskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: '#0F1216',
      borderRadius: 999,
    },
    newTaskButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    newTaskText: {
      ...auriaTypography.body,
      color: ds.white,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
    },
    pageTitle: {
      ...auriaTypography.title,
      color: '#0F1216',
      fontSize: 30,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    aiCard: {
      gap: 12,
      padding: 18,
      backgroundColor: '#DDE8FF',
      borderRadius: 22,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    aiIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.85)',
    },
    aiHeaderText: {
      flex: 1,
      gap: 1,
    },
    aiKicker: {
      ...auriaTypography.label,
      color: 'rgba(15,18,22,0.55)',
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    aiTitle: {
      ...auriaTypography.title,
      color: '#0F1216',
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    aiSummary: {
      ...auriaTypography.body,
      color: 'rgba(15,18,22,0.78)',
      fontSize: 13.5,
      lineHeight: 19,
    },
    aiAction: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
    },
    aiActionPressed: {
      opacity: 0.8,
    },
    aiActionText: {
      ...auriaTypography.body,
      color: '#0F1216',
      fontSize: 12.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionLabel: {
      ...auriaTypography.title,
      color: '#0F1216',
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    sectionHint: {
      ...auriaTypography.body,
      color: 'rgba(15,18,22,0.55)',
      fontSize: 12,
    },
    workspaceRow: { gap: 8, paddingRight: 18 },
    workspaceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 14,
      paddingRight: 8,
      paddingVertical: 8,
      backgroundColor: '#F3F4F6',
      borderRadius: 999,
    },
    workspaceChipActive: {
      backgroundColor: '#0F1216',
    },
    workspaceText: {
      ...auriaTypography.body,
      color: 'rgba(15,18,22,0.75)',
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
    workspaceTextActive: {
      color: '#FFFFFF',
      fontWeight: theme.typography.fontWeight.semibold,
    },
    workspaceBadge: {
      minWidth: 24,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: 'rgba(15,18,22,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    workspaceBadgeActive: {
      backgroundColor: '#B7F34A',
    },
    workspaceCount: {
      ...auriaTypography.label,
      color: 'rgba(15,18,22,0.7)',
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
    },
    workspaceCountActive: {
      color: '#1F2A1A',
    },
    filterRow: { gap: 8, paddingRight: 18 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: '#F3F4F6',
      borderRadius: 999,
    },
    filterChipActive: {
      backgroundColor: '#B7F34A',
    },
    filterText: {
      ...auriaTypography.body,
      color: 'rgba(15,18,22,0.7)',
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
    filterTextActive: {
      color: '#1F2A1A',
      fontWeight: theme.typography.fontWeight.bold,
    },
  });
}
