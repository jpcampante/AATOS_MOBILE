import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';

type AuriaErrorNoticeProps = {
  message: string;
  /** A second line (e.g. "Credits reset on Nov 1."). */
  detail?: string | null;
  actionLabel?: string;
  onAction?: () => void;
  /** Shows a close button when the notice can be dismissed. */
  onDismiss?: () => void;
};

/**
 * Notice above the composer when Auria can't answer: why, and what to do next.
 * Announced to screen readers when it appears.
 */
export function AuriaErrorNotice({ message, detail, actionLabel, onAction, onDismiss }: AuriaErrorNoticeProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  return (
    <View style={styles.wrap} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <AuriaIcon name="exclaimCircle" size={AURIA_ICON_SIZE.sm} color={ds.danger} strokeWidth={1.9} />
      <View style={styles.body}>
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <AuriaIcon name="close" size={16} color={ds.gray500} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(ds: ReturnType<typeof useTheme>['ds'], theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: ds.white,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.gray200,
    },
    body: { flex: 1, gap: 4 },
    message: {
      ...auriaTypography.body,
      fontSize: 14,
      lineHeight: 20,
      color: ds.gray900,
    },
    detail: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 18,
      color: ds.gray500,
    },
    action: {
      alignSelf: 'flex-start',
      minHeight: 36,
      justifyContent: 'center',
      paddingVertical: 4,
    },
    actionText: {
      ...auriaTypography.body,
      fontSize: 14,
      color: ds.auriaBlue,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    close: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.6 },
  });
}
