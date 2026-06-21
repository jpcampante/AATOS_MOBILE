import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDiscoverFeed } from '../../features/auria/useDiscoverFeed';
import type { DiscoverArticle } from '../../features/auria/newsTypes';
import { speak, stopSpeaking, shareText, copyText } from '../../features/auria/mediaActions';
import { auriaTypography, useTheme } from '../../theme';
import { AURIA_CONTENT_HORIZONTAL_INSET, AURIA_PANEL_SCROLL_END_PADDING } from './auriaLayout';
import { AuriaDiscoverTabs } from './AuriaDiscoverTabs';
import { AuriaDiscoverCard } from './AuriaDiscoverCard';
import { AuriaTopicChips } from './AuriaTopicChips';
import { AuriaSourcesSheet } from './AuriaSourcesSheet';
import { AuriaFollowUpComposer } from './AuriaFollowUpComposer';
import { AuriaArticleMenu, ArticleMenuAction } from './AuriaArticleMenu';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';

type AuriaNewsPanelProps = {
  onFeedback?: (message: string) => void;
  onAskFollowUp?: (article: DiscoverArticle, question: string) => void;
  searchOpen?: boolean;
  onCloseSearch?: () => void;
  customizeOpen?: boolean;
  onCloseCustomize?: () => void;
};

type ReportMode = 'summary' | 'full';
type Feedback = 'like' | 'dislike';

export function AuriaNewsPanel({
  onFeedback,
  onAskFollowUp,
  searchOpen = false,
  onCloseSearch,
  customizeOpen = false,
  onCloseCustomize,
}: AuriaNewsPanelProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const { category, setCategory, articles, loading, refreshing, refresh, topicPrefs, cycleTopic } =
    useDiscoverFeed();

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [reportMode, setReportMode] = useState<Record<string, ReportMode>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [sourcesArticle, setSourcesArticle] = useState<DiscoverArticle | null>(null);
  const [followUpArticle, setFollowUpArticle] = useState<DiscoverArticle | null>(null);
  const [menuArticle, setMenuArticle] = useState<DiscoverArticle | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
    else setQuery('');
  }, [searchOpen]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleReport = useCallback((id: string) => {
    setReportMode((prev) => ({ ...prev, [id]: prev[id] === 'full' ? 'summary' : 'full' }));
  }, []);

  const toggleListen = useCallback(
    (article: DiscoverArticle) => {
      if (speakingId === article.id) {
        stopSpeaking();
        setSpeakingId(null);
        return;
      }
      stopSpeaking();
      const body = article.bullets.map((b) => b.text).join(' ') || article.summary;
      const started = speak(`${article.title}. ${body}`, {
        onDone: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
      });
      if (started) {
        setSpeakingId(article.id);
        onFeedback?.('Reading aloud');
      } else onFeedback?.('Audio not available');
    },
    [onFeedback, speakingId],
  );

  const handleShare = useCallback(
    async (article: DiscoverArticle) => {
      const msg = await shareText(article.title, article.url);
      if (msg) onFeedback?.(msg);
    },
    [onFeedback],
  );

  const handleLike = useCallback(
    (article: DiscoverArticle) => {
      setFeedback((prev) => {
        const isLiked = prev[article.id] === 'like';
        const next = { ...prev };
        if (isLiked) delete next[article.id];
        else next[article.id] = 'like';
        return next;
      });
      onFeedback?.('Thanks — more like this');
    },
    [onFeedback],
  );

  const handleDislike = useCallback(
    (article: DiscoverArticle) => {
      setFeedback((prev) => {
        const isDis = prev[article.id] === 'dislike';
        const next = { ...prev };
        if (isDis) delete next[article.id];
        else next[article.id] = 'dislike';
        return next;
      });
      onFeedback?.('Got it — less like this');
    },
    [onFeedback],
  );

  const handleMenuAction = useCallback(
    async (action: ArticleMenuAction) => {
      const article = menuArticle;
      setMenuArticle(null);
      if (!article) return;
      if (action === 'copy') {
        const r = await copyText(article.url);
        onFeedback?.(r === 'Copied' ? 'Link copied' : r);
      } else if (action === 'share') {
        await handleShare(article);
      } else if (action === 'save') {
        onFeedback?.('Saved to your library');
      } else if (action === 'hide') {
        onFeedback?.("Got it — we'll show less like this");
      } else if (action === 'report') {
        onFeedback?.('Reported. Thank you');
      }
    },
    [handleShare, menuArticle, onFeedback],
  );

  // ---- Feed ----
  const q = query.trim().toLowerCase();
  const shown =
    searchOpen && q
      ? articles.filter((a) => `${a.title} ${a.summary} ${a.sourceName}`.toLowerCase().includes(q))
      : articles;
  const [lead, ...rest] = shown;
  const searching = searchOpen && q.length > 0;

  const renderCard = (article: DiscoverArticle) => (
    <AuriaDiscoverCard
      key={article.id}
      article={article}
      expanded={expanded.has(article.id)}
      reportMode={reportMode[article.id] ?? 'summary'}
      feedback={feedback[article.id] ?? null}
      listening={speakingId === article.id}
      onToggleExpand={() => toggleExpand(article.id)}
      onToggleReport={() => toggleReport(article.id)}
      onOpenSources={() => setSourcesArticle(article)}
      onAskFollowUp={() => setFollowUpArticle(article)}
      onListen={() => toggleListen(article)}
      onShare={() => handleShare(article)}
      onLike={() => handleLike(article)}
      onDislike={() => handleDislike(article)}
      onMore={() => setMenuArticle(article)}
    />
  );

  return (
    <View style={styles.fill}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ds.gray500} />
        }
      >
        <View style={styles.tabsBar}>
          <AuriaDiscoverTabs value={category} onChange={setCategory} />
          {searchOpen ? (
            <View style={styles.searchRow}>
              <AuriaIcon name="search" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.8} />
              <TextInput
                ref={searchRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search Discover…"
                placeholderTextColor={ds.gray400}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => {
                  setQuery('');
                  onCloseSearch?.();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close search"
              >
                <AuriaIcon name="close" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={2.2} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {loading && articles.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={ds.gray500} />
            <Text style={styles.loadingText}>Loading the latest…</Text>
          </View>
        ) : shown.length === 0 ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>
              {searching ? `No results for “${query.trim()}”` : 'No stories right now. Pull to refresh.'}
            </Text>
          </View>
        ) : (
          <View style={styles.feed}>
            {lead ? renderCard(lead) : null}
            {!searching ? <AuriaTopicChips prefs={topicPrefs} onCycle={cycleTopic} /> : null}
            {rest.map(renderCard)}
          </View>
        )}
      </ScrollView>

      <AuriaSourcesSheet
        visible={!!sourcesArticle}
        sources={sourcesArticle?.sources ?? []}
        onClose={() => setSourcesArticle(null)}
      />

      <AuriaFollowUpComposer
        visible={!!followUpArticle}
        article={followUpArticle}
        onClose={() => setFollowUpArticle(null)}
        onSend={(question) => {
          const article = followUpArticle;
          setFollowUpArticle(null);
          if (article) onAskFollowUp?.(article, question);
        }}
      />

      <AuriaArticleMenu
        visible={!!menuArticle}
        onClose={() => setMenuArticle(null)}
        onAction={handleMenuAction}
      />

      {customizeOpen ? (
        <View style={styles.customizeOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCloseCustomize} accessibilityLabel="Close customize" />
          <View style={styles.customizeSheet}>
            <View style={styles.sheetHandle} />
            <AuriaTopicChips prefs={topicPrefs} onCycle={cycleTopic} />
            <Pressable
              onPress={onCloseCustomize}
              style={({ pressed }) => [styles.doneBtn, pressed && styles.donePressed]}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    fill: { flex: 1 },
    scroll: { paddingBottom: AURIA_PANEL_SCROLL_END_PADDING },
    tabsBar: {
      paddingHorizontal: AURIA_CONTENT_HORIZONTAL_INSET,
      paddingBottom: 10,
      paddingTop: 2,
      backgroundColor: theme.colors.page,
      gap: 10,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 42,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: ds.sectionFill,
    },
    searchInput: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 15,
      color: ds.gray900,
      backgroundColor: 'transparent',
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
    feed: { paddingHorizontal: AURIA_CONTENT_HORIZONTAL_INSET, gap: 22 },
    loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
    loadingText: { ...auriaTypography.body, color: ds.gray500, fontSize: 14 },
    customizeOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
      zIndex: 50,
    },
    customizeSheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 28,
      gap: 14,
    },
    sheetHandle: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: ds.gray300 },
    doneBtn: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.offBlack },
    donePressed: { transform: [{ scale: 0.99 }] },
    doneText: { ...auriaTypography.body, color: ds.white, fontSize: 16, fontWeight: theme.typography.fontWeight.bold },
  });
}
