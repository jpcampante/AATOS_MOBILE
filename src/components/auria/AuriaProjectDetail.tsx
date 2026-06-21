import { useMemo, useState } from 'react';
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
import { AuriaProject, auriaProjectChats } from '../../data/auriaMockData';
import { getProjectIcon } from '../../features/auria/projectIcons';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type DetailTab = 'chats' | 'sources';

export function AuriaProjectDetail({
  project,
  onClose,
  onMenu,
  onShare,
}: {
  project: AuriaProject | null;
  onClose: () => void;
  onMenu: (project: AuriaProject) => void;
  onShare: (project: AuriaProject) => void;
}) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [tab, setTab] = useState<DetailTab>('chats');

  const icon = project ? getProjectIcon(project.iconId) : null;

  return (
    <Modal
      visible={!!project}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      onShow={() => setTab('chats')}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {project ? (
          <>
            {/* Top bar: back · name pill · share + more */}
            <View style={styles.topBar}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={6}
              >
                <AuriaIcon name="chevronLeft" size={20} color={ds.gray800} strokeWidth={2} />
              </Pressable>

              <View style={styles.namePill}>
                <Text style={styles.namePillText} numberOfLines={1}>
                  {project.name}
                </Text>
              </View>

              <View style={styles.topActions}>
                <Pressable
                  onPress={() => onShare(project)}
                  style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Share project"
                  hitSlop={6}
                >
                  <AuriaIcon name="upload" size={18} color={ds.gray800} strokeWidth={2} />
                </Pressable>
                <Pressable
                  onPress={() => onMenu(project)}
                  style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Project actions"
                  hitSlop={6}
                >
                  <AuriaIcon name="moreHorizontal" size={18} color={ds.gray800} strokeWidth={2} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Big title */}
              <View style={styles.titleRow}>
                <View style={styles.titleIcon}>
                  <AuriaIcon name={icon?.icon ?? 'document'} size={26} color={ds.gray900} strokeWidth={1.7} />
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {project.name}
                </Text>
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                {(['chats', 'sources'] as const).map((id) => {
                  const active = tab === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setTab(id)}
                      style={[styles.tab, active && styles.tabActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>
                        {id === 'chats' ? 'Chats' : 'Sources'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {tab === 'chats' ? (
                <View style={styles.chatList}>
                  {auriaProjectChats.map((chat) => (
                    <Pressable
                      key={chat.id}
                      style={({ pressed }) => [styles.chatRow, pressed && styles.chatRowPressed]}
                      accessibilityRole="button"
                      accessibilityLabel={chat.title}
                    >
                      <Text style={styles.chatTitle} numberOfLines={1}>
                        {chat.title}
                      </Text>
                      {chat.preview ? (
                        <Text style={styles.chatPreview} numberOfLines={1}>
                          {chat.preview}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.sourcesEmpty}>
                  <View style={styles.sourceTiles}>
                    <View style={[styles.sourceTile, { transform: [{ rotate: '-7deg' }] }]}>
                      <AuriaIcon name="building" size={20} color={ds.gray700} strokeWidth={1.7} />
                    </View>
                    <View style={[styles.sourceTile, styles.sourceTileCenter]}>
                      <AuriaIcon name="folder" size={20} color={ds.gray700} strokeWidth={1.7} />
                    </View>
                    <View style={[styles.sourceTile, { transform: [{ rotate: '7deg' }] }]}>
                      <AuriaIcon name="upload" size={20} color={ds.gray700} strokeWidth={1.7} />
                    </View>
                  </View>
                  <Text style={styles.emptyTitle}>Give Auria more context</Text>
                  <Text style={styles.emptyMessage}>
                    Upload sources, link drives, or connect apps to give Auria deeper context about
                    your project.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Add sources"
                  >
                    <Text style={styles.addText}>Add</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>

            {/* Bottom composer (visual) */}
            <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.composer}>
                <Pressable
                  style={({ pressed }) => [styles.composerPlus, pressed && styles.circleBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Add"
                  hitSlop={6}
                >
                  <AuriaIcon name="plus" size={20} color={ds.gray800} strokeWidth={2} />
                </Pressable>
                <TextInput
                  style={styles.composerInput}
                  placeholder={`Message ${project.name}`}
                  placeholderTextColor={ds.gray400}
                  editable={false}
                  pointerEvents="none"
                />
                <AuriaIcon name="mic" size={20} color={ds.gray700} strokeWidth={1.9} />
                <View style={styles.voiceBtn}>
                  <View style={styles.wave}>
                    <View style={[styles.waveBar, { height: 7 }]} />
                    <View style={[styles.waveBar, { height: 13 }]} />
                    <View style={[styles.waveBar, { height: 9 }]} />
                    <View style={[styles.waveBar, { height: 5 }]} />
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ds.gray50 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 6,
      paddingBottom: 8,
    },
    circleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
    },
    circleBtnPressed: { backgroundColor: ds.gray200 },
    namePill: {
      flex: 1,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: ds.gray100,
    },
    namePillText: {
      ...auriaTypography.title,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
    titleIcon: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...auriaTypography.title,
      flex: 1,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.5,
      color: ds.gray900,
    },
    tabs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    tab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: theme.radius.pill },
    tabActive: { backgroundColor: ds.gray100 },
    tabText: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray400,
    },
    tabTextActive: { color: ds.gray900 },
    chatList: { gap: 0 },
    chatRow: { paddingVertical: 13, gap: 4, ...myceoCornerStyle('inset') },
    chatRowPressed: { backgroundColor: ds.gray100 },
    chatTitle: {
      ...auriaTypography.body,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
    chatPreview: { ...auriaTypography.body, fontSize: 14.5, color: ds.gray400 },
    sourcesEmpty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 16 },
    sourceTiles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    sourceTile: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      borderWidth: 1,
      borderColor: ds.gray200,
      ...myceoCornerStyle('icon'),
    },
    sourceTileCenter: { marginHorizontal: -8, zIndex: 1, transform: [{ scale: 1.08 }] },
    emptyTitle: {
      ...auriaTypography.title,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray900,
      marginBottom: 8,
    },
    emptyMessage: {
      ...auriaTypography.body,
      fontSize: 14.5,
      lineHeight: 21,
      color: ds.gray500,
      textAlign: 'center',
      marginBottom: 20,
    },
    addButton: {
      paddingHorizontal: 26,
      paddingVertical: 12,
      borderRadius: theme.radius.pill,
      backgroundColor: ds.offBlack,
    },
    addButtonPressed: { opacity: 0.85 },
    addText: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.white,
    },
    composerWrap: { paddingHorizontal: 14, paddingTop: 6 },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 54,
      paddingLeft: 8,
      paddingRight: 8,
      borderRadius: 28,
      backgroundColor: ds.gray100,
      borderWidth: 1,
      borderColor: ds.gray200,
    },
    composerPlus: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composerInput: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 16,
      color: ds.gray800,
      paddingVertical: 0,
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
    voiceBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.auriaBlue,
    },
    wave: { flexDirection: 'row', alignItems: 'center', gap: 2.5 },
    waveBar: { width: 2.5, borderRadius: 2, backgroundColor: ds.white },
  });
}
