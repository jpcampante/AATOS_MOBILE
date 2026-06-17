import { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';

type SnackbarProps = {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Position override (e.g. a different bottom offset per screen). */
  style?: StyleProp<ViewStyle>;
};

/** Dark toast pill with an optional action, anchored bottom-left. */
export function Snackbar({ text, actionLabel, onAction, style }: SnackbarProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <View style={styles.bar}>
        <Text style={styles.text} numberOfLines={1}>
          {text}
        </Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={actionLabel}>
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 80,
      alignItems: 'flex-start',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      maxWidth: '100%',
      paddingHorizontal: 16,
      paddingVertical: 13,
      backgroundColor: ds.gray900,
      borderRadius: 10,
      ...theme.shadow.card,
    },
    text: {
      ...auriaTypography.body,
      flexShrink: 1,
      color: ds.white,
      fontSize: 13.5,
    },
    action: {
      ...auriaTypography.body,
      color: '#9CC4FF',
      fontSize: 13.5,
      fontWeight: theme.typography.fontWeight.bold,
    },
  });
}
