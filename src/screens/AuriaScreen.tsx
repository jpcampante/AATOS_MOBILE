import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  LayoutChangeEvent,
  PanResponder,
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
import { AuriaModelSheet } from '../components/auria/AuriaModelSheet';
import { AuriaPromptSuggestions } from '../components/auria/AuriaPromptSuggestions';
import { getModelById } from '../data/auriaModels';
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
import { AuriaVoiceMode } from '../components/auria/AuriaVoiceMode';
import { AuriaCameraView } from '../components/auria/AuriaCameraView';
import { AuriaNewProjectInput, AuriaNewProjectModal } from '../components/auria/AuriaNewProjectModal';
import { AuriaSidebar } from '../components/auria/AuriaSidebar';
import { AuriaWelcomeView } from '../components/auria/AuriaWelcomeView';
import { AuriaWorkspaceHeader, WORKSPACE_HEADER_HEIGHT } from '../components/auria/AuriaWorkspaceHeader';
import { APP_SHELL_BOTTOM_INSET } from '../components/navigation/AppShell';
import { AuriaPanel } from '../data/auriaMockData';
import { useAuriaWorkspace } from '../features/auria/useAuriaWorkspace';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUPPORTS_NATIVE_DRIVER, motionDuration, motionEasing, useTheme } from '../theme';

type AuriaScreenProps = {
  onSidebarOpenChange?: (open: boolean) => void;
  onOpenSettings?: () => void;
  /** When set (deep-link from Insights), pre-fills the composer once. */
  initialPrompt?: string | null;
  onPromptConsumed?: () => void;
};

export function AuriaScreen({
  onSidebarOpenChange,
  onOpenSettings,
  initialPrompt,
  onPromptConsumed,
}: AuriaScreenProps) {
  const { ds } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const safeBottom = useSafeAreaInsets().bottom;
  const shellBottomInset = APP_SHELL_BOTTOM_INSET + safeBottom;
  const keyboardInset = useKeyboardInset(shellBottomInset);
  const composerRef = useRef<AuriaComposerHandle>(null);
  const workspace = useAuriaWorkspace();
  const activeModel = getModelById(workspace.selectedModel);

  // Deep-link from Insights "Ask Auria": seed the composer once, then clear it.
  useEffect(() => {
    if (initialPrompt) {
      workspace.setComposerText(initialPrompt);
      onPromptConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [composerHeight, setComposerHeight] = useState(
    getAuriaComposerOverlayHeight(),
  );
  const slideProgress = useRef(new Animated.Value(0)).current;
  const sidebarOpenRef = useRef(sidebarOpen);
  sidebarOpenRef.current = sidebarOpen;
  // Edge-swipe right to open the sidebar; swipe left to close it.
  const sidebarSwipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) => {
        if (Math.abs(g.dx) < 10 || Math.abs(g.dx) < Math.abs(g.dy) * 1.2) return false;
        return sidebarOpenRef.current ? g.dx < -10 : g.x0 < 28 && g.dx > 10;
      },
      onPanResponderRelease: (_evt, g) => {
        if (sidebarOpenRef.current) {
          if (g.dx < -40 || g.vx < -0.3) setSidebarOpen(false);
        } else if (g.dx > 56 || g.vx > 0.3) {
          setSidebarOpen(true);
        }
      },
    }),
  ).current;
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
      duration: motionDuration.base,
      easing: sidebarOpen ? motionEasing.standard : motionEasing.accelerate,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    }).start();
    onSidebarOpenChange?.(sidebarOpen);
  }, [onSidebarOpenChange, sidebarOpen, slideProgress]);

  useEffect(() => () => onSidebarOpenChange?.(false), [onSidebarOpenChange]);

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
      duration: motionDuration.fast,
      easing: motionEasing.decelerate,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
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
        duration: motionDuration.fast,
        easing: motionEasing.standard,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      });
      panelTransitionRef.current.start();
    });
  };

  const handleSelectSidebarPanel = (next: AuriaPanel) => {
    if (next === 'settings') {
      dismissKeyboard();
      closeSidebar();
      onOpenSettings?.();
      return;
    }
    transitionPanel(next);
  };

  const handleNewChat = () => {
    dismissKeyboard();
    workspace.newChat();
    setAttachments([]);
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
    closeSidebar();
  };

  const handleSuggestion = (text: string) => {
    dismissKeyboard();
    workspace.sendMessage(text);
    setAttachments([]);
  };

  const handleSend = () => {
    const text = workspace.composerText.trim();
    if (!text && attachments.length === 0) return;
    workspace.sendMessage(text, attachments);
    dismissKeyboard();
    setAttachments([]);
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
    setAttachments([]);
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
    setAttachments([]);
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
          onDeleteProject={workspace.deleteProject}
        />
      );
    }

    return (
      <AuriaChatView
        messages={workspace.messages}
        isResponding={workspace.isResponding}
        onOpenFiles={() => transitionPanel('gallery')}
      />
    );
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
        onSelectPanel={handleSelectSidebarPanel}
        onCreateProject={openNewProjectModal}
        onSelectConversation={handleConversation}
      />

      <Animated.View
        style={[styles.pushShell, { transform: [{ translateX: mainTranslateX }] }]}
        aria-hidden={sidebarOpen}
        accessibilityElementsHidden={sidebarOpen}
        importantForAccessibility={sidebarOpen ? 'no-hide-descendants' : 'auto'}
        {...sidebarSwipe.panHandlers}
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
                {workspace.isWelcomeHome ? (
                  <AuriaPromptSuggestions onSelect={handleSuggestion} />
                ) : null}
                <AuriaComposer
                  ref={composerRef}
                  value={workspace.composerText}
                  onChangeText={workspace.setComposerText}
                  onSend={handleSend}
                  onAttach={openCreateMenu}
                  onVoice={() => {
                    dismissKeyboard();
                    setVoiceOpen(true);
                  }}
                  bottomInset={keyboardInset}
                  isResponding={workspace.isResponding}
                  selectedModelName={activeModel?.name ?? 'Opus 4.8'}
                  selectedModelEffort={activeModel?.effort ?? null}
                  onOpenModelPicker={() => {
                    dismissKeyboard();
                    setModelPickerOpen(true);
                  }}
                  attachments={attachments}
                  onRemoveAttachment={(uri) =>
                    setAttachments((current) => current.filter((item) => item !== uri))
                  }
                />
              </View>
            ) : null}

            <AuriaCreateMenu
              visible={createMenuOpen}
              onClose={() => setCreateMenuOpen(false)}
              onSendRequest={handleCreateRequest}
              onOpenCamera={() => {
                setCreateMenuOpen(false);
                setCameraOpen(true);
              }}
              onAddPhotos={(uris) => setAttachments((current) => [...current, ...uris])}
              bottomOffset={shellBottomInset - 20}
            />

            <AuriaModelSheet
              visible={modelPickerOpen}
              selectedId={workspace.selectedModel}
              onSelect={workspace.setSelectedModel}
              onClose={() => setModelPickerOpen(false)}
            />
          </View>
        </View>
      </Animated.View>

      <AuriaNewProjectModal
        visible={workspace.newProjectOpen}
        onClose={workspace.closeProjectModal}
        onCreate={handleCreateProject}
      />

      <AuriaVoiceMode visible={voiceOpen} onClose={() => setVoiceOpen(false)} />

      <AuriaCameraView
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(uri) => {
          setCameraOpen(false);
          setAttachments((current) => [...current, uri]);
        }}
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
