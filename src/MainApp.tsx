import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppShell } from './components/navigation/AppShell';
import { ScreenTransition } from './components/ui/transitions';
import { ProductTabId } from './data/productNavigation';
import { PlaceholderModuleScreen } from './screens/PlaceholderModuleScreen';

const HomeScreen = lazy(() => import('./screens/HomeScreen').then((m) => ({ default: m.HomeScreen })));
const AuriaScreen = lazy(() => import('./screens/AuriaScreen').then((m) => ({ default: m.AuriaScreen })));

type MainAppProps = {
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
};

export default function MainApp({ activeTab, onTabChange }: MainAppProps) {
  const renderProductScreen = (tab: ProductTabId) => (
    <Suspense fallback={<TabFallback />}>{renderTab(tab)}</Suspense>
  );

  return (
    <ScreenTransition key="main">
      <AppShell
        activeTab={activeTab}
        onTabChange={onTabChange}
        renderScreen={renderProductScreen}
      />
    </ScreenTransition>
  );
}

function renderTab(tab: ProductTabId) {
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
      return (
        <PlaceholderModuleScreen title="Integrations" subtitle="Mail, calendar, and connectors" />
      );
    default:
      return null;
  }
}

function TabFallback() {
  return (
    <View style={styles.tabFallback}>
      <ActivityIndicator size="small" color="#252B2F" />
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
