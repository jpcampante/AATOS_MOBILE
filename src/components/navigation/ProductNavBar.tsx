import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { ProductTabId } from '../../data/productNavigation';
import { tapSelection } from '../../utils/haptics';
import { SUPPORTS_NATIVE_DRIVER, motionSpring, useTheme } from '../../theme';
import {
  AuriaIcon,
  AuriaIconName,
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
  { id: 'integrations', label: 'Integrations', icon: 'mail' },
  { id: 'settings', label: 'Settings', icon: 'userCircle' },
];

export const PRODUCT_NAV_BAR_HEIGHT = 68;
export const PRODUCT_NAV_FLOATING_HEIGHT = PRODUCT_NAV_BAR_HEIGHT;

/** Single touch-friendly icon size; active emphasis comes from scale + pill. */
const NAV_ICON_SIZE = 26;

export function ProductNavBar({ activeTab, onTabChange }: ProductNavBarProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, ds), [theme, ds]);

  return (
    <View style={styles.bar}>
      {FOOTER_ITEMS.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          active={item.id === activeTab}
          onPress={() => {
            if (item.id !== activeTab) tapSelection();
            onTabChange(item.id);
          }}
          ds={ds}
          styles={styles}
        />
      ))}
    </View>
  );
}

type NavItemProps = {
  item: FooterItem;
  active: boolean;
  onPress: () => void;
  ds: ReturnType<typeof useTheme>['ds'];
  styles: ReturnType<typeof createStyles>;
};

function NavItem({ item, active, onPress, ds, styles }: NavItemProps) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      ...motionSpring.pop,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    }).start();
  }, [active, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
    >
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.activePill, { opacity: progress }]} />
        <Animated.View style={{ transform: [{ scale }] }}>
          <AuriaIcon
            name={item.icon}
            size={NAV_ICON_SIZE}
            color={active ? ds.gray900 : ds.gray500}
            strokeWidth={active ? AURIA_ICON_STROKE_STRONG : AURIA_ICON_STROKE_NAV}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  ds: ReturnType<typeof useTheme>['ds'],
) {
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
    },
    iconSlot: {
      width: 56,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    activePill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 20,
      backgroundColor: ds.gray100,
    },
  });
}
