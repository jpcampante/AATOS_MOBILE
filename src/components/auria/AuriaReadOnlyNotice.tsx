import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';

type AuriaReadOnlyNoticeProps = {
  /** Where the chat came from ("ChatGPT", "Claude"…). */
  origin: string;
  onNewChat: () => void;
  bottomInset?: number;
};

/**
 * Shown instead of the composer for chats imported from other apps: the Auria
 * engine can't continue them, so the person reads it here and starts a new chat.
 */
export function AuriaReadOnlyNotice({ origin, onNewChat, bottomInset = 0 }: AuriaReadOnlyNoticeProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  return (
    <View style={[styles.wrap, { marginBottom: bottomInset }]} accessibilityRole="summary">
      <Text style={styles.text}>
        This chat came from {origin}. It is read-only here; start a new chat to continue with Auria.
      </Text>
      <Pressable
        onPress={onNewChat}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="New chat"
      >
        <AuriaIcon name="squarePen" size={AURIA_ICON_SIZE.sm} color={ds.white} strokeWidth={1.8} />
        <Text style={styles.buttonText}>New chat</Text>
      </Pressable>
    </View>
  );
}

function createStyles(ds: ReturnType<typeof useTheme>['ds'], theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: 16,
      padding: 14,
      gap: 12,
      borderRadius: 20,
      backgroundColor: ds.white,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.gray200,
    },
    text: {
      ...auriaTypography.body,
      fontSize: 14,
      lineHeight: 20,
      color: ds.gray600,
    },
    button: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: ds.offBlack,
    },
    buttonText: {
      ...auriaTypography.body,
      fontSize: 15,
      color: ds.white,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    pressed: { opacity: 0.8 },
  });
}
