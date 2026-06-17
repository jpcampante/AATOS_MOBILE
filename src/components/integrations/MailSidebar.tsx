import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';

const INBOX_RED = '#D93025';
const INBOX_TINT = '#FCE8E6';

type FolderItem = {
  id: string;
  label: string;
  icon: AuriaIconName;
  count?: string;
  group: number;
  badge?: string;
};

const FOLDERS: FolderItem[] = [
  { id: 'all-inboxes', label: 'All inboxes', icon: 'library', count: '99+', group: 0 },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', count: '99+', group: 1 },
  { id: 'starred', label: 'Starred', icon: 'star', group: 2 },
  { id: 'snoozed', label: 'Snoozed', icon: 'clock', group: 2 },
  { id: 'important', label: 'Important', icon: 'flag', count: '99+', group: 2 },
  { id: 'sent', label: 'Sent', icon: 'send', group: 2 },
  { id: 'scheduled', label: 'Scheduled', icon: 'clock', group: 2 },
  { id: 'outbox', label: 'Outbox', icon: 'upload', group: 2 },
  { id: 'drafts', label: 'Drafts', icon: 'document', count: '19', group: 2 },
  { id: 'all-mail', label: 'All mail', icon: 'mail', group: 2 },
  { id: 'spam', label: 'Spam', icon: 'exclaimCircle', group: 2 },
  { id: 'trash', label: 'Trash', icon: 'trash', group: 2 },
  { id: 'subscriptions', label: 'Manage subscriptions', icon: 'mail', group: 3, badge: 'New' },
  { id: 'create', label: 'Create new', icon: 'plus', group: 4 },
];

type MailSidebarProps = {
  visible: boolean;
  activeFolder: string;
  onSelectFolder: (id: string) => void;
  onClose: () => void;
  onCreateNew?: () => void;
};

export function MailSidebar({
  visible,
  activeFolder,
  onSelectFolder,
  onClose,
  onCreateNew,
}: MailSidebarProps) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(308, width - 56);
  const styles = useMemo(
    () => createStyles(ds, theme, insets, panelWidth),
    [ds, theme, insets, panelWidth],
  );

  const [statusOpen, setStatusOpen] = useState(true);
  const translateX = useRef(new Animated.Value(-panelWidth)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      translateX.setValue(-panelWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [visible, translateX, panelWidth]);

  const requestClose = useRef(() => {
    Animated.timing(translateX, {
      toValue: -panelWidth,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => onCloseRef.current());
  }).current;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderMove: (_evt, g) => {
        translateX.setValue(Math.max(-panelWidth, Math.min(0, g.dx)));
      },
      onPanResponderRelease: (_evt, g) => {
        if (g.dx < -panelWidth * 0.33 || g.vx < -0.5) {
          requestClose();
        } else {
          Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const backdropOpacity = translateX.interpolate({
    inputRange: [-panelWidth, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={requestClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.flex} onPress={requestClose} accessibilityLabel="Close menu" />
        </Animated.View>

        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]} {...pan.panHandlers}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <AuriaIcon name="mail" size={AURIA_ICON_SIZE.md} color={INBOX_RED} strokeWidth={1.9} />
            </View>
            <Text style={styles.brandText}>aatos mail</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Pressable
              style={({ pressed }) => [styles.statusRow, pressed && styles.rowPressed]}
              onPress={() => setStatusOpen((o) => !o)}
              accessibilityRole="button"
            >
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
              <View style={statusOpen ? undefined : styles.chevronDown}>
                <AuriaIcon name="chevronDown" size={16} color={ds.gray500} strokeWidth={1.8} />
              </View>
            </Pressable>

            {statusOpen ? (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel="Add a status"
              >
                <AuriaIcon name="pencil" size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={1.7} />
                <Text style={styles.rowLabel}>Add a status</Text>
              </Pressable>
            ) : null}

            {FOLDERS.map((item, index) => {
              const isActive = item.id === activeFolder;
              const showDivider = index > 0 && item.group !== FOLDERS[index - 1].group;
              return (
                <View key={item.id}>
                  {showDivider ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={() => {
                      requestClose();
                      if (item.id === 'create') onCreateNew?.();
                      else if (item.id !== 'subscriptions') onSelectFolder(item.id);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      isActive && styles.rowActive,
                      pressed && !isActive && styles.rowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: isActive }}
                  >
                    <AuriaIcon
                      name={item.icon}
                      size={AURIA_ICON_SIZE.sm}
                      color={isActive ? INBOX_RED : ds.gray700}
                      strokeWidth={1.7}
                    />
                    <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                    {item.count ? (
                      <Text style={[styles.count, isActive && styles.rowLabelActive]}>{item.count}</Text>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  insets: { top: number; bottom: number },
  panelWidth: number,
) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: 'row' },
    flex: { flex: 1 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.32)' },
    panel: {
      width: panelWidth,
      backgroundColor: ds.white,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      paddingTop: insets.top + 8,
      overflow: 'hidden',
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ds.gray200,
    },
    brandMark: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandText: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 20,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.3,
    },
    scrollContent: { paddingBottom: insets.bottom + 16, paddingTop: 8 },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 22,
      paddingVertical: 14,
    },
    statusDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#1E8E3E',
      marginLeft: 3,
    },
    statusText: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.medium,
    },
    chevronDown: { transform: [{ rotate: '180deg' }] },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: ds.gray200,
      marginVertical: 8,
      marginHorizontal: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      height: 48,
      paddingLeft: 24,
      paddingRight: 18,
      marginHorizontal: 8,
      borderRadius: 24,
    },
    rowActive: { backgroundColor: INBOX_TINT },
    rowPressed: { backgroundColor: ds.gray100 },
    rowLabel: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray800,
      fontSize: 15.5,
    },
    rowLabelActive: { color: INBOX_RED, fontWeight: theme.typography.fontWeight.semibold },
    count: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 13,
    },
    newBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: ds.auriaBlue,
    },
    newBadgeText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
    },
  });
}
