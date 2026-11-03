/**
 * A change the Auria proposes to a document: it is NOT saved until the person
 * applies it (E34, E35). This is what the app keeps of one and how the raw
 * payload becomes it.
 */
import type { AuriaDocumentFormat } from './documents';

export type AuriaProposal = {
  id: string;
  documentId: string;
  documentTitle: string;
  /** What changed, in the Auria's words. */
  summary: string;
  /** The title the document would get, when the proposal renames it. */
  title: string | null;
  /** The revision the person is deciding on; it goes back to the server. */
  revision: number;
  /** The proposal also changes the document's format (e.g. markdown → html). */
  formatChanges: boolean;
  format: AuriaDocumentFormat | null;
  status: string;
};

const FORMATS: AuriaDocumentFormat[] = ['markdown', 'html', 'plain', 'sheet-json', 'deck-json'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Reads a proposal payload (a `canvas_proposal` event, `saved` or E34). */
export function mapApiProposal(raw: unknown): AuriaProposal | null {
  if (!isRecord(raw)) return null;
  const { id, document_id: documentId } = raw;
  if (typeof id !== 'string' || !id || typeof documentId !== 'string' || !documentId) return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const format = typeof raw.format === 'string' && FORMATS.includes(raw.format as AuriaDocumentFormat)
    ? (raw.format as AuriaDocumentFormat)
    : null;
  return {
    id,
    documentId,
    documentTitle: (typeof raw.document_title === 'string' && raw.document_title.trim()) || 'Document',
    summary: (typeof raw.summary === 'string' && raw.summary.trim()) || 'Auria proposed a change.',
    title: title || null,
    revision: typeof raw.revision === 'number' && Number.isFinite(raw.revision) ? raw.revision : 0,
    formatChanges: raw.format_changes === true,
    format,
    status: typeof raw.status === 'string' ? raw.status : 'pending',
  };
}

/** The proposals still waiting, newest state of each, in the order they came. */
export function mapApiProposals(raw: unknown): AuriaProposal[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map<string, AuriaProposal>();
  for (const item of raw) {
    const proposal = mapApiProposal(item);
    if (proposal) byId.set(proposal.id, proposal);
  }
  return [...byId.values()].filter((proposal) => proposal.status === 'pending');
}
