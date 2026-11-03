import { useCallback, useEffect, useRef, useState } from 'react';
import { isAuriaApiError } from './api/errors';
import { decideProposal, listChatProposals } from './api/documents';
import type { AuriaProposal } from './proposals';

export type ProposalDecision = 'apply' | 'reject';

/** What to tell the person when a decision did not go through. */
export const PROPOSAL_TEXT = {
  changed: 'This changed while you were deciding. Check it again.',
  failed: "The change couldn't be saved. Try again.",
} as const;

/**
 * The changes the Auria proposed in the open chat (E34) and the person's
 * decision on each (E35). A proposal is never saved by the app on its own: the
 * person applies or rejects it, and a server that refuses (409, because the
 * document or the proposal moved) makes the list be read again.
 */
export function useChatProposals(chatId: string | null) {
  const [proposals, setProposals] = useState<AuriaProposal[]>([]);
  const [deciding, setDeciding] = useState<string | null>(null);
  const chatRef = useRef(chatId);
  chatRef.current = chatId;

  const load = useCallback(async () => {
    const forChat = chatRef.current;
    if (!forChat) {
      setProposals([]);
      return;
    }
    try {
      const pending = await listChatProposals(forChat);
      if (chatRef.current === forChat) setProposals(pending);
    } catch {
      // The chat still works without the list; the next turn reads it again.
      if (chatRef.current === forChat) setProposals([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [chatId, load]);

  /** Applies or rejects one. Resolves with what to tell the person, or null. */
  const decide = useCallback(
    async (proposal: AuriaProposal, decision: ProposalDecision): Promise<string | null> => {
      setDeciding(proposal.id);
      try {
        await decideProposal(proposal, decision);
        setProposals((current) => current.filter((p) => p.id !== proposal.id));
        return null;
      } catch (err) {
        // 409: the document or the proposal moved. Never decide again on its own.
        const stale = isAuriaApiError(err) && err.status === 409;
        await load();
        return stale ? PROPOSAL_TEXT.changed : PROPOSAL_TEXT.failed;
      } finally {
        setDeciding(null);
      }
    },
    [load],
  );

  return { proposals, deciding, decide, reload: load };
}
