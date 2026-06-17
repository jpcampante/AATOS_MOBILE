import { useMemo, useRef } from 'react';
import {
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedScreenBlock } from '../components/navigation/AnimatedScreenBlock';
import { ComposeModal } from '../components/integrations/ComposeModal';
import { EmailDetailView } from '../components/integrations/EmailDetailView';
import { MailRow } from '../components/integrations/MailRow';
import { MailSidebar } from '../components/integrations/MailSidebar';
import { ActionFab } from '../components/ui/ActionFab';
import { Snackbar } from '../components/ui/Snackbar';
import { AuriaIcon, AURIA_ICON_SIZE } from '../components/icons';
import { FOLDER_LABELS } from '../data/integrationsMockData';
import { auriaProfileInitials } from '../data/auriaMockData';
import { useMailbox } from '../features/integrations/useMailbox';
import { auriaTypography, myceoCornerStyle, useTheme } from '../theme';

type IntegrationsScreenProps = {
  onOpenSettings?: () => void;
};

export function IntegrationsScreen({ onOpenSettings }: IntegrationsScreenProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const mb = useMailbox();

  // Swipe right from the left edge to open the drawer.
  const openSidebarRef = useRef(() => mb.setSidebarOpen(true));
  openSidebarRef.current = () => mb.setSidebarOpen(true);
  const edgeSwipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        g.x0 < 28 && g.dx > 12 && g.dx > Math.abs(g.dy) * 1.3,
      onPanResponderRelease: (_e, g) => {
        if (g.dx > 56 || g.vx > 0.3) openSidebarRef.current();
      },
    }),
  ).current;

  return (
    <View style={styles.root} {...edgeSwipe.panHandlers}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={mb.refreshing}
            onRefresh={mb.onRefresh}
            tintColor={ds.gray500}
            colors={[ds.auriaBlue]}
          />
        }
      >
        <AnimatedScreenBlock index={0}>
          <View style={styles.searchBar}>
            <Pressable
              onPress={() => mb.setSidebarOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <AuriaIcon name="menu" size={AURIA_ICON_SIZE.md} color={ds.gray600} strokeWidth={1.8} />
            </Pressable>
            <TextInput
              value={mb.query}
              onChangeText={mb.setQuery}
              placeholder="Search in mail"
              placeholderTextColor={ds.gray500}
              style={styles.searchInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {mb.query.length > 0 ? (
              <Pressable onPress={() => mb.setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
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
          <Text style={styles.inboxLabel}>{FOLDER_LABELS[mb.activeFolder] ?? 'Inbox'}</Text>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={2}>
          <View style={styles.list}>
            {mb.visible.length === 0 ? (
              <View style={styles.empty}>
                <AuriaIcon name="mail" size={AURIA_ICON_SIZE.lg} color={ds.gray400} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No messages here.</Text>
              </View>
            ) : (
              mb.visible.map((mail) => (
                <MailRow
                  key={mail.id}
                  mail={mail}
                  onOpen={() => {
                    mb.markRead(mail.id);
                    mb.setOpenMail(mail);
                  }}
                  onToggleStar={() => mb.toggleStar(mail.id)}
                  onArchive={() => mb.archiveMail(mail.id)}
                  onDelete={() => mb.trashMail(mail.id)}
                />
              ))
            )}
          </View>
        </AnimatedScreenBlock>
      </ScrollView>

      <ActionFab icon="squarePen" label="Compose" onPress={() => mb.openCompose()} />

      {mb.snack ? (
        <Snackbar
          text={mb.snack.text}
          actionLabel={mb.snack.undo ? 'Undo' : undefined}
          onAction={
            mb.snack.undo
              ? () => {
                  mb.snack?.undo?.();
                  mb.dismissSnack();
                }
              : undefined
          }
        />
      ) : null}

      <ComposeModal
        visible={mb.composeOpen}
        initialDraft={mb.composeDraft}
        onSend={mb.sendMail}
        onClose={mb.closeCompose}
      />

      {mb.openMail
        ? (() => {
            const mail = mb.openMail;
            return (
              <EmailDetailView
                mail={mail}
                onBack={() => mb.setOpenMail(null)}
                onToggleStar={() => mb.toggleStar(mail.id)}
                onArchive={() => {
                  mb.archiveMail(mail.id);
                  mb.setOpenMail(null);
                }}
                onDelete={() => {
                  mb.trashMail(mail.id);
                  mb.setOpenMail(null);
                }}
                onMarkUnread={() => {
                  mb.setUnread(mail.id, true);
                  mb.setOpenMail(null);
                }}
                onSpam={() => {
                  mb.spamMail(mail.id);
                  mb.setOpenMail(null);
                }}
                onReply={() => {
                  mb.setOpenMail(null);
                  mb.replyTo(mail);
                }}
                onForward={() => {
                  mb.setOpenMail(null);
                  mb.forwardMail(mail);
                }}
              />
            );
          })()
        : null}

      <MailSidebar
        visible={mb.sidebarOpen}
        activeFolder={mb.activeFolder}
        onSelectFolder={(id) => mb.setActiveFolder(id)}
        onCreateNew={() => mb.openCompose()}
        onEmailContact={(email) => mb.openCompose({ to: email, subject: '', body: '' })}
        onOpenSettings={onOpenSettings}
        onClose={() => mb.setSidebarOpen(false)}
      />
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
      ...auriaTypography.body,
      flex: 1,
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
    empty: { alignItems: 'center', gap: 10, paddingVertical: 60 },
    emptyText: { ...auriaTypography.body, color: ds.gray500, fontSize: 13 },
  });
}
