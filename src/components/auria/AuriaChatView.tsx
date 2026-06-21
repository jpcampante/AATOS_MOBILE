import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AURIA_CHAT_SCROLL_END_PADDING, AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';
import { auriaTypography, liquidGlassBorder, liquidGlassTokens, useTheme } from '../../theme';
import type { AuriaChatMessage } from '../../features/auria/types';
import { useTypewriter } from '../../features/auria/useTypewriter';
import { AuriaDocumentArtifact } from './AuriaDocumentArtifact';
import { AuriaImageArtifact } from './AuriaImageArtifact';
import { AuriaMessageActions } from './AuriaMessageActions';
import { AuriaReasoningBlock } from './AuriaReasoningBlock';
import { AuriaSourceChips } from './AuriaSourceChips';
import { AuriaTypingCursor } from './AuriaTypingCursor';

type AuriaChatViewProps = {
  messages: AuriaChatMessage[];
  isResponding?: boolean;
  /** Redirect to the files area when an internal document is opened. */
  onOpenFiles?: () => void;
  /** Fired when a fresh reply has finished writing, so the Stop button can clear. */
  onMessageDone?: (id: string) => void;
  /** Model label shown in a reply's "•••" menu (e.g. "Used Opus 4.8"). */
  modelLabel?: string;
  /** Starts a new chat from a reply ("Branch in new chat"). */
  onBranch?: () => void;
  /** Re-answers the turn a reply belongs to, optionally with thinking / web search. */
  onRegenerate?: (messageId: string, mode: 'retry' | 'thinking' | 'search') => void;
  /** Transient feedback from a message action (copied, reading aloud, …). */
  onActionFeedback?: (message: string) => void;
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
  isResponding = false,
  onOpenFiles,
  onMessageDone,
  modelLabel,
  onBranch,
  onRegenerate,
  onActionFeedback,
}: AuriaChatViewProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
    >
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const attachments = message.attachments ?? [];
        const hasBubbleContent =
          !!message.text ||
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

            {hasBubbleContent ? (
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
                  <AssistantBubbleContent
                    message={message}
                    styles={styles}
                    cursorColor={ds.gray500}
                    onOpenFiles={onOpenFiles}
                    onMessageDone={onMessageDone}
                    modelLabel={modelLabel}
                    onBranch={onBranch}
                    onRegenerate={onRegenerate}
                    onActionFeedback={onActionFeedback}
                  />
                )}
              </View>
            ) : null}
          </View>
        );
      })}
      {isResponding ? (
        <View style={[styles.row, styles.rowAssistant]}>
          <View style={[styles.bubble, styles.bubbleAssistant, styles.thinkingBubble]}>
            <ActivityIndicator size="small" color={ds.gray500} />
            <Text style={[styles.text, styles.thinkingText]}>Auria is thinking</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

/**
 * Renders an assistant reply across every response mode (text, reasoning,
 * sources, document/image artifacts). For a freshly-arrived reply the text
 * streams in like Auria is writing it, and the sources/artifact reveal only
 * once the text has finished — a calm, natural sequence. History renders
 * instantly (no `fresh` flag) so reopening a chat doesn't re-animate.
 */
function AssistantBubbleContent({
  message,
  styles,
  cursorColor,
  onOpenFiles,
  onMessageDone,
  modelLabel,
  onBranch,
  onRegenerate,
  onActionFeedback,
}: {
  message: AuriaChatMessage;
  styles: ReturnType<typeof createStyles>;
  cursorColor: string;
  onOpenFiles?: () => void;
  onMessageDone?: (id: string) => void;
  modelLabel?: string;
  onBranch?: () => void;
  onRegenerate?: (messageId: string, mode: 'retry' | 'thinking' | 'search') => void;
  onActionFeedback?: (message: string) => void;
}) {
  const fresh = !!message.fresh;
  const { shown, done } = useTypewriter(message.text, { enabled: fresh, cps: 50 });
  // Hold the trailing content back until the prose finishes writing.
  const revealRest = !fresh || done;

  // Once a fresh reply finishes writing, let the workspace clear its busy state.
  useEffect(() => {
    if (fresh && done) onMessageDone?.(message.id);
  }, [fresh, done, message.id, onMessageDone]);

  return (
    <>
      {message.reasoning ? (
        <AuriaReasoningBlock reasoning={message.reasoning} onOpenFiles={onOpenFiles} />
      ) : null}
      {message.text ? (
        <Text style={[styles.text, styles.textAssistant]}>
          {shown}
          {fresh && !done ? <AuriaTypingCursor color={cursorColor} style={styles.text} /> : null}
        </Text>
      ) : null}
      {revealRest && message.sources && message.sources.length > 0 ? (
        <AuriaSourceChips sources={message.sources} onOpenFiles={onOpenFiles} />
      ) : null}
      {revealRest && message.artifact?.kind === 'document' ? (
        <AuriaDocumentArtifact artifact={message.artifact} />
      ) : null}
      {revealRest && message.artifact?.kind === 'image' ? (
        <AuriaImageArtifact artifact={message.artifact} />
      ) : null}
      {revealRest && message.text ? (
        <AuriaMessageActions
          text={message.text}
          modelLabel={modelLabel}
          onBranch={onBranch}
          onRetry={() => onRegenerate?.(message.id, 'retry')}
          onUseThinking={() => onRegenerate?.(message.id, 'thinking')}
          onSearchWeb={() => onRegenerate?.(message.id, 'search')}
          onFeedback={onActionFeedback}
        />
      ) : null}
    </>
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
    thinkingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
    },
    thinkingText: {
      color: ds.gray500,
      fontSize: 13,
    },
  });
}
