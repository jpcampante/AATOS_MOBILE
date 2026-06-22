import { useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE } from '../icons';
import { IconButton } from '../ui/IconButton';

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
  const { ds } = useTheme();
  return (
    <>
      <IconButton onPress={onSearch} accessibilityLabel="Search Discover">
        <AuriaIcon
          name="search"
          size={AURIA_ICON_SIZE.header}
          color={searchActive ? ds.auriaBlue : ds.gray700}
          strokeWidth={AURIA_ICON_STROKE}
        />
      </IconButton>
      <IconButton onPress={onCustomize} accessibilityLabel="Customize feed">
        <AuriaIcon
          name="sliders"
          size={AURIA_ICON_SIZE.header}
          color={ds.gray700}
          strokeWidth={AURIA_ICON_STROKE}
        />
      </IconButton>
    </>
  );
}
