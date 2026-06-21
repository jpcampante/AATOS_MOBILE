/**
 * Discover (News) domain model. Mirrors a Perplexity-style feed: each story has
 * a hero image, a primary source, an AI-style bullet summary, and a list of the
 * real sources it was synthesised from.
 */

/** Tabs across the top of Discover. */
export type DiscoverCategory =
  | 'for-you'
  | 'top'
  | 'tech'
  | 'business';

export const DISCOVER_CATEGORIES: { id: DiscoverCategory; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'top', label: 'Top Stories' },
  { id: 'tech', label: 'Tech & Science' },
  { id: 'business', label: 'Business' },
];

/** "Help us fine-tune your feed" preference chips. */
export const DISCOVER_TOPICS = [
  'US Politics',
  'Tech',
  'Finance',
  'Sports',
  'Entertainment',
  'Science',
  'Health',
  'World',
] as const;
export type DiscoverTopic = (typeof DISCOVER_TOPICS)[number];

/** Per-topic preference: untouched, surfaced more, or surfaced less. */
export type TopicPreference = 'neutral' | 'more' | 'less';

/** One source backing a story, shown in the Sources sheet and as inline chips. */
export type DiscoverSource = {
  id: string;
  /** 1-based index shown in the Sources sheet. */
  index: number;
  title: string;
  excerpt: string;
  /** Human-readable site name, e.g. "SpaceNews". */
  siteName: string;
  /** Short slug used for the inline chip, e.g. "spacenews". */
  slug: string;
  /** Real favicon URL for the source domain. */
  favicon: string;
  url: string;
};

/** A single Discover story. */
export type DiscoverArticle = {
  id: string;
  title: string;
  /** One-paragraph teaser shown on the card. */
  summary: string;
  /** AI-style bullet points for the detail view, each tied to a source slug. */
  bullets: { text: string; sourceSlug: string; extraSources: number }[];
  imageUrl: string;
  /** Primary publisher name, shown as the card watermark. */
  sourceName: string;
  sourceSlug: string;
  sourceFavicon: string;
  url: string;
  /** ISO timestamp of publication. */
  publishedAt: string;
  category: DiscoverCategory;
  topics: DiscoverTopic[];
  sources: DiscoverSource[];
};
