import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuriaSource, AuriaSourceKind } from '../../features/auria/types';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, type AuriaIconName } from '../icons';

type AuriaSourceChipsProps = {
  sources: AuriaSource[];
  /** Redirect to the files area from the source detail. */
  onOpenFiles?: () => void;
};

const ICON_FOR: Record<AuriaSourceKind, AuriaIconName> = {
  pdf: 'document',
  doc: 'document',
  sheet: 'grid',
  image: 'photo',
  web: 'library',
};

const KIND_LABEL: Record<AuriaSourceKind, string> = {
  pdf: 'PDF',
  doc: 'Document',
  sheet: 'Spreadsheet',
  image: 'Image',
  web: 'Web',
};

/** Consulted documents as chips. Tapping one shows the source Auria read. */
export function AuriaSourceChips({ sources, onOpenFiles }: AuriaSourceChipsProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, safe.bottom), [ds, theme, safe.bottom]);
  const [active, setActive] = useState<AuriaSource | null>(null);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        Consulted {sources.length} {sources.length === 1 ? 'source' : 'sources'}
      </Text>
      <View style={styles.chips}>
        {sources.map((source) => (
          <Pressable
            key={source.id}
            onPress={() => setActive(source)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open source ${source.title}`}
          >
            <View style={styles.chipIcon}>
              <AuriaIcon name={ICON_FOR[source.kind]} size={13} color={ds.gray600} strokeWidth={1.8} />
            </View>
            <Text style={styles.chipText} numberOfLines={1}>
              {source.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={!!active}
        transparent
        animationType="slide"
        onRequestClose={() => setActive(null)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setActive(null)} accessibilityLabel="Close" />
          <View style={styles.sheet}>
            {active ? (
              <>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetIcon}>
                    <AuriaIcon name={ICON_FOR[active.kind]} size={18} color={ds.gray700} strokeWidth={1.8} />
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetTitle} numberOfLines={2}>
                      {active.title}
                    </Text>
                    <Text style={styles.sheetMeta}>
                      {KIND_LABEL[active.kind]}
                      {active.meta ? ` · ${active.meta}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setActive(null)}
                    style={({ pressed }) => [styles.closeButton, pressed && styles.chipPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <AuriaIcon name="close" size={18} color={ds.gray600} strokeWidth={2} />
                  </Pressable>
                </View>
                <Text style={styles.excerptLabel}>What Auria read</Text>
                <ScrollView style={styles.excerptScroll} contentContainerStyle={styles.excerptContent}>
                  <Text style={styles.excerpt}>
                    {active.excerpt ?? 'Auria referenced this document while answering. The full content will be available when document sync is connected.'}
                  </Text>
                </ScrollView>
                {onOpenFiles && active.kind !== 'web' ? (
                  <Pressable
                    onPress={() => {
                      setActive(null);
                      onOpenFiles();
                    }}
                    style={({ pressed }) => [styles.openFiles, pressed && styles.openFilesPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Open in files"
                  >
                    <AuriaIcon name="folder" size={16} color={ds.white} strokeWidth={1.9} />
                    <Text style={styles.openFilesText}>Open in files</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeBottom: number,
) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
    },
    label: {
      ...auriaTypography.label,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray500,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      maxWidth: '100%',
      paddingLeft: 6,
      paddingRight: 13,
      paddingVertical: 5,
      backgroundColor: ds.gray100,
      borderWidth: 1,
      borderColor: ds.gray200,
      borderRadius: 999,
    },
    chipPressed: {
      backgroundColor: ds.gray200,
    },
    chipIcon: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      ...myceoCornerStyle('iconSm'),
    },
    chipText: {
      ...auriaTypography.body,
      flexShrink: 1,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray800,
    },
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.32)' },
    sheet: {
      maxHeight: '72%',
      backgroundColor: ds.gray50,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 18,
      paddingBottom: Math.max(safeBottom, 12) + 6,
      gap: 12,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    sheetIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('icon'),
    },
    sheetHeaderText: { flex: 1, gap: 2 },
    sheetTitle: {
      ...auriaTypography.title,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray900,
    },
    sheetMeta: {
      ...auriaTypography.label,
      fontSize: 12,
      color: ds.gray500,
    },
    closeButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      ...myceoCornerStyle('icon'),
    },
    excerptLabel: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: ds.gray400,
    },
    excerptScroll: { maxHeight: 320 },
    excerptContent: { paddingBottom: 8 },
    excerpt: {
      ...auriaTypography.body,
      fontSize: 14.5,
      lineHeight: 23,
      color: ds.gray800,
    },
    openFiles: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      paddingVertical: 13,
      backgroundColor: ds.offBlack,
      ...myceoCornerStyle('panel'),
    },
    openFilesPressed: { opacity: 0.85 },
    openFilesText: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.white,
    },
  });
}
