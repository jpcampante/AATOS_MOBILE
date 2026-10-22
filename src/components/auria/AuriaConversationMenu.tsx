import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import type { AuriaConversation } from '../../features/auria/types';
import { AuriaActionSheet } from './AuriaActionSheet';

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
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    <AuriaActionSheet
      title={conversation.title}
      onClose={onClose}
      actions={[
        { icon: 'squarePen', label: 'Rename', onPress: () => setRenaming(true) },
        {
          icon: 'pin',
          label: conversation.isPinned ? 'Unpin' : 'Pin',
          onPress: () => {
            onSetPinned(conversation.id, !conversation.isPinned);
            onClose();
          },
        },
        { icon: 'trash', label: 'Delete', onPress: confirmDelete, danger: true },
      ]}
    >
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
      ) : undefined}
    </AuriaActionSheet>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
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
