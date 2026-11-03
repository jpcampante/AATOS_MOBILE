import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useWebImage } from '../../features/auria/useWebImage';
import { siteName } from '../../features/auria/webEvidence';
import type { WebSource } from '../../features/auria/webResult';
import { auriaTypography, MYCEO_CORNER_RADIUS, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

/**
 * The picture at the top of a source card, read through the server's signed
 * route (A036, E28). Without one — or while it loads — the card shows its own
 * small illustration with the site's name, never an empty grey box, and never
 * a request to the site itself.
 */
export function AuriaWebSourceCover({ source }: { source: WebSource }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const cover = useWebImage(source.image);

  if (cover) {
    return (
      <Image
        source={{ uri: cover }}
        accessibilityIgnoresInvertColors
        style={[styles.cover, { borderRadius: MYCEO_CORNER_RADIUS.iconSm }]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.cover, styles.placeholder, myceoCornerStyle('iconSm')]}>
      <AuriaIcon name="globe" size={16} color={ds.gray500} strokeWidth={1.6} />
      <Text style={styles.placeholderName} numberOfLines={1}>
        {siteName(source)}
      </Text>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    cover: {
      width: '100%',
      height: 88,
      backgroundColor: ds.gray100,
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    placeholderName: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray500,
    },
  });
}
