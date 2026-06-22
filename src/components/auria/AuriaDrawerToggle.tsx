import { IconButton } from '../ui/IconButton';
import { AuriaIcon, AURIA_ICON_SIZE, AURIA_ICON_STROKE } from '../icons';
import { useTheme } from '../../theme';

type AuriaDrawerToggleProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function AuriaDrawerToggle({
  onPress,
  accessibilityLabel = 'Open menu',
}: AuriaDrawerToggleProps) {
  const { ds } = useTheme();

  return (
    <IconButton onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <AuriaIcon
        name="panelLeft"
        size={AURIA_ICON_SIZE.header}
        color={ds.gray700}
        strokeWidth={AURIA_ICON_STROKE}
      />
    </IconButton>
  );
}
