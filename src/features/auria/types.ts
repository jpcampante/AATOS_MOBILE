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

/** Collapsible chain-of-thought shown above an answer ("Thought for Ns"). */
export type AuriaReasoning = {
  durationSec: number;
  steps: string[];
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
