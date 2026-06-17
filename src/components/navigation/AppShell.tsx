import { ReactNode, useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductTabId } from '../../data/productNavigation';
import { SUPPORTS_NATIVE_DRIVER, motionDuration, motionEasing, useTheme } from '../../theme';
import { PRODUCT_NAV_FLOATING_HEIGHT, ProductNavBar } from './ProductNavBar';
import { ProductTabTransition } from './ProductTabTransition';
import { getSidebarWidth } from '../auria/auriaLayout';

type AppShellProps = {
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
  renderScreen: (tab: ProductTabId) => ReactNode;
  auriaSidebarOpen?: boolean;
  /** Pop the navigation history (used by the edge swipe-back). */
  onBack?: () => void;
  /** Whether there is history to swipe back to. */
  canGoBack?: boolean;
};

/** Visual gap between screen content and the floating product nav rail. */
export const APP_SHELL_NAV_GAP = 12;
/** Sole shell-level bottom reservation — measured nav float + gap. */
export const APP_SHELL_BOTTOM_INSET = PRODUCT_NAV_FLOATING_HEIGHT + APP_SHELL_NAV_GAP;

export function AppShell({
  activeTab,
  onTabChange,
  renderScreen,
  auriaSidebarOpen = false,
  onBack,
  canGoBack = false,
}: AppShellProps) {
  const { theme, ds } = useTheme();
  const { width } = useWindowDimensions();
  const safeArea = useSafeAreaInsets();
  const navShift = useRef(new Animated.Value(0)).current;

  // Edge swipe-back: from the left edge, drag right to return to the previous
  // screen. Non-capturing on purpose — screens that own the left edge (the mail
  // drawer, the Auria sidebar) declare their gesture deeper in the tree, so
  // their responder wins first and this one quietly yields there.
  const canGoBackRef = useRef(canGoBack);
  canGoBackRef.current = canGoBack;
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const backSwipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        !!canGoBackRef.current &&
        g.x0 < 24 &&
        g.dx > 14 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
      onPanResponderRelease: (_evt, g) => {
        if (g.dx > 64 || g.vx > 0.3) onBackRef.current?.();
      },
    }),
  ).current;
  const sidebarWidth = getSidebarWidth(width);
  const shellBackground =
    activeTab === 'auria' || activeTab === 'settings' ? ds.gray50 : theme.colors.page;
  const bottomReservation = APP_SHELL_BOTTOM_INSET + safeArea.bottom;

  useEffect(() => {
    Animated.timing(navShift, {
      toValue: activeTab === 'auria' && auriaSidebarOpen ? sidebarWidth : 0,
      duration: motionDuration.base,
      easing: auriaSidebarOpen ? motionEasing.standard : motionEasing.accelerate,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    }).start();
  }, [activeTab, auriaSidebarOpen, navShift, sidebarWidth]);

  return (
    <View style={[styles.root, { backgroundColor: shellBackground }]}>
      <SafeAreaView style={styles.main} edges={['top']}>
        <StatusBar style={theme.colors.statusBar} />
        <View
          style={[styles.content, { paddingBottom: bottomReservation }]}
          {...backSwipe.panHandlers}
        >
          <ProductTabTransition activeTab={activeTab} renderScreen={renderScreen} />
        </View>
      </SafeAreaView>

      {activeTab === 'auria' && auriaSidebarOpen ? (
        <View
          style={[
            styles.sidebarFooterFill,
            { width: sidebarWidth, height: bottomReservation, backgroundColor: ds.white },
          ]}
        />
      ) : null}

      <Animated.View style={[styles.navOverlay, { transform: [{ translateX: navShift }] }]}>
        <SafeAreaView edges={['bottom']} style={styles.navSafe}>
          <ProductNavBar activeTab={activeTab} onTabChange={onTabChange} />
        </SafeAreaView>
      </Animated.View>
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
  sidebarFooterFill: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  navSafe: {
    backgroundColor: 'transparent',
  },
});
