import type { AuriaChatMessage } from './types';

/**
 * The saved reasoning to offer under "Thinking", as the web does: for an answer
 * reopened from the history (it has no work panel), or for a turn that stopped
 * midway, where the reasoning says more than the few steps that came out.
 * A finished turn of this session already tells its story in the work panel.
 */
export function savedThinking(message: AuriaChatMessage): string | null {
  const text = message.reasoningText?.trim();
  if (!text || message.role !== 'assistant' || message.live) return null;
  const work = message.work?.status;
  if (work && work !== 'stopped' && work !== 'failed') return null;
  return text;
}
