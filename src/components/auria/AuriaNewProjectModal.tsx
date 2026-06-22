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
import { AuriaProjectVisibility, auriaWorkspaceName } from '../../data/auriaMockData';
import { PROJECT_ICON_OPTIONS, getProjectIcon } from '../../features/auria/projectIcons';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';
import { AuriaIcon } from '../icons';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';

export type AuriaNewProjectInput = {
  name: string;
  iconId: string;
  description?: string;
  visibility: AuriaProjectVisibility;
};

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
  const { height } = useWindowDimensions();
  const isIosSheet = Platform.OS === 'ios';

  const [name, setName] = useState('');
  const [iconId, setIconId] = useState('folder');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<AuriaProjectVisibility>('Team');

  useEffect(() => {
    if (!visible) {
      setName('');
      setIconId('folder');
      setDescription('');
      setVisibility('Team');
    }
  }, [visible]);

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
            style={styles.sheet}
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
