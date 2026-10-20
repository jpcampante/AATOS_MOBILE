import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { AURIA_SCRIM } from './auriaLayout';
import type { AuriaMode } from '../../features/auria/api/streamChat';

/**
 * Fast or Deep: the only choice the Auria backend takes (`mode`). The model
 * itself is chosen on the server, so there is no model list (spec 002, D-06).
 */
export const AURIA_MODE_OPTIONS: { id: AuriaMode; label: string; description: string }[] = [
  { id: 'fast', label: 'Fast', description: 'Quick answers for everyday questions.' },
  { id: 'deep', label: 'Deep', description: 'Thinks longer and researches more for complex work.' },
];

export const auriaModeLabel = (mode: AuriaMode) =>
  AURIA_MODE_OPTIONS.find((option) => option.id === mode)?.label ?? 'Fast';

type AuriaModeSheetProps = {
  visible: boolean;
  selected: AuriaMode;
  onSelect: (mode: AuriaMode) => void;
  onClose: () => void;
};

export function AuriaModeSheet({ visible, selected, onSelect, onClose }: AuriaModeSheetProps) {
  const { theme, ds } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle} accessibilityRole="header">
            How should Auria answer?
          </Text>
          <View style={styles.card} accessibilityRole="radiogroup">
            {AURIA_MODE_OPTIONS.map((option, index) => {
              const active = option.id === selected;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${option.label}. ${option.description}`}
                  style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{option.label}</Text>
                    <Text style={styles.rowSubtitle}>{option.description}</Text>
                  </View>
                  {active ? <AuriaIcon name="checkCircle" size={18} color={ds.auriaBlue} strokeWidth={1.9} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], safeBottom: number) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: AURIA_SCRIM },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderCurve: 'continuous',
      paddingTop: 10,
      paddingHorizontal: 14,
      paddingBottom: Math.max(safeBottom, 12) + 6,
    },
    grabber: {
      alignSelf: 'center',
      width: 38,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.divider,
      marginBottom: 12,
    },
    sheetTitle: {
      ...auriaTypography.title,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      paddingBottom: 14,
    },
    card: {
      backgroundColor: theme.colors.input,
      overflow: 'hidden',
      ...myceoCornerStyle('inset'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      minHeight: 56,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.divider,
    },
    rowPressed: { backgroundColor: theme.colors.hover },
    rowText: { flex: 1, gap: 2 },
    rowTitle: {
      ...auriaTypography.body,
      fontSize: 15.5,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    rowSubtitle: {
      ...auriaTypography.label,
      fontSize: 12.5,
      letterSpacing: 0,
      color: theme.colors.textTertiary,
    },
  });
}
