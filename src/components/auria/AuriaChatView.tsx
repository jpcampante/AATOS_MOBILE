import { useMemo, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AURIA_CHAT_SCROLL_END_PADDING, AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';
import { auriaTypography, liquidGlassBorder, liquidGlassTokens, useTheme } from '../../theme';
import type { AuriaChatMessage } from '../../features/auria/types';
import { AuriaDocumentArtifact } from './AuriaDocumentArtifact';
import { AuriaImageArtifact } from './AuriaImageArtifact';

type AuriaChatViewProps = {
  messages: AuriaChatMessage[];
  isResponding?: boolean;
};

export function AuriaChatView({ messages, isResponding = false }: AuriaChatViewProps) {
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
        return (
          <View
            key={message.id}
            style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}
          >
            <View
              style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleAssistant,
                message.artifact && styles.bubbleWithArtifact,
              ]}
            >
              <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
                {message.text}
              </Text>
              {message.artifact?.kind === 'document' ? (
                <AuriaDocumentArtifact artifact={message.artifact} />
              ) : null}
              {message.artifact?.kind === 'image' ? (
                <AuriaImageArtifact artifact={message.artifact} />
              ) : null}
            </View>
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
