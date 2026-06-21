import { Platform } from 'react-native';
import type {
  DiscoverArticle,
  DiscoverCategory,
  DiscoverSource,
  DiscoverTopic,
} from './newsTypes';
import { domainOf, faviconForDomain, slugify } from './newsFormat';
import { discoverFallback } from '../../data/auriaDiscoverFallback';

/**
 * Live Discover data from real, general-news RSS feeds (BBC + The Guardian)
 * across distinct categories, reshaped into the Perplexity-style model: each
 * story gets a multi-point Summary and a Sources list synthesised from the real
 * sibling articles. On web the feeds are read through a CORS proxy; on native
 * they're fetched directly. Falls back to the Spaceflight News API and then a
 * curated dataset so the feed is never empty.
 */

const FETCH_TIMEOUT_MS = 9000;

/** Real RSS feeds per tab — multiple outlets so sources stay varied. */
const CATEGORY_FEEDS: Record<DiscoverCategory, string[]> = {
  'for-you': [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://www.theguardian.com/world/rss',
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
  ],
  top: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://www.theguardian.com/uk-news/rss',
  ],
  tech: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://www.theguardian.com/technology/rss',
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  ],
  business: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://www.theguardian.com/business/rss',
  ],
};

const SITE_NAMES: Record<string, string> = {
  'bbc.com': 'BBC',
  'bbc.co.uk': 'BBC',
  'theguardian.com': 'The Guardian',
  'reuters.com': 'Reuters',
  'nytimes.com': 'The New York Times',
  'cnbc.com': 'CNBC',
  'ft.com': 'Financial Times',
};

function siteNameFor(domain: string): string {
  if (SITE_NAMES[domain]) return SITE_NAMES[domain];
  const core = domain.replace(/\.(com|co\.uk|org|net|io|news)$/, '').split('.').pop() ?? domain;
  return core.charAt(0).toUpperCase() + core.slice(1);
}

/** Decode the handful of HTML entities that appear in RSS text. */
function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

type RawItem = {
  title: string;
  url: string;
  summary: string;
  image: string;
  domain: string;
  siteName: string;
  publishedAt: string;
};

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? m[1] : '';
}

function finalizeImage(url: string): string {
  let out = url.replace(/&amp;/g, '&');
  // BBC thumbnails default to 240px — upscale to a card-worthy size.
  if (out.includes('ichef.bbci.co.uk')) out = out.replace(/\/(?:120|144|200|240|320|480|624)\//, '/800/');
  return out;
}

function extractImage(block: string): string {
  // <media:content> often appears at several widths (e.g. The Guardian) — pick
  // the largest, since each width carries its own valid signed URL.
  const mediaContents = [...block.matchAll(/<media:content\b[^>]*>/gi)];
  let bestUrl = '';
  let bestWidth = -1;
  for (const m of mediaContents) {
    const tag = m[0];
    const urlMatch = tag.match(/url=["']([^"']+)["']/i);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    if (!/\.(jpg|jpeg|png|webp)/i.test(url) && !/guim\.co\.uk|media/i.test(url)) continue;
    const widthMatch = tag.match(/width=["'](\d+)["']/i);
    const width = widthMatch ? Number(widthMatch[1]) : 0;
    if (width >= bestWidth) {
      bestWidth = width;
      bestUrl = url;
    }
  }
  if (bestUrl) return finalizeImage(bestUrl);

  const fallbacks = [
    /<media:thumbnail[^>]*url=["']([^"']+)["']/i,
    /<enclosure[^>]*url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
    /<img[^>]*src=["']([^"']+)["']/i,
  ];
  for (const p of fallbacks) {
    const m = block.match(p);
    if (m) return finalizeImage(m[1]);
  }
  return '';
}

function parseFeed(xml: string): RawItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const items: RawItem[] = [];
  for (const block of blocks) {
    const title = decodeEntities(tag(block, 'title'));
    let url = decodeEntities(tag(block, 'link'));
    if (!url) {
      const href = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      url = href ? href[1] : '';
    }
    if (!title || !url) continue;
    const domain = domainOf(url);
    const summary = decodeEntities(tag(block, 'description') || tag(block, 'summary'));
    const pub = tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated');
    items.push({
      title,
      url,
      summary,
      image: extractImage(block),
      domain,
      siteName: siteNameFor(domain),
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
    });
  }
  return items;
}

/** On web, route through a CORS proxy; native fetches the feed directly. */
function feedUrl(raw: string): string {
  return Platform.OS === 'web'
    ? `https://corsproxy.io/?url=${encodeURIComponent(raw)}`
    : raw;
}

async function fetchFeed(raw: string): Promise<RawItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feedUrl(raw), { signal: controller.signal });
    if (!res.ok) return [];
    return parseFeed(await res.text());
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function toBullets(summary: string): string[] {
  return summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24)
    .slice(0, 4);
}

function inferTopics(text: string): DiscoverTopic[] {
  const t = text.toLowerCase();
  const topics: DiscoverTopic[] = [];
  if (/\b(ai|tech|robot|software|chip|app|google|apple|meta|startup)\b/.test(t)) topics.push('Tech');
  if (/\b(science|research|space|nasa|climate|study|physics|health|disease)\b/.test(t)) topics.push('Science');
  if (/\b(fund|invest|market|stock|economy|bank|trade|company|business|price)\b/.test(t)) topics.push('Finance');
  if (/\b(government|minister|election|parliament|senate|policy|president|labour|tory)\b/.test(t)) topics.push('US Politics');
  if (/\b(world|global|china|europe|ukraine|gaza|war|nation)\b/.test(t)) topics.push('World');
  if (/\b(sport|football|league|cup|olympic|tennis|cricket|match)\b/.test(t)) topics.push('Sports');
  return topics.length ? topics : ['World'];
}

function buildSources(self: RawItem, siblings: RawItem[]): DiscoverSource[] {
  const primary: DiscoverSource = {
    id: `${slugify(self.title)}-0`,
    index: 1,
    title: self.title,
    excerpt: self.summary.slice(0, 200),
    siteName: self.siteName,
    slug: slugify(self.siteName),
    favicon: faviconForDomain(self.domain),
    url: self.url,
  };
  const seenSites = new Set([self.siteName]);
  const related: DiscoverSource[] = [];
  for (const s of siblings) {
    if (related.length >= 4) break;
    if (s.url === self.url) continue;
    if (seenSites.has(s.siteName) && related.length > 1) continue;
    seenSites.add(s.siteName);
    related.push({
      id: `${slugify(self.title)}-${related.length + 1}`,
      index: related.length + 2,
      title: s.title,
      excerpt: s.summary.slice(0, 200),
      siteName: s.siteName,
      slug: slugify(s.siteName),
      favicon: faviconForDomain(s.domain),
      url: s.url,
    });
  }
  return [primary, ...related];
}

function mapItem(item: RawItem, pool: RawItem[], category: DiscoverCategory): DiscoverArticle {
  const sources = buildSources(item, pool);
  const bullets: DiscoverArticle['bullets'] = [];
  toBullets(item.summary).forEach((text, i) => {
    bullets.push({
      text,
      sourceSlug: sources[Math.min(i + 1, sources.length - 1)]?.slug ?? sources[0].slug,
      extraSources: sources.length > 2 && i === 0 ? 1 : 0,
    });
  });
  if (bullets.length < 3) {
    for (const s of sources.slice(1)) {
      if (bullets.length >= 4) break;
      if (!s.excerpt) continue;
      bullets.push({ text: s.excerpt, sourceSlug: s.slug, extraSources: 0 });
    }
  }
  return {
    id: slugify(item.title).slice(0, 48) || item.url,
    title: item.title,
    summary: item.summary || item.title,
    bullets: bullets.length ? bullets : [{ text: item.summary || item.title, sourceSlug: sources[0].slug, extraSources: 0 }],
    imageUrl: item.image,
    sourceName: item.siteName,
    sourceSlug: slugify(item.siteName),
    sourceFavicon: faviconForDomain(item.domain),
    url: item.url,
    publishedAt: item.publishedAt,
    category,
    topics: inferTopics(`${item.title} ${item.summary}`),
    sources,
  };
}

/** Spaceflight News API — reliable, CORS-enabled, image-bearing tech/space
 *  news. Used as a fallback when the RSS feeds can't be reached. */
async function spaceflightFallback(category: DiscoverCategory): Promise<DiscoverArticle[]> {
  try {
    const res = await fetch(
      `https://api.spaceflightnewsapi.net/v4/articles/?limit=24&ordering=-published_at`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: Array<{ id: number; title: string; url: string; image_url: string; news_site: string; summary: string; published_at: string }> };
    const items: RawItem[] = (json.results ?? [])
      .filter((r) => r.image_url && r.title)
      .map((r) => ({
        title: r.title,
        url: r.url,
        summary: (r.summary || '').replace(/\s*The post .*$/i, '').trim(),
        image: r.image_url,
        domain: domainOf(r.url) || slugify(r.news_site),
        siteName: r.news_site,
        publishedAt: r.published_at,
      }));
    return items.map((it) => mapItem(it, items, category));
  } catch {
    return [];
  }
}

export async function fetchDiscoverFeed(category: DiscoverCategory): Promise<DiscoverArticle[]> {
  const feeds = CATEGORY_FEEDS[category];
  const settled = await Promise.allSettled(feeds.map(fetchFeed));
  const merged: RawItem[] = [];
  const seen = new Set<string>();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  merged.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

  const withImage = merged.filter((i) => i.image);
  if (withImage.length >= 4) {
    // Use image-bearing items for cards; the full merged pool feeds Sources.
    return withImage.map((it) => mapItem(it, merged, category));
  }

  const space = await spaceflightFallback(category);
  if (space.length) return space;
  return discoverFallback();
}
