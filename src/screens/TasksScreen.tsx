import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { ActionFab } from '../components/ui/ActionFab';
import { NewTaskModal } from '../components/tasks/NewTaskModal';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskReviewModal } from '../components/tasks/TaskReviewModal';
import { TasksSection } from '../components/tasks/TasksSection';
import { TasksSummaryCards, type TaskQuickAction } from '../components/tasks/TasksSummaryCards';
import { tasksCardCorner } from '../components/tasks/tasksCorners';
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
import { auriaTypography, myceoCornerStyle, useTheme } from '../theme';

const MOCK_AVATAR = require('../../assets/mock-avatar.jpg');

type FilterId = (typeof taskFilters)[number]['id'];

export function TasksScreen() {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [filter, setFilter] = useState<FilterId>('all');
  const [workspace, setWorkspace] = useState('all');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<TaskItem[]>([]);

  const matchesWorkspace = (task: TaskItem) => workspace === 'all' || task.workspace === workspace;
  const today = [...localTasks, ...todayFocusTasks].filter(matchesWorkspace);
  const overdue = overdueTasks.filter(matchesWorkspace);
  const ai = aiSuggestionTasks.filter(matchesWorkspace);
  const waiting = waitingTasks.filter(matchesWorkspace);
  const reviewSuggestions = [...ai, ...overdue, ...today.filter((task) => task.source !== 'Manual'), ...waiting];
  const showAll = filter === 'all';
  const workspaceLabel = taskWorkspaces.find((item) => item.id === workspace)?.label ?? 'All workspaces';
  const aiSummary = useMemo(() => {
    const urgent = [...today, ...overdue].filter((task) => task.priority === 'Urgent' || task.priority === 'High').length;
    if (overdue.length > 0) {
      return `Auria read ${today.length + overdue.length + ai.length + waiting.length} tasks in ${workspaceLabel}. ${overdue.length} overdue and ${urgent} high-priority tasks need attention first.`;
    }
    return `Auria read ${today.length + ai.length + waiting.length} tasks in ${workspaceLabel}. The queue is on schedule; ${ai.length} AI suggestions are ready for review.`;
  }, [ai.length, overdue, today, waiting.length, workspaceLabel]);

  const handleQuickAction = (action: TaskQuickAction) => {
    if (action === 'aiSuggestions') {
      setReviewOpen(true);
      return;
    }
    setFilter(action);
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedScreenBlock index={0}>
          <View style={styles.topRow}>
            <View style={styles.greetingBlock}>
              <View style={styles.avatar}>
                <Image source={MOCK_AVATAR} style={styles.avatarImage} resizeMode="cover" accessibilityLabel="Marta" />
              </View>
              <View>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.greetingName}>Marta</Text>
              </View>
            </View>
          </View>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={1}>
          <Text style={styles.pageTitle}>Track your tasks</Text>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={2}>
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIcon}>
                <AuriaIcon name="sparkles" size={AURIA_ICON_SIZE.sm} color={ds.auriaBlue} strokeWidth={1.9} />
              </View>
              <View style={styles.aiHeaderText}>
                <Text style={styles.aiKicker}>Auria</Text>
                <Text style={styles.aiTitle}>{tasksAiOverview.title}</Text>
              </View>
            </View>
            <Text style={styles.aiSummary}>{aiSummary}</Text>
            <Pressable
              style={({ pressed }) => [styles.aiAction, pressed && styles.aiActionPressed]}
              onPress={() => setReviewOpen(true)}
              accessibilityRole="button"
            >
              <Text style={styles.aiActionText}>{tasksAiOverview.action}</Text>
              <AuriaIcon name="chevronRight" size={AURIA_ICON_SIZE.xs} color={ds.auriaBlue} strokeWidth={2.2} />
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
          <TasksSummaryCards summary={tasksSummary} onAction={handleQuickAction} />
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
      <ActionFab icon="plus" label="New task" onPress={() => setNewTaskOpen(true)} />
      <NewTaskModal visible={newTaskOpen} workspace={workspace} onClose={() => setNewTaskOpen(false)} onCreate={(task) => setLocalTasks((items) => [task, ...items])} />
      <TaskReviewModal
        visible={reviewOpen}
        suggestions={reviewSuggestions}
        onClose={() => setReviewOpen(false)}
        onCreateTask={(task) => setLocalTasks((items) => [task, ...items])}
      />
    </View>
  );
}

function createStyles(ds: ReturnType<typeof useTheme>['ds'], theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ds.pageSurface },
    scroll: { flex: 1, backgroundColor: ds.pageSurface },
    scrollContent: { padding: 18, paddingBottom: 96, gap: 20 },
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
      backgroundColor: ds.auriaBlue,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...myceoCornerStyle('iconLg'),
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    greeting: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
    greetingName: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    pageTitle: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 30,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    aiCard: {
      gap: 12,
      padding: 18,
      backgroundColor: '#DDE8FF',
      ...tasksCardCorner(),
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    aiIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.85)',
      ...myceoCornerStyle('icon'),
    },
    aiHeaderText: {
      flex: 1,
      gap: 1,
    },
    aiKicker: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    aiTitle: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    aiSummary: {
      ...auriaTypography.body,
      color: ds.gray700,
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
      backgroundColor: ds.white,
      ...myceoCornerStyle('chip'),
    },
    aiActionPressed: {
      opacity: 0.8,
    },
    aiActionText: {
      ...auriaTypography.body,
      color: ds.auriaBlue,
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
      color: ds.gray900,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    sectionHint: {
      ...auriaTypography.body,
      color: ds.gray500,
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
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    workspaceChipActive: {
      backgroundColor: ds.auriaBlue,
    },
    workspaceText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
    workspaceTextActive: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    workspaceBadge: {
      minWidth: 24,
      paddingHorizontal: 7,
      paddingVertical: 3,
      backgroundColor: ds.gray200,
      alignItems: 'center',
      justifyContent: 'center',
      ...myceoCornerStyle('chip'),
    },
    workspaceBadgeActive: {
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    workspaceCount: {
      ...auriaTypography.label,
      color: ds.gray700,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
    },
    workspaceCountActive: {
      color: ds.white,
    },
    filterRow: { gap: 8, paddingRight: 18 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    filterChipActive: {
      backgroundColor: ds.auriaBlue,
    },
    filterText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
    filterTextActive: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.bold,
    },
  });
}
