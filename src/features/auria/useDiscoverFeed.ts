import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchDiscoverFeed } from './newsService';
import { cycleDiscoverTopic, useDiscoverPrefs } from './discoverPrefsStore';
import type {
  DiscoverArticle,
  DiscoverCategory,
  DiscoverTopic,
  TopicPreference,
} from './newsTypes';

type TopicPrefs = Partial<Record<DiscoverTopic, TopicPreference>>;

/** Re-rank a feed so "more" topics float up and "less" topics sink. */
function applyPrefs(articles: DiscoverArticle[], prefs: TopicPrefs): DiscoverArticle[] {
  const score = (a: DiscoverArticle) =>
    a.topics.reduce((sum, t) => {
      const p = prefs[t];
      return sum + (p === 'more' ? 1 : p === 'less' ? -1 : 0);
    }, 0);
  // Stable sort by preference score (descending); ties keep original order.
  return articles
    .map((a, i) => ({ a, i, s: score(a) }))
    .sort((x, y) => y.s - x.s || x.i - y.i)
    .map((e) => e.a);
}

/**
 * Drives the Discover feed: fetches real articles per category, exposes
 * loading / refreshing state, and tracks per-topic preferences that re-rank
 * the feed (the "Help us fine-tune your feed" chips).
 */
export function useDiscoverFeed(initialCategory: DiscoverCategory = 'for-you') {
  const [category, setCategory] = useState<DiscoverCategory>(initialCategory);
  const [raw, setRaw] = useState<DiscoverArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const topicPrefs = useDiscoverPrefs();
  // Cache per category so switching tabs back is instant.
  const cache = useRef<Map<DiscoverCategory, DiscoverArticle[]>>(new Map());
  const reqId = useRef(0);

  const load = useCallback(
    async (cat: DiscoverCategory, mode: 'initial' | 'refresh') => {
      const id = ++reqId.current;
      if (mode === 'refresh') setRefreshing(true);
      else {
        const cached = cache.current.get(cat);
        if (cached) {
          setRaw(cached);
          setLoading(false);
        } else {
          setLoading(true);
        }
      }
      const articles = await fetchDiscoverFeed(cat);
      if (id !== reqId.current) return; // a newer request superseded this one
      cache.current.set(cat, articles);
      setRaw(articles);
      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    void load(category, 'initial');
  }, [category, load]);

  const refresh = useCallback(() => {
    cache.current.delete(category);
    void load(category, 'refresh');
  }, [category, load]);

  const cycleTopic = useCallback((topic: DiscoverTopic) => {
    cycleDiscoverTopic(topic);
  }, []);

  const articles = useMemo(() => applyPrefs(raw, topicPrefs), [raw, topicPrefs]);

  return {
    category,
    setCategory,
    articles,
    loading,
    refreshing,
    refresh,
    topicPrefs,
    cycleTopic,
  };
}
