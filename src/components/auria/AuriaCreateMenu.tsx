import { useEffect, useMemo, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { auriaTypography, liquidGlassTokens, useTheme } from '../../theme';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';

type CreateMode = 'home' | 'document' | 'image' | 'teammate';
type DocumentType = 'Document' | 'Presentation' | 'Spreadsheet' | 'Report';
type ImageRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

type AuriaCreateMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSendRequest: (request: string) => void;
  bottomOffset: number;
};

const ACTIONS: Array<{
  id: Exclude<CreateMode, 'home'> | 'files';
  label: string;
  icon: AuriaIconName;
}> = [
  {
    id: 'files',
    label: 'Add files',
    icon: 'upload',
  },
  {
    id: 'document',
    label: 'Create document',
    icon: 'document',
  },
  {
    id: 'image',
    label: 'Create image',
    icon: 'photo',
  },
  {
    id: 'teammate',
    label: 'Talk to teammate AI',
    icon: 'users',
  },
];

const DOCUMENT_TYPES: DocumentType[] = ['Document', 'Presentation', 'Spreadsheet', 'Report'];
const DOCUMENT_TASKS = ['Draft from scratch', 'Rewrite', 'Summarize', 'Create outline'] as const;
const IMAGE_RATIOS: ImageRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16'];
const TEAMMATES = [
  { name: 'Maya Chen', role: 'Finance AI', context: 'Budgets, forecasts, and board reporting' },
  { name: 'Noah Williams', role: 'Sales AI', context: 'Pipeline, accounts, and follow-ups' },
  { name: 'Sofia Martins', role: 'Legal AI', context: 'Contracts, policies, and compliance' },
] as const;

export function AuriaCreateMenu({
  visible,
  onClose,
  onSendRequest,
  bottomOffset,
}: AuriaCreateMenuProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, bottomOffset),
    [bottomOffset, theme],
  );
  const [mode, setMode] = useState<CreateMode>('home');
  const [prompt, setPrompt] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('Document');
  const [documentTask, setDocumentTask] =
    useState<(typeof DOCUMENT_TASKS)[number]>('Draft from scratch');
  const [imageRatio, setImageRatio] = useState<ImageRatio>('1:1');
  const [teammate, setTeammate] = useState<(typeof TEAMMATES)[number]>(TEAMMATES[0]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) {
      setMode('home');
      setPrompt('');
      anim.setValue(0);
      return;
    }
    Animated.timing(anim, {
      toValue: 1,
      duration: 240,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim, visible]);

  const finish = (request: string) => {
    onSendRequest(request);
    onClose();
  };

  const addFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const names = result.assets.map((asset) => asset.name).join(', ');
    finish(`Analyze the attached files: ${names}. Ask me what outcome I need before starting.`);
  };

  const openAction = (id: (typeof ACTIONS)[number]['id']) => {
    if (id === 'files') {
      void addFiles();
      return;
    }
    setMode(id);
  };

  const submit = () => {
    const detail = prompt.trim() || 'Ask me for the missing details before starting.';
    if (mode === 'document') {
      finish(`Create a ${documentType.toLowerCase()}. Task: ${documentTask}. Brief: ${detail}`);
    } else if (mode === 'image') {
      finish(`Create an image with aspect ratio ${imageRatio}. Image brief: ${detail}`);
    } else if (mode === 'teammate') {
      finish(`Start a shared conversation with ${teammate.name}, ${teammate.role}. Topic: ${detail}`);
    }
  };

  const title =
    mode === 'home'
      ? 'Create with Auria'
      : mode === 'document'
        ? 'Create document'
        : mode === 'image'
          ? 'Create image'
          : 'Talk to teammate AI';

  const menuBody = (
    <>
      <View style={styles.header}>
        {mode !== 'home' ? (
          <Pressable
            onPress={() => setMode('home')}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AuriaIcon name="arrowLeft" size={AURIA_ICON_SIZE.sm} />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={onClose}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <AuriaIcon name="moreHorizontal" size={AURIA_ICON_SIZE.sm} />
        </Pressable>
      </View>

      <ScrollView
        key={mode}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'home' ? (
          <View style={styles.grid}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => openAction(action.id)}
                style={({ pressed }) => [styles.tilePress, pressed && styles.tilePressed]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <LiquidGlassSurface
                  interactive
                  elevationLevel="card"
                  borderRadius={theme.radius.lg}
                  style={styles.tile}
                >
                  <View style={styles.tileIcon}>
                    <AuriaIcon name={action.icon} size={AURIA_ICON_SIZE.md} />
                  </View>
                  <Text style={styles.tileLabel}>{action.label}</Text>
                </LiquidGlassSurface>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            {mode === 'document' ? (
              <>
                <OptionSection label="Format" options={DOCUMENT_TYPES} value={documentType} onChange={setDocumentType} />
                <OptionSection label="Action" options={DOCUMENT_TASKS} value={documentTask} onChange={setDocumentTask} />
              </>
            ) : null}
            {mode === 'image' ? (
              <OptionSection label="Proportion" options={IMAGE_RATIOS} value={imageRatio} onChange={setImageRatio} />
            ) : null}
            {mode === 'teammate' ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Employee AI</Text>
                {TEAMMATES.map((person) => {
                  const active = teammate.name === person.name;
                  return (
                    <Pressable
                      key={person.name}
                      onPress={() => setTeammate(person)}
                      style={[styles.personRow, active && styles.personRowActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{person.name.split(' ').map((part) => part[0]).join('')}</Text>
                      </View>
                      <View style={styles.actionCopy}>
                        <Text style={styles.actionTitle}>{person.name}</Text>
                        <Text style={styles.actionDescription}>{person.role} {'\u00B7'} {person.context}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{mode === 'image' ? 'Describe the image' : 'Brief'}</Text>
              <LiquidGlassSurface variant="input" interactive elevated={false} borderRadius={theme.radius.md} style={styles.promptSurface}>
                <TextInput
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder={mode === 'image' ? 'A minimal campaign image with soft natural light...' : 'Describe what Auria should create or discuss...'}
                  placeholderTextColor={theme.colors.textHint}
                  multiline
                  style={styles.prompt}
                />
              </LiquidGlassSurface>
            </View>
            <Pressable onPress={submit} style={styles.submit} accessibilityRole="button">
              <AuriaIcon name="sparkles" color={theme.colors.surface} size={AURIA_ICON_SIZE.sm} />
              <Text style={styles.submitText}>{mode === 'teammate' ? 'Start conversation' : 'Create'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close create menu"
      />
      <Animated.View
        style={[
          styles.sheetPosition,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        <LiquidGlassSurface
          strong
          elevationLevel="modal"
          borderRadius={theme.radius.panel}
          style={styles.sheet}
        >
          {menuBody}
        </LiquidGlassSurface>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function OptionSection<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={({ pressed }) => [styles.chipPress, pressed && styles.chipPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <LiquidGlassSurface
                interactive
                elevated={false}
                borderRadius={theme.radius.pill}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
              </LiquidGlassSurface>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  bottomOffset = 90,
) {
  const glass = liquidGlassTokens(theme);
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingBottom: bottomOffset,
      zIndex: 20,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
      zIndex: 0,
    },
    sheetPosition: {
      width: 320,
      maxWidth: '88%',
      maxHeight: '64%',
    },
    sheet: {
      width: '100%',
      padding: 12,
      gap: 4,
      zIndex: 1,
    },
    header: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
    },
    title: {
      ...auriaTypography.title,
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      gap: 10,
      paddingBottom: 4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tilePress: {
      width: '47.5%',
      flexGrow: 1,
      borderRadius: theme.radius.lg,
    },
    tilePressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
    tile: {
      minHeight: 96,
      padding: 14,
      borderRadius: theme.radius.lg,
      justifyContent: 'space-between',
      gap: 12,
    },
    tileIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileLabel: {
      ...auriaTypography.body,
      color: theme.colors.text,
      fontSize: 13.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.2,
    },
    pressed: {
      backgroundColor: glass.pressed,
    },
    actionCopy: {
      flex: 1,
      gap: 3,
    },
    actionTitle: {
      ...auriaTypography.body,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    actionDescription: {
      ...auriaTypography.body,
      color: theme.colors.textTertiary,
      fontSize: 12,
      lineHeight: 16,
    },
    section: {
      gap: 8,
    },
    sectionLabel: {
      ...auriaTypography.label,
      color: theme.colors.textTertiary,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
      textTransform: 'uppercase',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chipPress: {
      borderRadius: theme.radius.pill,
    },
    chipPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: theme.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: theme.colors.accent,
    },
    chipText: {
      ...auriaTypography.body,
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
    chipTextActive: {
      color: theme.colors.surface,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: theme.radius.md,
    },
    personRowActive: {
      backgroundColor: glass.fillStrong,
    },
    avatar: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: theme.colors.accent,
    },
    avatarText: {
      ...auriaTypography.label,
      color: theme.colors.surface,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
    },
    promptSurface: {
      minHeight: 92,
      padding: 12,
    },
    prompt: {
      ...auriaTypography.body,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
      minHeight: 68,
      textAlignVertical: 'top',
      ...(Platform.OS === 'web'
        ? ({ outlineWidth: 0, outlineStyle: 'none' } as object)
        : null),
    },
    submit: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accent,
      marginTop: 2,
    },
    submitText: {
      ...auriaTypography.body,
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.bold,
    },
  });
}
