import { StyleSheet, Text, View } from 'react-native';
import { siteName } from '../../features/auria/webEvidence';
import type { WebSource } from '../../features/auria/webResult';
import { auriaTypography } from '../../theme';

/** A stable hue per site, so the same source always looks the same. */
function hue(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/**
 * The round mark of a web source: the site's initial on a colour drawn from its
 * name. The real logo only ever comes through the server's signed route, which
 * arrives with A036; until then nothing is loaded from the site itself.
 */
export function AuriaSiteBadge({ source, size = 18 }: { source: WebSource; size?: number }) {
  const name = siteName(source);
  return (
    <View
      accessible={false}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${hue(name)}, 55%, 36%)`,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.58 }]}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    ...auriaTypography.label,
    letterSpacing: 0,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
