import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { shareText } from '../../features/auria/mediaActions';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';
import { AuriaImageFullScreen } from './AuriaImageFullScreen';

type AuriaGeneratedImageProps = {
  /** The image the server generated and saved in the chat (E06, absolute URL). */
  url: string;
  /** The brief that produced it, used as the label and in the share. */
  prompt?: string;
  onFeedback?: (message: string) => void;
};

/**
 * An image the Auria made, as the chat shows it (A038): the picture itself,
 * tappable for the full-screen view, and a share button. Generated images are
 * public URLs, so they load straight from the server.
 */
export function AuriaGeneratedImage({ url, prompt, onFeedback }: AuriaGeneratedImageProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [preview, setPreview] = useState(false);
  const label = prompt?.trim() || 'Image from the Auria';

  const share = async () => {
    const result = await shareText(label, url);
    if (result) onFeedback?.(result);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setPreview(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Open the image: ${label}`}
        style={styles.card}
      >
        <Image source={{ uri: url }} resizeMode="cover" style={styles.image} accessibilityIgnoresInvertColors />
        <View style={styles.overlay} pointerEvents="box-none">
          <Pressable
            onPress={() => void share()}
            accessibilityRole="button"
            accessibilityLabel="Share image"
            hitSlop={8}
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          >
            <AuriaIcon
              name="upload"
              color={ds.white}
              size={AURIA_ICON_SIZE.sm}
              strokeWidth={AURIA_ICON_STROKE_NAV}
            />
          </Pressable>
        </View>
      </Pressable>
      {prompt?.trim() ? (
        <Text style={styles.caption} numberOfLines={2}>
          {prompt.trim()}
        </Text>
      ) : null}

      <AuriaImageFullScreen
        visible={preview}
        url={url}
        prompt={prompt}
        onClose={() => setPreview(false)}
        onFeedback={onFeedback}
      />
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrapper: {
      width: '100%',
      gap: 6,
    },
    card: {
      width: '100%',
      aspectRatio: 1,
      maxHeight: 420,
      overflow: 'hidden',
      backgroundColor: ds.gray200,
      ...myceoCornerStyle('menu'),
    },
    image: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      right: 12,
      bottom: 12,
    },
    shareButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 15, 15, 0.76)',
      ...myceoCornerStyle('icon'),
    },
    pressed: {
      opacity: 0.72,
    },
    caption: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
      paddingHorizontal: 2,
    },
  });
}
