import { useMemo } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shareText } from '../../features/auria/mediaActions';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';

type AuriaImageFullScreenProps = {
  visible: boolean;
  /** The image's public URL (E06). */
  url: string;
  /** The brief behind it, shown under the picture. */
  prompt?: string;
  onClose: () => void;
  onFeedback?: (message: string) => void;
};

/**
 * An image the Auria made, full screen (A038): the picture, its brief and
 * Share — which is also how Android saves it. Editing an image has no backend
 * yet (D-06), so nothing here pretends to change it.
 */
export function AuriaImageFullScreen({ visible, url, prompt, onClose, onFeedback }: AuriaImageFullScreenProps) {
  const insets = useSafeAreaInsets();
  const { ds } = useTheme();
  const styles = useMemo(() => createStyles(insets.top, insets.bottom), [insets.bottom, insets.top]);

  const share = async () => {
    const result = await shareText(prompt?.trim() || 'Image from the Auria', url);
    if (result) onFeedback?.(result);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
          >
            <AuriaIcon name="close" color={ds.white} size={AURIA_ICON_SIZE.sm} strokeWidth={AURIA_ICON_STROKE_NAV} />
          </Pressable>
          <Pressable
            onPress={() => void share()}
            accessibilityRole="button"
            accessibilityLabel="Share image"
            hitSlop={8}
            style={({ pressed }) => [styles.sharePill, pressed && styles.pressed]}
          >
            <Text style={styles.sharePillText}>Share</Text>
          </Pressable>
        </View>

        <Image
          source={{ uri: url }}
          resizeMode="contain"
          style={styles.image}
          accessibilityIgnoresInvertColors
          accessible
          accessibilityRole="image"
          accessibilityLabel={prompt?.trim() || 'Image from the Auria'}
        />

        {prompt?.trim() ? <Text style={styles.prompt}>{prompt.trim()}</Text> : null}
      </View>
    </Modal>
  );
}

function createStyles(top: number, bottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'rgba(8, 8, 8, 0.96)',
      paddingTop: top + 8,
      paddingBottom: bottom + 16,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    circle: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      ...myceoCornerStyle('icon'),
    },
    sharePill: {
      height: 40,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      ...myceoCornerStyle('chip'),
    },
    sharePillText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    image: {
      flex: 1,
      width: '100%',
      marginVertical: 12,
    },
    prompt: {
      ...auriaTypography.body,
      color: 'rgba(255, 255, 255, 0.86)',
      fontSize: 13,
      lineHeight: 19,
      paddingHorizontal: 20,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
