import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Keyboard,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AuriaComposer,
  AuriaComposerHandle,
} from '../components/auria/AuriaComposer';
import { AuriaCreateMenu } from '../components/auria/AuriaCreateMenu';
import { AuriaDocTemplatesModal } from '../components/auria/AuriaDocTemplatesModal';
import type { AuriaDocTemplate } from '../data/auriaDocTemplates';
import { AuriaModeSheet, auriaModeLabel } from '../components/auria/AuriaModeSheet';
import { AuriaPromptSuggestions } from '../components/auria/AuriaPromptSuggestions';
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
import { AuriaCameraView } from '../components/auria/AuriaCameraView';
import { AuriaNewProjectInput, AuriaNewProjectModal } from '../components/auria/AuriaNewProjectModal';
import { AuriaSidebar } from '../components/auria/AuriaSidebar';
import { AuriaWelcomeView } from '../components/auria/AuriaWelcomeView';
import { AuriaWorkspaceHeader, WORKSPACE_HEADER_HEIGHT } from '../components/auria/AuriaWorkspaceHeader';
import { APP_SHELL_BOTTOM_INSET } from '../components/navigation/AppShell';
import { AuriaPanel } from '../data/auriaMockData';
import { useAuriaWorkspace } from '../features/auria/useAuriaWorkspace';
import { useAuriaConversation } from '../features/auria/useAuriaConversation';
import { useAuriaChats } from '../features/auria/useAuriaChats';
import { describeAuriaError } from '../features/auria/api/errors';
import { useAuriaToast } from '../features/auria/useAuriaToast';
import { AuriaActionToast } from '../components/auria/AuriaActionToast';
import { AuriaDiscoverHeaderActions } from '../components/auria/AuriaDiscoverHeaderActions';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUPPORTS_NATIVE_DRIVER, motionDuration, motionEasing, useTheme } from '../theme';

type AuriaScreenProps = {
  onSidebarOpenChange?: (open: boolean) => void;
  onOpenSettings?: () => void;
  /** When set (deep link from another screen), pre-fills the composer once. */
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
  const conversation = useAuriaConversation();
  const chats = useAuriaChats();

  // When a turn ends, put its chat on top of the sidebar (a new chat appears
  // with its first message as the title, like the web).
  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !conversation.isBusy && conversation.chatId) {
      const firstUser = conversation.messages.find((m) => m.role === 'user');
      chats.touch(conversation.chatId, firstUser?.text.slice(0, 40) ?? '');
    }
    wasBusy.current = conversation.isBusy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.isBusy, conversation.chatId]);
  const isWelcomeHome = workspace.panel === 'chat' && conversation.messages.length === 0;
  const { toast, showToast } = useAuriaToast();

  // Until the notice above the composer lands (A027), a failed answer shows a toast.
  useEffect(() => {
    if (conversation.error) showToast(describeAuriaError(conversation.error).message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.error]);

  /** Sends to the real Auria from any entry point (composer, suggestion, article…). */
  const sendToAuria = (text: string) => {
    if (workspace.panel !== 'chat') workspace.openPanel('chat');
    return conversation.send(text);
  };

  // Deep link with a prompt: seed the composer once, then clear it.
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [imageMode, setImageMode] = useState(false);
  const [imageRatio, setImageRatio] = useState('1:1');
  const [docTemplatesOpen, setDocTemplatesOpen] = useState(false);
  const [newsSearchOpen, setNewsSearchOpen] = useState(false);
  const [newsCustomizeOpen, setNewsCustomizeOpen] = useState(false);
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

  // A tap on the content closes the sidebar or the keyboard. Detected from raw
  // touches (no responder) so the chat and the panels keep scrolling on Android.
  const contentTouch = useRef<{ x: number; y: number } | null>(null);
  const contentTapHandlers = {
    onTouchStart: (e: GestureResponderEvent) => {
      contentTouch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    },
    onTouchEnd: (e: GestureResponderEvent) => {
      const start = contentTouch.current;
      contentTouch.current = null;
      const moved = start ? Math.hypot(e.nativeEvent.pageX - start.x, e.nativeEvent.pageY - start.y) : Infinity;
      if (moved < 8) handleContentTap();
    },
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
    conversation.newChat();
    workspace.openPanel('chat');
    workspace.setComposerText('');
    setAttachments([]);
    setImageMode(false);
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
    closeSidebar();
  };

  const handleSuggestion = (text: string) => {
    dismissKeyboard();
    sendToAuria(text);
    setAttachments([]);
    setImageMode(false);
  };

  const handleAskAboutArticle = (
    article: { title: string; sourceName: string; url: string },
    question: string,
  ) => {
    dismissKeyboard();
    sendToAuria(
      `About the article "${article.title}" (${article.sourceName} — ${article.url}): ${question}`,
    );
    setAttachments([]);
    setImageMode(false);
  };

  const handleSend = () => {
    const text = workspace.composerText.trim();
    if (imageMode) {
      if (!text) return;
      if (!sendToAuria(`Create an image with aspect ratio ${imageRatio}. Image brief: ${text}`)) return;
      workspace.setComposerText('');
      setImageMode(false);
      dismissKeyboard();
      return;
    }
    if (attachments.length > 0) {
      // Uploading photos and files arrives with A024/A025; keep them in the composer until then.
      showToast('Sending photos and files is coming in the next update.');
    }
    if (!text || !sendToAuria(text)) return;
    workspace.setComposerText('');
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
    sendToAuria(request);
    setAttachments([]);
    setImageMode(false);
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
  };

  const handleUseTemplate = (template: AuriaDocTemplate) => {
    setDocTemplatesOpen(false);
    sendToAuria(`Create a document from the "${template.label}" template.`);
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
    closeSidebar();
    setAttachments([]);
    setImageMode(false);
    workspace.setComposerText('');
    if (workspace.panel !== 'chat') workspace.openPanel('chat');
    setPanelKey((key) => key + 1);
    panelAnim.setValue(1);
    const chat = chats.chats.find((c) => c.id === id);
    void conversation.openChat(id, chat?.provider ?? null);
  };

  const panelTranslateX = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const renderMain = () => {
    if (isWelcomeHome) {
      return (
        <AuriaWelcomeView
          contentMaxWidth={contentMaxWidth}
          contentTopPadding={welcomeTopPadding}
        />
      );
    }

    if (workspace.panel === 'news')
      return (
        <AuriaNewsPanel
          onFeedback={showToast}
          onAskFollowUp={handleAskAboutArticle}
          searchOpen={newsSearchOpen}
          onCloseSearch={() => setNewsSearchOpen(false)}
          customizeOpen={newsCustomizeOpen}
          onCloseCustomize={() => setNewsCustomizeOpen(false)}
        />
      );
    if (workspace.panel === 'gallery') return <AuriaGalleryPanel />;
    if (workspace.panel === 'search') return <AuriaSearchPanel />;
    if (workspace.panel === 'settings') return <AuriaSettingsPanel />;
    if (workspace.panel === 'projects') {
      return (
        <AuriaProjectsPanel
          projects={workspace.projects}
          onCreateProject={openNewProjectModal}
          onDeleteProject={workspace.deleteProject}
          onOpenConversation={handleConversation}
          onOpenSources={() => transitionPanel('gallery')}
        />
      );
    }

    return (
      <AuriaChatView
        messages={conversation.messages}
        isResponding={conversation.run !== null && !conversation.run.text}
        onOpenFiles={() => transitionPanel('gallery')}
        modelLabel={`Auria · ${auriaModeLabel(conversation.mode)}`}
        onActionFeedback={showToast}
        history={{
          loading: conversation.history.loading,
          hasEarlier: conversation.history.hasEarlier,
          failed: conversation.history.error !== null,
        }}
        onLoadEarlier={() => void conversation.loadEarlier()}
        onRetryHistory={conversation.reload}
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
        activeConversationId={conversation.chatId}
        projectRows={workspace.projectRows}
        projects={workspace.projects}
        onNewChat={handleNewChat}
        onSelectPanel={handleSelectSidebarPanel}
        onCreateProject={openNewProjectModal}
        onSelectConversation={handleConversation}
        conversations={chats.chats}
        conversationsLoaded={chats.loaded}
        conversationsLoading={chats.loading}
        hasMoreConversations={chats.hasMore}
        onLoadMoreConversations={chats.loadMore}
      />

      <Animated.View
        style={[styles.pushShell, { transform: [{ translateX: mainTranslateX }] }]}
        aria-hidden={sidebarOpen}
        accessibilityElementsHidden={sidebarOpen}
        importantForAccessibility={sidebarOpen ? 'no-hide-descendants' : 'auto'}
        // A pan responder over the whole screen stops the chat from scrolling on
        // Android, so the full-screen swipe only exists while the sidebar is open
        // (to close it); opening uses the edge strip below.
        {...(sidebarOpen ? sidebarSwipe.panHandlers : null)}
      >
        {!sidebarOpen ? <View style={styles.edgeSwipeStrip} {...sidebarSwipe.panHandlers} /> : null}
        <View style={styles.pushSurface}>
          <View style={styles.headerBar}>
            <AuriaWorkspaceHeader
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
              onNewChat={handleNewChat}
              title={
                workspace.panel === 'projects'
                  ? 'Projects'
                  : workspace.panel === 'news'
                    ? 'Discover'
                    : undefined
              }
              onPlus={workspace.panel === 'projects' ? openNewProjectModal : undefined}
              plusLabel="New project"
              rightSlot={
                workspace.panel === 'news' ? (
                  <AuriaDiscoverHeaderActions
                    onSearch={() => setNewsSearchOpen((open) => !open)}
                    onCustomize={() => setNewsCustomizeOpen(true)}
                    searchActive={newsSearchOpen}
                  />
                ) : undefined
              }
            />
          </View>

          <View style={styles.main}>
            <View style={styles.contentTapArea} {...contentTapHandlers}>
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
            </View>

            {workspace.showComposer ? (
              <View style={styles.composerOverlay} onLayout={handleComposerLayout}>
                {isWelcomeHome ? (
                  <AuriaPromptSuggestions onSelect={handleSuggestion} />
                ) : null}
                <AuriaComposer
                  ref={composerRef}
                  value={workspace.composerText}
                  onChangeText={workspace.setComposerText}
                  onSend={handleSend}
                  onStop={conversation.stop}
                  onAttach={openCreateMenu}
                  bottomInset={keyboardInset}
                  isResponding={conversation.isBusy}
                  selectedModelName={auriaModeLabel(conversation.mode)}
                  selectedModelEffort={null}
                  onOpenModelPicker={() => {
                    dismissKeyboard();
                    setModelPickerOpen(true);
                  }}
                  attachments={attachments}
                  onRemoveAttachment={(uri) =>
                    setAttachments((current) => current.filter((item) => item !== uri))
                  }
                  imageMode={imageMode}
                  imageRatio={imageRatio}
                  onSelectRatio={setImageRatio}
                  onExitImageMode={() => setImageMode(false)}
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
              onCreateImage={() => {
                setCreateMenuOpen(false);
                setImageMode(true);
              }}
              onCreateDocument={() => {
                setCreateMenuOpen(false);
                setDocTemplatesOpen(true);
              }}
              bottomOffset={shellBottomInset - 20}
            />

            <AuriaModeSheet
              visible={modelPickerOpen}
              selected={conversation.mode}
              onSelect={conversation.setMode}
              onClose={() => setModelPickerOpen(false)}
            />

            <AuriaDocTemplatesModal
              visible={docTemplatesOpen}
              onClose={() => setDocTemplatesOpen(false)}
              onUse={handleUseTemplate}
            />
          </View>
        </View>
      </Animated.View>

      <AuriaNewProjectModal
        visible={workspace.newProjectOpen}
        onClose={workspace.closeProjectModal}
        onCreate={handleCreateProject}
      />


      <AuriaCameraView
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(uri) => {
          setCameraOpen(false);
          setAttachments((current) => [...current, uri]);
        }}
      />

      <AuriaActionToast message={toast} />
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
    // Left-edge strip that catches the swipe to open the sidebar (below the header).
    edgeSwipeStrip: {
      position: 'absolute',
      left: 0,
      top: WORKSPACE_HEADER_HEIGHT,
      bottom: 0,
      width: 20,
      zIndex: 3,
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
