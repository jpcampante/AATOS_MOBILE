import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuriaDocumentArtifact as AuriaDocumentArtifactData } from '../../features/auria/types';
import { useTypewriter } from '../../features/auria/useTypewriter';
import { auriaTypography, liquidGlassBorder, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';
import { AuriaDocEditor } from './AuriaDocEditor';
import { AuriaTypingCursor } from './AuriaTypingCursor';
import { ShimmerText } from './ShimmerText';

type AuriaDocumentArtifactProps = {
  artifact: AuriaDocumentArtifactData;
};

export function AuriaDocumentArtifact({ artifact }: AuriaDocumentArtifactProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Typewriter: reveal the body progressively so you watch Auria "write" it.
  // A calm, deliberate pace — not a fast burst — that scales with the length.
  const body = artifact.body;
  const { shown: shownBody, done } = useTypewriter(body, {
    cps: 22,
    minMs: 3000,
    maxMs: 26000,
  });

  const copyDocument = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      void navigator.clipboard?.writeText(body);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.eyebrowRow}>
        <AuriaIcon name="document" size={15} color={ds.gray500} strokeWidth={2} />
        {done ? (
          <Text style={styles.eyebrow}>Document</Text>
        ) : (
          <ShimmerText text="Writing…" color={ds.gray500} style={styles.eyebrow} />
        )}
      </View>
      {done ? (
        <View style={styles.actions}>
          {copied ? <Text style={styles.copied}>Copied</Text> : null}
          <Pressable
            onPress={copyDocument}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Copy document"
          >
            <AuriaIcon name="copy" size={AURIA_ICON_SIZE.sm} strokeWidth={AURIA_ICON_STROKE_NAV} />
          </Pressable>
          <Pressable
            onPress={() => setExpanded(true)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Expand document"
          >
            <AuriaIcon name="expand" size={AURIA_ICON_SIZE.sm} strokeWidth={AURIA_ICON_STROKE_NAV} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <View style={styles.card}>
        {header}
        <Pressable
          onPress={() => setExpanded(true)}
          disabled={!done}
          accessibilityRole="button"
          accessibilityLabel="Open document"
        >
          <Text style={styles.title}>{artifact.title}</Text>
          <Text style={styles.body}>
            {shownBody}
            {!done ? <AuriaTypingCursor color={ds.auriaBlue} style={styles.cursor} /> : null}
          </Text>
          {done ? (
            <View style={styles.openRow}>
              <Text style={styles.openHint}>Tap to open</Text>
              <AuriaIcon name="chevronRight" size={14} color={ds.gray400} strokeWidth={2} />
            </View>
          ) : null}
        </Pressable>
      </View>

      <AuriaDocEditor
        visible={expanded}
        title={artifact.title}
        body={body}
        onClose={() => setExpanded(false)}
      />
    </>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  const rim = liquidGlassBorder(theme);
  return StyleSheet.create({
    card: {
      width: '100%',
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 16,
      backgroundColor: ds.gray100,
      ...rim,
      ...myceoCornerStyle('menu'),
    },
    header: {
      minHeight: 28,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    eyebrow: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12.5,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: 0.2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
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
      color: ds.gray500,
      fontSize: 11,
      marginRight: 2,
    },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 21,
      lineHeight: 27,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
      marginTop: 10,
      marginBottom: 12,
    },
    body: {
      ...auriaTypography.body,
      color: ds.gray800,
      fontSize: 15,
      lineHeight: 24,
    },
    cursor: {
      ...auriaTypography.body,
      color: ds.auriaBlue,
      fontSize: 15,
      lineHeight: 24,
      fontWeight: theme.typography.fontWeight.bold,
    },
    openRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: 14,
    },
    openHint: {
      ...auriaTypography.label,
      color: ds.gray400,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });
}
