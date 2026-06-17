import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TaskItem, TaskPriority } from '../../data/tasksMockData';
import { TASKS_USER, taskWorkspaces } from '../../data/tasksMockData';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { tasksSheetCorner } from './tasksCorners';

type NewTaskModalProps = {
  visible: boolean;
  workspace: string;
  onClose: () => void;
  onCreate: (task: TaskItem) => void;
};

const PRIORITY_OPTIONS: TaskPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

export function NewTaskModal({ visible, workspace, onClose, onCreate }: NewTaskModalProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, safe.bottom), [ds, theme, safe.bottom]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Normal');
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspace === 'all' ? 'aatos' : workspace);

  useEffect(() => {
    if (visible) {
      setSelectedWorkspace(workspace === 'all' ? 'aatos' : workspace);
    }
  }, [visible, workspace]);

  const createTask = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onCreate({
      id: `local-${Date.now()}`,
      title: cleanTitle,
      status: 'todo',
      priority,
      daysLeft: 1,
      source: 'Manual',
      relatedItem: description.trim() || 'Created in Tasks',
      owner: TASKS_USER,
      lastActivity: 'Just now',
      workspace: selectedWorkspace,
      progress: 0,
    });
    setTitle('');
    setDescription('');
    setPriority('Normal');
    onClose();
  };

  const canCreate = title.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close new task" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>New Task</Text>
            <Pressable onPress={createTask} disabled={!canCreate} accessibilityRole="button" accessibilityLabel="Save task">
              <Text style={[styles.doneText, !canCreate && styles.doneTextDisabled]}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                placeholderTextColor={ds.gray400}
                style={styles.input}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add context for this task"
                placeholderTextColor={ds.gray400}
                multiline
                style={[styles.input, styles.description]}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Workspace</Text>
              <View style={styles.chips}>
                {taskWorkspaces.filter((item) => item.id !== 'all').map((item) => {
                  const active = selectedWorkspace === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedWorkspace(item.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITY_OPTIONS.map((option) => {
                  const active = priority === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setPriority(option)}
                      style={[styles.priorityChip, active && styles.priorityChipActive]}
                    >
                      <Text style={[styles.priorityText, active && styles.priorityTextActive]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeBottom: number,
) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: ds.offBlackOverlay },
    sheet: {
      maxHeight: '92%',
      paddingTop: 16,
      paddingHorizontal: 18,
      paddingBottom: Math.max(safeBottom + 16, 24),
      backgroundColor: ds.white,
      ...tasksSheetCorner(),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
    },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.2,
    },
    cancelText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 15,
    },
    doneText: {
      ...auriaTypography.body,
      color: ds.auriaBlue,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    doneTextDisabled: {
      opacity: 0.4,
    },
    scrollContent: {
      gap: 18,
      paddingBottom: 12,
    },
    field: {
      gap: 8,
    },
    label: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
    },
    input: {
      ...auriaTypography.body,
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: ds.gray900,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('inset'),
      fontSize: 15,
    },
    description: {
      minHeight: 96,
      textAlignVertical: 'top',
      paddingTop: 14,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    chipActive: {
      backgroundColor: ds.auriaBlue,
    },
    chipText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
    chipTextActive: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.bold,
    },
    priorityRow: {
      flexDirection: 'row',
      gap: 6,
      padding: 4,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('inset'),
    },
    priorityChip: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      ...myceoCornerStyle('chip'),
    },
    priorityChipActive: {
      backgroundColor: ds.auriaBlue,
    },
    priorityText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
    priorityTextActive: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.bold,
    },
  });
}
