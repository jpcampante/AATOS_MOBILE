import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { savedThinking } from '../../features/auria/thinking';
import type { AuriaDocument } from '../../features/auria/documents';
import type { AuriaChatMessage } from '../../features/auria/types';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaDocumentCard } from './AuriaDocumentCard';
import { AuriaGeneratedImage } from './AuriaGeneratedImage';
import { AuriaMarkdown } from './AuriaMarkdown';
import { AuriaMessageActions } from './AuriaMessageActions';
import { AuriaReasoningBlock } from './AuriaReasoningBlock';
import { AuriaSourceChips } from './AuriaSourceChips';
import { AuriaThinkingDisclosure } from './AuriaThinkingDisclosure';
import { AuriaWebEvidence } from './AuriaWebEvidence';
import { AuriaTypingCursor } from './AuriaTypingCursor';
import { AuriaWorkPanel } from './work/AuriaWorkPanel';

type AuriaAssistantContentProps = {
  message: AuriaChatMessage;
  onOpenFiles?: () => void;
  modelLabel?: string;
  onRetry?: (messageId: string) => void;
  /** Like / unlike a saved answer (E22). */
  onToggleLike?: (messageId: string) => void;
  /** The version switcher `< 2/3 >`, drawn at the start of the actions row. */
  versionSwitcher?: ReactNode;
  onActionFeedback?: (message: string) => void;
  /** Opens a document this answer wrote (A040). */
  onOpenDocument?: (document: AuriaDocument) => void;
};

/**
 * Inside an Auria answer bubble: the work panel, the saved thinking, the text
 * (growing with a cursor while it streams), and, once it settles, sources,
 * artifacts and the actions.
 */
export function AuriaAssistantContent({
  message,
  onOpenFiles,
  modelLabel,
  onRetry,
  onToggleLike,
  versionSwitcher,
  onActionFeedback,
  onOpenDocument,
}: AuriaAssistantContentProps) {
  const { ds } = useTheme();
  const live = !!message.live;
  // Hold the trailing content back until the answer is settled.
  const revealRest = !live;
  const thinking = savedThinking(message);

  return (
    <>
      {/* What the Auria is doing / did in this turn ("Working for 6s" → "Reasoned for 8 seconds"). */}
      {message.work ? <AuriaWorkPanel run={message.work} /> : null}
      {/* Saved reasoning: answers from the history, or a turn that stopped midway. */}
      {thinking ? <AuriaThinkingDisclosure text={thinking} /> : null}
      {message.reasoning ? <AuriaReasoningBlock reasoning={message.reasoning} onOpenFiles={onOpenFiles} /> : null}
      {message.text ? (
        <AuriaMarkdown text={message.text} live={live} sources={message.web?.sources ?? []} />
      ) : null}
      {live && message.text ? <AuriaTypingCursor color={ds.gray500} style={styles.cursor} /> : null}
      {message.status ? (
        <Text style={[styles.statusNote, { color: ds.gray500 }]}>{message.status === 'stopped' ? 'Stopped' : 'Interrupted'}</Text>
      ) : null}
      {/* What the web search did for this turn: progress while it runs, then the sources. */}
      {message.web ? <AuriaWebEvidence result={message.web} /> : null}
      {revealRest && message.sources && message.sources.length > 0 ? (
        <AuriaSourceChips sources={message.sources} onOpenFiles={onOpenFiles} />
      ) : null}
      {/* Documents this turn wrote (E29): read only on the phone (D-07). */}
      {message.documents?.length ? (
        <View style={styles.documents}>
          {message.documents.map((document) => (
            <AuriaDocumentCard key={document.id} document={document} onOpen={onOpenDocument} />
          ))}
        </View>
      ) : null}
      {/* An image the Auria made (E06): the server saves it as its own message. */}
      {message.imageUrl ? (
        <AuriaGeneratedImage url={message.imageUrl} prompt={message.text} onFeedback={onActionFeedback} />
      ) : null}
      {revealRest && message.text ? (
        <AuriaMessageActions
          text={message.text}
          modelLabel={modelLabel}
          leading={versionSwitcher}
          // Only a saved answer has a version to replace.
          onRetry={onRetry && message.serverId ? () => onRetry(message.id) : undefined}
          liked={!!message.liked}
          onToggleLike={onToggleLike && message.serverId ? () => onToggleLike(message.id) : undefined}
          onFeedback={onActionFeedback}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  cursor: {
    ...auriaTypography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  statusNote: {
    ...auriaTypography.body,
    fontSize: 12,
  },
  documents: {
    gap: 8,
    marginTop: 10,
  },
});
