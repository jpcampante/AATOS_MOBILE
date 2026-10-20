export type AuriaDocumentArtifact = {
  kind: 'document';
  title: string;
  body: string;
};

export type AuriaImageArtifact = {
  kind: 'image';
  title: string;
  prompt: string;
  aspectRatio: number;
};

export type AuriaArtifact = AuriaDocumentArtifact | AuriaImageArtifact;

/**
 * A source consulted during a search step (favicon link pill).
 * `kind: 'web'` opens the URL; `kind: 'doc'` is an internal document that
 * opens in-app. Defaults to 'doc' for file-like labels, 'web' otherwise.
 */
export type AuriaThoughtSource = {
  label: string;
  kind?: 'web' | 'doc';
  /** Web target (for kind 'web'). */
  url?: string;
  /** Document type for the in-app viewer icon (for kind 'doc'). */
  docType?: 'pdf' | 'doc' | 'sheet';
  /** Excerpt shown when the internal document is opened. */
  excerpt?: string;
};

/**
 * One entry in the thinking timeline. Either a reasoning paragraph or a
 * web-search step with query chips and the sources it found. The lists are
 * complete — the UI shows a preview and a working "N more" toggle.
 */
export type AuriaThoughtStep = {
  kind: 'reasoning' | 'search';
  title: string;
  /** Reasoning paragraph (for kind 'reasoning'). */
  body?: string;
  /** Full list of search query chips (for kind 'search'). */
  queries?: string[];
  /** Full list of consulted sources. */
  sources?: AuriaThoughtSource[];
};

/** Chain-of-thought: a shimmering "Thinking" chip that opens the full timeline. */
export type AuriaReasoning = {
  durationSec: number;
  /** When true the chip reads "Thinking" with the live shimmer. */
  live?: boolean;
  steps: AuriaThoughtStep[];
};

export type AuriaSourceKind = 'pdf' | 'doc' | 'sheet' | 'image' | 'web';

/** A document/source the assistant consulted — rendered as a tappable chip. */
export type AuriaSource = {
  id: string;
  title: string;
  kind: AuriaSourceKind;
  /** e.g. "Strategy chat · 2.4 MB" or a domain. */
  meta?: string;
  /** A short excerpt shown when the chip is opened. */
  excerpt?: string;
};

/** A file attached to a message (uploaded by the person, from the app or the web). */
export type AuriaAttachment = {
  /** Attachment uuid on the server, when the URL is an Auria attachment. */
  id?: string;
  name: string;
  /** Absolute URL. `private` ones need the Bearer token to load. */
  url: string;
  isImage: boolean;
  private: boolean;
};

/** A conversation as the sidebar lists it. */
export type AuriaConversation = {
  id: string;
  title: string;
  /** Origin: `auria_system` (Auria), `aatos`, `chatgpt`, `anthropic`… — imported chats are read-only here. */
  provider: string;
  visibility: 'private' | 'public';
  ownerPublicUid: string | null;
  isPinned: boolean;
  lastActivity: string | null;
  messageCount: number | null;
  createdAt: string | null;
};

/** One page of a paginated list. */
export type AuriaPage<T> = {
  items: T[];
  count: number;
  hasMore: boolean;
};

export type AuriaChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Message uuid on the server (absent while a sent message is still local). */
  serverId?: string;
  createdAt?: string;
  /** Saved reasoning ("Thinking") text, as the server stored it. */
  reasoningText?: string;
  liked?: boolean;
  /** Which version of this message is shown (`< 2/3 >`), with all version ids. */
  version?: { index: number; count: number; ids: string[] };
  /** Real attachments (images and files) of the message. */
  files?: AuriaAttachment[];
  /** A generated image (absolute URL; generated images are public). */
  imageUrl?: string;
  mentions?: { userPublicUid: string; name?: string }[];
  /** The answer being written right now (its text grows as the stream arrives). */
  live?: boolean;
  /** An answer that did not finish: the person stopped it, or it failed midway. */
  status?: 'stopped' | 'error';
  /**
   * Image attachment URIs sent by the user. Rendered bare (outside the bubble):
   * a single image at its natural aspect ratio, multiple as a 2-column grid.
   */
  attachments?: string[];
  artifact?: AuriaArtifact;
  reasoning?: AuriaReasoning;
  sources?: AuriaSource[];
};
