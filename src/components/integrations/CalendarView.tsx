import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import { calendarEvents, isoDate, type CalEvent } from '../../data/mailWorkspaceMockData';
import { auriaTypography, useTheme } from '../../theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarView() {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const cells = useMemo(() => {
    const first = startOfMonth(viewDate);
    const gridStart = new Date(first);
    gridStart.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    calendarEvents.forEach((e) => {
      (map[e.date] = map[e.date] ?? []).push(e);
    });
    return map;
  }, []);

  const selectedEvents = (eventsByDate[isoDate(selected)] ?? [])
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              const t = new Date();
              setViewDate(startOfMonth(t));
              setSelected(t);
            }}
            style={({ pressed }) => [styles.todayBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go to today"
          >
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
          <Pressable
            onPress={() => setViewDate((v) => addMonths(v, -1))}
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <AuriaIcon name="chevronLeft" size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={() => setViewDate((v) => addMonths(v, 1))}
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <AuriaIcon name="chevronRight" size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === viewDate.getMonth();
          const isToday = sameDay(d, today);
          const isSel = sameDay(d, selected);
          const hasEvents = Boolean(eventsByDate[isoDate(d)]);
          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => setSelected(new Date(d))}
              accessibilityRole="button"
              accessibilityLabel={isoDate(d)}
            >
              <View
                style={[
                  styles.dayCircle,
                  isToday && !isSel && styles.dayToday,
                  isSel && styles.daySelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !inMonth && styles.dayOut,
                    isToday && !isSel && styles.dayTodayText,
                    isSel && styles.daySelText,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
              <View
                style={[
                  styles.eventDot,
                  { opacity: hasEvents ? 1 : 0 },
                  isSel && styles.eventDotSel,
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.eventsTitle}>
        {DAY_NAMES[selected.getDay()]}, {MONTHS[selected.getMonth()]} {selected.getDate()}
      </Text>
      <ScrollView style={styles.eventsList} contentContainerStyle={styles.eventsContent} showsVerticalScrollIndicator={false}>
        {selectedEvents.length === 0 ? (
          <View style={styles.empty}>
            <AuriaIcon name="calendar" size={AURIA_ICON_SIZE.lg} color={ds.gray400} strokeWidth={1.5} />
            <Text style={styles.noEvents}>No events</Text>
          </View>
        ) : (
          selectedEvents.map((e) => (
            <View key={e.id} style={styles.eventRow}>
              <View style={[styles.eventBar, { backgroundColor: e.color }]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={styles.eventTime} numberOfLines={1}>
                  {e.start} – {e.end}
                  {e.location ? ` · ${e.location}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
    },
    monthTitle: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    todayBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: ds.gray100,
      marginRight: 4,
    },
    todayText: {
      ...auriaTypography.body,
      color: ds.gray800,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
    pressed: { opacity: 0.55 },
    weekRow: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 4 },
    weekday: {
      ...auriaTypography.label,
      flex: 1,
      textAlign: 'center',
      color: ds.gray500,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
      paddingBottom: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ds.gray200,
    },
    cell: {
      width: `${100 / 7}%`,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    dayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayToday: { borderWidth: 1.5, borderColor: ds.auriaBlue },
    daySelected: { backgroundColor: ds.auriaBlue },
    dayText: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 14,
    },
    dayOut: { color: ds.gray400 },
    dayTodayText: { color: ds.auriaBlue, fontWeight: theme.typography.fontWeight.bold },
    daySelText: { color: '#FFFFFF', fontWeight: theme.typography.fontWeight.bold },
    eventDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: ds.auriaBlue,
    },
    eventDotSel: { backgroundColor: ds.auriaBlue },
    eventsTitle: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
    },
    eventsList: { flex: 1 },
    eventsContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
    empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
    noEvents: { ...auriaTypography.body, color: ds.gray500, fontSize: 13 },
    eventRow: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: ds.white,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.gray200,
      padding: 10,
    },
    eventBar: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
    eventInfo: { flex: 1, gap: 2 },
    eventTitle: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.medium,
    },
    eventTime: {
      ...auriaTypography.body,
      color: ds.gray600,
      fontSize: 12.5,
    },
  });
}
