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

export type AuriaChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  artifact?: AuriaArtifact;
  reasoning?: AuriaReasoning;
  sources?: AuriaSource[];
};
