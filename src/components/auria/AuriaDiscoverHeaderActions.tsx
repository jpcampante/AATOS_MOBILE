import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE_NAV } from '../icons';
import { AuriaGlassButton } from './AuriaGlassButton';

type AuriaDiscoverHeaderActionsProps = {
  onSearch: () => void;
  onCustomize: () => void;
  searchActive?: boolean;
};

/** Discover's top-bar controls — search and feed filter (sliders), matching the
 *  Perplexity Discover header. */
export function AuriaDiscoverHeaderActions({
  onSearch,
  onCustomize,
  searchActive = false,
}: AuriaDiscoverHeaderActionsProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <AuriaGlassButton
        onPress={onSearch}
        accessibilityLabel="Search Discover"
        hitSlop={8}
        elevated={false}
        borderRadius={theme.radius.md}
        surfaceStyle={styles.slot}
      >
        <AuriaIcon
          name="search"
          size={AURIA_ICON_SIZE.sm}
          color={searchActive ? ds.auriaBlue : ds.gray700}
          strokeWidth={AURIA_ICON_STROKE_NAV}
        />
      </AuriaGlassButton>
      <AuriaGlassButton
        onPress={onCustomize}
        accessibilityLabel="Customize feed"
        hitSlop={8}
        elevated={false}
        borderRadius={theme.radius.md}
        surfaceStyle={styles.slot}
      >
        <AuriaIcon
          name="sliders"
          size={AURIA_ICON_SIZE.sm}
          color={ds.gray700}
          strokeWidth={AURIA_ICON_STROKE_NAV}
        />
      </AuriaGlassButton>
    </>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    slot: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
    },
  });
}
