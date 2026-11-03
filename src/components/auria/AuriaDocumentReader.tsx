import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getChatDocument } from '../../features/auria/api/documents';
import { parseDeckDocument, parseSheetDocument } from '../../features/auria/documentContent';
import { DOCUMENT_KIND_LABEL, type AuriaDocument } from '../../features/auria/documents';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import { AuriaDeckSlides } from './AuriaDeckSlides';
import { AuriaMarkdown } from './AuriaMarkdown';
import { AuriaSheetTable } from './AuriaSheetTable';

type AuriaDocumentReaderProps = {
  /** The document to read; null closes the reader. */
  document: AuriaDocument | null;
  onClose: () => void;
};

/**
 * A document of the chat, read only (A040, D-07): markdown and plain text are
 * drawn natively, HTML in a web view with nothing to navigate to, a
 * spreadsheet as a table and a presentation as its slides. The body is read
 * from the server when it opens (E31); nothing here changes the document.
 */
export function AuriaDocumentReader({ document, onClose }: AuriaDocumentReaderProps) {
  const insets = useSafeAreaInsets();
  const { ds, theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, insets.top, insets.bottom), [ds, theme, insets.top, insets.bottom]);
  const [content, setContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const id = document?.id ?? null;
  const chatId = document?.chatId ?? null;

  useEffect(() => {
    if (!document || !id) return;
    if (document.content !== undefined) {
      setContent(document.content);
      setFailed(false);
      return;
    }
    if (!chatId) {
      setFailed(true);
      return;
    }
    let active = true;
    setContent(null);
    setFailed(false);
    getChatDocument(chatId, id).then(
      (full) => active && setContent(full.content ?? ''),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [document, id, chatId]);

  if (!document) return null;

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close the document"
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <AuriaIcon name="close" size={AURIA_ICON_SIZE.sm} color={ds.gray900} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {document.title}
            </Text>
            <Text style={styles.kind}>
              {DOCUMENT_KIND_LABEL[document.format]} · read only
            </Text>
          </View>
        </View>

        {failed ? (
          <Text style={styles.notice}>This document could not be opened. Try again from the chat.</Text>
        ) : content === null ? (
          <ActivityIndicator style={styles.loading} color={ds.gray500} />
        ) : (
          <DocumentBody format={document.format} content={content} isDark={isDark} styles={styles} />
        )}
      </View>
    </Modal>
  );
}

function DocumentBody({
  format,
  content,
  isDark,
  styles,
}: {
  format: AuriaDocument['format'];
  content: string;
  isDark: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  if (format === 'html') {
    // Its own HTML only: nothing in the document navigates anywhere.
    return (
      <WebView
        originWhitelist={['about:blank']}
        source={{ html: content }}
        style={styles.webview}
        javaScriptEnabled={false}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => request.url === 'about:blank'}
      />
    );
  }

  if (format === 'sheet-json') {
    const tabs = parseSheetDocument(content);
    return (
      <ScrollView contentContainerStyle={styles.body}>
        {tabs ? <AuriaSheetTable tabs={tabs} /> : <Text style={styles.notice}>This spreadsheet could not be read.</Text>}
      </ScrollView>
    );
  }

  if (format === 'deck-json') {
    const deck = parseDeckDocument(content);
    return (
      <ScrollView contentContainerStyle={styles.body}>
        {deck ? <AuriaDeckSlides deck={deck} /> : <Text style={styles.notice}>This presentation could not be read.</Text>}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {format === 'markdown' ? (
        <AuriaMarkdown text={content} />
      ) : (
        <Text style={[styles.plain, isDark ? styles.plainDark : null]}>{content}</Text>
      )}
    </ScrollView>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  top: number,
  bottom: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.page,
      paddingTop: top + 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    close: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
    },
    headerText: { flex: 1 },
    title: {
      ...auriaTypography.title,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
    kind: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.gray500,
    },
    body: {
      paddingHorizontal: 16,
      paddingBottom: bottom + 24,
      gap: 10,
    },
    webview: {
      flex: 1,
      backgroundColor: theme.colors.page,
    },
    loading: { marginTop: 24 },
    notice: {
      ...auriaTypography.body,
      fontSize: 14,
      color: ds.gray600,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    plain: {
      ...auriaTypography.body,
      fontSize: 15,
      lineHeight: 22,
      color: ds.gray900,
    },
    plainDark: { color: ds.gray900 },
    pressed: { opacity: 0.7 },
  });
}
