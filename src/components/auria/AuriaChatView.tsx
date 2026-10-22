import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AURIA_CHAT_SCROLL_END_PADDING, AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';
import { auriaTypography, liquidGlassBorder, liquidGlassTokens, useTheme } from '../../theme';
import type { AuriaChatMessage } from '../../features/auria/types';
import { AuriaAssistantContent } from './AuriaAssistantContent';
import { AuriaMessageFiles } from './AuriaMessageFiles';
import { AuriaVersionSwitcher } from './AuriaVersionSwitcher';

type AuriaChatViewProps = {
  messages: AuriaChatMessage[];
  /** Redirect to the files area when an internal document is opened. */
  onOpenFiles?: () => void;
  /** Model label shown in a reply's "•••" menu (e.g. "Used Opus 4.8"). */
  modelLabel?: string;
  /** "Retry": a new version of a saved answer (E19). */
  onRetry?: (messageId: string) => void;
  /** Show another version of a message (`< 2/3 >`, E21). */
  onSwitchVersion?: (messageId: string, direction: -1 | 1) => void;
  /** The message whose version is switching right now. */
  switchingVersionOf?: string | null;
  /** Long press on one of the person's messages (copy, edit). */
  onQuestionLongPress?: (message: AuriaChatMessage) => void;
  /** Transient feedback from a message action (copied, reading aloud, …). */
  onActionFeedback?: (message: string) => void;
  /** Loading state of a saved chat's history. */
  history?: { loading: boolean; hasEarlier: boolean; failed: boolean };
  onLoadEarlier?: () => void;
  onRetryHistory?: () => void;
};

const ATTACHMENT_MAX_W = 230;
const ATTACHMENT_MAX_H = 300;
const ATTACHMENT_FALLBACK = { width: 200, height: 240 };

/** Fits an image inside the max box, preserving aspect ratio (never upscales). */
function fitAttachment(w: number, h: number): { width: number; height: number } {
  const scale = Math.min(ATTACHMENT_MAX_W / w, ATTACHMENT_MAX_H / h, 1);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** A single sent photo, drawn at its natural aspect ratio (capped to the box). */
function ChatAttachmentImage({ uri, placeholderColor }: { uri: string; placeholderColor: string }) {
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    let active = true;
    setDims(null); // fall back to the neutral box until the new uri's size loads
    Image.getSize(
      uri,
      (w, h) => {
        if (active && w > 0 && h > 0) setDims(fitAttachment(w, h));
      },
      () => {
        if (active) setDims(ATTACHMENT_FALLBACK);
      },
    );
    return () => {
      active = false;
    };
  }, [uri]);
  const size = dims ?? ATTACHMENT_FALLBACK;
  return (
    <Image
      source={{ uri }}
      resizeMode="cover"
      style={{
        width: size.width,
        height: size.height,
        borderRadius: 16,
        backgroundColor: placeholderColor,
      }}
      accessibilityRole="image"
      accessibilityLabel="Attached image"
    />
  );
}

export function AuriaChatView({
  messages,
  onOpenFiles,
  modelLabel,
  onRetry,
  onSwitchVersion,
  switchingVersionOf = null,
  onQuestionLongPress,
  onActionFeedback,
  history,
  onLoadEarlier,
  onRetryHistory,
}: AuriaChatViewProps) {
  const { ds, theme } = useTheme();
  /** `< 2/3 >` for a message with other versions (retried answers, edited questions). */
  const versionSwitcher = (message: AuriaChatMessage) =>
    message.version && message.version.count > 1 ? (
      <AuriaVersionSwitcher
        index={message.version.index}
        count={message.version.count}
        onSwitch={onSwitchVersion && message.serverId ? (direction) => onSwitchVersion(message.id, direction) : undefined}
        busy={switchingVersionOf === message.id}
      />
    ) : null;
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const scrollRef = useRef<ScrollView>(null);

  // Follow the end of the chat when a message arrives or the live answer grows,
  // but not when earlier messages are added on top (that would jump away).
  const last = messages[messages.length - 1];
  const endKey = last ? `${last.id}:${last.text.length}` : '';
  const followedKey = useRef('');
  const followEnd = () => {
    if (endKey === followedKey.current) return;
    followedKey.current = endKey;
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const loadingFirst = !!history?.loading && messages.length === 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
      onContentSizeChange={followEnd}
    >
      {history?.hasEarlier && messages.length > 0 ? (
        <Pressable
          onPress={onLoadEarlier}
          disabled={history.loading}
          style={({ pressed }) => [styles.historyButton, pressed && styles.historyButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Load earlier messages"
        >
          {history.loading ? <ActivityIndicator size="small" color={ds.gray500} /> : null}
          <Text style={styles.historyText}>{history.loading ? 'Loading…' : 'Load earlier messages'}</Text>
        </Pressable>
      ) : null}
      {loadingFirst ? (
        <View style={styles.historyState}>
          <ActivityIndicator size="small" color={ds.gray500} />
          <Text style={styles.historyText}>Loading messages…</Text>
        </View>
      ) : null}
      {history?.failed && !history.loading ? (
        <View style={styles.historyState}>
          <Text style={styles.historyText}>
            {messages.length === 0 ? "Couldn't open this conversation." : "Couldn't load earlier messages."}
          </Text>
          <Pressable
            onPress={messages.length === 0 ? onRetryHistory : onLoadEarlier}
            style={({ pressed }) => [styles.historyButton, pressed && styles.historyButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={[styles.historyText, styles.historyAction]}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const attachments = message.attachments ?? [];
        const hasBubbleContent =
          !!message.text ||
          !!message.work ||
          !!message.reasoning ||
          (message.sources?.length ?? 0) > 0 ||
          !!message.artifact;
        return (
          <View
            key={message.id}
            style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}
          >
            {/* Sent photos render bare (no bubble), like ChatGPT/iMessage. */}
            {attachments.length === 1 ? (
              <ChatAttachmentImage uri={attachments[0]} placeholderColor={ds.gray200} />
            ) : null}
            {attachments.length > 1 ? (
              <View style={[styles.attachments, styles.attachmentsGrid]}>
                {attachments.map((uri, index) => (
                  <Image
                    key={`${message.id}-att-${index}`}
                    source={{ uri }}
                    style={styles.attachmentImage}
                    resizeMode="cover"
                    accessibilityRole="image"
                    accessibilityLabel={`Attached image ${index + 1} of ${attachments.length}`}
                  />
                ))}
              </View>
            ) : null}

            {/* Real attachments (uploaded from the app or the web): images bare, files as chips. */}
            {message.files?.length ? (
              <AuriaMessageFiles files={message.files} onOpenFailed={onActionFeedback} />
            ) : null}

            {hasBubbleContent && isUser && onQuestionLongPress ? (
              <Pressable
                onLongPress={() => onQuestionLongPress(message)}
                delayLongPress={350}
                style={({ pressed }) => [styles.bubble, styles.bubbleUser, pressed && styles.bubblePressed]}
                accessibilityHint="Double tap and hold for options"
                accessibilityActions={[{ name: 'longpress', label: 'Options' }]}
                onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && onQuestionLongPress(message)}
              >
                <Text style={[styles.text, styles.textUser]}>{message.text}</Text>
              </Pressable>
            ) : hasBubbleContent ? (
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                  message.artifact && styles.bubbleWithArtifact,
                ]}
              >
                {isUser ? (
                  message.text ? (
                    <Text style={[styles.text, styles.textUser]}>{message.text}</Text>
                  ) : null
                ) : (
                  <AuriaAssistantContent
                    message={message}
                    onOpenFiles={onOpenFiles}
                    modelLabel={modelLabel}
                    versionSwitcher={versionSwitcher(message)}
                    onRetry={onRetry}
                    onActionFeedback={onActionFeedback}
                  />
                )}
              </View>
            ) : null}
            {isUser ? versionSwitcher(message) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  const glass = liquidGlassTokens(theme);
  const rim = liquidGlassBorder(theme);

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: AURIA_CONTENT_HORIZONTAL_INSET,
      paddingTop: 12,
      paddingBottom: AURIA_CHAT_SCROLL_END_PADDING,
      gap: 12,
    },
    row: {
      width: '100%',
      gap: 6,
    },
    rowUser: {
      alignItems: 'flex-end',
    },
    rowAssistant: {
      alignItems: 'flex-start',
    },
    bubble: {
      maxWidth: '88%',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 11,
    },
    bubbleUser: {
      backgroundColor: ds.offBlack,
    },
    bubbleAssistant: {
      // A fixed width, not content-sized: Markdown code blocks and tables scroll
      // horizontally, and a content-sized parent makes Android measure them wrong
      // (the chat then can't scroll to the end of the answer).
      width: '88%',
      backgroundColor: glass.fill,
      ...rim,
      ...glass.webBlur,
    },
    bubbleWithArtifact: {
      width: '100%',
      maxWidth: '100%',
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: 'transparent',
      borderWidth: 0,
      gap: 10,
    },
    attachments: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    // Two-column grid that shrink-wraps to its content (no dead space to the
    // right). 2*104 + 6 gap + 2px slack so an exact-fit row never wraps early.
    attachmentsGrid: {
      width: 216,
    },
    attachmentImage: {
      width: 104,
      height: 104,
      borderRadius: 12,
      backgroundColor: ds.gray200,
    },
    text: {
      ...auriaTypography.body,
      fontSize: 15,
      lineHeight: 22,
    },
    textUser: {
      color: ds.white,
    },
    textAssistant: {
      color: ds.gray900,
    },
    historyButton: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
    },
    bubblePressed: {
      opacity: 0.8,
    },
    historyButtonPressed: {
      backgroundColor: ds.gray100,
    },
    historyState: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 24,
    },
    historyText: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 13,
    },
    historyAction: {
      color: ds.auriaBlue,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
}
