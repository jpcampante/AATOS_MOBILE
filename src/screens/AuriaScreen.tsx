import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AuriaComposer,
  AuriaComposerHandle,
} from '../components/auria/AuriaComposer';
import { AuriaCreateMenu } from '../components/auria/AuriaCreateMenu';
import {
  AuriaGalleryPanel,
  AuriaNewsPanel,
  AuriaProjectsPanel,
  AuriaSearchPanel,
  AuriaSettingsPanel,
} from '../components/auria/AuriaPanels';
import {
  getAuriaComposerOverlayHeight,
  getContentMaxWidth,
  getSidebarWidth,
  getWelcomeContentTopPadding,
} from '../components/auria/auriaLayout';
import { AuriaChatView } from '../components/auria/AuriaChatView';
import { AuriaNewProjectInput, AuriaNewProjectModal } from '../components/auria/AuriaNewProjectModal';
import { AuriaSidebar } from '../components/auria/AuriaSidebar';
import { AuriaWelcomeView } from '../components/auria/AuriaWelcomeView';
import { AuriaWorkspaceHeader, WORKSPACE_HEADER_HEIGHT } from '../components/auria/AuriaWorkspaceHeader';
import { APP_SHELL_BOTTOM_INSET } from '../components/navigation/AppShell';
import { AuriaPanel } from '../data/auriaMockData';
import { useAuriaWorkspace } from '../features/auria/useAuriaWorkspace';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

const SLIDE_DURATION = 280;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function AuriaScreen() {
  const { ds } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const safeBottom = useSafeAreaInsets().bottom;
  const shellBottomInset = APP_SHELL_BOTTOM_INSET + safeBottom;
  const keyboardInset = useKeyboardInset(shellBottomInset);
  const composerRef = useRef<AuriaComposerHandle>(null);
  const workspace = useAuriaWorkspace();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [composerHeight, setComposerHeight] = useState(
    getAuriaComposerOverlayHeight(),
  );
  const slideProgress = useRef(new Animated.Value(0)).current;
  const [panelKey, setPanelKey] = useState(0);
  const panelAnim = useRef(new Animated.Value(1)).current;
  const panelTransitionId = useRef(0);
  const panelTransitionRef = useRef<Animated.CompositeAnimation | null>(null);

  const styles = useMemo(() => createStyles(ds), [ds]);
  const sidebarWidth = useMemo(() => getSidebarWidth(screenWidth), [screenWidth]);
  const contentMaxWidth = useMemo(() => getContentMaxWidth(screenWidth), [screenWidth]);
  const composerOverlayHeight = getAuriaComposerOverlayHeight(keyboardInset);
  const welcomeTopPadding = useMemo(
    () =>
      getWelcomeContentTopPadding(
        screenHeight,
        WORKSPACE_HEADER_HEIGHT,
        composerOverlayHeight,
        shellBottomInset,
      ),
    [composerOverlayHeight, screenHeight, shellBottomInset],
  );

  const dismissKeyboard = () => {
    composerRef.current?.blur();
    Keyboard.dismiss();
  };

  useEffect(() => {
    slideProgress.stopAnimation();
    Animated.timing(slideProgress, {
      toValue: sidebarOpen ? 1 : 0,
      duration: SLIDE_DURATION,
      easing: sidebarOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [sidebarOpen, slideProgress]);

  const mainTranslateX = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sidebarWidth],
  });

  useEffect(() => {
    if (sidebarOpen) {
      dismissKeyboard();
    }
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  const handleContentTap = () => {
    if (sidebarOpen) {
      closeSidebar();
      return;
    }
    dismissKeyboard();
  };

  const transitionPanel = (next: AuriaPanel) => {
    dismissKeyboard();
    closeSidebar();

    if (next === workspace.panel) {
      return;
    }

    const transitionId = panelTransitionId.current + 1;
    panelTransitionId.current = transitionId;
    panelTransitionRef.current?.stop();
    panelAnim.stopAnimation();

    panelTransitionRef.current = Animated.timing(panelAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    panelTransitionRef.current.start(() => {
      if (panelTransitionId.current !== transitionId) {
        return;
      }

      workspace.openPanel(next);
      setPanelKey((key) => key + 1);
      panelAnim.setValue(0);
      panelTransitionRef.current = Animated.timing(panelAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      panelTransitionRef.current.start();
    });
  };

  const handleNewChat = () => {
    dismissKeyboard();
    workspace.newChat();
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
    closeSidebar();
  };

  const handleSuggestion = (text: string) => {
    dismissKeyboard();
    workspace.sendMessage(text);
  };

  const handleSend = () => {
    workspace.sendMessage(workspace.composerText);
    dismissKeyboard();
  };

  const openNewProjectModal = () => {
    dismissKeyboard();
    closeSidebar();
    workspace.openProjectModal();
  };

  const openCreateMenu = () => {
    dismissKeyboard();
    setCreateMenuOpen(true);
  };

  const handleComposerLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setComposerHeight((current) => (current === nextHeight ? current : nextHeight));
  };

  const handleCreateRequest = (request: string) => {
    workspace.sendMessage(request);
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
  };

  const handleCreateProject = (input: AuriaNewProjectInput) => {
    workspace.createProject(input);
    closeSidebar();
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
  };

  const handleConversation = (id: string) => {
    dismissKeyboard();
    workspace.openConversation(id);
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
    closeSidebar();
  };

  const panelTranslateX = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const renderMain = () => {
    if (workspace.isWelcomeHome) {
      return (
        <AuriaWelcomeView
          contentMaxWidth={contentMaxWidth}
          contentTopPadding={welcomeTopPadding}
          onSuggestion={handleSuggestion}
        />
      );
    }

    if (workspace.panel === 'news') return <AuriaNewsPanel />;
    if (workspace.panel === 'gallery') return <AuriaGalleryPanel />;
    if (workspace.panel === 'search') return <AuriaSearchPanel />;
    if (workspace.panel === 'settings') return <AuriaSettingsPanel />;
    if (workspace.panel === 'projects') {
      return (
        <AuriaProjectsPanel
          projects={workspace.projects}
          onCreateProject={openNewProjectModal}
        />
      );
    }

    return <AuriaChatView messages={workspace.messages} isResponding={workspace.isResponding} />;
  };

  return (
    <View style={styles.root}>
      <AuriaSidebar
        open={sidebarOpen}
        width={sidebarWidth}
        revealProgress={slideProgress}
        activePanel={workspace.panel}
        activeConversationId={workspace.activeConversationId}
        projectRows={workspace.projectRows}
        projects={workspace.projects}
        onNewChat={handleNewChat}
        onSelectPanel={transitionPanel}
        onCreateProject={openNewProjectModal}
        onSelectConversation={handleConversation}
      />

      <Animated.View
        style={[styles.pushShell, { transform: [{ translateX: mainTranslateX }] }]}
        aria-hidden={sidebarOpen}
        accessibilityElementsHidden={sidebarOpen}
        importantForAccessibility={sidebarOpen ? 'no-hide-descendants' : 'auto'}
      >
        <View style={styles.pushSurface}>
          <View style={styles.headerBar}>
            <AuriaWorkspaceHeader
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onNewChat={handleNewChat}
            />
          </View>

          <View style={styles.main}>
            <Pressable style={styles.contentTapArea} onPress={handleContentTap} accessible={false}>
              <Animated.View
                key={panelKey}
                style={[
                  styles.content,
                  workspace.showComposer ? { paddingBottom: composerOverlayHeight } : null,
                  { transform: [{ translateX: panelTranslateX }] },
                ]}
              >
                {renderMain()}
              </Animated.View>
            </Pressable>

            {workspace.showComposer ? (
              <View style={styles.composerOverlay} onLayout={handleComposerLayout}>
                <AuriaComposer
                  ref={composerRef}
                  value={workspace.composerText}
                  onChangeText={workspace.setComposerText}
                  onSend={handleSend}
                  onAttach={openCreateMenu}
                  bottomInset={keyboardInset}
                  isResponding={workspace.isResponding}
                />
              </View>
            ) : null}

            <AuriaCreateMenu
              visible={createMenuOpen}
              onClose={() => setCreateMenuOpen(false)}
              onSendRequest={handleCreateRequest}
              bottomOffset={composerHeight + 4}
            />
          </View>
        </View>
      </Animated.View>

      <AuriaNewProjectModal
        visible={workspace.newProjectOpen}
        onClose={workspace.closeProjectModal}
        onCreate={handleCreateProject}
      />
    </View>
  );
}

function createStyles(ds: ReturnType<typeof useTheme>['ds']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: ds.gray50,
      overflow: 'hidden',
    },
    pushShell: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
    },
    pushSurface: {
      flex: 1,
      backgroundColor: ds.gray50,
    },
    main: {
      flex: 1,
    },
    headerBar: {
      height: WORKSPACE_HEADER_HEIGHT,
    },
    contentTapArea: {
      flex: 1,
      overflow: 'hidden',
    },
    content: {
      flex: 1,
      pointerEvents: 'box-none',
    },
    composerOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'box-none',
    },
  });
}
