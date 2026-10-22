import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { savedThinking } from '../../features/auria/thinking';
import type { AuriaChatMessage } from '../../features/auria/types';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaDocumentArtifact } from './AuriaDocumentArtifact';
import { AuriaImageArtifact } from './AuriaImageArtifact';
import { AuriaMarkdown } from './AuriaMarkdown';
import { AuriaMessageActions } from './AuriaMessageActions';
import { AuriaReasoningBlock } from './AuriaReasoningBlock';
import { AuriaSourceChips } from './AuriaSourceChips';
import { AuriaThinkingDisclosure } from './AuriaThinkingDisclosure';
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
      {message.text ? <AuriaMarkdown text={message.text} live={live} /> : null}
      {live && message.text ? <AuriaTypingCursor color={ds.gray500} style={styles.cursor} /> : null}
      {message.status ? (
        <Text style={[styles.statusNote, { color: ds.gray500 }]}>{message.status === 'stopped' ? 'Stopped' : 'Interrupted'}</Text>
      ) : null}
      {revealRest && message.sources && message.sources.length > 0 ? (
        <AuriaSourceChips sources={message.sources} onOpenFiles={onOpenFiles} />
      ) : null}
      {revealRest && message.artifact?.kind === 'document' ? <AuriaDocumentArtifact artifact={message.artifact} /> : null}
      {revealRest && message.artifact?.kind === 'image' ? <AuriaImageArtifact artifact={message.artifact} /> : null}
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
});
