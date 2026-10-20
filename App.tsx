import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenTransition } from './src/components/ui/transitions';
import { ProductTabId } from './src/data/productNavigation';
import { AuthProvider, useAuth } from './src/features/auth';
import { LoginScreen } from './src/screens/LoginScreen';
import { ThemeProvider } from './src/theme';
import { ensureWebBrandFont } from './src/theme/webFont';

// Load the DM Sans brand font on web so the app matches the AATOS web app.
ensureWebBrandFont();

const MainApp = lazy(() => import('./src/MainApp'));

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialPreference="light">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { status } = useAuth();
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

  // A new session always starts on Insights, with no back history.
  useEffect(() => {
    if (status === 'signedOut') {
      setActiveTab('insights');
      setTabHistory([]);
    }
  }, [status]);

  const goBack = useCallback(() => {
    const h = tabHistoryRef.current;
    if (h.length === 0) return;
    setActiveTab(h[h.length - 1]);
    setTabHistory(h.slice(0, -1));
  }, []);

  // Reading the stored session takes a few ms; stay on the login's blank white
  // canvas so a signed-in start never flashes the login sheet.
  if (status === 'loading') return <View style={styles.blank} />;

  return status === 'signedOut' ? (
    <ScreenTransition key="login">
      <LoginScreen />
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
  blank: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
