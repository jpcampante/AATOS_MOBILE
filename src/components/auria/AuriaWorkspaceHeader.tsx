import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE } from '../icons';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaDrawerToggle } from './AuriaDrawerToggle';
import { IconButton } from '../ui/IconButton';

/** Fixed workspace bar — keep in sync with AuriaScreen top inset. */
export const WORKSPACE_HEADER_HEIGHT = 54;

type AuriaWorkspaceHeaderProps = {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  /** When set, the bar shows a centered title (e.g. on the Projects panel). */
  title?: string;
  /** When set, the right slot is a "+" action (e.g. New project) instead of
   *  the new-chat pencil. */
  onPlus?: () => void;
  plusLabel?: string;
  /** Custom right-hand controls (e.g. Discover's search + filter). Overrides
   *  the default new-chat / plus button when provided. */
  rightSlot?: ReactNode;
};

export function AuriaWorkspaceHeader({
  onToggleSidebar,
  onNewChat,
  title,
  onPlus,
  plusLabel = 'New',
  rightSlot,
}: AuriaWorkspaceHeaderProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <View style={styles.header}>
      <View style={styles.sideRail}>
        <AuriaDrawerToggle onPress={onToggleSidebar} accessibilityLabel="Open history and sidebar" />
      </View>

      {title ? (
        <View style={styles.titleWrap} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}

      {rightSlot ? (
        <View style={styles.rightCluster}>{rightSlot}</View>
      ) : (
        <View style={styles.sideRail}>
          <IconButton
            onPress={onPlus ?? onNewChat}
            accessibilityLabel={onPlus ? plusLabel : 'New chat'}
          >
            <AuriaIcon
              name={onPlus ? 'plus' : 'squarePen'}
              size={AURIA_ICON_SIZE.header}
              color={ds.gray700}
              strokeWidth={AURIA_ICON_STROKE}
            />
          </IconButton>
        </View>
      )}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: WORKSPACE_HEADER_HEIGHT,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: 'transparent',
    },
    sideRail: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    titleWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...auriaTypography.title,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
  });
}
