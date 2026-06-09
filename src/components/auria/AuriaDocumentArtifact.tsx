import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuriaDocumentArtifact as AuriaDocumentArtifactData } from '../../features/auria/types';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';

type AuriaDocumentArtifactProps = {
  artifact: AuriaDocumentArtifactData;
};

export function AuriaDocumentArtifact({ artifact }: AuriaDocumentArtifactProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyDocument = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      void navigator.clipboard?.writeText(artifact.body);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const documentBody = (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Writing</Text>
        <View style={styles.actions}>
          <Pressable
            onPress={copyDocument}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Copy document"
          >
            <AuriaIcon name="copy" size={AURIA_ICON_SIZE.sm} strokeWidth={AURIA_ICON_STROKE_NAV} />
          </Pressable>
          <Pressable
            onPress={() => setExpanded((value) => !value)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Close expanded document' : 'Expand document'}
          >
            <AuriaIcon name="expand" size={AURIA_ICON_SIZE.sm} strokeWidth={AURIA_ICON_STROKE_NAV} />
          </Pressable>
        </View>
      </View>
      {copied ? <Text style={styles.copied}>Copied</Text> : null}
      <Text style={styles.title}>{artifact.title}</Text>
      <Text style={styles.body}>{artifact.body}</Text>
    </>
  );

  return (
    <>
      <View style={styles.card}>{documentBody}</View>
      <Modal
        visible={expanded}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalContent}>{documentBody}</ScrollView>
        </View>
      </Modal>
    </>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      width: '100%',
      maxHeight: 440,
      overflow: 'hidden',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('menu'),
    },
    header: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    eyebrow: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
    actions: {
      flexDirection: 'row',
      gap: 4,
    },
    iconButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      ...myceoCornerStyle('icon'),
    },
    iconButtonPressed: {
      backgroundColor: ds.gray200,
    },
    copied: {
      ...auriaTypography.label,
      alignSelf: 'flex-end',
      color: ds.gray500,
      fontSize: 11,
    },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: theme.typography.fontWeight.bold,
      marginTop: 6,
      marginBottom: 14,
    },
    body: {
      ...auriaTypography.body,
      color: ds.gray800,
      fontSize: 15,
      lineHeight: 24,
    },
    modal: {
      flex: 1,
      backgroundColor: ds.gray50,
    },
    modalContent: {
      padding: 20,
      paddingTop: 28,
      paddingBottom: 56,
    },
  });
}
