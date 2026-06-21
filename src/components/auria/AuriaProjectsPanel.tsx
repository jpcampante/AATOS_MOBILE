import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuriaProject, auriaProjects } from '../../data/auriaMockData';
import { getProjectIcon } from '../../features/auria/projectIcons';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';
import { AuriaProjectDetail } from './AuriaProjectDetail';
import { GalleryToast } from './AuriaGallerySheets';
import { APP_SHELL_BOTTOM_INSET } from '../navigation/AppShell';
import { AURIA_SCRIM } from './auriaLayout';

type ProjectTab = 'all' | 'created' | 'shared';

const TABS: Array<{ id: ProjectTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'created', label: 'Created by you' },
  { id: 'shared', label: 'Shared with you' },
];

/** "Updated 4 hours ago" → "4 hours ago"; bare labels pass through. */
function relativeLabel(label: string) {
  return label.replace(/^updated\s+/i, '').trim();
}

export function AuriaProjectsPanel({
  projects = auriaProjects,
  onDeleteProject,
  onOpenConversation,
  onOpenSources,
}: {
  projects?: AuriaProject[];
  onCreateProject?: () => void;
  onDeleteProject?: (id: string) => void;
  onOpenConversation?: (conversationId: string) => void;
  onOpenSources?: () => void;
}) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [tab, setTab] = useState<ProjectTab>('all');
  const [query, setQuery] = useState('');
  const [openProject, setOpenProject] = useState<AuriaProject | null>(null);
  const [menuProject, setMenuProject] = useState<AuriaProject | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = projects.filter((p) => {
      if (tab === 'created' && !p.createdByYou) return false;
      if (tab === 'shared' && p.createdByYou) return false;
      if (q && !`${p.name} ${p.owner} ${p.description ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    // Pinned first, otherwise keep the source order.
    return [...scoped].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [projects, tab, query]);

  const runAction = (action: 'share' | 'settings' | 'delete') => {
    const target = menuProject;
    if (!target) return;
    setMenuProject(null);
    if (action === 'share') {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        void navigator.clipboard?.writeText(`https://aatos.app/project/${encodeURIComponent(target.name)}`);
      }
      showToast('Project link copied');
    } else if (action === 'settings') {
      showToast(`Settings for ${target.name}`);
    } else {
      setOpenProject((current) => (current?.id === target.id ? null : current));
      onDeleteProject?.(target.id);
      showToast('Project deleted');
    }
  };

  return (
    <View style={styles.root}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <AuriaIcon name="folder" size={AURIA_ICON_SIZE.lg} color={ds.gray400} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptyMessage}>Try a different search or create a new project.</Text>
          </View>
        ) : (
          visible.map((project) => (
            <Pressable
              key={project.id}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setOpenProject(project)}
              accessibilityRole="button"
              accessibilityLabel={`Open project ${project.name}`}
            >
              <View style={styles.rowIcon}>
                <AuriaIcon
                  name={getProjectIcon(project.iconId).icon}
                  size={20}
                  color={ds.gray800}
                  strokeWidth={1.7}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {project.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {relativeLabel(project.updatedLabel)}
                </Text>
              </View>
              {project.pinned ? (
                <AuriaIcon name="pin" size={18} color={ds.gray400} strokeWidth={1.7} />
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Floating bottom search bar */}
      <View style={[styles.searchDock, { paddingBottom: APP_SHELL_BOTTOM_INSET + Math.max(insets.bottom, 10) }]}>
        <View style={styles.searchBox}>
          <AuriaIcon name="search" size={18} color={ds.gray500} strokeWidth={AURIA_ICON_STROKE_NAV} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search projects"
            placeholderTextColor={ds.gray400}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
              <AuriaIcon name="close" size={16} color={ds.gray400} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <AuriaProjectDetail
        project={openProject}
        onClose={() => setOpenProject(null)}
        onMenu={setMenuProject}
        onOpenConversation={onOpenConversation}
        onOpenSources={onOpenSources}
        onShare={(p) => {
          if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
            void navigator.clipboard?.writeText(`https://aatos.app/project/${encodeURIComponent(p.name)}`);
          }
          showToast('Project link copied');
        }}
      />

      <ProjectActionSheet
        project={menuProject}
        styles={styles}
        theme={theme}
        onClose={() => setMenuProject(null)}
        onAction={runAction}
      />
      <GalleryToast message={toast} />
    </View>
  );
}

function ProjectActionSheet({
  project,
  styles,
  theme,
  onClose,
  onAction,
}: {
  project: AuriaProject | null;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
  onClose: () => void;
  onAction: (action: 'share' | 'settings' | 'delete') => void;
}) {
  const rows: Array<{ id: 'share' | 'settings' | 'delete'; label: string; icon: 'upload' | 'settings' | 'trash'; danger?: boolean }> = [
    { id: 'share', label: 'Share', icon: 'upload' },
    { id: 'settings', label: 'Project settings', icon: 'settings' },
    { id: 'delete', label: 'Delete project', icon: 'trash', danger: true },
  ];
  return (
    <Modal visible={!!project} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {project ? (
            <View style={styles.sheetHeader}>
              <View style={styles.rowIcon}>
                <AuriaIcon name={getProjectIcon(project.iconId).icon} size={18} color={project.accent} strokeWidth={1.7} />
              </View>
              <Text style={styles.sheetTitle} numberOfLines={1}>{project.name}</Text>
            </View>
          ) : null}
          {rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => onAction(row.id)}
              style={({ pressed }) => [styles.actionRow, row.danger ? styles.actionDivider : null, pressed && styles.actionRowPressed]}
              accessibilityRole="button"
              accessibilityLabel={row.label}
            >
              <AuriaIcon name={row.icon} size={18} color={row.danger ? theme.colors.error : theme.colors.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.actionLabel, row.danger && { color: theme.colors.error }]}>{row.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    root: { flex: 1 },
    tabs: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 10,
    },
    tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.pill },
    tabActive: { backgroundColor: ds.gray100 },
    tabText: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray400,
    },
    tabTextActive: { color: ds.gray900 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 11,
      paddingHorizontal: 8,
      ...myceoCornerStyle('inset'),
    },
    rowPressed: { backgroundColor: ds.gray100 },
    rowIcon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('icon'),
    },
    rowCopy: { flex: 1, gap: 2 },
    rowName: {
      ...auriaTypography.body,
      fontSize: 16.5,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
    rowMeta: { ...auriaTypography.body, fontSize: 14, color: ds.gray400 },
    searchDock: {
      paddingHorizontal: 14,
      paddingTop: 8,
      backgroundColor: ds.gray50,
    },
    searchBox: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      borderRadius: 26,
      backgroundColor: ds.gray100,
      borderWidth: 1,
      borderColor: ds.gray200,
    },
    searchInput: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 16,
      color: ds.gray900,
      paddingVertical: 0,
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
    empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
    emptyTitle: { ...auriaTypography.body, fontSize: 15, fontWeight: theme.typography.fontWeight.semibold, color: ds.gray900, marginTop: 6 },
    emptyMessage: { ...auriaTypography.body, fontSize: 13, color: ds.gray400, textAlign: 'center' },
    /* action sheet */
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: AURIA_SCRIM },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingHorizontal: 14,
      paddingBottom: 22,
    },
    grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: theme.colors.divider, marginBottom: 12 },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingHorizontal: 8,
      paddingBottom: 12,
      marginBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    sheetTitle: { ...auriaTypography.title, flex: 1, fontSize: 15.5, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, paddingVertical: 13, ...myceoCornerStyle('inset') },
    actionDivider: { marginTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.divider },
    actionRowPressed: { backgroundColor: theme.colors.hover },
    actionLabel: { ...auriaTypography.body, flex: 1, fontSize: 15, color: theme.colors.text },
  });
}
