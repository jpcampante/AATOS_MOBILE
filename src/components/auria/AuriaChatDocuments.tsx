import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuriaDocument } from '../../features/auria/documents';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { AuriaDocumentCard } from './AuriaDocumentCard';

type AuriaChatDocumentsProps = {
  documents: AuriaDocument[];
  onOpen?: (document: AuriaDocument) => void;
};

/**
 * Everything the Auria wrote in this chat (E29), at the end of the
 * conversation and closed by default: the answers already show the documents
 * of their own turn, so this is for going back to an older one.
 */
export function AuriaChatDocuments({ documents, onOpen }: AuriaChatDocumentsProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [expanded, setExpanded] = useState(false);
  if (documents.length === 0) return null;
  const summary = `${documents.length} ${documents.length === 1 ? 'document' : 'documents'} in this chat`;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${summary}, ${expanded ? 'hide' : 'show'} the list`}
        hitSlop={6}
        style={styles.summaryRow}
      >
        <AuriaIcon name="document" size={14} color={ds.gray500} strokeWidth={1.8} />
        <Text style={styles.summary}>{summary}</Text>
        <View style={expanded ? styles.chevronUp : null}>
          <AuriaIcon name="chevronDown" size={12} color={ds.gray500} strokeWidth={1.8} />
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.list}>
          {documents.map((document) => (
            <AuriaDocumentCard key={document.id} document={document} onOpen={onOpen} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
      paddingTop: 4,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    summary: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray600,
    },
    chevronUp: {
      transform: [{ rotate: '180deg' }],
    },
    list: {
      gap: 8,
    },
  });
}
