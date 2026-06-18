import { useMemo, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { auriaGalleryItems, auriaProjects, AuriaGalleryItem, AuriaProject } from '../../data/auriaMockData';
import {
  AuriaGallerySort,
  AuriaGalleryTab,
  AuriaGalleryView,
  filterGalleryItems,
  sortGalleryItems,
} from '../../features/auria/galleryLogic';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';
import { AuriaEmptyState, AuriaPanelScroll } from './AuriaPanelShared';
import {
  GalleryActionSheet,
  GalleryMoveSheet,
  GalleryPreviewSheet,
  GalleryRenameModal,
  GallerySortSheet,
  GalleryToast,
  type GalleryActionId,
} from './AuriaGallerySheets';

const TABS: Array<{ id: AuriaGalleryTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'images', label: 'Images' },
  { id: 'files', label: 'Files' },
];

export function AuriaGalleryPanel() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState<AuriaGalleryTab>('all');
  const [view, setView] = useState<AuriaGalleryView>('grid');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<AuriaGallerySort>('recent');
  const [items, setItems] = useState<AuriaGalleryItem[]>(() => [...auriaGalleryItems]);

  // Active overlays
  const [menuItem, setMenuItem] = useState<AuriaGalleryItem | null>(null);
  const [renameItem, setRenameItem] = useState<AuriaGalleryItem | null>(null);
  const [moveItem, setMoveItem] = useState<AuriaGalleryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<AuriaGalleryItem | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayed = useMemo(
    () => sortGalleryItems(filterGalleryItems(items, { tab, query, typeFilter: null }), sort),
    [items, tab, query, sort],
  );
  const columns = width >= 960 ? 4 : width >= 680 ? 3 : 2;
  const cardWidth = `${100 / columns - 1.6}%` as const;

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const upload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    setItems((current) => [
      ...result.assets.map((asset, index) => ({
        id: `upload-${asset.name}-${index}-${Date.now()}`,
        name: asset.name,
        type: asset.mimeType?.startsWith('image/') ? ('Image' as const) : ('Document' as const),
        accent: theme.colors.input,
        text: theme.colors.textSecondary,
        modifiedLabel: 'Uploaded now',
        sizeLabel: asset.size ? formatBytes(asset.size) : 'File',
        source: 'Uploaded',
      })),
      ...current,
    ]);
    showToast(`Uploaded ${result.assets.length} file${result.assets.length === 1 ? '' : 's'}`);
  };

  const runAction = (id: GalleryActionId) => {
    const target = menuItem ?? previewItem;
    if (!target) return;
    if (id !== 'download' && id !== 'share' && id !== 'addToChat') setMenuItem(null);
    switch (id) {
      case 'open':
        setPreviewItem(target);
        break;
      case 'rename':
        setRenameItem(target);
        break;
      case 'move':
        setMoveItem(target);
        break;
      case 'download':
        showToast(`Downloading “${target.name}”`);
        break;
      case 'share':
        if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
          void navigator.clipboard?.writeText(`https://aatos.app/file/${encodeURIComponent(target.name)}`);
        }
        showToast('Link copied');
        break;
      case 'addToChat':
        showToast(`Added “${target.name}” to chat`);
        break;
      case 'delete':
        setItems((current) => current.filter((it) => it.id !== target.id));
        setPreviewItem((p) => (p?.id === target.id ? null : p));
        showToast('File deleted');
        break;
    }
  };

  const renameTo = (name: string) => {
    if (!renameItem) return;
    setItems((current) => current.map((it) => (it.id === renameItem.id ? { ...it, name } : it)));
    setRenameItem(null);
    showToast('File renamed');
  };

  const moveTo = (project: AuriaProject) => {
    if (!moveItem) return;
    setItems((current) =>
      current.map((it) => (it.id === moveItem.id ? { ...it, source: project.name } : it)),
    );
    setMoveItem(null);
    showToast(`Moved to ${project.name}`);
  };

  return (
    <View style={styles.root}>
      <AuriaPanelScroll>
        <View style={styles.topRow}>
          <Text style={styles.title}>Gallery</Text>
          <View style={styles.topActions}>
            <SearchBox value={query} onChangeText={setQuery} />
            <Pressable style={styles.uploadButton} onPress={() => void upload()} accessibilityRole="button" accessibilityLabel="Upload files">
              <AuriaIcon name="upload" size={AURIA_ICON_SIZE.xs} color={theme.colors.surface} strokeWidth={AURIA_ICON_STROKE_NAV} />
              <Text style={styles.uploadText}>Upload</Text>
            </Pressable>
          </View>
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
                </Pressable>
              );
            })}
          </View>
          <View style={styles.viewActions}>
            <Pressable
              style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonActive]}
              onPress={() => setSortOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Sort and filter"
            >
              <AuriaIcon name="filter" size={AURIA_ICON_SIZE.xs} color={theme.colors.textTertiary} strokeWidth={AURIA_ICON_STROKE_NAV} />
            </Pressable>
            {(['grid', 'list'] as const).map((value) => {
              const active = view === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setView(value)}
                  style={[styles.viewButton, active && styles.viewButtonActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} view`}
                  accessibilityState={{ selected: active }}
                >
                  <AuriaIcon
                    name={value}
                    size={AURIA_ICON_SIZE.xs}
                    color={active ? theme.colors.text : theme.colors.textTertiary}
                    strokeWidth={AURIA_ICON_STROKE_NAV}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {displayed.length === 0 ? (
          <AuriaEmptyState title="No files found" message="Try a different search or category." />
        ) : view === 'grid' ? (
          <View style={styles.grid}>
            {displayed.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                index={index}
                width={cardWidth}
                onOpen={() => setPreviewItem(item)}
                onMenu={() => setMenuItem(item)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {displayed.map((item, index) => (
              <GalleryListRow
                key={item.id}
                item={item}
                index={index}
                onOpen={() => setPreviewItem(item)}
                onMenu={() => setMenuItem(item)}
              />
            ))}
          </View>
        )}

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {displayed.length} {displayed.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </AuriaPanelScroll>

      <GalleryActionSheet item={menuItem} onClose={() => setMenuItem(null)} onAction={runAction} />
      <GalleryRenameModal item={renameItem} onClose={() => setRenameItem(null)} onRename={renameTo} />
      <GalleryMoveSheet item={moveItem} projects={auriaProjects} onClose={() => setMoveItem(null)} onMove={moveTo} />
      <GallerySortSheet visible={sortOpen} sort={sort} onSelect={(s) => { setSort(s); setSortOpen(false); }} onClose={() => setSortOpen(false)} />
      <GalleryPreviewSheet item={previewItem} onClose={() => setPreviewItem(null)} onAction={runAction} />
      <GalleryToast message={toast} />
    </View>
  );
}

function SearchBox({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.searchBox}>
      <AuriaIcon name="search" size={AURIA_ICON_SIZE.xs} tertiary />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search library"
        placeholderTextColor={theme.colors.textHint}
        style={styles.searchInput}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
          <AuriaIcon name="close" size={AURIA_ICON_SIZE.xs} color={theme.colors.textTertiary} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function MoreButton({ onPress, style }: { onPress: () => void; style?: object }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.moreButton, pressed && styles.moreButtonPressed, style]}
      accessibilityRole="button"
      accessibilityLabel="File options"
    >
      <AuriaIcon name="moreHorizontal" size={AURIA_ICON_SIZE.xs} color={theme.colors.textSecondary} strokeWidth={AURIA_ICON_STROKE_NAV} />
    </Pressable>
  );
}

function GalleryCard({
  item,
  index,
  width,
  onOpen,
  onMenu,
}: {
  item: AuriaGalleryItem;
  index: number;
  width: `${number}%`;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const image = item.type === 'Image';
  return (
    <View style={[styles.card, { width }]}>
      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.preview}>
        {image ? <AbstractPreview index={index} /> : <FilePreview item={item} />}
      </View>
      <Text style={styles.cardMeta}>{item.type.toUpperCase()} · {item.sizeLabel}</Text>
      {/* tap-to-open overlay (sits under the 3-dots button) */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}`}
      />
      <MoreButton onPress={onMenu} style={styles.cardMore} />
    </View>
  );
}

function FilePreview({ item }: { item: AuriaGalleryItem }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.fileIconShell}>
      <AuriaIcon name="document" size={AURIA_ICON_SIZE.md} color={item.text} />
      <Text style={[styles.fileType, { color: item.text }]}>{item.type.slice(0, 4).toUpperCase()}</Text>
    </View>
  );
}

function AbstractPreview({ index }: { index: number }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const palettes = [
    ['#102A83', '#4D78F0', '#91D9F7'],
    ['#E87C45', '#10204F', '#8ADAE9'],
    ['#155E75', '#67E8F9', '#E0F2FE'],
    ['#203879', '#7DD3FC', '#E8F4FF'],
  ];
  const palette = palettes[index % palettes.length];
  return (
    <View style={[styles.abstract, { backgroundColor: palette[0] }]}>
      <View style={[styles.abstractBand, styles.bandOne, { backgroundColor: palette[1] }]} />
      <View style={[styles.abstractBand, styles.bandTwo, { backgroundColor: palette[2] }]} />
      <View style={[styles.abstractOrb, { backgroundColor: palette[1] }]} />
    </View>
  );
}

function GalleryListRow({
  item,
  index,
  onOpen,
  onMenu,
}: {
  item: AuriaGalleryItem;
  index: number;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.listRow}>
      <Pressable style={styles.listMain} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${item.name}`}>
        <View style={styles.listPreview}>
          {item.type === 'Image' ? <AbstractPreview index={index} /> : <FilePreview item={item} />}
        </View>
        <View style={styles.listCopy}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardMeta}>{item.type.toUpperCase()} · {item.sizeLabel} · {item.source}</Text>
        </View>
      </Pressable>
      <MoreButton onPress={onMenu} />
    </View>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: { flex: 1 },
    topRow: { gap: 14 },
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
    uploadButton: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.offBlack,
    },
    uploadText: {
      ...auriaTypography.body,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.surface,
    },
    controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    tabs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tab: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: theme.radius.pill },
    tabActive: { backgroundColor: theme.colors.input },
    tabText: { ...auriaTypography.body, fontSize: 12, color: theme.colors.textTertiary },
    tabTextActive: { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold },
    viewActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    viewButtonActive: { backgroundColor: theme.colors.input },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' },
    card: {
      minHeight: 220,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'space-between',
      gap: 8,
      overflow: 'hidden',
    },
    cardMore: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.colors.surface,
    },
    cardName: {
      ...auriaTypography.body,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      paddingRight: 30,
    },
    preview: { flex: 1, minHeight: 132, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 14 },
    cardMeta: { ...auriaTypography.body, fontSize: 10, color: theme.colors.textTertiary },
    fileIconShell: {
      width: 48,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 13,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    },
    fileType: { ...auriaTypography.label, fontSize: 7, fontWeight: theme.typography.fontWeight.bold },
    abstract: { width: '100%', height: '100%', overflow: 'hidden' },
    abstractBand: { position: 'absolute', width: '135%', height: '42%', borderRadius: 999, transform: [{ rotate: '-22deg' }] },
    bandOne: { left: '-18%', top: '17%' },
    bandTwo: { left: '-8%', top: '49%', opacity: 0.82 },
    abstractOrb: { position: 'absolute', right: '-12%', top: '-12%', width: '55%', aspectRatio: 1, borderRadius: 999, opacity: 0.72 },
    list: { gap: 8 },
    listRow: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 9,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    listMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    listPreview: { width: 54, height: 54, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    listCopy: { flex: 1, gap: 5 },
    moreButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreButtonPressed: { backgroundColor: theme.colors.hover },
    countRow: { paddingTop: 18, paddingBottom: 16 },
    countText: { ...auriaTypography.body, fontSize: 12, color: theme.colors.textHint },
  });
}
