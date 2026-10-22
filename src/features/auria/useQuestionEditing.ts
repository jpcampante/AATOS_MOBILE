import { useCallback, useState } from 'react';
import type { AuriaChatMessage } from './types';

type QuestionEditingOptions = {
  /** Saves the edit (behind the screen's rules, e.g. credits). False when it didn't start. */
  saveEdit: (questionId: string, text: string) => boolean;
  /** The composer's text: editing borrows the composer. */
  setComposerText: (text: string) => void;
};

/**
 * Long-press actions on the person's messages: which one has the menu open,
 * and which one is being edited in the composer (the next send saves the edit).
 */
export function useQuestionEditing({ saveEdit, setComposerText }: QuestionEditingOptions) {
  const [menuFor, setMenuFor] = useState<AuriaChatMessage | null>(null);
  const [editing, setEditing] = useState<AuriaChatMessage | null>(null);

  const openMenu = useCallback((message: AuriaChatMessage) => setMenuFor(message), []);
  const closeMenu = useCallback(() => setMenuFor(null), []);

  const start = useCallback(
    (message: AuriaChatMessage) => {
      setEditing(message);
      setComposerText(message.text);
    },
    [setComposerText],
  );

  /** Leaves editing and empties the composer. Nothing happens when not editing. */
  const cancel = useCallback(() => {
    if (!editing) return;
    setEditing(null);
    setComposerText('');
  }, [editing, setComposerText]);

  /** Saves the edited text. Returns true when the edit started (editing then ends). */
  const submit = useCallback(
    (text: string): boolean => {
      if (!editing || !text.trim() || !saveEdit(editing.id, text)) return false;
      setEditing(null);
      setComposerText('');
      return true;
    },
    [editing, saveEdit, setComposerText],
  );

  return { menuFor, openMenu, closeMenu, editing, start, cancel, submit };
}
