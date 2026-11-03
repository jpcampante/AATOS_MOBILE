import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DOCUMENT_KIND_LABEL, type AuriaDocument } from '../../features/auria/documents';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, type AuriaIconName } from '../icons';

const ICON_FOR: Record<AuriaDocument['format'], AuriaIconName> = {
  markdown: 'document',
  plain: 'document',
  html: 'document',
  'sheet-json': 'grid',
  'deck-json': 'frame',
};

type AuriaDocumentCardProps = {
  document: AuriaDocument;
  /** Opens the document in the reader (A040). */
  onOpen?: (document: AuriaDocument) => void;
};

/**
 * A document the Auria wrote in this chat (A039): what it is, its name, the
 * first lines and which version the server has. Tapping it opens the reader —
 * documents are read only on the phone (D-07).
 */
export function AuriaDocumentCard({ document, onOpen }: AuriaDocumentCardProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const kind = DOCUMENT_KIND_LABEL[document.format];

  return (
    <Pressable
      onPress={() => onOpen?.(document)}
      disabled={!onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${kind.toLowerCase()}: ${document.title}`}
      style={({ pressed }) => [styles.card, myceoCornerStyle('inset'), pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <AuriaIcon name={ICON_FOR[document.format]} size={15} color={ds.gray600} strokeWidth={1.8} />
        <Text style={styles.kind}>{kind}</Text>
        {document.version > 1 ? <Text style={styles.version}>v{document.version}</Text> : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {document.title}
      </Text>
      {document.preview ? (
        <Text style={styles.preview} numberOfLines={2}>
          {document.preview}
        </Text>
      ) : null}
    </Pressable>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      padding: 12,
      gap: 4,
      backgroundColor: ds.sectionFill,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    kind: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.gray600,
    },
    version: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      color: ds.gray500,
    },
    title: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    preview: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 18,
      color: ds.gray600,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
