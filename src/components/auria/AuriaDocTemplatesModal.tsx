import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import { AURIA_DOC_TEMPLATES, type AuriaDocTemplate } from '../../data/auriaDocTemplates';
import { AURIA_SCRIM } from './auriaLayout';

type AuriaDocTemplatesModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Drops the chosen template's document into the chat. */
  onUse: (template: AuriaDocTemplate) => void;
};

/**
 * Document-templates picker (ported from the Auria web doc-welcome grid):
 * a grid of template cards → tap to preview the document → "Use template"
 * generates it in the chat.
 */
export function AuriaDocTemplatesModal({ visible, onClose, onUse }: AuriaDocTemplatesModalProps) {
  const { theme, ds } = useTheme();
  const safe = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ds, safe.bottom), [theme, ds, safe.bottom]);
  const [preview, setPreview] = useState<AuriaDocTemplate | null>(null);

  useEffect(() => {
    if (!visible) setPreview(null);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={preview ? () => setPreview(null) : onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          {preview ? (
            <>
              <View style={styles.previewHeader}>
                <View style={[styles.previewIcon, { backgroundColor: `${preview.accent}1F` }]}>
                  <AuriaIcon name={preview.icon} size={22} color={preview.accent} strokeWidth={1.85} />
                </View>
                <View style={styles.previewHeaderText}>
                  <Text style={styles.eyebrow}>Template preview</Text>
                  <Text style={styles.previewTitle} numberOfLines={1}>
                    {preview.label}
                  </Text>
                  <Text style={styles.previewDesc} numberOfLines={2}>
                    {preview.description}
                  </Text>
                </View>
              </View>

              <ScrollView
                style={{ maxHeight: Math.round(height * 0.46) }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.previewBodyWrap}
              >
                <Text style={styles.previewDocTitle}>{preview.title}</Text>
                <Text style={styles.previewBody}>{preview.body}</Text>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  onPress={() => setPreview(null)}
                  style={({ pressed }) => [styles.footerGhost, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to templates"
                >
                  <Text style={styles.footerGhostText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => onUse(preview)}
                  style={({ pressed }) => [
                    styles.footerUse,
                    { backgroundColor: preview.accent },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Use template"
                >
                  <Text style={styles.footerUseText}>Use template</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Document templates</Text>
              <Text style={styles.subtitle}>Start from a ready-made structure</Text>
              <ScrollView
                style={{ maxHeight: Math.round(height * 0.62) }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.grid}
              >
                {AURIA_DOC_TEMPLATES.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setPreview(t)}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.label} — ${t.description}`}
                  >
                    <View style={[styles.cardIcon, { backgroundColor: `${t.accent}1F` }]}>
                      <AuriaIcon name={t.icon} size={AURIA_ICON_SIZE.md} color={t.accent} strokeWidth={1.85} />
                    </View>
                    <Text style={styles.cardLabel} numberOfLines={1}>
                      {t.label}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {t.description}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  ds: ReturnType<typeof useTheme>['ds'],
  safeBottom: number,
) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: AURIA_SCRIM },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderCurve: 'continuous',
      paddingTop: 10,
      paddingHorizontal: 16,
      paddingBottom: Math.max(safeBottom, 12) + 6,
    },
    grabber: {
      alignSelf: 'center',
      width: 38,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.divider,
      marginBottom: 12,
    },
    title: {
      ...auriaTypography.title,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...auriaTypography.body,
      fontSize: 13,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      paddingTop: 2,
      paddingBottom: 14,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
      paddingBottom: 4,
    },
    card: {
      width: '48%',
      padding: 14,
      gap: 9,
      backgroundColor: theme.colors.input,
      ...myceoCornerStyle('inset'),
    },
    cardPressed: { backgroundColor: theme.colors.hover, transform: [{ scale: 0.985 }] },
    cardIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardLabel: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    cardDesc: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      lineHeight: 16,
      color: theme.colors.textTertiary,
    },
    // Preview
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingBottom: 12,
    },
    previewIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewHeaderText: { flex: 1, paddingTop: 1 },
    eyebrow: {
      ...auriaTypography.label,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: ds.gray400,
      marginBottom: 3,
    },
    previewTitle: {
      ...auriaTypography.title,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    previewDesc: {
      ...auriaTypography.label,
      fontSize: 12.5,
      letterSpacing: 0,
      lineHeight: 17,
      color: theme.colors.textTertiary,
      marginTop: 3,
    },
    previewBodyWrap: {
      paddingBottom: 8,
    },
    previewDocTitle: {
      ...auriaTypography.title,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      paddingBottom: 8,
    },
    previewBody: {
      ...auriaTypography.body,
      fontSize: 14,
      lineHeight: 21,
      color: ds.gray700,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      paddingTop: 12,
    },
    footerGhost: {
      height: 44,
      paddingHorizontal: 18,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerGhostText: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    footerUse: {
      height: 44,
      paddingHorizontal: 22,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerUseText: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    pressed: { opacity: 0.7 },
  });
}
