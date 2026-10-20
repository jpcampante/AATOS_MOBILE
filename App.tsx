import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
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
  const [activeTab, setActiveTab] = useState<ProductTabId>('auria');
  const canGoBack = activeTab !== 'auria';

  // A new session always starts on Auria.
  useEffect(() => {
    if (status === 'signedOut') setActiveTab('auria');
  }, [status]);

  // Auria is home: the edge swipe-back and the Android back button return there.
  const goBack = useCallback(() => setActiveTab('auria'), []);

  useEffect(() => {
    if (status !== 'signedIn' || !canGoBack) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [status, canGoBack, goBack]);

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
        onTabChange={setActiveTab}
        onBack={goBack}
        canGoBack={canGoBack}
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
