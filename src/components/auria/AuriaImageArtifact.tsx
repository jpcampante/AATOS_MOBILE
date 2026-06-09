import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
        <View style={styles.overlay}>
          <Pressable
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
      <Text style={styles.caption}>{artifact.title}</Text>
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
  });
}
