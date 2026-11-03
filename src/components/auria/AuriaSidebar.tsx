import { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { AuriaPanel } from '../../data/auriaMockData';
import {
  AuriaIcon,
  AURIA_ICON_SIZE,
  AURIA_ICON_STROKE_NAV,
  AURIA_ICON_STROKE_STRONG,
  type AuriaIconName,
} from '../icons';
import { auriaTypography, liquidGlassBorder, liquidGlassTokens, useTheme } from '../../theme';
import { AuriaBloomMark } from './AuriaBloomMark';
import { useCurrentUser } from '../../features/auth';
import { providerLabel } from '../../features/auria/chatList';
import type { AuriaConversation } from '../../features/auria/types';

/**
 * What the sidebar navigates to in the v1 (A056). Gallery, Projects and the
 * search panel are simulated and only get a backend in the v2 (D-09), so they
 * are not reachable here.
 */
const V1_TOP_ITEMS = [{ id: 'news' as const, label: 'News', icon: 'newspaper' as const }];

type AuriaSidebarProps = {
  open?: boolean;
  width: number;
  revealProgress?: Animated.Value;
  activePanel: AuriaPanel;
  activeConversationId?: string | null;
  onNewChat: () => void;
  onSelectPanel: (panel: AuriaPanel) => void;
  onSelectConversation: (id: string) => void;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
  /** The person's conversations from the server, pinned first. */
  conversations: AuriaConversation[];
  /** The first page arrived (an empty list really is empty). */
  conversationsLoaded: boolean;
  conversationsLoading: boolean;
  hasMoreConversations: boolean;
  onLoadMoreConversations: () => void;
  /** Long-press on a conversation: rename, pin, delete. */
  onConversationMenu?: (conversation: AuriaConversation) => void;
};

/** Loads the next page when the list is this close to its end. */
const LOAD_MORE_DISTANCE = 240;

const SIDEBAR_WIDTH = 320;

type SidebarStyles = ReturnType<typeof createStyles>;

function SidebarSection({ title, styles }: { title: string; styles: SidebarStyles }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SidebarRow({
  label,
  active,
  onPress,
  onLongPress,
  icon,
  trailing,
  styles,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  icon?: ReactNode;
  trailing?: ReactNode;
  styles: SidebarStyles;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: active }}
    >
      {icon ? <View style={styles.rowIconSlot}>{icon}</View> : null}
      <Text style={[styles.rowLabel, active && styles.rowLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

const PROJECT_ICON_BY_ID: Record<string, AuriaIconName> = {
  'f-finance': 'currencyDollar',
  'f-sales': 'briefcase',
  'f-legal': 'scale',
};

export function AuriaSidebar({
  open = false,
  width,
  revealProgress,
  activePanel,
  activeConversationId,
  onNewChat,
  onSelectPanel,
  onSelectConversation,
  onSelectProject,
  onCreateProject,
  conversations,
  conversationsLoaded,
  conversationsLoading,
  hasMoreConversations,
  onLoadMoreConversations,
  onConversationMenu,
}: AuriaSidebarProps) {
  const { ds, theme } = useTheme();
  const user = useCurrentUser();
  const styles = useMemo(() => createStyles(ds, theme, width), [ds, theme, width]);

  const pinnedChats = conversations.filter((chat) => chat.isPinned);
  const recentChats = conversations.filter((chat) => !chat.isPinned);

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const nearEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_DISTANCE;
    if (nearEnd && hasMoreConversations && !conversationsLoading) onLoadMoreConversations();
  };

  const renderConversation = (chat: AuriaConversation, pinned: boolean) => {
    const origin = providerLabel(chat.provider);
    return (
      <SidebarRow
        key={chat.id}
        label={chat.title}
        active={activeConversationId === chat.id}
        onPress={() => onSelectConversation(chat.id)}
        onLongPress={onConversationMenu ? () => onConversationMenu(chat) : undefined}
        accessibilityLabel={`${chat.title}${pinned ? ', pinned' : ''}${origin ? `, from ${origin}` : ''}`}
        accessibilityHint={onConversationMenu ? 'Long press for rename, pin and delete' : undefined}
        styles={styles}
        trailing={
          <>
            {origin ? <Text style={styles.originBadge}>{origin}</Text> : null}
            {pinned ? (
              <AuriaIcon name="pin" size={AURIA_ICON_SIZE.sm} color={ds.gray400} strokeWidth={AURIA_ICON_STROKE_NAV} />
            ) : null}
          </>
        }
      />
    );
  };

  const handleTopItem = (id: (typeof V1_TOP_ITEMS)[number]['id']) => {
    onSelectPanel(id);
  };


  return (
    <Animated.View
      style={[
        styles.drawerShell,
        Platform.OS === 'ios'
          ? null
          : revealProgress
            ? { opacity: revealProgress }
            : { opacity: open ? 1 : 0 },
        { pointerEvents: open ? 'auto' : 'none' },
      ]}
      aria-hidden={!open}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
    >
      <View style={styles.drawer}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <AuriaBloomMark size="sm" />
              <Text style={styles.brand}>Auria</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.profileBtn, pressed && styles.profileBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
            onPress={() => onSelectPanel('settings')}
          >
            <Text style={styles.profileInitials}>{user.initials}</Text>
          </Pressable>
          </View>
        </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        <SidebarRow
          label="New chat"
          onPress={onNewChat}
          styles={styles}
          icon={
            <AuriaIcon
              name="squarePen"
              size={AURIA_ICON_SIZE.sm}
              active
              strokeWidth={AURIA_ICON_STROKE_NAV}
            />
          }
        />

        {V1_TOP_ITEMS.map((item) => {
          const active = activePanel === item.id;
          const rowIcon = (
            <AuriaIcon
              name={item.icon as AuriaIconName}
              size={AURIA_ICON_SIZE.sm}
              active={active}
              strokeWidth={AURIA_ICON_STROKE_NAV}
            />
          );

          return (
            <SidebarRow
              key={item.id}
              label={item.label}
              active={active}
              onPress={() => handleTopItem(item.id)}
              styles={styles}
              icon={rowIcon}
            />
          );
        })}


        {pinnedChats.length > 0 ? (
          <>
            <SidebarSection title="Pinned" styles={styles} />
            {pinnedChats.map((chat) => renderConversation(chat, true))}
          </>
        ) : null}

        {recentChats.length > 0 || (conversationsLoaded && conversations.length === 0) ? (
          <SidebarSection title="Recents" styles={styles} />
        ) : null}
        {recentChats.map((chat) => renderConversation(chat, false))}
        {conversationsLoaded && conversations.length === 0 ? (
          <Text style={styles.emptyNote}>No conversations yet. Ask Auria anything to start one.</Text>
        ) : null}
        {conversationsLoading ? (
          <View style={styles.listSpinner} accessibilityLabel="Loading conversations">
            <ActivityIndicator size="small" color={ds.gray500} />
          </View>
        ) : null}
      </ScrollView>

      </View>
    </Animated.View>
  );
}

export { SIDEBAR_WIDTH };

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  drawerWidth: number,
) {
  const glass = liquidGlassTokens(theme);
  const rimSubtle = liquidGlassBorder(theme, true);

  return StyleSheet.create({
    drawerShell: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: drawerWidth,
      overflow: 'hidden',
      backgroundColor: ds.white,
      zIndex: 1,
    },
    drawer: {
      width: drawerWidth,
      flex: 1,
      backgroundColor: ds.white,
      paddingTop: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    brandBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brand: {
      ...auriaTypography.title,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.auriaBlue,
      letterSpacing: -0.35,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: glass.fill,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 4,
      paddingVertical: 4,
      ...rimSubtle,
      ...glass.webBlur,
    },
    headerActionBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    headerActionBtnActive: {
      backgroundColor: glass.fillStrong,
    },
    headerActionBtnPressed: {
      opacity: 0.75,
    },
    profileBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: ds.offBlack,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileBtnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    profileInitials: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.white,
      letterSpacing: -0.2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.xl,
    },
    originBadge: {
      ...auriaTypography.label,
      fontSize: 10.5,
      color: ds.gray500,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: ds.gray100,
      overflow: 'hidden',
    },
    emptyNote: {
      ...auriaTypography.body,
      fontSize: 13,
      color: ds.gray500,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    listSpinner: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    sectionTitle: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray500,
      paddingHorizontal: theme.spacing.md,
      marginTop: theme.spacing.xs,
      marginBottom: 4,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      minHeight: 44,
    },
    rowActive: {
      backgroundColor: glass.pressed,
    },
    rowPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.985 }],
    },
    rowIconSlot: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    rowLabelActive: {
      fontWeight: theme.typography.fontWeight.semibold,
    },
    projectsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: theme.spacing.sm,
    },
    projectsMain: {
      flex: 1,
    },
    rowTrailingBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTrailingBtnPressed: {
      backgroundColor: glass.pressed,
    },
    projectIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    projectIconMuted: {
      backgroundColor: glass.fill,
      ...rimSubtle,
    },
  });
}
