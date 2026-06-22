import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  AuriaGalleryItem,
  AuriaProjectVisibility,
  auriaConversations,
  auriaGalleryItems,
  auriaWorkspaceName,
} from '../../data/auriaMockData';
import { PROJECT_ICON_OPTIONS, getProjectIcon } from '../../features/auria/projectIcons';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';
import { AuriaIcon, AuriaIconName } from '../icons';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';

export type AuriaNewProjectInput = {
  name: string;
  iconId: string;
  description?: string;
  visibility: AuriaProjectVisibility;
  /** Chat + doc source ids Auria should pull from for this project. */
  sourceIds: string[];
};

/** The glyph for each gallery/doc source type. */
const SOURCE_DOC_ICON: Record<AuriaGalleryItem['type'], AuriaIconName> = {
  PDF: 'document',
  Document: 'document',
  Spreadsheet: 'document',
  Data: 'globe',
  Image: 'frame',
};

type SourceOption = { id: string; name: string; icon: AuriaIconName; meta: string };

type SourceGroup = {
  key: string;
  label: string;
  /** Glyph + word used when adding a brand-new source to this group. */
  icon: AuriaIconName;
  noun: string;
  items: SourceOption[];
};

/** What we have to draw on when creating a project: saved chats and docs. */
const SOURCE_GROUPS: SourceGroup[] = [
  {
    key: 'chats',
    label: 'Chats',
    icon: 'messageSquare',
    noun: 'chat',
    items: auriaConversations.map((c) => ({
      id: c.id,
      name: c.title,
      icon: 'messageSquare' as AuriaIconName,
      meta: 'Chat',
    })),
  },
  {
    key: 'docs',
    label: 'Docs',
    icon: 'document',
    noun: 'doc',
    items: auriaGalleryItems.map((d) => ({
      id: d.id,
      name: d.name,
      icon: SOURCE_DOC_ICON[d.type],
      meta: `${d.type} · ${d.sizeLabel}`,
    })),
  },
];

type AuriaNewProjectModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: AuriaNewProjectInput) => void;
};

const inputWebFocusReset =
  Platform.OS === 'web'
    ? ({
        outlineWidth: 0,
        outlineStyle: 'none',
        boxShadow: 'none',
      } as object)
    : null;

export function AuriaNewProjectModal({ visible, onClose, onCreate }: AuriaNewProjectModalProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const { width: windowWidth, height } = useWindowDimensions();
  const isIosSheet = Platform.OS === 'ios';
  // Explicit pixel width so the centered sheet always fits the viewport. A
  // percentage width + alignSelf:center misbehaves on react-native-web at
  // mid widths and let the sheet overflow (cut on both sides).
  const sheetWidth = Math.min(windowWidth - 32, 540);

  const [name, setName] = useState('');
  const [iconId, setIconId] = useState('folder');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<AuriaProjectVisibility>('Team');
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  // Per-group search text + sources the user adds on the fly + ids removed.
  const [sourceQueries, setSourceQueries] = useState<Record<string, string>>({});
  const [customSources, setCustomSources] = useState<Record<string, SourceOption[]>>({});
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setName('');
      setIconId('folder');
      setDescription('');
      setVisibility('Team');
      setSourceIds([]);
      setSourceQueries({});
      setCustomSources({});
      setRemovedIds([]);
    }
  }, [visible]);

  const setQuery = (groupKey: string, value: string) =>
    setSourceQueries((current) => ({ ...current, [groupKey]: value }));

  /** Add a brand-new source to a group from the search text, then select it. */
  const addSource = (group: SourceGroup, rawName: string) => {
    const label = rawName.trim();
    if (!label) return;
    const id = `custom-${group.key}-${Date.now()}`;
    setCustomSources((current) => ({
      ...current,
      [group.key]: [
        { id, name: label, icon: group.icon, meta: 'Added' },
        ...(current[group.key] ?? []),
      ],
    }));
    setSourceIds((current) => [...current, id]);
    setQuery(group.key, '');
  };

  /** Remove a source from this project's picker (existing or added) + deselect. */
  const removeSource = (id: string) => {
    setRemovedIds((current) => (current.includes(id) ? current : [...current, id]));
    setSourceIds((current) => current.filter((s) => s !== id));
  };

  const toggleSource = (id: string) =>
    setSourceIds((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );

  const trimmedName = name.trim();
  const canCreate = trimmedName.length > 0;
  const selectedIcon = getProjectIcon(iconId);

  const handleCreate = () => {
    if (!canCreate) return;
    Keyboard.dismiss();
    onCreate({
      name: trimmedName,
      iconId,
      description: description.trim() || undefined,
      visibility,
      sourceIds,
    });
  };

  const visibilityOptions: Array<{
    value: AuriaProjectVisibility;
    title: string;
    hint: string;
  }> = [
    { value: 'Team', title: 'Invite only', hint: `Only invited members from ${auriaWorkspaceName} can use` },
    { value: 'Shared', title: 'Share with all members', hint: `Everyone in ${auriaWorkspaceName} can view and use` },
  ];

  const sheetContent = (
    <>
      <Text style={styles.title}>New project</Text>
      <Text style={styles.subtitle}>Choose an icon, name and sharing rules before creating it.</Text>

      <Text style={styles.label}>Project name</Text>
      <View style={styles.nameRow}>
        <View style={styles.nameIcon}>
          <AuriaIcon name={selectedIcon.icon} size={20} color={ds.gray800} strokeWidth={1.4} />
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Untitled project"
          placeholderTextColor={ds.gray400}
          style={styles.nameInput}
          autoFocus={visible && !isIosSheet}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.label}>Project icon</Text>
        <Text style={styles.labelMeta}>{selectedIcon.label}</Text>
      </View>
      <View style={styles.iconGrid}>
        {PROJECT_ICON_OPTIONS.map((option) => {
          const selected = option.id === iconId;
          return (
            <Pressable
              key={option.id}
              onPress={() => setIconId(option.id)}
              style={[styles.iconCell, selected && styles.iconCellActive]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Use ${option.label} icon`}
            >
              <AuriaIcon
                name={option.icon}
                size={selected ? 20 : 17}
                color={selected ? ds.gray800 : ds.gray500}
                strokeWidth={selected ? 1.5 : 1.35}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Goal, topic or project context"
        placeholderTextColor={ds.gray400}
        style={styles.descInput}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.labelRow}>
        <Text style={styles.label}>Sources</Text>
        <Text style={styles.labelMeta}>
          {sourceIds.length > 0 ? `${sourceIds.length} selected` : 'Optional'}
        </Text>
      </View>
      <Text style={styles.sourcesHint}>
        Pick the chats and docs Auria should pull from for this project.
      </Text>
      {SOURCE_GROUPS.map((group) => {
        const query = sourceQueries[group.key] ?? '';
        const q = query.trim().toLowerCase();
        const all = [...(customSources[group.key] ?? []), ...group.items].filter(
          (i) => !removedIds.includes(i.id),
        );
        const filtered = q ? all.filter((i) => i.name.toLowerCase().includes(q)) : all;
        const hasExact = all.some((i) => i.name.trim().toLowerCase() === q);
        const canAdd = q.length > 0 && !hasExact;
        return (
          <View key={group.key} style={styles.sourceGroup}>
            <Text style={styles.sourceGroupLabel}>{group.label}</Text>

            <View style={styles.searchRow}>
              <AuriaIcon name="search" size={15} color={ds.gray500} strokeWidth={1.8} />
              <TextInput
                value={query}
                onChangeText={(text) => setQuery(group.key, text)}
                placeholder={`Search ${group.label.toLowerCase()}`}
                placeholderTextColor={ds.gray400}
                style={styles.searchInput}
                returnKeyType="done"
                onSubmitEditing={() => addSource(group, query)}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery(group.key, '')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <AuriaIcon name="close" size={14} color={ds.gray400} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>

            {canAdd ? (
              <Pressable
                onPress={() => addSource(group, query)}
                style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${group.noun} ${query.trim()}`}
              >
                <View style={styles.addRowIcon}>
                  <AuriaIcon name="plus" size={16} color={ds.auriaBlue} strokeWidth={2.2} />
                </View>
                <Text style={styles.addRowText} numberOfLines={1}>
                  Add {group.noun} “{query.trim()}”
                </Text>
              </Pressable>
            ) : null}

            {filtered.length === 0 && !canAdd ? (
              <Text style={styles.sourceEmpty}>No {group.label.toLowerCase()} found.</Text>
            ) : null}

            {filtered.map((item) => {
              const selected = sourceIds.includes(item.id);
              return (
                <View
                  key={item.id}
                  style={[styles.sourceRow, selected && styles.sourceRowActive]}
                >
                  <Pressable
                    onPress={() => toggleSource(item.id)}
                    style={styles.sourceSelect}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={item.name}
                  >
                    <View style={styles.sourceRowIcon}>
                      <AuriaIcon
                        name={item.icon}
                        size={16}
                        color={selected ? ds.auriaBlue : ds.gray600}
                        strokeWidth={1.8}
                      />
                    </View>
                    <View style={styles.sourceRowCopy}>
                      <Text style={styles.sourceRowName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.sourceRowMeta} numberOfLines={1}>
                        {item.meta}
                      </Text>
                    </View>
                    <View style={[styles.sourceCheck, selected && styles.sourceCheckOn]}>
                      {selected ? (
                        <AuriaIcon name="checkCircle" size={18} color={ds.auriaBlue} strokeWidth={2} />
                      ) : null}
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => removeSource(item.id)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    style={({ pressed }) => [styles.sourceDelete, pressed && styles.sourceDeletePressed]}
                  >
                    <AuriaIcon name="trash" size={15} color={ds.gray400} strokeWidth={1.8} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={styles.companyBox}>
        <View style={styles.companyIcon}>
          <AuriaIcon name="building" size={14} color={ds.gray600} strokeWidth={1.45} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyEyebrow}>Company</Text>
          <Text style={styles.companyName} numberOfLines={1}>{auriaWorkspaceName}</Text>
          <Text style={styles.companyHint}>
            {visibility === 'Shared'
              ? `Shared with every member of ${auriaWorkspaceName}.`
              : `Not shared with everyone at ${auriaWorkspaceName}; only invited members can use it.`}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Company access</Text>
      <View style={styles.radioGrid}>
        {visibilityOptions.map((option) => {
          const active = visibility === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setVisibility(option.value)}
              style={[styles.radioCard, active && styles.radioCardActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.radioOuter, { borderColor: active ? theme.colors.success : ds.gray300 }]}>
                {active ? <View style={styles.radioInner} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>{option.title}</Text>
                <Text style={styles.radioHint}>{option.hint}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!canCreate}
          accessibilityRole="button"
        >
          <Text style={styles.createText}>Create project</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent={!isIosSheet}
      animationType={isIosSheet ? 'slide' : 'fade'}
      presentationStyle={isIosSheet ? 'pageSheet' : 'overFullScreen'}
      onRequestClose={onClose}
    >
      {isIosSheet ? (
        <ScrollView
          contentContainerStyle={styles.iosSheet}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {sheetContent}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <LiquidGlassSurface
            elevated
            elevationLevel="modal"
            borderRadius={theme.radius.panel}
            style={[styles.sheet, { width: sheetWidth }]}
          >
            <ScrollView
              style={{ maxHeight: Math.min(height * 0.86, 760) }}
              contentContainerStyle={styles.sheetScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {sheetContent}
            </ScrollView>
          </LiquidGlassSurface>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.offBlackOverlay,
    },
    iosSheet: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 10,
    },
    sheet: {
      padding: 0,
      overflow: 'hidden',
      // Anchored to the layout viewport's left inset rather than centered in the
      // Modal portal: react-native-web portals to the OS window, which can be
      // wider than the app's viewport (device emulation), so centering there
      // pushes the sheet off-screen. At mobile widths width === viewport-32, so
      // a 16px left inset reads as centered.
      alignSelf: 'flex-start',
    },
    sheetScroll: {
      padding: 20,
      gap: 10,
    },
    title: {
      ...auriaTypography.title,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray900,
      letterSpacing: -0.2,
    },
    subtitle: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 18,
      color: ds.gray500,
      marginTop: -4,
      marginBottom: 2,
    },
    label: {
      ...auriaTypography.body,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
      marginTop: 4,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    labelMeta: {
      ...auriaTypography.body,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray500,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('inset'),
    },
    nameIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      ...myceoCornerStyle('iconLg'),
    },
    nameInput: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
      paddingVertical: 4,
      backgroundColor: 'transparent',
      borderWidth: 0,
      ...(inputWebFocusReset ?? {}),
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      padding: 6,
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('inset'),
    },
    iconCell: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      ...myceoCornerStyle('iconSm'),
    },
    iconCellActive: {
      backgroundColor: theme.colors.surface,
    },
    descInput: {
      ...auriaTypography.body,
      minHeight: 66,
      fontSize: 13,
      lineHeight: 19,
      color: ds.gray900,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('inset'),
      ...(inputWebFocusReset ?? {}),
    },
    sourcesHint: {
      ...auriaTypography.body,
      fontSize: 11,
      lineHeight: 16,
      color: ds.gray500,
      marginTop: -2,
      marginBottom: 2,
    },
    sourceGroup: {
      gap: 4,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 2,
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('inset'),
    },
    searchInput: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 13,
      color: ds.gray900,
      padding: 0,
      ...(inputWebFocusReset ?? {}),
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 2,
      borderWidth: 1,
      borderColor: ds.auriaBlue,
      backgroundColor: theme.mode === 'dark' ? 'rgba(107,168,255,0.12)' : 'rgba(43,124,216,0.08)',
      ...myceoCornerStyle('inset'),
    },
    addRowPressed: {
      opacity: 0.85,
    },
    addRowIcon: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      ...myceoCornerStyle('iconSm'),
    },
    addRowText: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.auriaBlue,
    },
    sourceEmpty: {
      ...auriaTypography.body,
      fontSize: 12,
      color: ds.gray500,
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    sourceGroupLabel: {
      ...auriaTypography.label,
      fontSize: 10.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: ds.gray400,
      marginTop: 4,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.colors.input,
      borderWidth: 1,
      borderColor: 'transparent',
      ...myceoCornerStyle('inset'),
    },
    sourceRowActive: {
      borderColor: ds.auriaBlue,
      backgroundColor: theme.mode === 'dark' ? 'rgba(107,168,255,0.12)' : 'rgba(43,124,216,0.08)',
    },
    sourceRowIcon: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      ...myceoCornerStyle('iconSm'),
    },
    sourceRowCopy: {
      flex: 1,
      gap: 1,
    },
    sourceRowName: {
      ...auriaTypography.body,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    sourceRowMeta: {
      ...auriaTypography.body,
      fontSize: 11,
      color: ds.gray500,
    },
    sourceSelect: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minWidth: 0,
    },
    sourceCheck: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourceCheckOn: {},
    sourceDelete: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourceDeletePressed: {
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,107,107,0.16)' : 'rgba(217,45,45,0.10)',
    },
    companyBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('inset'),
    },
    companyIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    companyEyebrow: {
      ...auriaTypography.label,
      fontSize: 10.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: ds.gray400,
    },
    companyName: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
      marginTop: 1,
    },
    companyHint: {
      ...auriaTypography.body,
      fontSize: 11,
      lineHeight: 16,
      color: ds.gray500,
      marginTop: 2,
    },
    radioGrid: {
      gap: 8,
    },
    radioCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.divider,
      ...myceoCornerStyle('inset'),
    },
    radioCardActive: {
      backgroundColor: theme.colors.input,
      borderColor: theme.colors.borderInput,
    },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    radioInner: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: theme.colors.success,
    },
    radioTitle: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
    radioHint: {
      ...auriaTypography.body,
      fontSize: 11,
      lineHeight: 16,
      color: ds.gray500,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 10,
    },
    cancelButton: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: theme.radius.pill,
      backgroundColor: ds.gray100,
    },
    cancelButtonPressed: {
      backgroundColor: ds.gray200,
    },
    cancelText: {
      ...auriaTypography.body,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray700,
    },
    createButton: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: theme.radius.pill,
      backgroundColor: ds.offBlack,
    },
    createButtonDisabled: {
      opacity: 0.45,
    },
    createText: {
      ...auriaTypography.body,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.white,
    },
  });
}
