import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_SEND, AURIA_ICON_STROKE_STRONG } from '../icons';
import { auriaTypography, liquidGlassTokens, MYCEO_CORNER_RADIUS, useTheme } from '../../theme';
import {
  AURIA_COMPOSER_CONTENT_GAP,
  AURIA_COMPOSER_BOTTOM_PADDING,
  AURIA_COMPOSER_DOCK_PADDING_V,
  AURIA_COMPOSER_TOOLBAR_HEIGHT,
  AURIA_CONTENT_HORIZONTAL_INSET,
} from './auriaLayout';

export type AuriaComposerHandle = {
  blur: () => void;
  focus: () => void;
};

export {
  AURIA_COMPOSER_CONTENT_GAP,
  AURIA_COMPOSER_DOCK_PADDING_V,
  AURIA_COMPOSER_TOOLBAR_HEIGHT,
} from './auriaLayout';

type AuriaComposerProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  /** Cancels the in-progress reply. Shown as a stop button while responding. */
  onStop?: () => void;
  onAttach?: () => void;
  onVoice?: () => void;
  bottomInset?: number;
  isResponding?: boolean;
  /** Label shown on the model selector pill (e.g. "Opus 4.8"). */
  selectedModelName?: string;
  /** Optional effort tag shown beside the model name (e.g. "Max"). */
  selectedModelEffort?: string | null;
  /** Opens the model picker sheet. */
  onOpenModelPicker?: () => void;
  /** Image attachment URIs shown as thumbnails above the input. */
  attachments?: string[];
  /** Removes an attachment by its URI. */
  onRemoveAttachment?: (uri: string) => void;
  /** Image-generation mode: show aspect-ratio chips and prompt for an image. */
  imageMode?: boolean;
  /** Currently selected aspect ratio (e.g. "1:1"). */
  imageRatio?: string;
  /** Picks an aspect ratio in image mode. */
  onSelectRatio?: (ratio: string) => void;
  /** Leaves image-generation mode. */
  onExitImageMode?: () => void;
};

/** Aspect ratios offered when generating an image, straight in the composer. */
export const COMPOSER_IMAGE_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const;

const inputWebFocusReset =
  Platform.OS === 'web'
    ? ({
        outlineWidth: 0,
        outlineStyle: 'none',
        boxShadow: 'none',
        minHeight: 24,
        paddingTop: 0,
        paddingBottom: 0,
        boxSizing: 'border-box',
      } as object)
    : null;

export const AuriaComposer = forwardRef<AuriaComposerHandle, AuriaComposerProps>(
  function AuriaComposer(
    {
      value,
      onChangeText,
      onSend,
      onStop,
      onAttach,
      onVoice,
      bottomInset = 0,
      isResponding = false,
      selectedModelName = 'Opus 4.8',
      selectedModelEffort = 'Max',
      onOpenModelPicker,
      attachments = [],
      onRemoveAttachment,
      imageMode = false,
      imageRatio = '1:1',
      onSelectRatio,
      onExitImageMode,
    },
    ref,
  ) {
    const [draft, setDraft] = useState('');
    const inputRef = useRef<TextInput>(null);
    const { ds, theme } = useTheme();
    const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

    const text = value ?? draft;
    const setText = onChangeText ?? setDraft;
    const hasText = text.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    const canSend = (imageMode ? hasText : hasText || hasAttachments) && !isResponding;

    useImperativeHandle(ref, () => ({
      blur: () => {
        inputRef.current?.blur();
        Keyboard.dismiss();
      },
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleSend = () => {
      if (!canSend) return;
      inputRef.current?.blur();
      Keyboard.dismiss();
      onSend?.();
    };

    // On web/desktop, Enter sends and Shift+Enter inserts a newline.
    const handleKeyPress = (event: { nativeEvent: { key: string; shiftKey?: boolean }; preventDefault?: () => void }) => {
      if (Platform.OS !== 'web') return;
      const { key, shiftKey } = event.nativeEvent;
      if (key === 'Enter' && !shiftKey) {
        event.preventDefault?.();
        handleSend();
      }
    };

    const shellPaddingTop = AURIA_COMPOSER_CONTENT_GAP + AURIA_COMPOSER_DOCK_PADDING_V;
    const shellStyle = {
      paddingTop: shellPaddingTop,
      paddingBottom: bottomInset + AURIA_COMPOSER_BOTTOM_PADDING,
    };

    const toolbar = (
      <LiquidGlassSurface
        variant="input"
        interactive
        elevated={false}
        borderRadius={MYCEO_CORNER_RADIUS.panel}
        style={styles.toolbarGlass}
      >
        {/* Row 0 — image attachment thumbnails */}
        {hasAttachments ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.attachmentRow}
          >
            {attachments.map((uri) => (
              <View key={uri} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <Pressable
                  onPress={() => onRemoveAttachment?.(uri)}
                  style={styles.removeButton}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove attachment"
                >
                  <AuriaIcon name="close" size={12} color={ds.gray900} strokeWidth={2.5} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {/* Image-generation bar — aspect ratios live right in the input */}
        {imageMode ? (
          <View style={styles.imageBar}>
            <AuriaIcon name="frame" size={16} color={ds.auriaBlue} strokeWidth={2} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.ratioRow}
            >
              {COMPOSER_IMAGE_RATIOS.map((ratio) => {
                const active = ratio === imageRatio;
                return (
                  <Pressable
                    key={ratio}
                    onPress={() => onSelectRatio?.(ratio)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.ratioChip, active && styles.ratioChipActive]}
                  >
                    <Text style={[styles.ratioChipText, active && styles.ratioChipTextActive]}>
                      {ratio}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={onExitImageMode}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Exit image mode"
              style={styles.imageExit}
            >
              <AuriaIcon name="close" size={14} color={ds.gray600} strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : null}

        {/* Row 1 — multiline text */}
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={imageMode ? 'Describe the image…' : 'Ask anything'}
          placeholderTextColor={ds.gray400}
          style={[styles.input, inputWebFocusReset]}
          multiline
          scrollEnabled
          blurOnSubmit={false}
          returnKeyType="default"
          enablesReturnKeyAutomatically
          keyboardAppearance={theme.mode === 'dark' ? 'dark' : 'light'}
          textAlignVertical="top"
          submitBehavior="newline"
          onKeyPress={handleKeyPress}
          onSubmitEditing={Platform.OS === 'ios' ? undefined : () => Keyboard.dismiss()}
        />

        {/* Row 2 — action row */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={onAttach}
            accessibilityRole="button"
            accessibilityLabel="Open create menu"
            hitSlop={8}
            style={({ pressed }) => [styles.circleButton, pressed && styles.circleButtonPressed]}
          >
            <AuriaIcon
              name="plus"
              size={AURIA_ICON_SIZE.md}
              color={ds.gray900}
              strokeWidth={AURIA_ICON_STROKE_STRONG}
            />
          </Pressable>

          <Pressable
            onPress={onOpenModelPicker}
            accessibilityRole="button"
            accessibilityLabel={`Model: ${selectedModelName}`}
            hitSlop={6}
            style={({ pressed }) => [styles.modelPill, pressed && styles.modelPillPressed]}
          >
            <Text style={styles.modelName} numberOfLines={1}>
              {selectedModelName}
            </Text>
            {selectedModelEffort ? (
              <View style={styles.effortTag}>
                <Text style={styles.effortTagText}>{selectedModelEffort}</Text>
              </View>
            ) : null}
            <AuriaIcon
              name="chevronDown"
              size={12}
              color={ds.gray500}
              strokeWidth={1.5}
            />
          </Pressable>

          <View style={styles.spacer} />

          <Pressable
            onPress={onVoice}
            accessibilityRole="button"
            accessibilityLabel="Voice"
            hitSlop={8}
            style={({ pressed }) => [styles.circleButton, pressed && styles.circleButtonPressed]}
          >
            <AuriaIcon
              name="mic"
              size={AURIA_ICON_SIZE.md}
              color={ds.gray600}
              strokeWidth={AURIA_ICON_STROKE_STRONG}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (canSend || isResponding) && styles.sendButtonActive,
              !canSend && !isResponding && styles.sendButtonDisabled,
              pressed && (canSend || isResponding) && styles.sendButtonPressed,
            ]}
            onPress={isResponding ? onStop : handleSend}
            disabled={isResponding ? false : !canSend}
            accessibilityRole="button"
            accessibilityLabel={isResponding ? 'Stop' : 'Send'}
            hitSlop={8}
          >
            <AuriaIcon
              name={isResponding ? 'stop' : 'arrowUp'}
              size={AURIA_ICON_SIZE.sm}
              color={ds.white}
              strokeWidth={isResponding ? 2.5 : AURIA_ICON_STROKE_SEND}
            />
          </Pressable>
        </View>
      </LiquidGlassSurface>
    );

    return (
      <View style={styles.outer}>
        <View style={[styles.shell, shellStyle]}>{toolbar}</View>
      </View>
    );
  },
);

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  const glass = liquidGlassTokens(theme);
  return StyleSheet.create({
    outer: {
      width: '100%',
      paddingHorizontal: AURIA_CONTENT_HORIZONTAL_INSET,
      // Solid page backing so a tall (e.g. pasted) draft never bleeds the chat
      // through the translucent glass — keeps long text readable.
      backgroundColor: theme.colors.page,
    },
    shell: {
      paddingHorizontal: 4,
    },
    toolbarGlass: {
      flexDirection: 'column',
      alignItems: 'stretch',
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
      gap: 10,
      minHeight: AURIA_COMPOSER_TOOLBAR_HEIGHT,
    },
    attachmentRow: {
      gap: 8,
      paddingBottom: 2,
    },
    thumbWrap: {
      width: 64,
      height: 64,
    },
    thumb: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: ds.gray200,
    },
    removeButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: ds.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 2,
    },
    ratioRow: {
      gap: 6,
      alignItems: 'center',
      paddingRight: 4,
    },
    ratioChip: {
      height: 28,
      paddingHorizontal: 11,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
    },
    ratioChipActive: {
      backgroundColor: ds.offBlack,
    },
    ratioChipText: {
      ...auriaTypography.label,
      fontSize: 13,
      letterSpacing: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    ratioChipTextActive: {
      color: ds.white,
    },
    imageExit: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
    },
    input: {
      ...auriaTypography.body,
      fontSize: 16,
      lineHeight: 22,
      color: ds.gray900,
      paddingVertical: 0,
      paddingHorizontal: 4,
      margin: 0,
      maxHeight: 120,
      minHeight: 24,
      backgroundColor: 'transparent',
      borderWidth: 0,
      ...(inputWebFocusReset ?? {}),
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 36,
    },
    spacer: { flex: 1 },
    circleButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    circleButtonPressed: {
      backgroundColor: glass.pressed,
      transform: [{ scale: 0.96 }],
    },
    modelPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 34,
      borderRadius: 17,
      paddingHorizontal: 12,
      backgroundColor: ds.sectionFill,
    },
    modelPillPressed: {
      backgroundColor: ds.gray200,
      transform: [{ scale: 0.98 }],
    },
    modelName: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    effortTag: {
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.mode === 'dark' ? 'rgba(107,168,255,0.18)' : 'rgba(43,124,216,0.12)',
    },
    effortTagText: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.auriaBlue,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ds.offBlack,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonActive: {
      backgroundColor: ds.offBlackSoft,
    },
    sendButtonDisabled: {
      opacity: 0.45,
    },
    sendButtonPressed: {
      transform: [{ scale: 0.96 }],
    },
  });
}
