import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon } from '../../icons';
import type { NavigateFn, ProductTabId } from '../../../data/productNavigation';
import type { InsightAction, Signal } from '../../../data/insights/types';
import { needsYou, risks } from '../../../data/insights/selectors';
import { SignalRow } from './SignalRow';
import { NeedsYouModal } from './NeedsYouModal';

const FILTERS = ['Needs you', 'Risks', 'All'] as const;
type Filter = (typeof FILTERS)[number];

const INLINE_MAX = 4;

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
          visible.map((signal) => (
            <SignalRow key={signal.id} signal={signal} onAction={runAction} />
          ))
        )}
      </View>

      {modalMounted ? (
        <NeedsYouModal visible={modalOpen} onClose={() => setModalOpen(false)} onNavigate={onNavigate} />
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
    title: { ...auriaTypography.title, fontSize: 16, fontWeight: theme.typography.fontWeight.extrabold, color: insights.text },
    viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewAllText: { ...auriaTypography.body, fontSize: 12.5, fontWeight: '600', color: insights.textMuted },
    pressed: { opacity: 0.6 },
    filters: { flexDirection: 'row', gap: 7 },
    filter: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: insights.page,
      ...myceoCornerStyle('chip'),
    },
    filterActive: { backgroundColor: insights.accent },
    filterText: { ...auriaTypography.body, fontSize: 12, fontWeight: '600', color: insights.textMuted },
    filterTextActive: { color: insights.surface },
    list: { gap: 8 },
    empty: { ...auriaTypography.body, fontSize: 13, color: insights.textMuted, paddingVertical: 16, textAlign: 'center' },
  });
}
