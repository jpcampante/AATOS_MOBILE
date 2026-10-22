import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../icons';
import { AURIA_SCRIM } from './auriaLayout';

export type AuriaSheetAction = {
  icon: AuriaIconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

type AuriaActionSheetProps = {
  /** Shown centered at the top (a chat title, a message preview…). */
  title: string;
  onClose: () => void;
  /** Rows of the sheet. Ignored when `children` is given (e.g. a rename box). */
  actions?: AuriaSheetAction[];
  children?: ReactNode;
};

/** Bottom sheet opened by a long press: a title and a card of actions. Shared by every long-press menu. */
export function AuriaActionSheet({ title, onClose, actions = [], children }: AuriaActionSheetProps) {
  const { theme, ds } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
          {children ?? (
            <View style={styles.card}>
              {actions.map((action, index) => (
                <Pressable
                  key={action.label}
                  onPress={action.onPress}
                  style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <AuriaIcon
                    name={action.icon}
                    size={AURIA_ICON_SIZE.sm}
                    color={action.danger ? ds.danger : ds.gray900}
                    strokeWidth={1.8}
                  />
                  <Text style={[styles.rowLabel, action.danger && { color: ds.danger }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
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
    title: {
      ...auriaTypography.title,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      paddingBottom: 14,
      paddingHorizontal: 12,
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
      minHeight: 52,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.divider,
    },
    rowPressed: { backgroundColor: theme.colors.hover },
    rowLabel: {
      ...auriaTypography.body,
      fontSize: 15.5,
      color: theme.colors.text,
    },
  });
}
