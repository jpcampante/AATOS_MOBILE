import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type IconButtonProps = {
  onPress?: () => void;
  children: ReactNode;
  /** Touch-target diameter. Default 40 — the app-wide standard. */
  size?: number;
  /**
   * `ghost` — transparent until pressed; for top-bar / inline nav actions.
   * `filled` — subtle gray surface; for close / dismiss controls on a sheet.
   */
  variant?: 'ghost' | 'filled';
  accessibilityLabel?: string;
  hitSlop?: number;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * The single icon-only button used across the app. One shape (circle), one
 * touch target (40), one press feedback — so every header, toolbar and close
 * control speaks the same language. Pass an `AuriaIcon` as the child.
 */
export function IconButton({
  onPress,
  children,
  size = 40,
  variant = 'ghost',
  accessibilityLabel,
  hitSlop = 8,
  disabled,
  style,
}: IconButtonProps) {
  const { ds } = useTheme();
  const styles = useMemo(() => createStyles(ds), [ds]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'filled' && styles.filled,
        pressed &&
          !disabled &&
          (variant === 'filled' ? styles.filledPressed : styles.ghostPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

function createStyles(ds: ReturnType<typeof useTheme>['ds']) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    filled: {
      backgroundColor: ds.gray100,
    },
    ghostPressed: {
      backgroundColor: ds.gray100,
      transform: [{ scale: 0.94 }],
    },
    filledPressed: {
      backgroundColor: ds.gray200,
      transform: [{ scale: 0.94 }],
    },
    disabled: {
      opacity: 0.4,
    },
  });
}
