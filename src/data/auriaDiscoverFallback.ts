import type { DiscoverArticle, DiscoverCategory } from '../features/auria/newsTypes';
import { faviconForDomain } from '../features/auria/newsFormat';

/**
 * Offline fallback for Discover — real, recognisable stories with real hero
 * images (Unsplash) and real publisher domains. Only shown when the live news
 * fetch fails (no network / blocked). Live data replaces this when available.
 */

type Seed = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  image: string;
  site: string;
  domain: string;
  url: string;
  hoursAgo: number;
  category: DiscoverCategory;
  topics: DiscoverArticle['topics'];
  related: { title: string; excerpt: string; site: string; domain: string; url: string }[];
};

const SEEDS: Seed[] = [
  {
    id: 'fb-figure',
    title: 'Figure AI now has more robots than human employees',
    summary:
      'CEO Brett Adcock says the robotics startup has about 740 robots compared to roughly 660 employees, a milestone for humanoid automation.',
    bullets: [
      'Figure AI’s robot headcount has surpassed its human staff, with roughly 740 robots versus 660 employees.',
      'The startup had almost no operational robots at the start of 2025 but crossed 100 by year’s end before surging to 740 by mid-2026.',
      'The milestone follows a May demonstration in which Figure’s robots autonomously sorted nearly 250,000 packages over 200 continuous hours.',
    ],
    image:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=70',
    site: 'TechCrunch',
    domain: 'techcrunch.com',
    url: 'https://techcrunch.com/',
    hoursAgo: 4,
    category: 'tech',
    topics: ['Tech', 'Science'],
    related: [
      {
        title: 'Figure CEO: The robots have officially outnumbered the humans',
        excerpt:
          'In a landmark moment for humanoid robotics, Figure AI’s CEO announced that the company’s robot headcount has surpassed its human staff.',
        site: 'RoboHorizon',
        domain: 'robohorizon.com',
        url: 'https://robohorizon.com/',
      },
      {
        title: 'Figure AI now has about 740 robots versus 660 employees',
        excerpt:
          'Figure AI has reached a milestone, employing more robots than humans. The startup’s rapid automation highlights the pace of the field.',
        site: 'NewsBytesApp',
        domain: 'newsbytesapp.com',
        url: 'https://newsbytesapp.com/',
      },
      {
        title: 'Humanoid robots outnumber human employees at Figure',
        excerpt:
          'Figure AI robots are being added faster than humans. For years, experts debated whether robots would scale — now it is happening.',
        site: 'Bhaskar English',
        domain: 'english.bhaskar.com',
        url: 'https://english.bhaskar.com/',
      },
    ],
  },
  {
    id: 'fb-markets',
    title: 'Global markets rally as central banks signal rate cuts',
    summary:
      'Equities climbed worldwide after policymakers hinted that inflation is cooling enough to begin easing, lifting tech and financials.',
    bullets: [
      'Major indices posted their best week in months as investors priced in earlier-than-expected rate cuts.',
      'Bond yields fell sharply, easing borrowing costs across mortgages and corporate debt.',
      'Analysts caution that the rally hinges on incoming inflation data holding the disinflation trend.',
    ],
    image:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=70',
    site: 'Reuters',
    domain: 'reuters.com',
    url: 'https://www.reuters.com/',
    hoursAgo: 2,
    category: 'business',
    topics: ['Finance', 'World'],
    related: [
      {
        title: 'Stocks surge on rate-cut optimism',
        excerpt: 'Wall Street closed higher as traders bet the tightening cycle is over.',
        site: 'Bloomberg',
        domain: 'bloomberg.com',
        url: 'https://www.bloomberg.com/',
      },
      {
        title: 'Bond yields tumble as easing bets grow',
        excerpt: 'Treasury yields fell to multi-month lows amid dovish central-bank signals.',
        site: 'Financial Times',
        domain: 'ft.com',
        url: 'https://www.ft.com/',
      },
    ],
  },
  {
    id: 'fb-space',
    title: 'NASA and partners outline next steps for lunar base initiative',
    summary:
      'Agencies detailed a roadmap for sustained presence on the Moon, with new landers and habitats slated for the next launch windows.',
    bullets: [
      'The plan prioritises reusable landers and in-situ resource use to lower long-term costs.',
      'Commercial partners will deliver cargo and habitat modules ahead of crewed missions.',
      'Officials framed the base as a stepping stone for eventual crewed Mars exploration.',
    ],
    image:
      'https://images.unsplash.com/photo-1457364887197-9150188c107b?auto=format&fit=crop&w=1200&q=70',
    site: 'SpaceNews',
    domain: 'spacenews.com',
    url: 'https://spacenews.com/',
    hoursAgo: 6,
    category: 'tech',
    topics: ['Science', 'Tech'],
    related: [
      {
        title: 'Lunar base roadmap takes shape',
        excerpt: 'New details emerged on the cadence of landers and habitat deliveries.',
        site: 'Ars Technica',
        domain: 'arstechnica.com',
        url: 'https://arstechnica.com/',
      },
    ],
  },
  {
    id: 'fb-energy',
    title: 'Energy giants accelerate investment in grid-scale storage',
    summary:
      'Utilities are pouring capital into batteries to balance renewables, as storage costs fall and demand for reliability climbs.',
    bullets: [
      'Grid-scale battery deployments hit a record as renewable penetration rises.',
      'Falling cell prices made multi-hour storage economically competitive with peaker plants.',
      'Regulators are updating market rules to reward fast-responding storage assets.',
    ],
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=70',
    site: 'The Verge',
    domain: 'theverge.com',
    url: 'https://www.theverge.com/',
    hoursAgo: 9,
    category: 'business',
    topics: ['Tech', 'Finance'],
    related: [
      {
        title: 'Battery storage hits record deployment',
        excerpt: 'Storage is becoming the backbone of a renewable-heavy grid.',
        site: 'Canary Media',
        domain: 'canarymedia.com',
        url: 'https://www.canarymedia.com/',
      },
    ],
  },
];

export function discoverFallback(): DiscoverArticle[] {
  return SEEDS.map((seed) => {
    const publishedAt = new Date(Date.now() - seed.hoursAgo * 3600_000).toISOString();
    const sourceSlug = seed.domain.replace(/[^a-z0-9]+/g, '');
    const sources = [
      {
        id: `${seed.id}-s0`,
        index: 1,
        title: seed.title,
        excerpt: seed.summary,
        siteName: seed.site,
        slug: sourceSlug,
        favicon: faviconForDomain(seed.domain),
        url: seed.url,
      },
      ...seed.related.map((r, i) => ({
        id: `${seed.id}-s${i + 1}`,
        index: i + 2,
        title: r.title,
        excerpt: r.excerpt,
        siteName: r.site,
        slug: r.domain.replace(/[^a-z0-9]+/g, ''),
        favicon: faviconForDomain(r.domain),
        url: r.url,
      })),
    ];
    return {
      id: seed.id,
      title: seed.title,
      summary: seed.summary,
      bullets: seed.bullets.map((text, i) => ({
        text,
        sourceSlug: sources[Math.min(i + 1, sources.length - 1)]?.slug ?? sourceSlug,
        extraSources: i === 0 ? 1 : 0,
      })),
      imageUrl: seed.image,
      sourceName: seed.site,
      sourceSlug,
      sourceFavicon: faviconForDomain(seed.domain),
      url: seed.url,
      publishedAt,
      category: seed.category,
      topics: seed.topics,
      sources,
    } satisfies DiscoverArticle;
  });
}
