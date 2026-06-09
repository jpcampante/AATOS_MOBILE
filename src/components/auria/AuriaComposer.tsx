import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_SEND, AURIA_ICON_STROKE_STRONG } from '../icons';
import { auriaTypography, liquidGlassTokens, useTheme } from '../../theme';
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
  onAttach?: () => void;
  bottomInset?: number;
  isResponding?: boolean;
};

const inputWebFocusReset =
  Platform.OS === 'web'
    ? ({
        outlineWidth: 0,
        outlineStyle: 'none',
        boxShadow: 'none',
        height: AURIA_COMPOSER_TOOLBAR_HEIGHT,
        minHeight: AURIA_COMPOSER_TOOLBAR_HEIGHT,
        paddingTop: 11,
        paddingBottom: 11,
        boxSizing: 'border-box',
      } as object)
    : null;

export const AuriaComposer = forwardRef<AuriaComposerHandle, AuriaComposerProps>(
  function AuriaComposer(
    { value, onChangeText, onSend, onAttach, bottomInset = 0, isResponding = false },
    ref,
  ) {
    const [draft, setDraft] = useState('');
    const inputRef = useRef<TextInput>(null);
    const { ds, theme } = useTheme();
    const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

    const text = value ?? draft;
    const setText = onChangeText ?? setDraft;
    const hasText = text.trim().length > 0;

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
      if (!hasText || isResponding) return;
      inputRef.current?.blur();
      Keyboard.dismiss();
      onSend?.();
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
        borderRadius={AURIA_COMPOSER_TOOLBAR_HEIGHT / 2}
        style={styles.toolbarGlass}
      >
        <Pressable
          onPress={onAttach}
          accessibilityRole="button"
          accessibilityLabel="Open create menu"
          hitSlop={6}
          style={({ pressed }) => [styles.attachButton, pressed && styles.attachButtonPressed]}
        >
          <AuriaIcon
            name="plus"
            size={AURIA_ICON_SIZE.sm}
            color={ds.gray900}
            strokeWidth={AURIA_ICON_STROKE_STRONG}
          />
        </Pressable>

        <View style={styles.inputPill}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Ask anything"
          placeholderTextColor={ds.gray400}
          style={[styles.input, inputWebFocusReset]}
          multiline
          blurOnSubmit={false}
          returnKeyType="default"
          enablesReturnKeyAutomatically
          keyboardAppearance={theme.mode === 'dark' ? 'dark' : 'light'}
          textAlignVertical="center"
          submitBehavior="newline"
          onSubmitEditing={Platform.OS === 'ios' ? undefined : () => Keyboard.dismiss()}
        />
        <Pressable
          style={styles.micButton}
          accessibilityRole="button"
          accessibilityLabel="Voice"
        >
          <AuriaIcon
            name="mic"
            size={AURIA_ICON_SIZE.sm}
            color={ds.gray400}
            strokeWidth={AURIA_ICON_STROKE_STRONG}
          />
        </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.voiceButton,
            hasText && !isResponding && styles.voiceButtonActive,
            (!hasText || isResponding) && styles.voiceButtonDisabled,
            pressed && hasText && !isResponding && styles.voiceButtonPressed,
          ]}
          onPress={handleSend}
          disabled={!hasText || isResponding}
          accessibilityRole="button"
          accessibilityLabel="Send"
          hitSlop={6}
        >
          <AuriaIcon
            name="arrowUp"
            size={AURIA_ICON_SIZE.xs}
            color={ds.white}
            strokeWidth={AURIA_ICON_STROKE_SEND}
          />
        </Pressable>
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
      backgroundColor: 'transparent',
    },
    shell: {
      paddingHorizontal: 4,
    },
    toolbarGlass: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      minHeight: AURIA_COMPOSER_TOOLBAR_HEIGHT,
    },
    attachButton: {
      width: AURIA_COMPOSER_TOOLBAR_HEIGHT,
      height: AURIA_COMPOSER_TOOLBAR_HEIGHT,
      borderRadius: AURIA_COMPOSER_TOOLBAR_HEIGHT / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    attachButtonPressed: {
      backgroundColor: glass.pressed,
      transform: [{ scale: 0.96 }],
    },
    inputPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: AURIA_COMPOSER_TOOLBAR_HEIGHT,
      paddingLeft: 4,
      paddingRight: 0,
      backgroundColor: 'transparent',
    },
    input: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
      color: ds.gray900,
      paddingVertical: 0,
      paddingTop: 0,
      paddingBottom: 0,
      margin: 0,
      maxHeight: 100,
      minHeight: 22,
      backgroundColor: 'transparent',
      borderWidth: 0,
      ...(inputWebFocusReset ?? {}),
    },
    micButton: {
      width: 38,
      height: AURIA_COMPOSER_TOOLBAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceButton: {
      width: AURIA_COMPOSER_TOOLBAR_HEIGHT,
      height: AURIA_COMPOSER_TOOLBAR_HEIGHT,
      borderRadius: AURIA_COMPOSER_TOOLBAR_HEIGHT / 2,
      backgroundColor: ds.offBlack,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceButtonActive: {
      backgroundColor: ds.offBlackSoft,
    },
    voiceButtonDisabled: {
      opacity: 0.45,
    },
    voiceButtonPressed: {
      transform: [{ scale: 0.96 }],
    },
  });
}
