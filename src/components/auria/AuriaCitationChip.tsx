import { useMemo } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import { siteName } from '../../features/auria/webEvidence';
import type { WebSource } from '../../features/auria/webResult';
import { auriaTypography, useTheme } from '../../theme';

type AuriaCitationChipProps = {
  source: WebSource;
  /** Opens the source; defaults to the browser. */
  onOpen?: (source: WebSource) => void;
};

/**
 * A `[n]` citation inside an answer: the index and the site it points at,
 * tappable to open the page. It renders as text so it flows with the sentence
 * (A035); the web shows the same thing as a chip with a popover.
 */
export function AuriaCitationChip({ source, onOpen }: AuriaCitationChipProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const name = siteName(source);
  const short = name.length > 16 ? `${name.slice(0, 15)}…` : name;
  return (
    <Text
      accessibilityRole="link"
      accessibilityLabel={`Source ${source.index}: ${source.title || source.domain}`}
      onPress={() => (onOpen ? onOpen(source) : void Linking.openURL(source.url))}
      style={styles.chip}
    >
      {` ${source.index} ${short} `}
    </Text>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    chip: {
      ...auriaTypography.body,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray600,
      backgroundColor: ds.sectionFill,
      borderRadius: 9,
      overflow: 'hidden',
    },
  });
}
