import { lazy, Suspense, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppShell } from './components/navigation/AppShell';
import { AuriaSettingsModal } from './components/auria/AuriaSettingsModal';
import { ScreenTransition } from './components/ui/transitions';
import { NavigateFn, ProductTabId } from './data/productNavigation';

const HomeScreen = lazy(() => import('./screens/HomeScreen').then((m) => ({ default: m.HomeScreen })));
const AuriaScreen = lazy(() => import('./screens/AuriaScreen').then((m) => ({ default: m.AuriaScreen })));
const TasksScreen = lazy(() => import('./screens/TasksScreen').then((m) => ({ default: m.TasksScreen })));
const IntegrationsScreen = lazy(() =>
  import('./screens/IntegrationsScreen').then((m) => ({ default: m.IntegrationsScreen })),
);

type MainAppProps = {
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
  onBack?: () => void;
  canGoBack?: boolean;
};

export default function MainApp({ activeTab, onTabChange, onBack, canGoBack }: MainAppProps) {
  const [auriaSidebarOpen, setAuriaSidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pendingAuriaPrompt, setPendingAuriaPrompt] = useState<string | null>(null);

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

  // Insights actions can deep-link to Auria with a pre-filled prompt.
  const handleNavigate = useCallback<NavigateFn>(
    (tab, opts) => {
      if (tab === 'auria' && opts?.prompt) setPendingAuriaPrompt(opts.prompt);
      handleTabChange(tab);
    },
    [handleTabChange],
  );

  const renderProductScreen = useCallback(
    (tab: ProductTabId) => (
      <Suspense fallback={<TabFallback />}>
        {renderTab(tab, {
          onAuriaSidebarOpenChange: handleAuriaSidebarOpenChange,
          onOpenSettings: openSettingsModal,
          onNavigate: handleNavigate,
          auriaPrompt: pendingAuriaPrompt,
          onAuriaPromptConsumed: () => setPendingAuriaPrompt(null),
        })}
      </Suspense>
    ),
    [handleAuriaSidebarOpenChange, openSettingsModal, handleNavigate, pendingAuriaPrompt],
  );

  return (
    <ScreenTransition key="main">
      <AppShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        renderScreen={renderProductScreen}
        auriaSidebarOpen={auriaSidebarOpen}
        onBack={onBack}
        canGoBack={canGoBack}
      />
      <AuriaSettingsModal
        visible={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </ScreenTransition>
  );
}

type RenderTabHandlers = {
  onAuriaSidebarOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
  onNavigate: NavigateFn;
  auriaPrompt: string | null;
  onAuriaPromptConsumed: () => void;
};

function renderTab(tab: ProductTabId, handlers: RenderTabHandlers) {
  switch (tab) {
    case 'insights':
      return <HomeScreen onNavigate={handlers.onNavigate} />;
    case 'auria':
      return (
        <AuriaScreen
          onSidebarOpenChange={handlers.onAuriaSidebarOpenChange}
          onOpenSettings={handlers.onOpenSettings}
          initialPrompt={handlers.auriaPrompt}
          onPromptConsumed={handlers.onAuriaPromptConsumed}
        />
      );
    case 'tasks':
      return <TasksScreen />;
    case 'integrations':
      return <IntegrationsScreen onOpenSettings={handlers.onOpenSettings} />;
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
