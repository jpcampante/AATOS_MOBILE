import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SheetTab } from '../../features/auria/documentContent';
import { auriaTypography, useTheme } from '../../theme';

/**
 * A spreadsheet the Auria wrote, read only (A040): one tab at a time, the
 * header row kept apart and the grid scrolling sideways. Hidden tabs are shown
 * as hidden, because other formulas may depend on them.
 */
export function AuriaSheetTable({ tabs }: { tabs: SheetTab[] }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  if (!tab) return null;

  return (
    <View style={styles.wrap}>
      {tabs.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((item, index) => (
            <Pressable
              key={`${item.name}-${index}`}
              onPress={() => setActive(index)}
              accessibilityRole="button"
              accessibilityState={{ selected: index === active }}
              accessibilityLabel={`Tab ${item.name}${item.hidden ? ', hidden' : ''}`}
              style={[styles.tab, index === active && styles.tabActive]}
            >
              <Text style={[styles.tabText, index === active && styles.tabTextActive]} numberOfLines={1}>
                {item.name}
                {item.hidden ? ' · hidden' : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {tab.columns.length > 0 ? (
            <View style={[styles.row, styles.headerRow]}>
              {tab.columns.map((column, index) => (
                <Text key={index} style={[styles.cell, styles.headerCell]} numberOfLines={2}>
                  {column}
                </Text>
              ))}
            </View>
          ) : null}
          {tab.rows.map((cells, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {(tab.columns.length > 0 ? tab.columns : cells).map((_, columnIndex) => (
                <Text key={columnIndex} style={styles.cell} numberOfLines={3}>
                  {cells[columnIndex] ?? ''}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.count}>
        {tab.rows.length} {tab.rows.length === 1 ? 'row' : 'rows'}
      </Text>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: { gap: 10 },
    tabs: { gap: 6 },
    tab: {
      height: 30,
      paddingHorizontal: 12,
      borderRadius: 15,
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
      maxWidth: 180,
    },
    tabActive: { backgroundColor: ds.offBlack },
    tabText: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.gray900,
    },
    tabTextActive: { color: ds.white },
    row: { flexDirection: 'row' },
    headerRow: { backgroundColor: ds.sectionFill },
    cell: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 18,
      color: ds.gray900,
      width: 140,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ds.gray200,
    },
    headerCell: { fontWeight: theme.typography.fontWeight.semibold },
    count: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      color: ds.gray500,
    },
  });
}
