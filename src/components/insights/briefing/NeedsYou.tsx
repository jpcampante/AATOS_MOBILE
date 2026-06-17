import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../../icons';
import type { NavigateFn, ProductTabId } from '../../../data/productNavigation';
import type { InsightAction, Signal, SignalDomain, Severity } from '../../../data/insights/types';
import { resolveActions } from '../../../data/insights/actions';
import { needsYou, risks } from '../../../data/insights/selectors';
import { TodayModal } from '../../today/TodayModal';
import { DataSourceBadge } from '../DataSourceBadge';

const FILTERS = ['Needs you', 'Risks', 'All'] as const;
type Filter = (typeof FILTERS)[number];

const INLINE_MAX = 4;

const DOMAIN_ICON: Record<SignalDomain, AuriaIconName> = {
  tasks: 'checkCircle',
  email: 'mail',
  auria: 'sparkles',
  calendar: 'calendar',
  projects: 'briefcase',
};

const SEVERITY_COLOR: Record<Severity, string> = {
  high: '#E5484D',
  medium: '#B45309',
  low: '#9CA3AF',
};

type NeedsYouProps = {
  /** Switch tab when an action is taken (Auria actions carry a pre-filled prompt). */
  onNavigate: NavigateFn;
};

/** Zone 2 — the single decision queue. Needs you / Risks / All over signals. */
export function NeedsYou({ onNavigate }: NeedsYouProps) {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);
  const [filter, setFilter] = useState<Filter>('Needs you');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);

  const items = useMemo<Signal[]>(() => {
    if (filter === 'Needs you') return needsYou();
    if (filter === 'Risks') return risks();
    return [...needsYou(), ...risks()];
  }, [filter]);

  const visible = items.slice(0, INLINE_MAX);

  const runAction = (action: InsightAction) => {
    if (action.kind === 'auria') {
      onNavigate('auria', { prompt: action.payload?.prompt });
    } else if (action.kind === 'navigate') {
      onNavigate(action.target as ProductTabId);
    }
  };

  const openModal = () => {
    setModalMounted(true);
    setModalOpen(true);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Needs you now</Text>
        <Pressable
          onPress={openModal}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View all"
        >
          <Text style={styles.viewAllText}>View all</Text>
          <AuriaIcon name="chevronRight" size={13} color={insights.textMuted} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((option) => {
          const active = option === filter;
          return (
            <Pressable
              key={option}
              onPress={() => setFilter(option)}
              style={[styles.filter, active && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>Nothing needs you here. 🎉</Text>
        ) : (
          visible.map((signal) => {
            const actions = resolveActions(signal.actionIds);
            return (
              <View key={signal.id} style={styles.row}>
                <View style={styles.rowTop}>
                  <View style={[styles.sevDot, { backgroundColor: SEVERITY_COLOR[signal.severity] }]} />
                  <View style={styles.iconTile}>
                    <AuriaIcon
                      name={DOMAIN_ICON[signal.domain]}
                      size={AURIA_ICON_SIZE.xs}
                      color={insights.textMuted}
                      strokeWidth={1.8}
                    />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{signal.title}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {signal.detail ?? signal.delta ?? signal.domain}
                    </Text>
                  </View>
                  <DataSourceBadge source={signal.source} />
                </View>

                {actions.length > 0 ? (
                  <View style={styles.actions}>
                    {actions.map((action) => (
                      <Pressable
                        key={action.id}
                        onPress={() => runAction(action)}
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={action.label}
                      >
                        <Text style={styles.actionText}>{action.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      {modalMounted ? (
        <TodayModal visible={modalOpen} onClose={() => setModalOpen(false)} onNavigate={onNavigate} />
      ) : null}
    </View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: insights.surface,
      ...myceoCornerStyle('card'),
      ...theme.shadow.card,
      padding: theme.spacing.lg,
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { fontSize: 16, fontWeight: '800', color: insights.text, letterSpacing: -0.2 },
    viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewAllText: { fontSize: 12.5, fontWeight: '600', color: insights.textMuted },
    pressed: { opacity: 0.6 },
    filters: { flexDirection: 'row', gap: 7 },
    filter: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: insights.page,
      ...myceoCornerStyle('chip'),
    },
    filterActive: { backgroundColor: insights.accent },
    filterText: { fontSize: 12, fontWeight: '600', color: insights.textMuted },
    filterTextActive: { color: insights.surface },
    list: { gap: 8 },
    empty: { fontSize: 13, color: insights.textMuted, paddingVertical: 16, textAlign: 'center' },
    row: {
      backgroundColor: insights.page,
      ...myceoCornerStyle('inset'),
      padding: 11,
      gap: 9,
    },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    sevDot: { width: 8, height: 8, borderRadius: 4 },
    iconTile: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: insights.surface,
      ...myceoCornerStyle('iconSm'),
    },
    rowCopy: { flex: 1, gap: 1, minWidth: 0 },
    rowTitle: { fontSize: 13.5, fontWeight: '700', color: insights.text, letterSpacing: -0.1 },
    rowMeta: { fontSize: 11.5, color: insights.textMuted },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingLeft: 47 },
    actionBtn: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      backgroundColor: insights.surface,
      borderWidth: 1,
      borderColor: insights.divider,
      ...myceoCornerStyle('chip'),
    },
    actionText: { fontSize: 11.5, fontWeight: '600', color: insights.text },
  });
}
