import type { AuriaChatMessage } from '../../features/auria/types';
import { AuriaActionSheet, type AuriaSheetAction } from './AuriaActionSheet';

type AuriaQuestionMenuProps = {
  /** The person's message that was long-pressed (null: closed). */
  message: AuriaChatMessage | null;
  onClose: () => void;
  onCopy: (message: AuriaChatMessage) => void;
  /** Absent when the chat can't continue (imported, or an answer is running). */
  onEdit?: (message: AuriaChatMessage) => void;
};

const PREVIEW = 80;

/** Long-press sheet for one of the person's messages: copy it, or edit it (E20). */
export function AuriaQuestionMenu({ message, onClose, onCopy, onEdit }: AuriaQuestionMenuProps) {
  if (!message) return null;
  const preview = message.text.length > PREVIEW ? `${message.text.slice(0, PREVIEW)}…` : message.text;
  const act = (run: (m: AuriaChatMessage) => void) => () => {
    onClose();
    run(message);
  };
  const actions: AuriaSheetAction[] = [];
  if (message.text) actions.push({ icon: 'copy', label: 'Copy', onPress: act(onCopy) });
  if (onEdit && message.serverId) actions.push({ icon: 'pencil', label: 'Edit', onPress: act(onEdit) });

  return <AuriaActionSheet title={preview || 'Your message'} onClose={onClose} actions={actions} />;
}
