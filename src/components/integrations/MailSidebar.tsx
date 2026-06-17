import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { CalendarView } from './CalendarView';
import { ContactsView } from './ContactsView';
import { auriaProfileInitials } from '../../data/auriaMockData';
import {
  auriaTypography,
  motionDuration,
  motionEasing,
  motionSpring,
  useTheme,
} from '../../theme';

const INBOX_RED = '#D93025';
const INBOX_TINT = '#FCE8E6';

type DrawerView = 'mail' | 'calendar' | 'contacts';

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

const RAIL: { id: DrawerView; icon: AuriaIconName; label: string }[] = [
  { id: 'mail', icon: 'mail', label: 'Mail' },
  { id: 'calendar', icon: 'calendar', label: 'Calendar' },
  { id: 'contacts', icon: 'users', label: 'People' },
];

type MailSidebarProps = {
  visible: boolean;
  activeFolder: string;
  onSelectFolder: (id: string) => void;
  onClose: () => void;
  onCreateNew?: () => void;
  onEmailContact?: (email: string) => void;
  onOpenSettings?: () => void;
};

export function MailSidebar({
  visible,
  activeFolder,
  onSelectFolder,
  onClose,
  onCreateNew,
  onEmailContact,
  onOpenSettings,
}: MailSidebarProps) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width - 36, 384);
  const styles = useMemo(
    () => createStyles(ds, theme, insets, drawerWidth),
    [ds, theme, insets, drawerWidth],
  );

  const [statusOpen, setStatusOpen] = useState(true);
  const [view, setView] = useState<DrawerView>('mail');
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setView('mail');
      translateX.setValue(-drawerWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: motionDuration.base,
        easing: motionEasing.standard,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, translateX, drawerWidth]);

  const requestClose = useRef(() => {
    Animated.timing(translateX, {
      toValue: -drawerWidth,
      duration: motionDuration.fast,
      easing: motionEasing.accelerate,
      useNativeDriver: false,
    }).start(() => onCloseRef.current());
  }).current;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderMove: (_evt, g) => {
        translateX.setValue(Math.max(-drawerWidth, Math.min(0, g.dx)));
      },
      onPanResponderRelease: (_evt, g) => {
        if (g.dx < -drawerWidth * 0.33 || g.vx < -0.5) {
          requestClose();
        } else {
          Animated.spring(translateX, { toValue: 0, ...motionSpring.settle, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, ...motionSpring.settle, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const backdropOpacity = translateX.interpolate({
    inputRange: [-drawerWidth, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const brandMeta =
    view === 'calendar'
      ? { icon: 'calendar' as AuriaIconName, label: 'Calendar', color: ds.auriaBlue }
      : view === 'contacts'
        ? { icon: 'users' as AuriaIconName, label: 'People', color: ds.auriaBlue }
        : { icon: 'mail' as AuriaIconName, label: 'aatos mail', color: INBOX_RED };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={requestClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.flex} onPress={requestClose} accessibilityLabel="Close menu" />
        </Animated.View>

        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]} {...pan.panHandlers}>
          <View style={styles.panelRow}>
            <View style={styles.rail}>
              <Pressable
                onPress={() => {
                  requestClose();
                  onOpenSettings?.();
                }}
                style={styles.profileWrap}
                accessibilityRole="button"
                accessibilityLabel="Account"
              >
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileText}>{auriaProfileInitials}</Text>
                </View>
                <View style={styles.statusDotRail} />
              </Pressable>

              {RAIL.map((item) => {
                const active = view === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setView(item.id)}
                    style={styles.railBtn}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.railIcon, active && styles.railIconActive]}>
                      <AuriaIcon
                        name={item.icon}
                        size={AURIA_ICON_SIZE.md}
                        color={active ? ds.auriaBlue : ds.gray600}
                        strokeWidth={active ? 1.95 : 1.7}
                      />
                    </View>
                    <Text style={[styles.railLabel, active && styles.railLabelActive]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}

              <View style={styles.flex} />

              <Pressable
                onPress={() => {
                  requestClose();
                  onOpenSettings?.();
                }}
                style={styles.railSettings}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <AuriaIcon name="settings" size={AURIA_ICON_SIZE.md} color={ds.gray500} strokeWidth={1.7} />
              </Pressable>
            </View>

            <View style={styles.content}>
              <View style={styles.brandRow}>
                <AuriaIcon name={brandMeta.icon} size={AURIA_ICON_SIZE.md} color={brandMeta.color} strokeWidth={1.9} />
                <Text style={styles.brandText}>{brandMeta.label}</Text>
              </View>

              {view === 'mail' ? (
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
              ) : view === 'calendar' ? (
                <CalendarView />
              ) : (
                <ContactsView
                  onEmail={(email) => {
                    requestClose();
                    onEmailContact?.(email);
                  }}
                />
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  insets: { top: number; bottom: number },
  drawerWidth: number,
) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: 'row' },
    flex: { flex: 1 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.32)' },
    panel: {
      width: drawerWidth,
      height: '100%',
      backgroundColor: ds.white,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      paddingTop: insets.top + 8,
      overflow: 'hidden',
    },
    panelRow: { flex: 1, flexDirection: 'row' },
    rail: {
      width: 60,
      alignItems: 'center',
      paddingTop: 6,
      paddingBottom: insets.bottom + 10,
      gap: 6,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: ds.gray200,
      backgroundColor: ds.gray50,
    },
    profileWrap: { marginBottom: 8, marginTop: 4 },
    profileAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.auriaBlue,
      borderWidth: 2,
      borderColor: ds.white,
    },
    profileText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.bold,
    },
    statusDotRail: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#1E8E3E',
      borderWidth: 2,
      borderColor: ds.gray50,
    },
    railBtn: { alignItems: 'center', gap: 2, paddingVertical: 2 },
    railIcon: {
      width: 44,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    railIconActive: { backgroundColor: '#DDE8FF' },
    railLabel: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.medium,
    },
    railLabelActive: { color: ds.auriaBlue, fontWeight: theme.typography.fontWeight.bold },
    railSettings: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ds.gray200,
    },
    brandText: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.3,
    },
    scrollContent: { paddingBottom: insets.bottom + 16, paddingTop: 6 },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    statusDot: {
      width: 13,
      height: 13,
      borderRadius: 6.5,
      backgroundColor: '#1E8E3E',
      marginLeft: 2,
    },
    statusText: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
    },
    chevronDown: { transform: [{ rotate: '180deg' }] },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: ds.gray200,
      marginVertical: 6,
      marginHorizontal: 14,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      height: 44,
      paddingLeft: 18,
      paddingRight: 14,
      marginHorizontal: 6,
      borderRadius: 22,
    },
    rowActive: { backgroundColor: INBOX_TINT },
    rowPressed: { backgroundColor: ds.gray100 },
    rowLabel: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray800,
      fontSize: 15,
    },
    rowLabelActive: { color: INBOX_RED, fontWeight: theme.typography.fontWeight.semibold },
    count: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 12.5,
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
