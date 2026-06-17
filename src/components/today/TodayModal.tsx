import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import type { ProductTabId } from '../../data/productNavigation';
import {
  filterTodayFeed,
  todayFeed,
  TODAY_KIND_LABEL,
  type TodayFeedItem,
  type TodayImportance,
} from '../../data/todayFeedMockData';
import { tasksSheetCorner } from '../tasks/tasksCorners';
import { TODAY_IMPORTANCE_DOT, TODAY_KIND_ICON, todayDateLabel } from './todayVisuals';

const FILTERS: Array<TodayImportance | 'All'> = ['All', 'Urgent', 'High', 'Normal', 'Low'];

type TodayModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Redirect the user to the source tab for the tapped item. */
  onNavigate: (tab: ProductTabId) => void;
};

/** Full "Today" agenda — every source, filterable by importance, taps redirect. */
export function TodayModal({ visible, onClose, onNavigate }: TodayModalProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, safe.bottom), [ds, theme, safe.bottom]);
  const [filter, setFilter] = useState<TodayImportance | 'All'>('All');

  const items = useMemo(() => filterTodayFeed(todayFeed, filter), [filter]);

  const open = (item: TodayFeedItem) => {
    onClose();
    onNavigate(item.target);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close today" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <AuriaIcon name="calendar" size={AURIA_ICON_SIZE.sm} color={ds.auriaBlue} strokeWidth={1.9} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Today</Text>
              <Text style={styles.subtitle}>{todayDateLabel()} · everything that needs you</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <View style={styles.closeIcon}>
                <AuriaIcon name="plus" size={14} color={ds.gray600} strokeWidth={2.4} />
              </View>
            </Pressable>
          </View>

          <View style={styles.filters}>
            {FILTERS.map((option) => {
              const active = filter === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setFilter(option)}
                  style={({ pressed }) => [styles.filter, active && styles.filterActive, pressed && styles.filterPressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <Text style={styles.empty}>Nothing at this importance.</Text>
            ) : (
              items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => open(item)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. Open in ${TODAY_KIND_LABEL[item.kind]}.`}
                >
                  <View style={styles.iconTile}>
                    <AuriaIcon name={TODAY_KIND_ICON[item.kind]} size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={1.8} />
                  </View>
                  <View style={styles.rowCopy}>
                    <View style={styles.rowTitleRow}>
                      <View style={[styles.dot, { backgroundColor: TODAY_IMPORTANCE_DOT[item.importance] }]} />
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {TODAY_KIND_LABEL[item.kind]} · {item.subtitle} · {item.time}
                    </Text>
                  </View>
                  <AuriaIcon name="chevronRight" size={14} color={ds.gray400} strokeWidth={2} />
                </Pressable>
              ))
            )}
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
      maxHeight: '88%',
      backgroundColor: ds.white,
      ...tasksSheetCorner(),
      paddingBottom: Math.max(safeBottom, 8),
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 18,
      paddingBottom: 12,
    },
    headerIcon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DDE8FF',
      ...myceoCornerStyle('icon'),
    },
    headerText: { flex: 1, gap: 2 },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
    },
    subtitle: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 12,
    },
    closeButton: { alignSelf: 'flex-start' },
    closeButtonPressed: { opacity: 0.6 },
    closeIcon: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      transform: [{ rotate: '45deg' }],
      ...myceoCornerStyle('icon'),
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      paddingHorizontal: 18,
      paddingBottom: 12,
    },
    filter: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    filterActive: { backgroundColor: ds.auriaBlue },
    filterPressed: { opacity: 0.75 },
    filterText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 12.5,
      fontWeight: theme.typography.fontWeight.medium,
    },
    filterTextActive: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    list: { flexGrow: 0, flexShrink: 1 },
    listContent: {
      paddingHorizontal: 18,
      paddingBottom: 12,
      gap: 8,
    },
    empty: {
      ...auriaTypography.body,
      color: ds.gray400,
      fontSize: 13,
      paddingVertical: 28,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('inset'),
    },
    rowPressed: {
      backgroundColor: ds.gray200,
      transform: [{ scale: 0.99 }],
    },
    iconTile: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      ...myceoCornerStyle('iconSm'),
    },
    rowCopy: { flex: 1, gap: 3, minWidth: 0 },
    rowTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    rowTitle: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
    },
    rowMeta: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 11.5,
    },
  });
}
