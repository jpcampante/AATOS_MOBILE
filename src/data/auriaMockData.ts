import { contentColors } from '../theme/aatosTheme';

export const auriaWorkspaceName = 'New workspace';
export const auriaWelcomeName = 'Marta';
export const auriaProfileInitials = 'MA';

export const auriaWelcomeSuggestionPool = [
  'Create prioritized task list',
  'Generate report summary',
  'Structure presentation outline',
  'Summarize last meeting notes',
  'Draft follow-up email to client',
  'Plan sprint priorities for next week',
  'Review contract key terms',
  'Outline Q3 growth strategy',
] as const;

export const auriaSidebarTopItems = [
  { id: 'gallery' as const, label: 'Gallery', icon: 'photo' as const },
  { id: 'news' as const, label: 'News', icon: 'newspaper' as const },
  { id: 'more' as const, label: 'More', icon: 'moreHorizontal' as const },
];

export type AuriaPanel = 'chat' | 'news' | 'gallery' | 'search' | 'projects' | 'settings';
export type AuriaProjectVisibility = 'Team' | 'Shared';

export type AuriaProject = {
  id: string;
  name: string;
  owner: string;
  emoji: string;
  accent: string;
  visibility: AuriaProjectVisibility;
  updatedLabel: string;
  fileCount: number;
  chatCount: number;
  /** Icon id from PROJECT_ICON_OPTIONS. */
  iconId?: string;
  description?: string;
  /** Pinned projects sort to the top and show a pin marker. */
  pinned?: boolean;
  /** Whether the signed-in user created it (vs shared into it). */
  createdByYou?: boolean;
};


export type AuriaSidebarProjectRow = {
  id: string;
  name: string;
  kind: 'new' | 'folder' | 'more';
};

export const PROJECT_ACCENT_PALETTE = contentColors.project;

export type AuriaNewsTopic = 'Business' | 'Technology' | 'Markets' | 'World';

export type AuriaNewsArticle = {
  id: string;
  title: string;
  summary: string;
  sources: number;
  publishedAgo: string;
  accent: string;
  topics: AuriaNewsTopic[];
  featured?: boolean;
};

export const auriaNewsArticles: AuriaNewsArticle[] = [
  {
    id: '1',
    title: 'Germany, France and the UK outline plan to engage Putin in Ukraine negotiations',
    summary:
      'European leaders are discussing a joint roadmap to reopen talks with Moscow, focused on security guarantees and a partial ceasefire.',
    sources: 59,
    publishedAgo: '1 hour ago',
    accent: contentColors.news[0],
    topics: ['World', 'Business'],
    featured: true,
  },
  {
    id: '2',
    title: 'Ukraine strikes oil terminal near Saint Petersburg',
    summary:
      'A new strike near a major export terminal renewed concerns about regional energy supply.',
    sources: 43,
    publishedAgo: '2 hours ago',
    accent: contentColors.news[1],
    topics: ['World', 'Markets'],
  },
  {
    id: '3',
    title: 'Iranian drone attack hits airport in Kuwait',
    summary:
      'Air traffic was disrupted after a drone incident affected airport operations and security.',
    sources: 38,
    publishedAgo: '3 hours ago',
    accent: contentColors.news[2],
    topics: ['World', 'Technology'],
  },
  {
    id: '4',
    title: 'Bolivian defense minister resigns after political crisis',
    summary:
      'The resignation adds pressure to a government already navigating a fast-moving political crisis.',
    sources: 29,
    publishedAgo: '4 hours ago',
    accent: contentColors.news[3],
    topics: ['World', 'Business'],
  },
];

export type AuriaGalleryCategory = 'Image' | 'Document' | 'Spreadsheet' | 'PDF' | 'Data';

export type AuriaGalleryItem = {
  id: string;
  name: string;
  type: AuriaGalleryCategory;
  accent: string;
  text: string;
  modifiedLabel: string;
  sizeLabel: string;
  source: string;
};

export const auriaGalleryItems: AuriaGalleryItem[] = [
  {
    id: 'g1',
    name: 'Q1 Strategy Brief.pdf',
    type: 'PDF',
    accent: contentColors.gallery.pdf.surface,
    text: contentColors.gallery.pdf.text,
    modifiedLabel: 'Updated 1 hour ago',
    sizeLabel: '2.4 MB',
    source: 'Strategy chat',
  },
  {
    id: 'g2',
    name: 'Team photo - Lisbon offsite.jpg',
    type: 'Image',
    accent: contentColors.gallery.imageBlue.surface,
    text: contentColors.gallery.imageBlue.text,
    modifiedLabel: 'Updated yesterday',
    sizeLabel: '4.8 MB',
    source: 'People workspace',
  },
  {
    id: 'g3',
    name: 'Customer interview notes.md',
    type: 'Document',
    accent: contentColors.gallery.document.surface,
    text: contentColors.gallery.document.text,
    modifiedLabel: 'Updated 2 days ago',
    sizeLabel: '84 KB',
    source: 'Research chat',
  },
  {
    id: 'g4',
    name: 'Pipeline export.csv',
    type: 'Spreadsheet',
    accent: contentColors.gallery.data.surface,
    text: contentColors.gallery.data.text,
    modifiedLabel: 'Updated 3 days ago',
    sizeLabel: '1.1 MB',
    source: 'Sales workspace',
  },
  {
    id: 'g5',
    name: 'Brand moodboard.png',
    type: 'Image',
    accent: contentColors.gallery.imageGold.surface,
    text: contentColors.gallery.imageGold.text,
    modifiedLabel: 'Updated last week',
    sizeLabel: '6.2 MB',
    source: 'Brand project',
  },
  {
    id: 'g6',
    name: 'Board memo.pdf',
    type: 'PDF',
    accent: contentColors.gallery.pdf.surface,
    text: contentColors.gallery.pdf.text,
    modifiedLabel: 'Updated last week',
    sizeLabel: '940 KB',
    source: 'Board update chat',
  },
  {
    id: 'g7',
    name: 'Sales QBR deck.pptx',
    type: 'Document',
    accent: contentColors.gallery.pdf.surface,
    text: contentColors.gallery.pdf.text,
    modifiedLabel: 'Updated last week',
    sizeLabel: '3.1 MB',
    source: 'Sales workspace',
  },
  {
    id: 'g8',
    name: 'Workspace architecture.png',
    type: 'Image',
    accent: contentColors.gallery.imageBlue.surface,
    text: contentColors.gallery.imageBlue.text,
    modifiedLabel: 'Updated last week',
    sizeLabel: '5.7 MB',
    source: 'Product workspace',
  },
  {
    id: 'g9',
    name: 'Renewal executive brief.docx',
    type: 'Document',
    accent: contentColors.gallery.document.surface,
    text: contentColors.gallery.document.text,
    modifiedLabel: 'Updated 2 weeks ago',
    sizeLabel: '96 KB',
    source: 'Account workspace',
  },
  {
    id: 'g10',
    name: 'Campaign visual concept.png',
    type: 'Image',
    accent: contentColors.gallery.imageGold.surface,
    text: contentColors.gallery.imageGold.text,
    modifiedLabel: 'Updated 2 weeks ago',
    sizeLabel: '7.4 MB',
    source: 'Marketing workspace',
  },
  {
    id: 'g11',
    name: 'Agents sales analysis.docx',
    type: 'Document',
    accent: contentColors.gallery.document.surface,
    text: contentColors.gallery.document.text,
    modifiedLabel: 'Updated 3 weeks ago',
    sizeLabel: '688 KB',
    source: 'Sales workspace',
  },
  {
    id: 'g12',
    name: 'Business efficiency report.pdf',
    type: 'PDF',
    accent: contentColors.gallery.pdf.surface,
    text: contentColors.gallery.pdf.text,
    modifiedLabel: 'Updated last month',
    sizeLabel: '621 KB',
    source: 'Operations workspace',
  },
];

export const auriaRecentSearches = [
  'Legal contract review',
  'Q2 pipeline summary',
  'Customer onboarding deck',
] as const;

export const auriaSearchResults = {
  chats: [
    { id: 'c1', title: 'Summarize Q2 pipeline', preview: 'Auria · yesterday' },
    { id: 'c2', title: 'Draft customer follow-up', preview: 'Auria · 2 days ago' },
  ],
  projects: [
    { id: 'f-finance', name: 'Finance team', meta: '3 files · 2 chats' },
    { id: 'f-sales', name: 'Sales team', meta: '5 files · 4 chats' },
  ],
  files: [
    { id: 'file1', name: 'Board memo.pdf', meta: 'Updated 1 hour ago' },
    { id: 'file2', name: 'Team photo.jpg', meta: 'Updated yesterday' },
  ],
} as const;

export const auriaProjects: AuriaProject[] = [
  {
    id: 'f-finance',
    name: 'Finance team',
    owner: 'Finance team',
    emoji: '$',
    accent: contentColors.project[0],
    visibility: 'Team',
    updatedLabel: 'Updated 2 hours ago',
    fileCount: 8,
    chatCount: 3,
    iconId: 'bar-chart',
    description: 'Budgets, forecasts and board financials for the finance org.',
    pinned: true,
    createdByYou: true,
  },
  {
    id: 'f-projects',
    name: 'Delivery team',
    owner: 'Delivery team',
    emoji: 'P',
    accent: contentColors.project[1],
    visibility: 'Team',
    updatedLabel: 'Updated yesterday',
    fileCount: 12,
    chatCount: 5,
    iconId: 'package',
    description: 'Delivery plans, status updates and customer rollouts.',
    pinned: true,
    createdByYou: true,
  },
  {
    id: 'f-sales',
    name: 'Sales team',
    owner: 'Sales team',
    emoji: 'S',
    accent: contentColors.project[2],
    visibility: 'Team',
    updatedLabel: 'Updated 4 hours ago',
    fileCount: 6,
    chatCount: 2,
    iconId: 'target',
    description: 'Pipeline, proposals and account plans for the sales team.',
    createdByYou: true,
  },
  {
    id: 'f-legal',
    name: 'Legal team',
    owner: 'Legal team',
    emoji: 'L',
    accent: contentColors.project[3],
    visibility: 'Shared',
    updatedLabel: 'Updated last week',
    fileCount: 4,
    chatCount: 1,
    iconId: 'shield',
    description: 'Contracts, reviews and compliance shared across the company.',
  },
];

export const auriaConversations = [
  { id: 'h1', title: 'Rewrite Terms of Service', pinned: true },
  { id: 'h2', title: 'Summarize Q2 pipeline', pinned: false },
  { id: 'h3', title: 'Draft board update', pinned: false },
  { id: 'h4', title: 'Customer onboarding plan', pinned: false },
  { id: 'h5', title: 'Legal contract review', pinned: false },
] as const;

export const auriaSidebarProjects: AuriaSidebarProjectRow[] = [
  { id: 'new', name: 'New project', kind: 'new' },
  { id: 'f-finance', name: 'Finance team', kind: 'folder' },
  { id: 'f-sales', name: 'Sales team', kind: 'folder' },
  { id: 'f-legal', name: 'Legal team', kind: 'folder' },
  { id: 'more', name: 'See more', kind: 'more' },
];
