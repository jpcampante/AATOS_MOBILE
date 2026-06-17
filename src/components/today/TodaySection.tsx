import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import type { ProductTabId } from '../../data/productNavigation';
import { filterTodayFeed, todayFeed, todayFeedSummary } from '../../data/todayFeedMockData';
import { tasksCardCorner } from '../tasks/tasksCorners';
import { TodayModal } from './TodayModal';
import { TODAY_IMPORTANCE_DOT, TODAY_KIND_ICON, todayDateLabel } from './todayVisuals';

const PREVIEW_COUNT = 4;

type TodaySectionProps = {
  /** Redirect to the source tab when a row is tapped. */
  onNavigate: (tab: ProductTabId) => void;
};

/**
 * The "Today" hub for the Insights landing page: a blue container on top that
 * opens the full agenda modal, then the today session (a preview of the most
 * important items) below it. Tapping any item redirects to its source.
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
  const preview = ranked.slice(0, PREVIEW_COUNT);
  const dateLabel = todayDateLabel();

  return (
    <View style={styles.wrap}>
      {/* Blue container — first */}
      <Pressable
        onPress={openModal}
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
        accessibilityRole="button"
        accessibilityLabel="Open today's agenda"
      >
        <View style={styles.bannerIcon}>
          <AuriaIcon name="calendar" size={AURIA_ICON_SIZE.sm} color={ds.auriaBlue} strokeWidth={1.9} />
        </View>
        <View style={styles.bannerCopy}>
          <View style={styles.bannerTop}>
            <Text style={styles.bannerTitle}>Today</Text>
            <Text style={styles.bannerDate}>{dateLabel}</Text>
          </View>
          <Text style={styles.bannerSummary} numberOfLines={1}>
            {ranked.length} need you · {todayFeedSummary(ranked)}
          </Text>
        </View>
        <View style={styles.viewAll}>
          <Text style={styles.viewAllText}>View all</Text>
          <AuriaIcon name="chevronRight" size={13} color={ds.white} strokeWidth={2.4} />
        </View>
      </Pressable>

      {/* Today session — after */}
      <View style={styles.session}>
        <Text style={styles.sessionLabel}>Needs you today</Text>
        {preview.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onNavigate(item.target)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. Open.`}
          >
            <View style={styles.iconTile}>
              <AuriaIcon name={TODAY_KIND_ICON[item.kind]} size={AURIA_ICON_SIZE.xs} color={ds.gray700} strokeWidth={1.8} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.rowMeta} numberOfLines={1}>{item.subtitle} · {item.time}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: TODAY_IMPORTANCE_DOT[item.importance] }]} />
            <AuriaIcon name="chevronRight" size={13} color={ds.gray400} strokeWidth={2} />
          </Pressable>
        ))}
      </View>

      {modalMounted ? (
        <TodayModal visible={modalOpen} onClose={() => setModalOpen(false)} onNavigate={onNavigate} />
      ) : null}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: { gap: 12 },

    // Blue container
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: '#DDE8FF',
      ...tasksCardCorner(),
    },
    bannerPressed: { opacity: 0.92 },
    bannerIcon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.85)',
      ...myceoCornerStyle('icon'),
    },
    bannerCopy: { flex: 1, gap: 3, minWidth: 0 },
    bannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    bannerTitle: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
    },
    bannerDate: {
      ...auriaTypography.body,
      color: ds.gray600,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
    bannerSummary: {
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

    // Today session
    session: {
      gap: 4,
      padding: 12,
      backgroundColor: ds.white,
      ...tasksCardCorner(),
      ...theme.shadow.card,
    },
    sessionLabel: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      paddingHorizontal: 6,
      paddingTop: 2,
      paddingBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 6,
      paddingVertical: 9,
      ...myceoCornerStyle('inset'),
    },
    rowPressed: { backgroundColor: ds.gray100 },
    iconTile: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('iconSm'),
    },
    rowCopy: { flex: 1, gap: 1, minWidth: 0 },
    rowTitle: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 13.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
    },
    rowMeta: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 11,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
  });
}
