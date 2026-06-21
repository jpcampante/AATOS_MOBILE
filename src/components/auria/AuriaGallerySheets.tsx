import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuriaGalleryItem, AuriaProject } from '../../data/auriaMockData';
import type { AuriaGallerySort } from '../../features/auria/galleryLogic';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, type AuriaIconName } from '../icons';
import { AURIA_SCRIM } from './auriaLayout';

export type GalleryActionId =
  | 'open'
  | 'rename'
  | 'download'
  | 'share'
  | 'move'
  | 'addToChat'
  | 'delete';

const itemIcon = (item: AuriaGalleryItem): AuriaIconName =>
  item.type === 'Image' ? 'photo' : item.type === 'Spreadsheet' || item.type === 'Data' ? 'grid' : 'document';

/* ------------------------------- Action sheet ------------------------------ */

const ACTIONS: Array<{ id: GalleryActionId; label: string; icon: AuriaIconName; danger?: boolean }> = [
  { id: 'open', label: 'Open', icon: 'expand' },
  { id: 'rename', label: 'Rename', icon: 'pencil' },
  { id: 'download', label: 'Download', icon: 'archive' },
  { id: 'share', label: 'Share', icon: 'upload' },
  { id: 'move', label: 'Move to project', icon: 'folder' },
  { id: 'addToChat', label: 'Add to chat', icon: 'messageSquare' },
  { id: 'delete', label: 'Delete', icon: 'trash', danger: true },
];

export function GalleryActionSheet({
  item,
  onClose,
  onAction,
}: {
  item: AuriaGalleryItem | null;
  onClose: () => void;
  onAction: (id: GalleryActionId) => void;
}) {
  const { theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {item ? (
            <View style={styles.itemHeader}>
              <View style={styles.itemIcon}>
                <AuriaIcon name={itemIcon(item)} size={18} color={theme.colors.textSecondary} strokeWidth={1.8} />
              </View>
              <View style={styles.itemHeaderText}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.type} · {item.sizeLabel}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            {ACTIONS.map((action, i) => (
              <Pressable
                key={action.id}
                onPress={() => onAction(action.id)}
                style={({ pressed }) => [
                  styles.actionRow,
                  action.danger && i > 0 ? styles.actionDivider : null,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <AuriaIcon
                  name={action.icon}
                  size={18}
                  color={action.danger ? theme.colors.error : theme.colors.textSecondary}
                  strokeWidth={1.8}
                />
                <Text style={[styles.actionLabel, action.danger && { color: theme.colors.error }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------ Rename modal ------------------------------- */

export function GalleryRenameModal({
  item,
  onClose,
  onRename,
}: {
  item: AuriaGalleryItem | null;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const { theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (item) setName(item.name);
  }, [item]);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) onRename(trimmed);
  };

  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centerOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Rename file</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="File name"
            placeholderTextColor={theme.colors.textHint}
            style={styles.input}
            autoFocus
            selectTextOnFocus
            onSubmitEditing={submit}
            returnKeyType="done"
          />
          <View style={styles.dialogActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.dialogBtn, pressed && styles.rowPressed]}
              accessibilityRole="button"
              accessibilityLabel="Cancel rename"
            >
              <Text style={styles.dialogBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnPrimary, pressed && styles.primaryPressed]}
              accessibilityRole="button"
              accessibilityLabel="Save name"
            >
              <Text style={styles.dialogBtnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------- Move-to-project sheet ------------------------- */

export function GalleryMoveSheet({
  item,
  projects,
  onClose,
  onMove,
}: {
  item: AuriaGalleryItem | null;
  projects: AuriaProject[];
  onClose: () => void;
  onMove: (project: AuriaProject) => void;
}) {
  const { theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Move to project</Text>
          <View style={styles.actions}>
            {projects.map((project) => (
              <Pressable
                key={project.id}
                onPress={() => onMove(project)}
                style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Move to ${project.name}`}
              >
                <View style={[styles.projectChip, { backgroundColor: project.accent }]}>
                  <Text style={styles.projectEmoji}>{project.emoji}</Text>
                </View>
                <Text style={styles.actionLabel}>{project.name}</Text>
                {item?.source === project.name ? (
                  <AuriaIcon name="checkCircle" size={16} color={theme.colors.success} strokeWidth={1.9} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------- Sort sheet ------------------------------- */

const SORTS: Array<{ id: AuriaGallerySort; label: string; icon: AuriaIconName }> = [
  { id: 'recent', label: 'Recently updated', icon: 'clock' },
  { id: 'name', label: 'Name (A–Z)', icon: 'list' },
  { id: 'size', label: 'Largest first', icon: 'archive' },
];

export function GallerySortSheet({
  visible,
  sort,
  onSelect,
  onClose,
}: {
  visible: boolean;
  sort: AuriaGallerySort;
  onSelect: (sort: AuriaGallerySort) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Sort by</Text>
          <View style={styles.actions}>
            {SORTS.map((option) => {
              const active = option.id === sort;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onSelect(option.id)}
                  style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                >
                  <AuriaIcon name={option.icon} size={18} color={theme.colors.textSecondary} strokeWidth={1.8} />
                  <Text style={styles.actionLabel}>{option.label}</Text>
                  {active ? (
                    <AuriaIcon name="checkCircle" size={16} color={theme.colors.success} strokeWidth={1.9} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------ Preview sheet ------------------------------ */

export function GalleryPreviewSheet({
  item,
  onClose,
  onAction,
}: {
  item: AuriaGalleryItem | null;
  onClose: () => void;
  onAction: (id: GalleryActionId) => void;
}) {
  const { theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { maxHeight: Math.round(height * 0.82) }]}>
          <View style={styles.grabber} />
          {item ? (
            <>
              <View style={styles.previewHeader}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <AuriaIcon name="close" size={18} color={theme.colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>

              <View style={[styles.previewBody, { backgroundColor: item.accent }]}>
                <AuriaIcon name={itemIcon(item)} size={40} color={item.text} strokeWidth={1.6} />
              </View>

              <View style={styles.metaRows}>
                <MetaRow label="Type" value={item.type} styles={styles} />
                <MetaRow label="Size" value={item.sizeLabel} styles={styles} />
                <MetaRow label="Source" value={item.source} styles={styles} />
                <MetaRow label="Modified" value={item.modifiedLabel} styles={styles} />
              </View>

              <View style={styles.previewActions}>
                {(['download', 'share', 'addToChat'] as const).map((id) => (
                  <Pressable
                    key={id}
                    onPress={() => onAction(id)}
                    style={({ pressed }) => [styles.previewBtn, pressed && styles.rowPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={id}
                  >
                    <AuriaIcon
                      name={id === 'download' ? 'archive' : id === 'share' ? 'upload' : 'messageSquare'}
                      size={17}
                      color={theme.colors.text}
                      strokeWidth={1.8}
                    />
                    <Text style={styles.previewBtnText}>
                      {id === 'download' ? 'Download' : id === 'share' ? 'Share' : 'Add to chat'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function MetaRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* ---------------------------------- Toast ---------------------------------- */

export function GalleryToast({ message }: { message: string | null }) {
  const { theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setShown(message);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setShown(null));
    }
  }, [message, anim]);

  if (!shown) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      <Text style={styles.toastText}>{shown}</Text>
    </Animated.View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], safeBottom: number) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    centerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: AURIA_SCRIM },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
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
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 8,
      paddingBottom: 12,
      marginBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    itemIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('icon'),
    },
    itemHeaderText: { flex: 1, gap: 2 },
    itemTitle: {
      ...auriaTypography.title,
      flex: 1,
      fontSize: 15.5,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    itemMeta: { ...auriaTypography.label, fontSize: 12, color: theme.colors.textTertiary },
    actions: { gap: 2 },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 10,
      paddingVertical: 13,
      ...myceoCornerStyle('inset'),
    },
    actionDivider: { marginTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.divider },
    rowPressed: { backgroundColor: theme.colors.hover },
    actionLabel: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
    },
    projectChip: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    projectEmoji: { ...auriaTypography.label, fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    /* rename dialog */
    dialog: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 18,
      gap: 14,
    },
    dialogTitle: {
      ...auriaTypography.title,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    input: {
      ...auriaTypography.body,
      fontSize: 15,
      color: theme.colors.text,
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: theme.colors.borderInput,
      borderRadius: 12,
      backgroundColor: theme.colors.input,
    },
    dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
    dialogBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    dialogBtnText: { ...auriaTypography.body, fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
    dialogBtnPrimary: { backgroundColor: theme.colors.offBlack },
    primaryPressed: { opacity: 0.85 },
    dialogBtnPrimaryText: { ...auriaTypography.body, fontSize: 14, fontWeight: '700', color: theme.colors.surface },
    /* preview */
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 8,
      paddingBottom: 12,
    },
    closeBtn: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      ...myceoCornerStyle('icon'),
    },
    previewBody: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
      ...myceoCornerStyle('card'),
    },
    metaRows: { paddingHorizontal: 8, paddingTop: 14, gap: 9 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
    metaLabel: { ...auriaTypography.body, fontSize: 13, color: theme.colors.textTertiary },
    metaValue: { ...auriaTypography.body, flexShrink: 1, fontSize: 13, fontWeight: '600', color: theme.colors.text },
    previewActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingTop: 18 },
    previewBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 12,
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('chip'),
    },
    previewBtnText: { ...auriaTypography.body, fontSize: 13, fontWeight: '700', color: theme.colors.text },
    /* toast */
    toast: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: safeBottom + 28,
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: theme.colors.offBlack,
    },
    toastText: { ...auriaTypography.body, fontSize: 13.5, fontWeight: '600', color: theme.colors.surface, textAlign: 'center' },
  });
}
