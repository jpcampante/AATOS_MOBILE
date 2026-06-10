import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';

export function TasksSection({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  children: ReactNode;
}) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {count != null ? (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    section: {
      gap: 12,
    },
    headerRow: {
      gap: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    title: {
      ...auriaTypography.title,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#0F1216',
      letterSpacing: -0.4,
    },
    countPill: {
      minWidth: 24,
      paddingHorizontal: 8,
      paddingVertical: 3,
      ...myceoCornerStyle('chip'),
      backgroundColor: '#0F1216',
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    subtitle: {
      ...auriaTypography.body,
      fontSize: 13,
      color: 'rgba(15,18,22,0.55)',
      lineHeight: 18,
    },
    list: {
      gap: 12,
    },
  });
}
