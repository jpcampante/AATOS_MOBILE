import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TaskItem, TaskSource } from '../../data/tasksMockData';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../icons';
import { tasksCardCorner, tasksSheetCorner } from './tasksCorners';

type TaskReviewModalProps = {
  visible: boolean;
  suggestions: TaskItem[];
  onClose: () => void;
  onCreateTask: (task: TaskItem) => void;
};

const SOURCE_ICONS: Record<TaskSource, AuriaIconName> = {
  Manual: 'pin',
  Auria: 'sparkles',
  Email: 'messageSquare',
  Calendar: 'clock',
  Meeting: 'users',
  Document: 'document',
  Sales: 'briefcase',
};

export function TaskReviewModal({ visible, suggestions, onClose, onCreateTask }: TaskReviewModalProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(ds, theme, safe.top, safe.bottom, windowHeight),
    [ds, safe.bottom, safe.top, theme, windowHeight],
  );
  const [source, setSource] = useState<TaskSource | 'All'>('All');
  const [processed, setProcessed] = useState<string[]>([]);

  const visibleSuggestions = suggestions.filter((item) => source === 'All' || item.source === source);
  const highPriority = suggestions.filter((item) => item.priority === 'High' || item.priority === 'Urgent').length;
  const sources = Array.from(new Set(suggestions.map((item) => item.source)));
  const pendingCount = suggestions.length - processed.length;

  const createSuggestion = (item: TaskItem) => {
    onCreateTask({ ...item, id: `review-${Date.now()}-${item.id}`, isAiSuggestion: false, lastActivity: 'Created now' });
    setProcessed((items) => [...items, item.id]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close review focus" />
        <View style={styles.sheet}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <AuriaIcon name="sparkles" size={AURIA_ICON_SIZE.sm} color={ds.auriaBlue} strokeWidth={1.9} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>AI task suggestions</Text>
              <Text style={styles.subtitle}>Actions detected by Auria across connected workspace sources.</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <View style={styles.closeIcon}>
                <AuriaIcon name="plus" size={14} color={ds.gray600} strokeWidth={2.4} />
              </View>
            </Pressable>
          </View>

          {/* ── Stats row ── */}
          <View style={styles.stats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{String(pendingCount).padStart(2, '0')}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{String(highPriority).padStart(2, '0')}</Text>
              <Text style={styles.statLabel}>High priority</Text>
            </View>
            <View style={[styles.statCard, styles.statCardAccent]}>
              <Text style={styles.statValueAccent}>{String(sources.length).padStart(2, '0')}</Text>
              <Text style={styles.statLabelAccent}>Sources</Text>
            </View>
          </View>

          {/* ── Source filters ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {(['All', ...sources] as Array<TaskSource | 'All'>).map((item) => {
              const active = source === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setSource(item)}
                  style={({ pressed }) => [styles.filter, active && styles.filterActive, pressed && styles.filterPressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── Suggestion list ── */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {visibleSuggestions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No suggestions for this source.</Text>
              </View>
            ) : (
              visibleSuggestions.map((item) => {
                const isProcessed = processed.includes(item.id);
                const reasonText = item.blockedReason ?? item.reviewLabel ?? item.waitingOn;
                return (
                  <View key={item.id} style={[styles.suggestion, isProcessed && styles.suggestionProcessed]}>
                    <View style={styles.suggestionTop}>
                      <View style={styles.sourceIcon}>
                        <AuriaIcon name={SOURCE_ICONS[item.source]} size={AURIA_ICON_SIZE.xs} color={ds.gray600} strokeWidth={1.9} />
                      </View>
                      <View style={styles.suggestionCopy}>
                        <Text style={styles.suggestionTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.suggestionSource} numberOfLines={1}>
                          {item.source} · {item.relatedItem ?? item.workspace}
                        </Text>
                      </View>
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>{item.priority}</Text>
                      </View>
                    </View>

                    <Text style={styles.reason} numberOfLines={2}>
                      {reasonText
                        ? `Context: ${reasonText}`
                        : `Auria detected a relevant action in ${item.source.toLowerCase()}.`}
                    </Text>

                    <View style={styles.suggestionFooter}>
                      <Text style={styles.confidence}>{item.aiConfidence ?? 82}% confidence</Text>
                      <Pressable
                        disabled={isProcessed}
                        onPress={() => createSuggestion(item)}
                        style={({ pressed }) => [
                          styles.createButton,
                          isProcessed && styles.createButtonDone,
                          !isProcessed && pressed && styles.createButtonPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={isProcessed ? 'Task created' : 'Create task'}
                      >
                        <Text style={[styles.createButtonText, isProcessed && styles.createButtonTextDone]}>
                          {isProcessed ? 'Created' : 'Create task'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {pendingCount} suggestion{pendingCount !== 1 ? 's' : ''} ready
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeTop: number,
  safeBottom: number,
  windowHeight: number,
) {
  // Bound the suggestion list with a pixel height (not flex). A `flex` child
  // inside a `maxHeight`-only sheet has no definite height on native (Yoga),
  // which leaves the sheet stuck / the list collapsed. This sheet has more
  // chrome (header + stats + filters), so the list cap is smaller.
  const listMaxHeight = Math.round(windowHeight * 0.55);
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: ds.offBlackOverlay,
    },
    sheet: {
      maxHeight: Math.round(windowHeight * 0.9),
      flexDirection: 'column',
      backgroundColor: ds.white,
      ...tasksSheetCorner(),
      paddingBottom: Math.max(safeBottom, 8),
      overflow: 'hidden',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 18,
      paddingBottom: 14,
    },
    headerIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EEF4FF',
      ...myceoCornerStyle('icon'),
    },
    headerText: {
      flex: 1,
      gap: 3,
      paddingTop: 2,
    },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.2,
    },
    subtitle: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 11.5,
      lineHeight: 16,
    },
    closeButton: {
      marginTop: 2,
    },
    closeButtonPressed: {
      opacity: 0.6,
    },
    closeIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      transform: [{ rotate: '45deg' }],
      ...myceoCornerStyle('icon'),
    },

    // Stats
    stats: {
      flexDirection: 'row',
      gap: 7,
      paddingHorizontal: 18,
      paddingBottom: 14,
    },
    statCard: {
      flex: 1,
      gap: 2,
      padding: 12,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('inset'),
    },
    statCardAccent: {
      backgroundColor: '#DDE8FF',
    },
    statValue: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 26,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.5,
    },
    statValueAccent: {
      ...auriaTypography.title,
      color: '#2B5CB8',
      fontSize: 26,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.5,
    },
    statLabel: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 10,
    },
    statLabelAccent: {
      ...auriaTypography.body,
      color: 'rgba(43,92,184,0.75)',
      fontSize: 10,
    },

    // Filters
    filters: {
      gap: 6,
      paddingHorizontal: 18,
      paddingBottom: 12,
    },
    filter: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    filterActive: {
      backgroundColor: ds.auriaBlue,
    },
    filterPressed: {
      opacity: 0.75,
    },
    filterText: {
      ...auriaTypography.body,
      color: ds.gray600,
      fontSize: 11.5,
      fontWeight: theme.typography.fontWeight.medium,
    },
    filterTextActive: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.semibold,
    },

    // List
    list: {
      maxHeight: listMaxHeight,
    },
    listContent: {
      paddingHorizontal: 18,
      paddingBottom: 8,
      gap: 8,
    },
    emptyState: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyText: {
      ...auriaTypography.body,
      color: ds.gray400,
      fontSize: 13,
    },

    // Suggestion card
    suggestion: {
      gap: 10,
      padding: 14,
      backgroundColor: ds.gray100,
      ...tasksCardCorner(),
    },
    suggestionProcessed: {
      opacity: 0.45,
    },
    suggestionTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    sourceIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      ...myceoCornerStyle('iconSm'),
    },
    suggestionCopy: {
      flex: 1,
      gap: 3,
    },
    suggestionTitle: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
      lineHeight: 17,
    },
    suggestionSource: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 10.5,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: ds.white,
      ...myceoCornerStyle('chip'),
    },
    priorityText: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 9,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    reason: {
      ...auriaTypography.body,
      color: ds.gray600,
      fontSize: 11,
      lineHeight: 15.5,
    },
    suggestionFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    confidence: {
      ...auriaTypography.body,
      color: ds.auriaBlue,
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.medium,
    },
    createButton: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: ds.auriaBlue,
      ...myceoCornerStyle('chip'),
    },
    createButtonPressed: {
      opacity: 0.8,
    },
    createButtonDone: {
      backgroundColor: ds.gray100,
    },
    createButtonText: {
      ...auriaTypography.body,
      color: ds.white,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    createButtonTextDone: {
      color: ds.gray400,
    },

    // Footer
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.gray200,
    },
    footerText: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
    doneButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: ds.auriaBlue,
      ...myceoCornerStyle('chip'),
    },
    doneButtonPressed: {
      opacity: 0.85,
    },
    doneText: {
      ...auriaTypography.body,
      color: ds.white,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.bold,
    },
  });
}
