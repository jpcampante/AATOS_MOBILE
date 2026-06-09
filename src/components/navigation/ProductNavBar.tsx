import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProductTabId } from '../../data/productNavigation';
import { useTheme } from '../../theme';
import {
  AuriaIcon,
  AuriaIconName,
  AURIA_ICON_SIZE,
  AURIA_ICON_STROKE_NAV,
  AURIA_ICON_STROKE_STRONG,
} from '../icons';

type ProductNavBarProps = {
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
};

type FooterItem = {
  id: ProductTabId;
  label: string;
  icon: AuriaIconName;
};

const FOOTER_ITEMS: FooterItem[] = [
  { id: 'insights', label: 'Insights', icon: 'grid' },
  { id: 'auria', label: 'Auria', icon: 'messageSquare' },
  { id: 'tasks', label: 'Tasks', icon: 'document' },
  { id: 'specialists', label: 'Specialists', icon: 'users' },
  { id: 'integrations', label: 'Integrations', icon: 'library' },
];

export const PRODUCT_NAV_BAR_HEIGHT = 58;
export const PRODUCT_NAV_FLOATING_HEIGHT = PRODUCT_NAV_BAR_HEIGHT;

export function ProductNavBar({ activeTab, onTabChange }: ProductNavBarProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.bar}>
      {FOOTER_ITEMS.map((item) => {
        const active = item.id === activeTab;
        return (
          <Pressable
            key={item.id}
            onPress={() => onTabChange(item.id)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
          >
            <View style={styles.iconSlot}>
              <AuriaIcon
                name={item.icon}
                size={active ? AURIA_ICON_SIZE.md : AURIA_ICON_SIZE.sm}
                color={active ? ds.gray900 : ds.gray500}
                strokeWidth={active ? AURIA_ICON_STROKE_STRONG : AURIA_ICON_STROKE_NAV}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    bar: {
      height: PRODUCT_NAV_BAR_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.page,
    },
    item: {
      flex: 1,
      height: PRODUCT_NAV_BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemPressed: {
      opacity: 0.55,
      transform: [{ scale: 0.94 }],
    },
    iconSlot: {
      width: 46,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
    },
  });
}
