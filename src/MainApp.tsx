import { lazy, Suspense, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppShell } from './components/navigation/AppShell';
import { AuriaSettingsModal } from './components/auria/AuriaSettingsModal';
import { ScreenTransition } from './components/ui/transitions';
import { ProductTabId } from './data/productNavigation';

const HomeScreen = lazy(() => import('./screens/HomeScreen').then((m) => ({ default: m.HomeScreen })));
const AuriaScreen = lazy(() => import('./screens/AuriaScreen').then((m) => ({ default: m.AuriaScreen })));
const TasksScreen = lazy(() => import('./screens/TasksScreen').then((m) => ({ default: m.TasksScreen })));
const IntegrationsScreen = lazy(() =>
  import('./screens/IntegrationsScreen').then((m) => ({ default: m.IntegrationsScreen })),
);

type MainAppProps = {
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
};

export default function MainApp({ activeTab, onTabChange }: MainAppProps) {
  const [auriaSidebarOpen, setAuriaSidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const handleAuriaSidebarOpenChange = useCallback((open: boolean) => {
    setAuriaSidebarOpen(open);
  }, []);

  const openSettingsModal = useCallback(() => {
    setSettingsModalOpen(true);
  }, []);

  const handleTabChange = useCallback(
    (tab: ProductTabId) => {
      if (tab === 'settings') {
        setSettingsModalOpen(true);
        return;
      }
      onTabChange(tab);
    },
    [onTabChange],
  );

  const renderProductScreen = useCallback(
    (tab: ProductTabId) => (
      <Suspense fallback={<TabFallback />}>
        {renderTab(tab, handleAuriaSidebarOpenChange, openSettingsModal)}
      </Suspense>
    ),
    [handleAuriaSidebarOpenChange, openSettingsModal],
  );

  return (
    <ScreenTransition key="main">
      <AppShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        renderScreen={renderProductScreen}
        auriaSidebarOpen={auriaSidebarOpen}
      />
      <AuriaSettingsModal
        visible={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </ScreenTransition>
  );
}

function renderTab(
  tab: ProductTabId,
  onAuriaSidebarOpenChange: (open: boolean) => void,
  onOpenSettings: () => void,
) {
  switch (tab) {
    case 'insights':
      return <HomeScreen />;
    case 'auria':
      return (
        <AuriaScreen
          onSidebarOpenChange={onAuriaSidebarOpenChange}
          onOpenSettings={onOpenSettings}
        />
      );
    case 'tasks':
      return <TasksScreen />;
    case 'integrations':
      return <IntegrationsScreen onOpenSettings={onOpenSettings} />;
    case 'settings':
      return null;
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
