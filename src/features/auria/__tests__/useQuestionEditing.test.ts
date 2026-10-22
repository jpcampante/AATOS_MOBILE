import { act, renderHook } from '@testing-library/react-native';
import type { AuriaChatMessage } from '../types';
import { useQuestionEditing } from '../useQuestionEditing';

const question: AuriaChatMessage = { id: 'u-1', serverId: 'u-1', role: 'user', text: 'What are my tasks?' };

function setup(saveEdit = jest.fn(() => true)) {
  const setComposerText = jest.fn();
  const hook = renderHook(() => useQuestionEditing({ saveEdit, setComposerText }));
  return { ...hook, saveEdit, setComposerText };
}

describe('useQuestionEditing', () => {
  it('opens and closes the menu of a question', () => {
    const { result } = setup();
    act(() => result.current.openMenu(question));
    expect(result.current.menuFor).toBe(question);
    act(() => result.current.closeMenu());
    expect(result.current.menuFor).toBeNull();
  });

  it('puts the question in the composer and saves the edit on send', () => {
    const { result, saveEdit, setComposerText } = setup();
    act(() => result.current.start(question));
    expect(result.current.editing).toBe(question);
    expect(setComposerText).toHaveBeenLastCalledWith('What are my tasks?');

    let saved = false;
    act(() => {
      saved = result.current.submit('What are my tasks this week?');
    });
    expect(saved).toBe(true);
    expect(saveEdit).toHaveBeenCalledWith('u-1', 'What are my tasks this week?');
    expect(result.current.editing).toBeNull();
    expect(setComposerText).toHaveBeenLastCalledWith('');
  });

  it('keeps editing when the edit could not start (e.g. out of credits) or the text is empty', () => {
    const { result, saveEdit } = setup(jest.fn(() => false));
    act(() => result.current.start(question));
    act(() => {
      result.current.submit('   ');
      result.current.submit('New text');
    });
    expect(saveEdit).toHaveBeenCalledTimes(1);
    expect(result.current.editing).toBe(question);
  });

  it('cancels back to an empty composer, and does nothing when not editing', () => {
    const { result, setComposerText } = setup();
    act(() => result.current.cancel());
    expect(setComposerText).not.toHaveBeenCalled();
    act(() => result.current.start(question));
    act(() => result.current.cancel());
    expect(result.current.editing).toBeNull();
    expect(setComposerText).toHaveBeenLastCalledWith('');
  });
});
