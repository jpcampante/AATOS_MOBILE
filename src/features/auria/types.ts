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

export type AuriaChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  artifact?: AuriaArtifact;
};
