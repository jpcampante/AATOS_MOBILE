import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductTabId } from '../../data/productNavigation';
import { useTheme } from '../../theme';
import { PRODUCT_NAV_FLOATING_HEIGHT, ProductNavBar } from './ProductNavBar';
import { ProductTabTransition } from './ProductTabTransition';

type AppShellProps = {
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
  renderScreen: (tab: ProductTabId) => ReactNode;
};

/** Visual gap between screen content and the floating product nav rail. */
export const APP_SHELL_NAV_GAP = 12;
/** Sole shell-level bottom reservation — measured nav float + gap. */
export const APP_SHELL_BOTTOM_INSET = PRODUCT_NAV_FLOATING_HEIGHT + APP_SHELL_NAV_GAP;

export function AppShell({ activeTab, onTabChange, renderScreen }: AppShellProps) {
  const { theme, ds } = useTheme();
  const safeArea = useSafeAreaInsets();
  const shellBackground = activeTab === 'auria' ? ds.gray50 : theme.colors.page;
  const bottomReservation = APP_SHELL_BOTTOM_INSET + safeArea.bottom;

  return (
    <View style={[styles.root, { backgroundColor: shellBackground }]}>
      <SafeAreaView style={styles.main} edges={['top']}>
        <StatusBar style={theme.colors.statusBar} />
        <View style={[styles.content, { paddingBottom: bottomReservation }]}>
          <ProductTabTransition activeTab={activeTab} renderScreen={renderScreen} />
        </View>
      </SafeAreaView>

      <View style={styles.navOverlay}>
        <SafeAreaView edges={['bottom']} style={styles.navSafe}>
          <ProductNavBar activeTab={activeTab} onTabChange={onTabChange} />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  main: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  navOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  navSafe: {
    backgroundColor: 'transparent',
  },
});
