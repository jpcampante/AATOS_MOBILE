import { lazy, Suspense, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppShell } from './components/navigation/AppShell';
import { ScreenTransition } from './components/ui/transitions';
import { ProductTabId } from './data/productNavigation';
import { useTheme } from './theme';

const AuriaScreen = lazy(() => import('./screens/AuriaScreen').then((m) => ({ default: m.AuriaScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));

type MainAppProps = {
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
  onBack?: () => void;
  canGoBack?: boolean;
};

export default function MainApp({ activeTab, onTabChange, onBack, canGoBack }: MainAppProps) {
  const [auriaSidebarOpen, setAuriaSidebarOpen] = useState(false);

  const openProfile = useCallback(() => onTabChange('profile'), [onTabChange]);

  const renderProductScreen = useCallback(
    (tab: ProductTabId) => (
      <Suspense fallback={<TabFallback />}>
        {tab === 'auria' ? (
          <AuriaScreen onSidebarOpenChange={setAuriaSidebarOpen} onOpenSettings={openProfile} />
        ) : (
          <ProfileScreen />
        )}
      </Suspense>
    ),
    [openProfile],
  );

  return (
    <ScreenTransition key="main">
      <AppShell
        activeTab={activeTab}
        onTabChange={onTabChange}
        renderScreen={renderProductScreen}
        auriaSidebarOpen={auriaSidebarOpen}
        onBack={onBack}
        canGoBack={canGoBack}
      />
    </ScreenTransition>
  );
}

function TabFallback() {
  const { ds } = useTheme();
  return (
    <View style={styles.tabFallback}>
      <ActivityIndicator size="small" color={ds.gray900} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
