import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, type AuriaIconName } from '../icons';
import { IconButton } from '../ui/IconButton';
import { getMetric } from '../../data/insights/metrics';
import {
  HOME_CARD_META,
  addMetricCard,
  availableMetrics,
  isMetricCard,
  metricIdOf,
  moveCard,
  removeMetricCard,
  resetLayout,
  toggleSection,
  useHomeLayout,
  type LayoutCardId,
  type SectionCardId,
} from '../../data/insights/homeLayout';

const ROW_HEIGHT = 62;
const ROW_GAP = 10;
const PITCH = ROW_HEIGHT + ROW_GAP;

type CustomizeHomeSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const lightHaptic = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
const selectHaptic = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

type CardMeta = { title: string; description: string; icon: AuriaIconName; removable: boolean; isMetric: boolean };

function cardMeta(id: LayoutCardId): CardMeta {
  if (isMetricCard(id)) {
    const m = getMetric(metricIdOf(id));
    return { title: m.chip, description: m.headline, icon: 'frame', removable: true, isMetric: true };
  }
  const s = HOME_CARD_META[id];
  return { title: s.title, description: s.description, icon: s.icon, removable: s.removable, isMetric: false };
}

/** Sheet to arrange (drag) and add/remove the Insights cards. Opened from the blue Explorer. */
export function CustomizeHomeSheet({ visible, onClose }: CustomizeHomeSheetProps) {
  const { insights, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(insights, theme, safe.bottom, windowHeight),
    [insights, theme, safe.bottom, windowHeight],
  );
  const { order, hiddenSections } = useHomeLayout();
  const [dragging, setDragging] = useState(false);

  const metricsToAdd = availableMetrics(order);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Customize your Insights</Text>
              <Text style={styles.subtitle}>Drag to reorder · tap to add or remove</Text>
            </View>
            <IconButton variant="filled" onPress={onClose} accessibilityLabel="Close">
              <AuriaIcon name="close" size={20} color={insights.textMuted} strokeWidth={2} />
            </IconButton>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            scrollEnabled={!dragging}
            showsVerticalScrollIndicator={false}
          >
            <ReorderableCardList order={order} hiddenSections={hiddenSections} onDragActiveChange={setDragging} />

            {metricsToAdd.length > 0 ? (
              <View style={styles.addChartSection}>
                <Text style={styles.sectionLabel}>Add a chart</Text>
                <View style={styles.addChips}>
                  {metricsToAdd.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => addMetricCard(m.id)}
                      style={({ pressed }) => [styles.addChip, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${m.chip} chart`}
                    >
                      <AuriaIcon name="plus" size={12} color={insights.accent} strokeWidth={2.4} />
                      <Text style={styles.addChipText}>{m.chip}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.allAdded}>All charts added — remove one above to free it up.</Text>
            )}

            <Pressable
              onPress={resetLayout}
              style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Reset to default layout"
            >
              <AuriaIcon name="arrowPath" size={14} color={insights.textMuted} strokeWidth={1.9} />
              <Text style={styles.resetText}>Reset to default</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type ListProps = {
  order: LayoutCardId[];
  hiddenSections: SectionCardId[];
  onDragActiveChange: (active: boolean) => void;
};

function ReorderableCardList({ order, hiddenSections, onDragActiveChange }: ListProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [toIndex, setToIndex] = useState<number | null>(null);
  const toIndexRef = useRef<number | null>(null);
  const dragOffset = useRef(new Animated.Value(0)).current;
  const shiftValues = useRef<Animated.Value[]>([]);
  // Resize the per-slot shift values when cards are added/removed.
  if (shiftValues.current.length !== order.length) {
    const arr = shiftValues.current;
    while (arr.length < order.length) arr.push(new Animated.Value(0));
    arr.length = order.length;
  }

  useEffect(() => onDragActiveChange(draggingIndex != null), [draggingIndex, onDragActiveChange]);

  const onGrant = (index: number) => {
    setDraggingIndex(index);
    setToIndex(index);
    toIndexRef.current = index;
    dragOffset.setValue(0);
    lightHaptic();
  };

  const onMove = (index: number, dy: number) => {
    dragOffset.setValue(dy);
    const next = Math.max(0, Math.min(order.length - 1, index + Math.round(dy / PITCH)));
    if (next !== toIndexRef.current) {
      toIndexRef.current = next;
      setToIndex(next);
      selectHaptic();
    }
  };

  const onRelease = (index: number) => {
    const from = index;
    const to = toIndexRef.current ?? index;
    Animated.spring(dragOffset, {
      toValue: (to - from) * PITCH,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start(() => {
      dragOffset.setValue(0);
      shiftValues.current.forEach((v) => v.setValue(0));
      setDraggingIndex(null);
      setToIndex(null);
      toIndexRef.current = null;
      if (from !== to) moveCard(from, to);
    });
  };

  // Open a gap: slots between the picked-up row and its target slide out of the way.
  useEffect(() => {
    order.forEach((_, i) => {
      if (i === draggingIndex) return;
      let target = 0;
      if (draggingIndex != null && toIndex != null) {
        if (draggingIndex < toIndex && i > draggingIndex && i <= toIndex) target = -PITCH;
        else if (draggingIndex > toIndex && i < draggingIndex && i >= toIndex) target = PITCH;
      }
      const v = shiftValues.current[i];
      if (v) Animated.spring(v, { toValue: target, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
    });
  }, [draggingIndex, toIndex, order]);

  return (
    <View style={{ height: order.length * PITCH }}>
      {order.map((id, index) => {
        const meta = cardMeta(id);
        const isVisible = meta.isMetric || !hiddenSections.includes(id as SectionCardId);
        return (
          <CardRow
            key={id}
            id={id}
            meta={meta}
            index={index}
            isDragging={index === draggingIndex}
            isVisible={isVisible}
            dragOffset={dragOffset}
            shiftValue={shiftValues.current[index]}
            onGrant={onGrant}
            onMove={onMove}
            onRelease={onRelease}
          />
        );
      })}
    </View>
  );
}

type RowProps = {
  id: LayoutCardId;
  meta: CardMeta;
  index: number;
  isDragging: boolean;
  isVisible: boolean;
  dragOffset: Animated.Value;
  shiftValue: Animated.Value;
  onGrant: (index: number) => void;
  onMove: (index: number, dy: number) => void;
  onRelease: (index: number) => void;
};

function CardRow({
  id,
  meta,
  index,
  isDragging,
  isVisible,
  dragOffset,
  shiftValue,
  onGrant,
  onMove,
  onRelease,
}: RowProps) {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createRowStyles(insights, theme), [insights, theme]);

  // Keep the (created-once) PanResponder reading the latest index/callbacks.
  const handlers = useRef({ index, onGrant, onMove, onRelease });
  handlers.current = { index, onGrant, onMove, onRelease };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 2,
      onPanResponderGrant: () => handlers.current.onGrant(handlers.current.index),
      onPanResponderMove: (_e, g) => handlers.current.onMove(handlers.current.index, g.dy),
      onPanResponderRelease: () => handlers.current.onRelease(handlers.current.index),
      onPanResponderTerminate: () => handlers.current.onRelease(handlers.current.index),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const toggle = () => {
    if (meta.isMetric) removeMetricCard(metricIdOf(id as `metric:${string}`));
    else toggleSection(id as SectionCardId);
  };

  return (
    <Animated.View
      style={[
        styles.rowWrap,
        {
          transform: [{ translateY: isDragging ? dragOffset : shiftValue }, { scale: isDragging ? 1.03 : 1 }],
          zIndex: isDragging ? 10 : 1,
        },
      ]}
    >
      <View style={[styles.row, isDragging && styles.rowDragging, !isVisible && styles.rowHidden]}>
        <View style={styles.handle} hitSlop={10} {...responder.panHandlers}>
          <AuriaIcon name="menu" size={18} color={insights.textHint} strokeWidth={2} />
        </View>
        <View style={styles.cardIcon}>
          <AuriaIcon name={meta.icon} size={15} color={insights.accent} strokeWidth={1.9} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {meta.title}
          </Text>
          <Text style={styles.rowDesc} numberOfLines={1}>
            {meta.description}
          </Text>
        </View>
        {meta.removable ? (
          <Pressable
            onPress={toggle}
            style={[styles.toggle, isVisible ? styles.toggleOn : styles.toggleOff]}
            accessibilityRole="button"
            accessibilityState={{ selected: isVisible }}
            accessibilityLabel={isVisible ? `Remove ${meta.title}` : `Add ${meta.title}`}
          >
            <AuriaIcon
              name={isVisible ? 'checkCircle' : 'plus'}
              size={13}
              color={isVisible ? insights.surface : insights.accent}
              strokeWidth={2.2}
            />
            <Text style={[styles.toggleText, isVisible ? styles.toggleTextOn : styles.toggleTextOff]}>
              {isVisible ? 'On' : 'Add'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.locked}>
            <AuriaIcon name="lock" size={12} color={insights.textHint} strokeWidth={2} />
            <Text style={styles.lockedText}>Always</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeBottom: number,
  windowHeight: number,
) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.32)' },
    sheet: {
      maxHeight: Math.round(windowHeight * 0.9),
      backgroundColor: insights.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingBottom: Math.max(safeBottom, 10),
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 18,
      paddingBottom: 14,
    },
    headerText: { flex: 1, gap: 2 },
    title: {
      ...auriaTypography.title,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.extrabold,
      color: insights.text,
    },
    subtitle: { ...auriaTypography.body, fontSize: 12, color: insights.textMuted },
    pressed: { opacity: 0.6 },
    body: {},
    bodyContent: { paddingHorizontal: 18, paddingBottom: 8 },
    addChartSection: { marginTop: 8, gap: 8 },
    sectionLabel: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: '700',
      color: insights.textHint,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    addChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    addChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 8,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: insights.accent,
      ...myceoCornerStyle('chip'),
    },
    addChipText: { ...auriaTypography.body, fontSize: 12, fontWeight: '700', color: insights.accent },
    allAdded: { ...auriaTypography.body, fontSize: 12, color: insights.textMuted, marginTop: 10 },
    reset: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 14,
      paddingVertical: 12,
      backgroundColor: insights.page,
      ...myceoCornerStyle('chip'),
    },
    resetText: { ...auriaTypography.body, fontSize: 13, fontWeight: '600', color: insights.textMuted },
  });
}

function createRowStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    rowWrap: { height: ROW_HEIGHT, marginBottom: ROW_GAP },
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingRight: 12,
      backgroundColor: insights.page,
      ...myceoCornerStyle('panel'),
    },
    rowDragging: {
      backgroundColor: insights.surface,
      shadowColor: '#0B1220',
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    rowHidden: { opacity: 0.55 },
    handle: {
      width: 34,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web' ? ({ cursor: 'grab' } as object) : null),
    },
    cardIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: insights.surface,
      ...myceoCornerStyle('icon'),
    },
    copy: { flex: 1, gap: 1 },
    rowTitle: { ...auriaTypography.body, fontSize: 13.5, fontWeight: '700', color: insights.text },
    rowDesc: { ...auriaTypography.body, fontSize: 11, color: insights.textMuted },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 7,
      ...myceoCornerStyle('chip'),
    },
    toggleOn: { backgroundColor: insights.accent },
    toggleOff: { backgroundColor: 'transparent', borderWidth: 1, borderColor: insights.accent },
    toggleText: { ...auriaTypography.body, fontSize: 12, fontWeight: '700' },
    toggleTextOn: { color: insights.surface },
    toggleTextOff: { color: insights.accent },
    locked: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    lockedText: { ...auriaTypography.body, fontSize: 11.5, fontWeight: '600', color: insights.textHint },
  });
}
