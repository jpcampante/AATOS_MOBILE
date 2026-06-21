import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DiscoverArticle } from '../../features/auria/newsTypes';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';

type AuriaFollowUpComposerProps = {
  visible: boolean;
  article: DiscoverArticle | null;
  onClose: () => void;
  onSend: (question: string) => void;
};

/** The "Ask a follow up" sheet — a floating composer pinned above the keyboard,
 *  carrying the article it's about as a context chip. Mirrors Perplexity's
 *  follow-up box. */
export function AuriaFollowUpComposer({
  visible,
  article,
  onClose,
  onSend,
}: AuriaFollowUpComposerProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, safe.bottom), [ds, theme, safe.bottom]);
  const [text, setText] = useState('');
  const anim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setText('');
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => inputRef.current?.focus());
    } else {
      anim.setValue(0);
    }
  }, [visible, anim]);

  if (!visible || !article) return null;

  const canSend = text.trim().length > 0;
  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close follow up" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: anim,
              transform: [
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.contextChip}>
            <Image source={{ uri: article.sourceFavicon }} style={styles.chipIcon} />
            <Text style={styles.chipText} numberOfLines={1}>
              {article.title}
            </Text>
          </View>

          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Ask a follow up…"
            placeholderTextColor={ds.gray400}
            style={styles.input}
            multiline
            onSubmitEditing={submit}
            blurOnSubmit={false}
          />

          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.circleBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Add attachment"
              hitSlop={6}
            >
              <AuriaIcon name="plus" size={AURIA_ICON_SIZE.md} color={ds.gray900} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modelPill, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Model"
              hitSlop={6}
            >
              <Text style={styles.modelText}>Model</Text>
            </Pressable>
            <View style={styles.spacer} />
            {canSend ? (
              <Pressable
                onPress={submit}
                style={({ pressed }) => [styles.sendBtn, pressed && styles.sendPressed]}
                accessibilityRole="button"
                accessibilityLabel="Send"
                hitSlop={6}
              >
                <AuriaIcon name="arrowUp" size={AURIA_ICON_SIZE.sm} color={ds.white} strokeWidth={2.4} />
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.circleBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Voice"
                hitSlop={6}
              >
                <AuriaIcon name="mic" size={AURIA_ICON_SIZE.md} color={ds.gray600} strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  bottomInset: number,
) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      paddingHorizontal: 12,
      paddingBottom: bottomInset + 10,
      zIndex: 55,
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      padding: 14,
      gap: 12,
      ...Platform.select({
        web: { boxShadow: '0 12px 40px rgba(0,0,0,0.18)' } as object,
        default: {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 10 },
          elevation: 20,
        },
      }),
    },
    contextChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: ds.sectionFill,
    },
    chipIcon: {
      width: 22,
      height: 22,
      borderRadius: 6,
      backgroundColor: ds.gray200,
    },
    chipText: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.medium,
    },
    input: {
      ...auriaTypography.body,
      fontSize: 16,
      lineHeight: 22,
      color: ds.gray900,
      minHeight: 24,
      maxHeight: 120,
      paddingHorizontal: 4,
      ...(Platform.OS === 'web'
        ? ({ outlineWidth: 0, outlineStyle: 'none' } as object)
        : null),
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    circleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
    },
    modelPill: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
    },
    modelText: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.medium,
    },
    spacer: { flex: 1 },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.offBlack,
    },
    sendPressed: {
      transform: [{ scale: 0.96 }],
    },
    pressed: {
      backgroundColor: ds.gray200,
    },
  });
}
