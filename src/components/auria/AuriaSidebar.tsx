import { useMemo, type ReactNode } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  auriaConversations,
  auriaProfileInitials,
  auriaProjects,
  auriaSidebarProjects,
  auriaSidebarTopItems,
  AuriaPanel,
  AuriaProject,
  AuriaSidebarProjectRow,
} from '../../data/auriaMockData';
import {
  AuriaIcon,
  AURIA_ICON_SIZE,
  AURIA_ICON_STROKE_NAV,
  AURIA_ICON_STROKE_STRONG,
  type AuriaIconName,
} from '../icons';
import { auriaTypography, liquidGlassBorder, liquidGlassTokens, useTheme } from '../../theme';
import { AuriaLogoMark } from './AuriaLogoMark';

type AuriaSidebarProps = {
  open?: boolean;
  width: number;
  revealProgress?: Animated.Value;
  activePanel: AuriaPanel;
  activeConversationId?: string | null;
  projectRows?: AuriaSidebarProjectRow[];
  projects?: AuriaProject[];
  onNewChat: () => void;
  onSelectPanel: (panel: AuriaPanel) => void;
  onSelectConversation: (id: string) => void;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
};

const SIDEBAR_WIDTH = 320;

type SidebarStyles = ReturnType<typeof createStyles>;

function SidebarSection({ title, styles }: { title: string; styles: SidebarStyles }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SidebarRow({
  label,
  active,
  onPress,
  icon,
  trailing,
  styles,
  accessibilityLabel,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: ReactNode;
  trailing?: ReactNode;
  styles: SidebarStyles;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
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

function ProjectIcon({
  projectId,
  accent,
  kind,
  mutedColor,
  styles,
}: {
  projectId: string;
  accent: string;
  kind: AuriaSidebarProjectRow['kind'];
  mutedColor: string;
  styles: SidebarStyles;
}) {
  if (kind === 'new') {
    return (
      <View style={[styles.projectIcon, styles.projectIconMuted]}>
        <AuriaIcon
          name="folderPlus"
          size={AURIA_ICON_SIZE.sm}
          color={mutedColor}
          strokeWidth={AURIA_ICON_STROKE_NAV}
        />
      </View>
    );
  }

  if (kind === 'more') {
    return (
      <View style={[styles.projectIcon, styles.projectIconMuted]}>
        <AuriaIcon name="moreHorizontal" size={AURIA_ICON_SIZE.sm} tertiary strokeWidth={AURIA_ICON_STROKE_NAV} />
      </View>
    );
  }

  const iconName = PROJECT_ICON_BY_ID[projectId] ?? 'folder';

  return (
    <View style={[styles.projectIcon, { backgroundColor: `${accent}18` }]}>
      <AuriaIcon
        name={iconName}
        size={AURIA_ICON_SIZE.sm}
        color={accent}
        strokeWidth={AURIA_ICON_STROKE_NAV}
      />
    </View>
  );
}

const projectMetaById = (projects: AuriaProject[]) =>
  Object.fromEntries(projects.map((project) => [project.id, project])) as Record<
    string,
    AuriaProject
  >;

export function AuriaSidebar({
  open = false,
  width,
  revealProgress,
  activePanel,
  activeConversationId,
  projectRows = auriaSidebarProjects,
  projects = auriaProjects,
  onNewChat,
  onSelectPanel,
  onSelectConversation,
  onSelectProject,
  onCreateProject,
}: AuriaSidebarProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, width), [ds, theme, width]);
  const projectMeta = useMemo(() => projectMetaById(projects), [projects]);

  const pinnedChats = auriaConversations.filter((chat) => chat.pinned);
  const recentChats = auriaConversations.filter((chat) => !chat.pinned);

  const handleTopItem = (id: (typeof auriaSidebarTopItems)[number]['id']) => {
    if (id === 'more') {
      onSelectPanel('projects');
      return;
    }
    onSelectPanel(id);
  };

  const handleProject = (id: string, kind: AuriaSidebarProjectRow['kind']) => {
    if (kind === 'new') {
      onCreateProject?.();
      return;
    }
    if (kind === 'more') {
      onSelectPanel('projects');
      return;
    }
    onSelectProject?.(id);
    onSelectPanel('projects');
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
              <AuriaLogoMark size="sm" />
              <Text style={styles.brand}>Auria</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.headerActionBtn,
              activePanel === 'search' && styles.headerActionBtnActive,
              pressed && styles.headerActionBtnPressed,
            ]}
            onPress={() => onSelectPanel('search')}
            accessibilityLabel="Search"
          >
            <AuriaIcon
              name="search"
              size={AURIA_ICON_SIZE.sm}
              active={activePanel === 'search'}
              strokeWidth={AURIA_ICON_STROKE_NAV}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.profileBtn, pressed && styles.profileBtnPressed]}
            accessibilityLabel="Profile"
            onPress={() => onSelectPanel('settings')}
          >
            <Text style={styles.profileInitials}>{auriaProfileInitials}</Text>
          </Pressable>
          </View>
        </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SidebarRow
          label="New chat"
          onPress={onNewChat}
          styles={styles}
          icon={
            <AuriaIcon
              name="plus"
              size={AURIA_ICON_SIZE.sm}
              active
              strokeWidth={AURIA_ICON_STROKE_STRONG}
            />
          }
        />

        {auriaSidebarTopItems.map((item) => {
          const active = activePanel === item.id;
          return (
            <SidebarRow
              key={item.id}
              label={item.label}
              active={active}
              onPress={() => handleTopItem(item.id)}
              styles={styles}
              icon={
                <AuriaIcon
                  name={item.icon as AuriaIconName}
                  size={AURIA_ICON_SIZE.sm}
                  active={active}
                  strokeWidth={AURIA_ICON_STROKE_NAV}
                />
              }
            />
          );
        })}

        <SidebarSection title="Projects" styles={styles} />
        {projectRows.map((project) => {
          const meta = projectMeta[project.id];
          return (
            <SidebarRow
              key={project.id}
              label={project.name}
              onPress={() => handleProject(project.id, project.kind)}
              styles={styles}
              icon={
                <ProjectIcon
                  projectId={project.id}
                  accent={meta?.accent ?? ds.gray600}
                  kind={project.kind}
                  mutedColor={ds.gray600}
                  styles={styles}
                />
              }
            />
          );
        })}

        {pinnedChats.length > 0 ? (
          <>
            <SidebarSection title="Pinned" styles={styles} />
            {pinnedChats.map((chat) => (
              <SidebarRow
                key={chat.id}
                label={chat.title}
                active={activeConversationId === chat.id}
                onPress={() => onSelectConversation(chat.id)}
                styles={styles}
                trailing={
                  <AuriaIcon
                    name="pin"
                    size={AURIA_ICON_SIZE.sm}
                    color={ds.gray400}
                    strokeWidth={AURIA_ICON_STROKE_NAV}
                  />
                }
              />
            ))}
          </>
        ) : null}

        <SidebarSection title="Recents" styles={styles} />
        {recentChats.map((chat) => (
          <SidebarRow
            key={chat.id}
            label={chat.title}
            active={activeConversationId === chat.id}
            onPress={() => onSelectConversation(chat.id)}
            styles={styles}
          />
        ))}
        <View style={styles.settingsDivider} />
        <SidebarRow
          label="Settings"
          active={activePanel === 'settings'}
          onPress={() => onSelectPanel('settings')}
          styles={styles}
          icon={
            <AuriaIcon
              name="settings"
              size={AURIA_ICON_SIZE.sm}
              active={activePanel === 'settings'}
              strokeWidth={AURIA_ICON_STROKE_NAV}
            />
          }
        />
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
  const rowActiveBorder = {} as const;
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
      ...rowActiveBorder,
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
      ...rowActiveBorder,
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
    settingsDivider: {
      height: 1,
      backgroundColor: ds.gray200,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.sm,
    },
  });
}
