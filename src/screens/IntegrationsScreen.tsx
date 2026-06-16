import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { EmailDetailView } from '../components/integrations/EmailDetailView';
import { MailSidebar } from '../components/integrations/MailSidebar';
import { AuriaIcon, AURIA_ICON_SIZE } from '../components/icons';
import {
  composeDefaultFrom,
  composeFromAccounts,
  composeSignature,
  inboxMessages,
  type MailItem,
} from '../data/integrationsMockData';
import { auriaProfileInitials } from '../data/auriaMockData';
import { auriaTypography, myceoCornerStyle, useTheme } from '../theme';

const STAR_ACTIVE = '#F5A524';
const FAB_SURFACE = '#DDE8FF';

type IntegrationsScreenProps = {
  onOpenSettings?: () => void;
};

export function IntegrationsScreen({ onOpenSettings }: IntegrationsScreenProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  const [messages, setMessages] = useState<MailItem[]>(inboxMessages);
  const [query, setQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [openMail, setOpenMail] = useState<MailItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.sender.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q),
    );
  }, [messages, query]);

  const markRead = (id: string) =>
    setMessages((items) => items.map((m) => (m.id === id ? { ...m, unread: false } : m)));

  const toggleStar = (id: string) =>
    setMessages((items) => items.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));

  const removeMail = (id: string) => setMessages((items) => items.filter((m) => m.id !== id));

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedScreenBlock index={0}>
          <View style={styles.searchBar}>
            <Pressable
              onPress={() => setSidebarOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <AuriaIcon name="menu" size={AURIA_ICON_SIZE.md} color={ds.gray600} strokeWidth={1.8} />
            </Pressable>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search in mail"
              placeholderTextColor={ds.gray500}
              style={styles.searchInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                <AuriaIcon name="close" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.8} />
              </Pressable>
            ) : (
              <Pressable
                onPress={onOpenSettings}
                accessibilityLabel="Account"
                accessibilityRole="button"
                hitSlop={6}
              >
                <View style={styles.accountAvatar}>
                  <Text style={styles.accountAvatarText}>{auriaProfileInitials}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={1}>
          <Text style={styles.inboxLabel}>Inbox</Text>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={2}>
          <View style={styles.list}>
            {visible.length === 0 ? (
              <View style={styles.empty}>
                <AuriaIcon name="mail" size={AURIA_ICON_SIZE.lg} color={ds.gray400} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No messages here.</Text>
              </View>
            ) : (
              visible.map((mail) => (
                <SwipeableRow
                  key={mail.id}
                  styles={styles}
                  onArchive={() => removeMail(mail.id)}
                  onDelete={() => removeMail(mail.id)}
                >
                  <View style={styles.row}>
                  <Pressable
                    onPress={() => {
                      markRead(mail.id);
                      setOpenMail(mail);
                    }}
                    style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${mail.sender}. ${mail.subject}`}
                  >
                    <View style={[styles.mailAvatar, { backgroundColor: mail.accent }]}>
                      <Text style={styles.mailAvatarText}>{mail.initial}</Text>
                    </View>
                    <View style={styles.mailBody}>
                      <View style={styles.mailHeader}>
                        <Text
                          style={[styles.sender, mail.unread && styles.senderUnread]}
                          numberOfLines={1}
                        >
                          {mail.sender}
                        </Text>
                        <Text style={[styles.time, mail.unread && styles.timeUnread]}>
                          {mail.time}
                        </Text>
                      </View>
                      <Text
                        style={[styles.subject, mail.unread && styles.subjectUnread]}
                        numberOfLines={1}
                      >
                        {mail.subject}
                      </Text>
                      <Text style={styles.preview} numberOfLines={1}>
                        {mail.preview}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleStar(mail.id)}
                    style={styles.starButton}
                    hitSlop={8}
                    accessibilityLabel={mail.starred ? 'Unstar' : 'Star'}
                    accessibilityRole="button"
                  >
                    <AuriaIcon
                      name="star"
                      size={AURIA_ICON_SIZE.md}
                      color={mail.starred ? STAR_ACTIVE : ds.gray400}
                      strokeWidth={mail.starred ? 2 : 1.6}
                    />
                  </Pressable>
                  </View>
                </SwipeableRow>
              ))
            )}
          </View>
        </AnimatedScreenBlock>
      </ScrollView>

      <Pressable
        onPress={() => setComposeOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityLabel="Compose"
        accessibilityRole="button"
      >
        <AuriaIcon name="squarePen" size={AURIA_ICON_SIZE.md} color={ds.gray900} strokeWidth={1.9} />
        <Text style={styles.fabText}>Compose</Text>
      </Pressable>

      <ComposeModal visible={composeOpen} onClose={() => setComposeOpen(false)} ds={ds} theme={theme} />

      {openMail ? <EmailDetailView mail={openMail} onBack={() => setOpenMail(null)} /> : null}

      <MailSidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </View>
  );
}

type ComposeModalProps = {
  visible: boolean;
  onClose: () => void;
  ds: ReturnType<typeof useTheme>['ds'];
  theme: ReturnType<typeof useTheme>['theme'];
};

function ComposeModal({ visible, onClose, ds, theme }: ComposeModalProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createComposeStyles(ds, theme, insets.top), [ds, theme, insets.top]);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [recipientsExpanded, setRecipientsExpanded] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [from, setFrom] = useState(composeDefaultFrom);
  const [fromOpen, setFromOpen] = useState(false);
  const [fromAnchor, setFromAnchor] = useState(0);

  const close = () => {
    setTo('');
    setCc('');
    setBcc('');
    setRecipientsExpanded(false);
    setSubject('');
    setBody('');
    setFrom(composeDefaultFrom);
    setFromOpen(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <View style={styles.root}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable
              onPress={close}
              style={({ pressed }) => [styles.closeCircle, pressed && styles.iconPressed]}
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={6}
            >
              <AuriaIcon name="close" size={AURIA_ICON_SIZE.md} color={ds.gray700} strokeWidth={2} />
            </Pressable>
            <View style={styles.flex} />
            <HeaderAction icon="pencil" label="Formatting" color={ds.gray800} styles={styles} />
            <HeaderAction icon="paperclip" label="Attach file" color={ds.gray800} styles={styles} />
            <HeaderAction icon="send" label="Send" color={ds.gray400} styles={styles} onPress={close} />
            <HeaderAction icon="moreCircle" label="More options" color={ds.gray800} styles={styles} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldRow}>
              <TextInput
                value={to}
                onChangeText={setTo}
                placeholder="To"
                placeholderTextColor={ds.gray500}
                style={styles.fieldInput}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable
                onPress={() => setRecipientsExpanded((open) => !open)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={recipientsExpanded ? 'Hide Cc and Bcc' : 'Show Cc and Bcc'}
                accessibilityState={{ expanded: recipientsExpanded }}
              >
                <View style={recipientsExpanded ? styles.chevronUp : undefined}>
                  <AuriaIcon name="chevronDown" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.8} />
                </View>
              </Pressable>
            </View>
            <View style={styles.divider} />

            {recipientsExpanded ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fromLabel}>Cc</Text>
                  <TextInput
                    value={cc}
                    onChangeText={setCc}
                    placeholder=""
                    style={styles.fieldInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fromLabel}>Bcc</Text>
                  <TextInput
                    value={bcc}
                    onChangeText={setBcc}
                    placeholder=""
                    style={styles.fieldInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.divider} />
              </>
            ) : null}

            <Pressable
              style={styles.fieldRow}
              onPress={() => setFromOpen((open) => !open)}
              onLayout={(e) => setFromAnchor(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
              accessibilityRole="button"
              accessibilityLabel={`From ${from}`}
            >
              <Text style={styles.fromLabel}>From</Text>
              <Text style={styles.fromValue} numberOfLines={1}>
                {from}
              </Text>
              <View style={styles.flex} />
              <AuriaIcon name="chevronDown" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.8} />
            </Pressable>
            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject"
                placeholderTextColor={ds.gray500}
                style={styles.fieldInput}
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.bodyArea}>
              <View>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  style={styles.bodyInput}
                  multiline
                  textAlignVertical="top"
                />
                {body.length === 0 ? (
                  <View style={styles.helpRow} pointerEvents="none">
                    <AuriaIcon name="pencil" size={16} color={ds.auriaBlue} strokeWidth={1.7} />
                    <Text style={styles.helpText}>Help me write</Text>
                    <View style={styles.swipeChip}>
                      <Text style={styles.swipeText}>Swipe →</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <Text style={styles.signature}>{composeSignature}</Text>
            </View>

            {fromOpen ? (
              <>
                <Pressable
                  style={styles.dropdownDismiss}
                  onPress={() => setFromOpen(false)}
                  accessibilityLabel="Close account picker"
                />
                <View style={[styles.dropdown, { top: fromAnchor }]}>
                  {composeFromAccounts.map((account, index) => (
                    <Pressable
                      key={account.id}
                      onPress={() => {
                        setFrom(account.address);
                        setFromOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownRow,
                        index > 0 && styles.dropdownDivider,
                        pressed && styles.dropdownPressed,
                      ]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.dropdownText}>
                        {account.sendAs ? `Send as: ${account.address}` : account.address}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type HeaderActionProps = {
  icon: 'pencil' | 'paperclip' | 'send' | 'moreCircle';
  label: string;
  color: string;
  styles: ReturnType<typeof createComposeStyles>;
  onPress?: () => void;
};

function HeaderAction({ icon, label, color, styles, onPress }: HeaderActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.headerIcon, pressed && styles.iconPressed]}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
    >
      <AuriaIcon name={icon} size={AURIA_ICON_SIZE.md} color={color} strokeWidth={1.8} />
    </Pressable>
  );
}

type SwipeableRowProps = {
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
  onArchive: () => void;
  onDelete: () => void;
};

function SwipeableRow({ children, styles, onArchive, onDelete }: SwipeableRowProps) {
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;

  const archiveOpacity = translateX.interpolate({
    inputRange: [0, 36],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const deleteOpacity = translateX.interpolate({
    inputRange: [-36, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderMove: (_evt, g) => translateX.setValue(g.dx),
      onPanResponderRelease: (_evt, g) => {
        const threshold = 110;
        if (g.dx <= -threshold) {
          Animated.timing(translateX, { toValue: -width, duration: 200, useNativeDriver: false }).start(
            () => onDelete(),
          );
        } else if (g.dx >= threshold) {
          Animated.timing(translateX, { toValue: width, duration: 200, useNativeDriver: false }).start(
            () => onArchive(),
          );
        } else {
          Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.swipeWrap}>
      <Animated.View
        style={[styles.swipeAction, styles.archiveAction, { opacity: archiveOpacity }]}
        pointerEvents="none"
      >
        <AuriaIcon name="archive" size={AURIA_ICON_SIZE.md} color="#0E3B1C" strokeWidth={1.8} />
      </Animated.View>
      <Animated.View
        style={[styles.swipeAction, styles.deleteAction, { opacity: deleteOpacity }]}
        pointerEvents="none"
      >
        <AuriaIcon name="trash" size={AURIA_ICON_SIZE.md} color="#5C1A12" strokeWidth={1.8} />
      </Animated.View>
      <Animated.View
        style={[styles.swipeContent, { transform: [{ translateX }] }]}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ds.pageSurface },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 96, gap: 14 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: 16,
      paddingRight: 8,
      paddingVertical: 9,
      backgroundColor: ds.inputFill,
      ...myceoCornerStyle('chip'),
      borderRadius: 26,
    },
    searchInput: {
      flex: 1,
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 15,
      padding: 0,
    },
    accountAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: ds.auriaBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountAvatarText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.bold,
    },
    inboxLabel: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
      paddingHorizontal: 4,
    },
    list: { gap: 2 },
    swipeWrap: { overflow: 'hidden' },
    swipeAction: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      alignItems: 'center',
    },
    archiveAction: { backgroundColor: '#69D98A', justifyContent: 'flex-start', paddingLeft: 28 },
    deleteAction: { backgroundColor: '#F08A80', justifyContent: 'flex-end', paddingRight: 28 },
    swipeContent: { backgroundColor: ds.pageSurface },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
    },
    rowPressed: { opacity: 0.6 },
    mailAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mailAvatarText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
    },
    mailBody: { flex: 1, gap: 1 },
    mailHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    sender: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray800,
      fontSize: 14.5,
      fontWeight: theme.typography.fontWeight.normal,
    },
    senderUnread: { color: ds.gray900, fontWeight: theme.typography.fontWeight.bold },
    time: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.normal,
    },
    timeUnread: { color: ds.gray900, fontWeight: theme.typography.fontWeight.semibold },
    subject: {
      ...auriaTypography.body,
      color: ds.gray800,
      fontSize: 14,
    },
    subjectUnread: { color: ds.gray900, fontWeight: theme.typography.fontWeight.semibold },
    preview: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 13,
      lineHeight: 18,
    },
    starButton: { padding: 6, alignSelf: 'center' },
    empty: { alignItems: 'center', gap: 10, paddingVertical: 60 },
    emptyText: { ...auriaTypography.body, color: ds.gray500, fontSize: 13 },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 15,
      backgroundColor: FAB_SURFACE,
      ...myceoCornerStyle('iconLg'),
      ...theme.shadow.card,
    },
    fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
    fabText: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.1,
    },
  });
}

function createComposeStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeTop: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      flex: 1,
      marginTop: Math.max(safeTop, 12) + 6,
      backgroundColor: ds.white,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden',
    },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    closeCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
    },
    headerIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconPressed: { opacity: 0.55, backgroundColor: ds.gray100 },
    chevronUp: { transform: [{ rotate: '180deg' }] },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 50,
      paddingHorizontal: 16,
    },
    fieldInput: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 16,
      padding: 0,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: ds.gray200,
    },
    fromLabel: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 16,
    },
    fromValue: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 16,
      maxWidth: '70%',
    },
    bodyArea: {
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 18,
    },
    bodyInput: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 16,
      lineHeight: 22,
      minHeight: 26,
      padding: 0,
    },
    helpRow: {
      position: 'absolute',
      top: 2,
      left: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    helpText: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 16,
    },
    swipeChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: ds.gray100,
    },
    swipeText: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
    },
    signature: {
      ...auriaTypography.body,
      color: ds.gray800,
      fontSize: 16,
      lineHeight: 24,
    },
    dropdownDismiss: {
      ...StyleSheet.absoluteFillObject,
    },
    dropdown: {
      position: 'absolute',
      left: 56,
      width: 232,
      maxWidth: '76%',
      backgroundColor: ds.white,
      borderRadius: 12,
      paddingVertical: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 8,
    },
    dropdownRow: {
      paddingHorizontal: 18,
      paddingVertical: 15,
    },
    dropdownDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.gray200,
    },
    dropdownPressed: { backgroundColor: ds.gray100 },
    dropdownText: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 16,
      lineHeight: 22,
    },
  });
}
