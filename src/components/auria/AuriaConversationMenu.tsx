import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../icons';
import { AURIA_SCRIM } from './auriaLayout';
import type { AuriaConversation } from '../../features/auria/types';

type AuriaConversationMenuProps = {
  conversation: AuriaConversation | null;
  onClose: () => void;
  onRename: (chatId: string, title: string) => void;
  onSetPinned: (chatId: string, pinned: boolean) => void;
  onDelete: (chatId: string) => void;
};

/** Long-press sheet for a sidebar conversation: rename, pin/unpin, delete (with confirmation). */
export function AuriaConversationMenu({ conversation, onClose, onRename, onSetPinned, onDelete }: AuriaConversationMenuProps) {
  const { theme, ds } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    setRenaming(false);
    setTitle(conversation?.title ?? '');
  }, [conversation]);

  if (!conversation) return null;

  const confirmDelete = () => {
    Alert.alert('Delete this chat?', `"${conversation.title}" will be deleted for everyone who can see it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete(conversation.id);
          onClose();
        },
      },
    ]);
  };

  const saveTitle = () => {
    const clean = title.trim();
    if (clean && clean !== conversation.title) onRename(conversation.id, clean);
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
            {conversation.title}
          </Text>

          {renaming ? (
            <View style={styles.renameBox}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                autoFocus
                maxLength={120}
                returnKeyType="done"
                onSubmitEditing={saveTitle}
                style={styles.input}
                placeholder="Chat name"
                placeholderTextColor={ds.gray400}
                accessibilityLabel="Chat name"
              />
              <View style={styles.renameActions}>
                <Pressable
                  onPress={() => setRenaming(false)}
                  style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.textButtonLabel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={saveTitle}
                  disabled={!title.trim()}
                  style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.textButtonLabel, styles.textButtonPrimary]}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <MenuRow icon="squarePen" label="Rename" onPress={() => setRenaming(true)} styles={styles} color={ds.gray900} />
              <MenuRow
                icon="pin"
                label={conversation.isPinned ? 'Unpin' : 'Pin'}
                onPress={() => {
                  onSetPinned(conversation.id, !conversation.isPinned);
                  onClose();
                }}
                styles={styles}
                color={ds.gray900}
                divider
              />
              <MenuRow icon="trash" label="Delete" onPress={confirmDelete} styles={styles} color={ds.danger} divider danger />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  styles,
  color,
  divider,
  danger,
}: {
  icon: AuriaIconName;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  color: string;
  divider?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.rowDivider, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color={color} strokeWidth={1.8} />
      <Text style={[styles.rowLabel, danger && { color }]}>{label}</Text>
    </Pressable>
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
    renameBox: { gap: 10 },
    input: {
      ...auriaTypography.body,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.input,
      borderRadius: 12,
      paddingHorizontal: 14,
      minHeight: 48,
    },
    renameActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
    textButton: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
    textButtonLabel: { ...auriaTypography.body, fontSize: 15, color: theme.colors.textSecondary },
    textButtonPrimary: { color: theme.colors.accent, fontWeight: theme.typography.fontWeight.semibold },
    pressed: { opacity: 0.7 },
  });
}
