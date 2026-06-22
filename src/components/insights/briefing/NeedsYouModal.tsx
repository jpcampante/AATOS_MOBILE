import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon } from '../../icons';
import { IconButton } from '../../ui/IconButton';
import type { NavigateFn, ProductTabId } from '../../../data/productNavigation';
import type { InsightAction, Signal } from '../../../data/insights/types';
import { needsYou, risks } from '../../../data/insights/selectors';
import { SignalRow } from './SignalRow';

const FILTERS = ['Needs you', 'Risks', 'All'] as const;
type Filter = (typeof FILTERS)[number];

type NeedsYouModalProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate: NavigateFn;
};

/** Full "Needs you" list — the same signals as the inline card, every item. */
export function NeedsYouModal({ visible, onClose, onNavigate }: NeedsYouModalProps) {
  const { insights, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(insights, theme, safe.bottom, windowHeight),
    [insights, theme, safe.bottom, windowHeight],
  );
  const [filter, setFilter] = useState<Filter>('Needs you');

  const items = useMemo<Signal[]>(() => {
    if (filter === 'Needs you') return needsYou();
    if (filter === 'Risks') return risks();
    return [...needsYou(), ...risks()];
  }, [filter]);

  const runAction = (action: InsightAction) => {
    onClose();
    if (action.kind === 'auria') onNavigate('auria', { prompt: action.payload?.prompt });
    else if (action.kind === 'navigate') onNavigate(action.target as ProductTabId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Needs you now</Text>
              <Text style={styles.subtitle}>Everything that needs a decision</Text>
            </View>
            <IconButton variant="filled" onPress={onClose} accessibilityLabel="Close">
              <AuriaIcon name="close" size={20} color={insights.textMuted} strokeWidth={2} />
            </IconButton>
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

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <Text style={styles.empty}>Nothing here right now.</Text>
            ) : (
              items.map((signal) => (
                <SignalRow key={signal.id} signal={signal} onAction={runAction} tileBg={insights.page} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeBottom: number,
  windowHeight: number,
) {
  const listMaxHeight = Math.round(windowHeight * 0.66);
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.32)' },
    sheet: {
      maxHeight: Math.round(windowHeight * 0.88),
      backgroundColor: insights.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
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
    headerText: { flex: 1, gap: 2 },
    title: { ...auriaTypography.title, fontSize: 18, fontWeight: theme.typography.fontWeight.extrabold, color: insights.text },
    subtitle: { ...auriaTypography.body, fontSize: 12, color: insights.textMuted },
    filters: { flexDirection: 'row', gap: 7, paddingHorizontal: 18, paddingBottom: 12 },
    filter: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      backgroundColor: insights.page,
      ...myceoCornerStyle('chip'),
    },
    filterActive: { backgroundColor: insights.accent },
    filterText: { ...auriaTypography.body, fontSize: 12.5, fontWeight: '600', color: insights.textMuted },
    filterTextActive: { color: insights.surface },
    list: { maxHeight: listMaxHeight },
    listContent: { paddingHorizontal: 18, paddingBottom: 12, gap: 8 },
    empty: { ...auriaTypography.body, fontSize: 13, color: insights.textMuted, paddingVertical: 28, textAlign: 'center' },
  });
}
