import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { TaskCard } from '../components/tasks/TaskCard';
import { TasksSection } from '../components/tasks/TasksSection';
import { TasksSummaryCards } from '../components/tasks/TasksSummaryCards';
import {
  aiSuggestionTasks,
  overdueTasks,
  taskFilters,
  tasksSummary,
  todayFocusTasks,
  waitingTasks,
} from '../data/tasksMockData';
import { auriaTypography, useTheme } from '../theme';

type FilterId = (typeof taskFilters)[number]['id'];

export function TasksScreen() {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [filter, setFilter] = useState<FilterId>('all');

  const showAll = filter === 'all';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AnimatedScreenBlock index={0}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Tasks</Text>
          <Text style={styles.pageSubtitle}>Your personal queue</Text>
        </View>
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={1}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {taskFilters.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.filterChipPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${f.label}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </AnimatedScreenBlock>

      <AnimatedScreenBlock index={2}>
        <TasksSummaryCards summary={tasksSummary} />
      </AnimatedScreenBlock>

      {(showAll || filter === 'today') && todayFocusTasks.length ? (
        <AnimatedScreenBlock index={3}>
          <TasksSection
            title="Today Focus"
            subtitle="Due today, high-impact work waiting on you."
            count={todayFocusTasks.length}
          >
            {todayFocusTasks.map((task) => (
              <TaskCard key={task.id} item={task} />
            ))}
          </TasksSection>
        </AnimatedScreenBlock>
      ) : null}

      {(showAll || filter === 'overdue') && overdueTasks.length ? (
        <AnimatedScreenBlock index={4}>
          <TasksSection
            title="Overdue"
            subtitle="Past due — pick up where you left off."
            count={overdueTasks.length}
          >
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} item={task} />
            ))}
          </TasksSection>
        </AnimatedScreenBlock>
      ) : null}

      {(showAll || filter === 'ai') && aiSuggestionTasks.length ? (
        <AnimatedScreenBlock index={5}>
          <TasksSection
            title="AI Suggestions"
            subtitle="From Auria — accept or dismiss to keep your queue clean."
            count={aiSuggestionTasks.length}
          >
            {aiSuggestionTasks.map((task) => (
              <TaskCard key={task.id} item={task} />
            ))}
          </TasksSection>
        </AnimatedScreenBlock>
      ) : null}

      {(showAll || filter === 'waiting') && waitingTasks.length ? (
        <AnimatedScreenBlock index={6}>
          <TasksSection
            title="Waiting on others"
            subtitle="Tasks delegated and currently with someone else."
            count={waitingTasks.length}
          >
            {waitingTasks.map((task) => (
              <TaskCard key={task.id} item={task} />
            ))}
          </TasksSection>
        </AnimatedScreenBlock>
      ) : null}
    </ScrollView>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: ds.pageSurface,
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
      color: ds.gray900,
      letterSpacing: -0.4,
    },
    pageSubtitle: {
      fontSize: theme.typography.fontSize.md,
      color: ds.gray500,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: theme.spacing.lg,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: ds.white,
      borderWidth: 1,
      borderColor: ds.gray200,
    },
    filterChipActive: {
      backgroundColor: ds.gray900,
      borderColor: ds.gray900,
    },
    filterChipPressed: {
      opacity: 0.78,
    },
    filterText: {
      ...auriaTypography.body,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray700,
    },
    filterTextActive: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
}
