import { useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuriaImageArtifact as AuriaImageArtifactData } from '../../features/auria/types';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';

const imageMock = require('../../../assets/auria-image-mock.jpg');

type AuriaImageArtifactProps = {
  artifact: AuriaImageArtifactData;
};

export function AuriaImageArtifact({ artifact }: AuriaImageArtifactProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [preview, setPreview] = useState(false);
  const [shared, setShared] = useState(false);

  const share = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      void navigator.clipboard?.writeText(
        `https://aatos.app/image/${encodeURIComponent(artifact.title)}`,
      );
    }
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.thought}>Image generated from your brief</Text>
      <View style={[styles.card, { aspectRatio: artifact.aspectRatio }]}>
        <Image
          source={imageMock}
          resizeMode="cover"
          style={styles.image}
          accessibilityLabel={artifact.prompt}
        />
        {/* Tap the image (anywhere but the buttons) to open the full preview. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setPreview(true)}
          accessibilityRole="button"
          accessibilityLabel="Open image preview"
        />
        <View style={styles.overlay} pointerEvents="box-none">
          <Pressable
            onPress={() => setPreview(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit image"
            style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
          >
            <AuriaIcon
              name="squarePen"
              color={ds.white}
              size={AURIA_ICON_SIZE.sm}
              strokeWidth={AURIA_ICON_STROKE_NAV}
            />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={share}
            accessibilityRole="button"
            accessibilityLabel="Share image"
            style={({ pressed }) => [styles.shareButton, pressed && styles.buttonPressed]}
          >
            <AuriaIcon
              name="upload"
              color={ds.white}
              size={AURIA_ICON_SIZE.sm}
              strokeWidth={AURIA_ICON_STROKE_NAV}
            />
          </Pressable>
        </View>
      </View>
      <Text style={styles.caption}>{shared ? 'Link copied' : artifact.title}</Text>

      <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
        <View style={styles.previewRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPreview(false)}
            accessibilityLabel="Close preview"
          />
          <Image
            source={imageMock}
            resizeMode="contain"
            style={styles.previewImage}
            accessibilityLabel={artifact.prompt}
          />
          <View style={styles.previewBar} pointerEvents="box-none">
            <Text style={styles.previewPrompt} numberOfLines={2}>
              {artifact.prompt}
            </Text>
            <Pressable
              onPress={() => setPreview(false)}
              style={({ pressed }) => [styles.previewClose, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <AuriaIcon name="close" size={20} color={ds.white} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </Modal>
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
      gap: 8,
    },
    thought: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
      paddingHorizontal: 2,
    },
    card: {
      width: '100%',
      minHeight: 260,
      maxHeight: 480,
      overflow: 'hidden',
      backgroundColor: ds.gray200,
      ...myceoCornerStyle('menu'),
    },
    image: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    editButton: {
      minHeight: 40,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: 'rgba(15, 15, 15, 0.76)',
      ...myceoCornerStyle('chip'),
    },
    editText: {
      ...auriaTypography.label,
      color: ds.white,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.bold,
    },
    shareButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 15, 15, 0.76)',
      ...myceoCornerStyle('icon'),
    },
    buttonPressed: {
      opacity: 0.72,
    },
    caption: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 12,
      paddingHorizontal: 2,
    },
    previewRoot: {
      flex: 1,
      backgroundColor: 'rgba(8, 9, 11, 0.94)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewImage: {
      width: '92%',
      height: '74%',
    },
    previewBar: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    previewPrompt: {
      ...auriaTypography.body,
      flex: 1,
      color: 'rgba(255,255,255,0.82)',
      fontSize: 13,
      lineHeight: 18,
    },
    previewClose: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 22,
    },
  });
}
