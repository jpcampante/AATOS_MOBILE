import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenTransition } from './src/components/ui/transitions';
import { ProductTabId } from './src/data/productNavigation';
import { LoginScreen } from './src/screens/LoginScreen';
import { ThemeProvider } from './src/theme';
import { ensureWebBrandFont } from './src/theme/webFont';

// Load the DM Sans brand font on web so the app matches the AATOS web app.
ensureWebBrandFont();

const MainApp = lazy(() => import('./src/MainApp'));

type AppPhase = 'login' | 'main';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('login');
  const [activeTab, setActiveTab] = useState<ProductTabId>('insights');
  const [tabHistory, setTabHistory] = useState<ProductTabId[]>([]);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const tabHistoryRef = useRef(tabHistory);
  tabHistoryRef.current = tabHistory;

  // Remember where the user came from so an edge swipe-back can return there.
  const navigateTab = useCallback((tab: ProductTabId) => {
    if (tab !== activeTabRef.current) {
      setTabHistory((h) => [...h, activeTabRef.current]);
    }
    setActiveTab(tab);
  }, []);

  const goBack = useCallback(() => {
    const h = tabHistoryRef.current;
    if (h.length === 0) return;
    setActiveTab(h[h.length - 1]);
    setTabHistory(h.slice(0, -1));
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider initialPreference="light">
        {phase === 'login' ? (
          <ScreenTransition key="login">
            <LoginScreen onContinue={() => setPhase('main')} />
          </ScreenTransition>
        ) : (
          <Suspense fallback={<BootFallback />}>
            <MainApp
              activeTab={activeTab}
              onTabChange={navigateTab}
              onBack={goBack}
              canGoBack={tabHistory.length > 0}
            />
          </Suspense>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function BootFallback() {
  return (
    <View style={styles.boot}>
      <ActivityIndicator size="large" color="#252B2F" />
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
