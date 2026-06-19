import { useMemo } from 'react';
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
import { AuriaIcon } from '../icons';
import {
  MODELS_BY_PROVIDER,
  PROVIDER_LABEL,
  PROVIDER_ORDER,
  type AIModel,
} from '../../data/auriaModels';

type AuriaModelSheetProps = {
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function AuriaModelSheet({ visible, selectedId, onSelect, onClose }: AuriaModelSheetProps) {
  const { theme, ds } = useTheme();
  const safe = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, safe.bottom), [theme, safe.bottom]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Select model</Text>

          <ScrollView
            style={{ maxHeight: Math.round(height * 0.62) }}
            showsVerticalScrollIndicator={false}
          >
            {PROVIDER_ORDER.map((provider) => {
              const models = MODELS_BY_PROVIDER[provider];
              return (
                <View key={provider} style={styles.section}>
                  <Text style={styles.sectionLabel}>{PROVIDER_LABEL[provider]}</Text>
                  <View style={styles.card}>
                    {models.map((m: AIModel, i) => {
                      const active = m.id === selectedId;
                      const disabled = !m.available;
                      return (
                        <Pressable
                          key={m.id}
                          disabled={disabled}
                          onPress={() => {
                            onSelect(m.id);
                            onClose();
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active, disabled }}
                          accessibilityLabel={m.name}
                          style={({ pressed }) => [
                            styles.row,
                            i > 0 && styles.rowDivider,
                            pressed && !disabled && styles.rowPressed,
                          ]}
                        >
                          <View style={styles.rowText}>
                            <Text
                              style={[styles.rowTitle, disabled && styles.rowMuted]}
                              numberOfLines={1}
                            >
                              {m.name}
                            </Text>
                            <Text
                              style={[styles.rowSubtitle, disabled && styles.rowMuted]}
                              numberOfLines={1}
                            >
                              {m.description}
                            </Text>
                          </View>
                          {disabled ? (
                            <View style={styles.unavailableTag}>
                              <Text style={styles.unavailableText}>Currently unavailable</Text>
                            </View>
                          ) : active ? (
                            <AuriaIcon name="checkCircle" size={18} color={ds.auriaBlue} strokeWidth={1.9} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Footer — mirrors Claude's Effort / More models rows */}
            <View style={[styles.section, styles.footerSection]}>
              <View style={styles.card}>
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Effort"
                >
                  <Text style={styles.footerLabel}>Effort</Text>
                  <View style={styles.flexSpacer} />
                  <Text style={styles.footerValue}>Max</Text>
                  <AuriaIcon name="chevronRight" size={16} color={theme.colors.textTertiary} strokeWidth={2} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="More models"
                >
                  <Text style={styles.footerLabel}>More models</Text>
                  <View style={styles.flexSpacer} />
                  <AuriaIcon name="chevronRight" size={16} color={theme.colors.textTertiary} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], safeBottom: number) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.34)' },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderCurve: 'continuous',
      paddingTop: 10,
      paddingHorizontal: 14,
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
    sheetTitle: {
      ...auriaTypography.title,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      paddingBottom: 10,
    },
    section: { marginTop: 6 },
    footerSection: { marginTop: 12 },
    sectionLabel: {
      ...auriaTypography.label,
      fontSize: 11.5,
      textTransform: 'uppercase',
      color: theme.colors.textTertiary,
      paddingHorizontal: 6,
      paddingBottom: 6,
    },
    card: {
      backgroundColor: theme.colors.input,
      overflow: 'hidden',
      ...myceoCornerStyle('inset'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.divider,
    },
    rowPressed: { backgroundColor: theme.colors.hover },
    rowText: { flex: 1, gap: 2 },
    rowTitle: {
      ...auriaTypography.body,
      fontSize: 15.5,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    rowSubtitle: {
      ...auriaTypography.label,
      fontSize: 12.5,
      letterSpacing: 0,
      color: theme.colors.textTertiary,
    },
    rowMuted: { color: theme.colors.textHint },
    unavailableTag: {
      borderRadius: 9,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: theme.colors.surface,
    },
    unavailableText: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      color: theme.colors.textTertiary,
    },
    flexSpacer: { flex: 1 },
    footerLabel: { ...auriaTypography.body, fontSize: 15, color: theme.colors.text },
    footerValue: {
      ...auriaTypography.body,
      fontSize: 15,
      color: theme.colors.textTertiary,
      marginRight: 6,
    },
  });
}
