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
  useWindowDimensions,
  View,
} from 'react-native';
import {
  auriaTypography,
  liquidGlassTokens,
  MYCEO_CORNER_RADIUS,
  myceoCornerStyle,
  useTheme,
} from '../../theme';
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
  const { width: viewportWidth } = useWindowDimensions();
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
  const sheetWidth =
    mode === 'home'
      ? Math.min(Math.max(0, viewportWidth - 32), 230)
      : Math.min(Math.max(0, viewportWidth - 36), 420);

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
      {mode !== 'home' ? (
        <View style={styles.header}>
          <Pressable
            onPress={() => setMode('home')}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AuriaIcon name="arrowLeft" size={AURIA_ICON_SIZE.sm} />
          </Pressable>
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
      ) : null}

      <ScrollView
        key={mode}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'home' ? (
          <View style={styles.actionList}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => openAction(action.id)}
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View style={styles.actionIcon}>
                  <AuriaIcon name={action.icon} size={AURIA_ICON_SIZE.md} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
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
              <LiquidGlassSurface
                variant="input"
                interactive
                elevated={false}
                borderRadius={MYCEO_CORNER_RADIUS.inset}
                style={styles.promptSurface}
              >
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
          mode === 'home' ? styles.homeSheetPosition : styles.detailSheetPosition,
          { width: sheetWidth },
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
          elevationLevel="card"
          borderRadius={MYCEO_CORNER_RADIUS.menu}
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
                borderRadius={MYCEO_CORNER_RADIUS.chip}
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
      alignItems: 'stretch',
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
      maxHeight: '72%',
    },
    homeSheetPosition: {
      alignSelf: 'flex-start',
    },
    detailSheetPosition: {
      alignSelf: 'center',
    },
    sheet: {
      width: '100%',
      ...myceoCornerStyle('menu'),
      padding: 8,
      gap: 2,
      zIndex: 1,
    },
    header: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      ...myceoCornerStyle('icon'),
    },
    title: {
      ...auriaTypography.title,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.35,
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      gap: 10,
    },
    actionList: {
      gap: 0,
    },
    actionRow: {
      minHeight: 52,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 2,
      paddingVertical: 4,
      ...myceoCornerStyle('inset'),
    },
    actionRowPressed: {
      backgroundColor: glass.pressed,
      transform: [{ scale: 0.985 }],
    },
    actionIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('icon'),
    },
    actionLabel: {
      ...auriaTypography.body,
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
      letterSpacing: -0.1,
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
      ...myceoCornerStyle('chip'),
    },
    chipPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 9,
      ...myceoCornerStyle('chip'),
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
      ...myceoCornerStyle('inset'),
    },
    personRowActive: {
      backgroundColor: glass.fillStrong,
    },
    avatar: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      ...myceoCornerStyle('icon'),
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
      ...myceoCornerStyle('inset'),
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
      ...myceoCornerStyle('chip'),
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
