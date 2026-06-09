import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PRODUCT_TABS, ProductTabId } from '../../data/productNavigation';
import { auriaTypography, useTheme } from '../../theme';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';

type AuriaModuleBarProps = {
  activeModule?: ProductTabId;
  onNavigate?: (tab: ProductTabId) => void;
};

/**
 * Horizontal module switcher pinned to the top of the Auria screen.
 * Each tab is a real Liquid Glass pill; the active one fills with the
 * Auria accent. Lives outside the sidebar so navigation is always visible.
 */
export function AuriaModuleBar({ activeModule, onNavigate }: AuriaModuleBarProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  if (!onNavigate) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.bar}
    >
      {PRODUCT_TABS.map((tab) => {
        const active = tab.id === activeModule;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onNavigate(tab.id)}
            style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <LiquidGlassSurface
              borderRadius={theme.radius.pill}
              elevationLevel="card"
              interactive
              style={[styles.chip, active && { backgroundColor: ds.auriaBlue }]}
            >
              <Text
                style={[styles.chipText, active && styles.chipTextActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </LiquidGlassSurface>
          </Pressable>
        );
      })}
      <View style={styles.tailSpacer} />
    </ScrollView>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    bar: {
      flexGrow: 0,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
    },
    pressable: {
      borderRadius: theme.radius.pill,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: theme.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      ...auriaTypography.label,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray700,
      letterSpacing: -0.1,
    },
    chipTextActive: {
      color: ds.white,
    },
    tailSpacer: {
      width: theme.spacing.sm,
    },
  });
}
