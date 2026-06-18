import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuriaProject, auriaProjects } from '../../data/auriaMockData';
import { getProjectIcon } from '../../features/auria/projectIcons';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';
import { AuriaPanelScroll } from './AuriaPanelShared';
import { GalleryToast } from './AuriaGallerySheets';

type ProjectTab = 'your' | 'team' | 'shared';
type ProjectSort = 'activity' | 'edited' | 'created';

const TABS: Array<{ id: ProjectTab; label: string }> = [
  { id: 'your', label: 'Your projects' },
  { id: 'team', label: 'Team' },
  { id: 'shared', label: 'Shared' },
];

const SORTS: Array<{ id: ProjectSort; label: string; short: string }> = [
  { id: 'activity', label: 'Recent activity', short: 'Activity' },
  { id: 'edited', label: 'Last edited', short: 'Last edited' },
  { id: 'created', label: 'Date created', short: 'Date created' },
];

function parseUpdatedMs(label: string) {
  const now = Date.now();
  const n = label.toLowerCase();
  const h = n.match(/(\d+)\s*hour/);
  if (h) return now - Number(h[1]) * 36e5;
  if (n.includes('hour')) return now - 36e5;
  if (n.includes('yesterday')) return now - 864e5;
  const d = n.match(/(\d+)\s*day/);
  if (d) return now - Number(d[1]) * 864e5;
  if (n.includes('last week')) return now - 7 * 864e5;
  if (n.includes('last month')) return now - 30 * 864e5;
  if (n.includes('just now') || n.includes('recently')) return now;
  return 0;
}

export function AuriaProjectsPanel({
  projects = auriaProjects,
  onCreateProject,
  onDeleteProject,
}: {
  projects?: AuriaProject[];
  onCreateProject?: () => void;
  onDeleteProject?: (id: string) => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState<ProjectTab>('your');
  const [sort, setSort] = useState<ProjectSort>('activity');
  const [query, setQuery] = useState('');
  const [menuProject, setMenuProject] = useState<AuriaProject | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const counts = {
    your: projects.length,
    team: projects.filter((p) => p.visibility === 'Team').length,
    shared: projects.filter((p) => p.visibility === 'Shared').length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = projects.filter((p) => {
      if (tab === 'team' && p.visibility !== 'Team') return false;
      if (tab === 'shared' && p.visibility !== 'Shared') return false;
      if (q && !`${p.name} ${p.owner} ${p.description ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...scoped].sort((a, b) => {
      if (sort === 'created') return a.name.localeCompare(b.name);
      const diff = parseUpdatedMs(b.updatedLabel) - parseUpdatedMs(a.updatedLabel);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [projects, tab, query, sort]);

  const activeSort = SORTS.find((s) => s.id === sort) ?? SORTS[0];

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
      onDeleteProject?.(target.id);
      showToast('Project deleted');
    }
  };

  return (
    <View style={styles.root}>
      <AuriaPanelScroll>
        <Text style={styles.title}>Projects</Text>

        <View style={styles.topActions}>
          <View style={styles.searchBox}>
            <AuriaIcon name="search" size={AURIA_ICON_SIZE.xs} tertiary />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search projects…"
              placeholderTextColor={theme.colors.textHint}
              style={styles.searchInput}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                <AuriaIcon name="close" size={AURIA_ICON_SIZE.xs} color={theme.colors.textTertiary} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.newButton} onPress={onCreateProject} accessibilityRole="button" accessibilityLabel="New project">
            <AuriaIcon name="plus" size={AURIA_ICON_SIZE.xs} color={theme.colors.surface} strokeWidth={AURIA_ICON_STROKE_NAV} />
            <Text style={styles.newText}>New</Text>
          </Pressable>
        </View>

        <View style={styles.controlRow}>
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
                  <Text style={[styles.tabCount, active && styles.tabCountActive]}>{counts[item.id]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={({ pressed }) => [styles.sortPill, pressed && styles.sortPillPressed]}
            onPress={() => setSortOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${activeSort.label}`}
          >
            <Text style={styles.sortText}>{activeSort.short}</Text>
            <AuriaIcon name="chevronDown" size={AURIA_ICON_SIZE.xs} color={theme.colors.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <AuriaIcon name="folder" size={AURIA_ICON_SIZE.lg} color={theme.colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptyMessage}>Try a different search or create a new project.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                styles={styles}
                theme={theme}
                onOpen={() => showToast(`Opening ${project.name}…`)}
                onMenu={() => setMenuProject(project)}
              />
            ))}
          </View>
        )}
      </AuriaPanelScroll>

      <ProjectActionSheet project={menuProject} styles={styles} theme={theme} onClose={() => setMenuProject(null)} onAction={runAction} />
      <ProjectSortSheet
        visible={sortOpen}
        sort={sort}
        styles={styles}
        theme={theme}
        onSelect={(s) => { setSort(s); setSortOpen(false); }}
        onClose={() => setSortOpen(false)}
      />
      <GalleryToast message={toast} />
    </View>
  );
}

function ProjectCard({
  project,
  styles,
  theme,
  onOpen,
  onMenu,
}: {
  project: AuriaProject;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
  onOpen: () => void;
  onMenu: () => void;
}) {
  const icon = getProjectIcon(project.iconId);
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <AuriaIcon name={icon.icon} size={15} color={project.accent} strokeWidth={1.7} />
      </View>
      <Text style={styles.cardName} numberOfLines={1}>{project.name}</Text>
      {project.visibility === 'Shared' ? (
        <AuriaIcon name="lock" size={13} color={theme.colors.textTertiary} strokeWidth={1.7} />
      ) : null}

      <Pressable style={StyleSheet.absoluteFill} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open project ${project.name}`} />
      <Pressable
        onPress={onMenu}
        hitSlop={8}
        style={({ pressed }) => [styles.cardMore, pressed && styles.cardMorePressed]}
        accessibilityRole="button"
        accessibilityLabel={`Project actions ${project.name}`}
      >
        <AuriaIcon name="moreHorizontal" size={AURIA_ICON_SIZE.xs} color={theme.colors.textSecondary} strokeWidth={AURIA_ICON_STROKE_NAV} />
      </Pressable>
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
              <View style={styles.cardIcon}>
                <AuriaIcon name={getProjectIcon(project.iconId).icon} size={16} color={project.accent} strokeWidth={1.7} />
              </View>
              <Text style={styles.sheetTitle} numberOfLines={1}>{project.name}</Text>
            </View>
          ) : null}
          {rows.map((row, i) => (
            <Pressable
              key={row.id}
              onPress={() => onAction(row.id)}
              style={({ pressed }) => [styles.actionRow, row.danger ? styles.actionDivider : null, pressed && styles.rowPressed]}
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

function ProjectSortSheet({
  visible,
  sort,
  styles,
  theme,
  onSelect,
  onClose,
}: {
  visible: boolean;
  sort: ProjectSort;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
  onSelect: (sort: ProjectSort) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitlePlain}>Sort by</Text>
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
                <Text style={styles.actionLabel}>{option.label}</Text>
                {active ? <AuriaIcon name="checkCircle" size={16} color={theme.colors.success} strokeWidth={1.9} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: { flex: 1 },
    title: {
      ...auriaTypography.title,
      fontSize: 29,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchBox: {
      flex: 1,
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
    },
    searchInput: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 13,
      color: theme.colors.text,
      paddingVertical: 0,
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
    newButton: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.offBlack,
    },
    newText: { ...auriaTypography.body, fontSize: 12, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.surface },
    controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    tabs: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: theme.radius.pill },
    tabActive: { backgroundColor: theme.colors.input },
    tabText: { ...auriaTypography.body, fontSize: 12, color: theme.colors.textTertiary },
    tabTextActive: { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold },
    tabCount: { ...auriaTypography.label, fontSize: 10.5, color: theme.colors.textHint },
    tabCountActive: { color: theme.colors.textTertiary },
    sortPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
    },
    sortPillPressed: { backgroundColor: theme.colors.hover },
    sortText: { ...auriaTypography.body, fontSize: 12, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.textSecondary },
    list: { gap: 8 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 54,
      paddingLeft: 12,
      paddingRight: 44,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    cardIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.input,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      ...myceoCornerStyle('iconSm'),
    },
    cardName: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      flexShrink: 1,
    },
    cardMore: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 6,
      width: 32,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    cardMorePressed: { backgroundColor: theme.colors.hover },
    empty: { alignItems: 'center', paddingVertical: 44, gap: 8 },
    emptyTitle: { ...auriaTypography.body, fontSize: 15, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text, marginTop: 6 },
    emptyMessage: { ...auriaTypography.body, fontSize: 13, color: theme.colors.textTertiary, textAlign: 'center' },
    /* sheets */
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.34)' },
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
    sheetTitlePlain: {
      ...auriaTypography.title,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, paddingVertical: 13, ...myceoCornerStyle('inset') },
    actionDivider: { marginTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.divider },
    rowPressed: { backgroundColor: theme.colors.hover },
    actionLabel: { ...auriaTypography.body, flex: 1, fontSize: 15, color: theme.colors.text },
  });
}
