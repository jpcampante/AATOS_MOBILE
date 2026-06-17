import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import type { ProductTabId } from '../../data/productNavigation';
import { filterTodayFeed, todayFeed, todayFeedSummary } from '../../data/todayFeedMockData';
import { tasksCardCorner } from '../tasks/tasksCorners';
import { TodayModal } from './TodayModal';
import { todayDateLabel } from './todayVisuals';

type TodaySectionProps = {
  /** Redirect to the source tab when an item is tapped (from the modal). */
  onNavigate: (tab: ProductTabId) => void;
};

/**
 * The "Today" hub for the Insights landing page: a single blue summary card
 * (counts + "View all"). The full agenda — every item — lives inside the modal
 * that View all opens, so the page itself stays compact.
 */
export function TodaySection({ onNavigate }: TodaySectionProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [modalOpen, setModalOpen] = useState(false);
  // Mount the modal only once it's first opened — keeps its safe-area read off
  // the Insights cold-start paint, then stays mounted so close animates.
  const [modalMounted, setModalMounted] = useState(false);

  const openModal = () => {
    setModalMounted(true);
    setModalOpen(true);
  };

  const ranked = useMemo(() => filterTodayFeed(todayFeed, 'All'), []);
  const dateLabel = todayDateLabel();

  return (
    <>
      <Pressable
        onPress={openModal}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel="Open today's agenda"
      >
        <View style={styles.icon}>
          <AuriaIcon name="calendar" size={AURIA_ICON_SIZE.sm} color={ds.auriaBlue} strokeWidth={1.9} />
        </View>
        <View style={styles.copy}>
          <View style={styles.top}>
            <Text style={styles.title}>Today</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
          <Text style={styles.summary} numberOfLines={1}>
            {ranked.length} need you · {todayFeedSummary(ranked)}
          </Text>
        </View>
        <View style={styles.viewAll}>
          <Text style={styles.viewAllText}>View all</Text>
          <AuriaIcon name="chevronRight" size={13} color={ds.white} strokeWidth={2.4} />
        </View>
      </Pressable>

      {modalMounted ? (
        <TodayModal visible={modalOpen} onClose={() => setModalOpen(false)} onNavigate={onNavigate} />
      ) : null}
    </>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: '#DDE8FF',
      ...tasksCardCorner(),
    },
    cardPressed: { opacity: 0.92 },
    icon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.85)',
      ...myceoCornerStyle('icon'),
    },
    copy: { flex: 1, gap: 3, minWidth: 0 },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
    },
    date: {
      ...auriaTypography.body,
      color: ds.gray600,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
    summary: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 12.5,
    },
    viewAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingLeft: 12,
      paddingVertical: 9,
      paddingRight: 11,
      backgroundColor: ds.auriaBlue,
      ...myceoCornerStyle('chip'),
    },
    viewAllText: {
      ...auriaTypography.body,
      color: ds.white,
      fontSize: 12.5,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
}
