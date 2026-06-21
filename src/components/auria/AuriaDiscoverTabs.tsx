import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { DISCOVER_CATEGORIES } from '../../features/auria/newsTypes';
import type { DiscoverCategory } from '../../features/auria/newsTypes';
import { auriaTypography, useTheme } from '../../theme';

type AuriaDiscoverTabsProps = {
  value: DiscoverCategory;
  onChange: (value: DiscoverCategory) => void;
};

/** Horizontally scrollable text tabs across the top of Discover. The active tab
 *  is tinted with the brand accent, matching Perplexity's Discover header. */
export function AuriaDiscoverTabs({ value, onChange }: AuriaDiscoverTabsProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {DISCOVER_CATEGORIES.map((cat) => {
        const active = cat.id === value;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.tab}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 22,
      paddingRight: 24,
      paddingVertical: 2,
    },
    tab: {
      paddingVertical: 4,
    },
    tabText: {
      ...auriaTypography.title,
      color: ds.gray500,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.3,
    },
    tabTextActive: {
      color: ds.auriaBlue,
    },
  });
}
