import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppShell } from './src/components/navigation/AppShell';
import { ScreenTransition } from './src/components/ui/transitions';
import { ProductTabId } from './src/data/productNavigation';
import { AuriaScreen } from './src/screens/AuriaScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { PlaceholderModuleScreen } from './src/screens/PlaceholderModuleScreen';
import { ThemeProvider } from './src/theme';

type AppPhase = 'login' | 'main';

function renderProductScreen(tab: ProductTabId) {
  switch (tab) {
    case 'insights':
      return <HomeScreen />;
    case 'auria':
      return <AuriaScreen />;
    case 'tasks':
      return <PlaceholderModuleScreen title="Tasks" subtitle="Kanban, roadmap, and workload" />;
    case 'specialists':
      return <PlaceholderModuleScreen title="Specialists" subtitle="Chat with professionals" />;
    case 'integrations':
      return <PlaceholderModuleScreen title="Integrations" subtitle="Mail, calendar, and connectors" />;
    default:
      return null;
  }
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('login');
  const [activeTab, setActiveTab] = useState<ProductTabId>('insights');

  return (
    <SafeAreaProvider>
      <ThemeProvider initialPreference="light">
        {phase === 'login' ? (
          <ScreenTransition key="login">
            <LoginScreen onContinue={() => setPhase('main')} />
          </ScreenTransition>
        ) : (
          <ScreenTransition key="main">
            <AppShell
              activeTab={activeTab}
              onTabChange={setActiveTab}
              renderScreen={renderProductScreen}
            />
          </ScreenTransition>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
