import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Popover } from '../ui/Popover';
import { Snackbar } from '../ui/Snackbar';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';
import { connectedMailbox, type MailItem } from '../../data/integrationsMockData';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';

const STAR_ACTIVE = '#F5A524';
const REACTIONS = ['💖', '👍', '🎉', '😂', '🙌', '🙂'];

type EmailDetailViewProps = {
  mail: MailItem;
  onBack: () => void;
  onToggleStar?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkUnread?: () => void;
  onSpam?: () => void;
  onReply?: () => void;
  onForward?: () => void;
};

type MenuItem = {
  icon: AuriaIconName;
  label: string;
  danger?: boolean;
  group?: number;
  action?: () => void;
};

export function EmailDetailView({
  mail,
  onBack,
  onToggleStar,
  onArchive,
  onDelete,
  onMarkUnread,
  onSpam,
  onReply,
  onForward,
}: EmailDetailViewProps) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, insets), [ds, theme, insets]);

  const [starred, setStarred] = useState(mail.starred);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [msgMenuOpen, setMsgMenuOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const info = (text: string) => {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack(text);
    snackTimer.current = setTimeout(() => setSnack(null), 2600);
  };

  const to = mail.to ?? [{ address: connectedMailbox }];
  const cc = mail.cc ?? [];
  const body = mail.bodyFull ?? mail.preview;
  const labels = mail.labels ?? ['Inbox'];
  const dateLabel = mail.dateLabel ?? `Today at ${mail.time}`;
  const senderEmail = mail.senderEmail ?? `${mail.sender.toLowerCase().replace(/\s+/g, '.')}@mail.com`;

  const recipientSummary =
    'to me' +
    (cc.length
      ? ', ' + cc.map((r) => (r.name ? r.name.split(' ')[0] : r.address.split('@')[0])).join(', ')
      : '');

  const topMenu: MenuItem[] = [
    { icon: 'folder', label: 'Move to', group: 0, action: onArchive },
    { icon: 'tag', label: 'Label', group: 0, action: () => info('Label applied') },
    {
      icon: 'flag',
      label: 'Mark as not important',
      group: 0,
      action: () => info('Marked as not important'),
    },
    { icon: 'clock', label: 'Snooze', group: 1, action: () => info('Snoozed until tomorrow') },
    { icon: 'checkCircle', label: 'Add to Tasks', group: 1, action: () => info('Added to Tasks') },
    { icon: 'bellSlash', label: 'Mute', group: 1, action: () => info('Conversation muted') },
    { icon: 'sun', label: 'View in light theme', group: 2, action: () => info('Already in light theme') },
    { icon: 'printer', label: 'Print all', group: 2, action: () => info('Preparing to print…') },
    { icon: 'frame', label: 'Revert auto-sizing', group: 2, action: () => info('Auto-sizing reverted') },
    { icon: 'exclaimCircle', label: 'Report spam', danger: true, group: 3, action: onSpam },
  ];

  const msgMenu: MenuItem[] = [
    { icon: 'reply', label: 'Reply', group: 0, action: onReply },
    { icon: 'replyAll', label: 'Reply all', group: 0, action: onReply },
    { icon: 'forward', label: 'Forward', group: 0, action: onForward },
    { icon: 'translate', label: 'Translate', group: 1, action: () => info('Translating message…') },
    { icon: 'printer', label: 'Print', group: 1, action: () => info('Preparing to print…') },
    { icon: 'messageSquare', label: 'Share in chat', group: 1, action: () => info('Shared in chat') },
    {
      icon: 'noSymbol',
      label: `Block "${mail.sender}"`,
      danger: true,
      group: 2,
      action: () => info(`Blocked ${mail.sender}`),
    },
    { icon: 'exclaimCircle', label: 'Report spam', danger: true, group: 2, action: onSpam },
  ];

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onBack}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TopIcon icon="arrowLeft" label="Back" styles={styles} ds={ds} onPress={onBack} />
          <View style={styles.flex} />
          <TopIcon
            icon="sparkles"
            label="Summarize"
            styles={styles}
            ds={ds}
            onPress={() => info('Summarizing conversation…')}
          />
          <TopIcon icon="archive" label="Archive" styles={styles} ds={ds} onPress={onArchive} />
          <TopIcon icon="trash" label="Delete" styles={styles} ds={ds} onPress={onDelete} />
          <TopIcon icon="mail" label="Mark unread" styles={styles} ds={ds} onPress={onMarkUnread} />
          <TopIcon
            icon="moreHorizontal"
            label="More options"
            styles={styles}
            ds={ds}
            onPress={() => {
              setMsgMenuOpen(false);
              setReactionsOpen(false);
              setTopMenuOpen(true);
            }}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.subjectRow}>
            <View style={styles.subjectMain}>
              <Text style={styles.subject}>{mail.subject}</Text>
              <View style={styles.chips}>
                {labels.map((label) => (
                  <View
                    key={label}
                    style={[styles.chip, label === 'External' ? styles.chipExternal : styles.chipNeutral]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        label === 'External' ? styles.chipTextExternal : styles.chipTextNeutral,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Pressable
              onPress={() => {
                setStarred((s) => !s);
                onToggleStar?.();
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={starred ? 'Unstar' : 'Star'}
            >
              <AuriaIcon
                name="star"
                size={AURIA_ICON_SIZE.lg}
                color={starred ? STAR_ACTIVE : ds.gray400}
                strokeWidth={starred ? 2 : 1.6}
              />
            </Pressable>
          </View>

          <View style={styles.senderRow}>
            <View style={[styles.avatar, { backgroundColor: mail.accent }]}>
              <Text style={styles.avatarText}>{mail.initial}</Text>
            </View>
            <View style={styles.senderInfo}>
              <View style={styles.senderTop}>
                <Text style={styles.senderName} numberOfLines={1}>
                  {mail.sender}
                </Text>
                <Text style={styles.senderTime}>{mail.time}</Text>
              </View>
              <Pressable
                style={styles.recipientsRow}
                onPress={() => setDetailsOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityLabel={detailsOpen ? 'Hide details' : 'Show details'}
                accessibilityState={{ expanded: detailsOpen }}
              >
                <Text style={styles.recipientsText} numberOfLines={1}>
                  {recipientSummary}
                </Text>
                <View style={detailsOpen ? styles.chevronUp : undefined}>
                  <AuriaIcon name="chevronDown" size={14} color={ds.gray500} strokeWidth={1.8} />
                </View>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setReactionsOpen((o) => !o)}
              hitSlop={6}
              style={styles.senderAction}
              accessibilityRole="button"
              accessibilityLabel="Add reaction"
            >
              <AuriaIcon name="faceSmile" size={AURIA_ICON_SIZE.md} color={ds.gray600} strokeWidth={1.7} />
            </Pressable>
            <Pressable
              onPress={onReply}
              hitSlop={6}
              style={styles.senderAction}
              accessibilityRole="button"
              accessibilityLabel="Reply"
            >
              <AuriaIcon name="reply" size={AURIA_ICON_SIZE.md} color={ds.gray600} strokeWidth={1.7} />
            </Pressable>
            <Pressable
              onPress={() => {
                setTopMenuOpen(false);
                setReactionsOpen(false);
                setMsgMenuOpen(true);
              }}
              hitSlop={6}
              style={styles.senderAction}
              accessibilityRole="button"
              accessibilityLabel="Message options"
            >
              <AuriaIcon name="moreHorizontal" size={AURIA_ICON_SIZE.md} color={ds.gray600} strokeWidth={1.7} />
            </Pressable>
          </View>

          {detailsOpen ? (
            <View style={styles.detailsCard}>
              <DetailRow label="From" styles={styles}>
                <Text style={styles.detailName}>{mail.sender}</Text>
                <Text style={styles.detailValue}>{senderEmail}</Text>
              </DetailRow>
              <DetailRow label="To" styles={styles}>
                {to.map((r) => (
                  <Text key={r.address} style={styles.detailValue}>
                    {r.name ? `${r.name}  ` : ''}
                    {r.address}
                  </Text>
                ))}
              </DetailRow>
              {cc.length ? (
                <DetailRow label="Cc" styles={styles}>
                  {cc.map((r) => (
                    <Text key={r.address} style={styles.detailValue}>
                      {r.name ? <Text style={styles.detailName}>{r.name}  </Text> : null}
                      {r.address}
                    </Text>
                  ))}
                </DetailRow>
              ) : null}
              <DetailRow label="Date" styles={styles}>
                <Text style={styles.detailValue}>{dateLabel}</Text>
              </DetailRow>
              <View style={styles.encRow}>
                <AuriaIcon name="lock" size={18} color={ds.gray500} strokeWidth={1.6} />
                <View>
                  <Text style={styles.encText}>Standard encryption (TLS)</Text>
                  <Text style={styles.encLink}>Learn more</Text>
                </View>
              </View>
            </View>
          ) : null}

          <Text style={styles.body}>{body}</Text>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            onPress={onReply}
            style={styles.replyIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Reply"
          >
            <AuriaIcon name="reply" size={AURIA_ICON_SIZE.md} color={ds.gray700} strokeWidth={1.7} />
          </Pressable>
          <Pressable
            onPress={onReply}
            style={styles.actionPill}
            accessibilityRole="button"
            accessibilityLabel="Reply all"
          >
            <AuriaIcon name="replyAll" size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={1.7} />
            <Text style={styles.actionPillText}>Reply all</Text>
          </Pressable>
          <Pressable
            onPress={onForward}
            style={styles.actionPill}
            accessibilityRole="button"
            accessibilityLabel="Forward"
          >
            <AuriaIcon name="forward" size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={1.7} />
            <Text style={styles.actionPillText}>Forward</Text>
          </Pressable>
          <Pressable style={styles.replyIconBtn} accessibilityRole="button" accessibilityLabel="Chat">
            <AuriaIcon name="messageSquare" size={AURIA_ICON_SIZE.md} color={ds.gray700} strokeWidth={1.7} />
          </Pressable>
        </View>

        {snack ? <Snackbar text={snack} style={styles.detailSnackPos} /> : null}

        {reactionsOpen ? (
          <>
            <Pressable style={styles.dismiss} onPress={() => setReactionsOpen(false)} accessibilityLabel="Close" />
            <Popover style={styles.reactionBar}>
              {REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    setReactionsOpen(false);
                    info(`Reacted ${emoji}`);
                  }}
                  style={styles.reactionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`React ${emoji}`}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
              <View style={styles.reactionPlus}>
                <AuriaIcon name="plus" size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={2} />
              </View>
            </Popover>
          </>
        ) : null}

        {topMenuOpen ? (
          <Menu items={topMenu} anchor={styles.topMenu} onClose={() => setTopMenuOpen(false)} styles={styles} ds={ds} />
        ) : null}
        {msgMenuOpen ? (
          <Menu items={msgMenu} anchor={styles.msgMenu} onClose={() => setMsgMenuOpen(false)} styles={styles} ds={ds} />
        ) : null}
      </View>
    </Modal>
  );
}

function TopIcon({
  icon,
  label,
  styles,
  ds,
  onPress,
}: {
  icon: AuriaIconName;
  label: string;
  styles: ReturnType<typeof createStyles>;
  ds: ReturnType<typeof useTheme>['ds'];
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.topIcon, pressed && styles.iconPressed]}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AuriaIcon name={icon} size={AURIA_ICON_SIZE.md} color={ds.gray700} strokeWidth={1.8} />
    </Pressable>
  );
}

function DetailRow({
  label,
  styles,
  children,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailContent}>{children}</View>
    </View>
  );
}

function Menu({
  items,
  anchor,
  onClose,
  styles,
  ds,
}: {
  items: MenuItem[];
  anchor: object;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
  ds: ReturnType<typeof useTheme>['ds'];
}) {
  return (
    <>
      <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Close menu" />
      <Popover style={[styles.menu, anchor]}>
        {items.map((item, index) => {
          const showDivider = index > 0 && item.group !== items[index - 1].group;
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                item.action?.();
                onClose();
              }}
              style={({ pressed }) => [
                styles.menuRow,
                showDivider && styles.menuDivider,
                pressed && styles.menuPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text style={[styles.menuText, item.danger && styles.menuTextDanger]} numberOfLines={1}>
                {item.label}
              </Text>
              <AuriaIcon
                name={item.icon}
                size={AURIA_ICON_SIZE.sm}
                color={item.danger ? ds.danger : ds.gray700}
                strokeWidth={1.7}
              />
            </Pressable>
          );
        })}
      </Popover>
    </>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  insets: { top: number; bottom: number },
) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ds.pageSurface },
    flex: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingTop: insets.top + 6,
      paddingBottom: 8,
      paddingHorizontal: 8,
    },
    topIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconPressed: { opacity: 0.5, backgroundColor: ds.gray100 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 18, paddingBottom: 24 },
    subjectRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingTop: 4,
      paddingBottom: 16,
    },
    subjectMain: { flex: 1, gap: 10 },
    subject: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 22,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.4,
      lineHeight: 28,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
    chipExternal: { backgroundColor: '#FCE8A6' },
    chipNeutral: { backgroundColor: ds.gray100 },
    chipText: {
      ...auriaTypography.label,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    chipTextExternal: { color: '#7A5B00' },
    chipTextNeutral: { color: ds.gray600 },
    senderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 8,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.bold,
    },
    senderInfo: { flex: 1, gap: 1, marginLeft: 2 },
    senderTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    senderName: {
      ...auriaTypography.body,
      flexShrink: 1,
      color: ds.gray900,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    senderTime: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
    },
    recipientsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    recipientsText: {
      ...auriaTypography.body,
      flexShrink: 1,
      color: ds.gray500,
      fontSize: 13,
    },
    chevronUp: { transform: [{ rotate: '180deg' }] },
    senderAction: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailsCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.gray300,
      ...myceoCornerStyle('card'),
      padding: 16,
      gap: 12,
      marginBottom: 18,
    },
    detailRow: { flexDirection: 'row', gap: 14 },
    detailLabel: {
      ...auriaTypography.body,
      width: 36,
      color: ds.gray500,
      fontSize: 14,
    },
    detailContent: { flex: 1, gap: 3 },
    detailName: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    detailValue: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 14,
      lineHeight: 20,
    },
    encRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 2,
    },
    encText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 14,
    },
    encLink: {
      ...auriaTypography.body,
      color: ds.auriaBlue,
      fontSize: 13,
    },
    body: {
      ...auriaTypography.body,
      color: ds.gray800,
      fontSize: 16,
      lineHeight: 25,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: insets.bottom + 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.gray200,
    },
    replyIconBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.gray300,
    },
    actionPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.gray300,
    },
    actionPillText: {
      ...auriaTypography.body,
      color: ds.gray800,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.medium,
    },
    detailSnackPos: { bottom: insets.bottom + 84 },
    dismiss: { ...StyleSheet.absoluteFillObject },
    reactionBar: {
      position: 'absolute',
      top: insets.top + 60,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: ds.white,
      borderRadius: 28,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 16,
      elevation: 8,
    },
    reactionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    reactionEmoji: { fontSize: 26 },
    reactionPlus: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      marginLeft: 2,
    },
    menu: {
      position: 'absolute',
      backgroundColor: ds.white,
      borderRadius: 14,
      paddingVertical: 6,
      minWidth: 250,
      shadowColor: '#000000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 18,
      elevation: 10,
    },
    topMenu: { top: insets.top + 52, right: 10 },
    msgMenu: { top: insets.top + 150, right: 16 },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingHorizontal: 18,
      paddingVertical: 13,
    },
    menuDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.gray200,
      marginTop: 5,
      paddingTop: 18,
    },
    menuPressed: { backgroundColor: ds.gray100 },
    menuText: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 15.5,
    },
    menuTextDanger: { color: ds.danger },
  });
}
