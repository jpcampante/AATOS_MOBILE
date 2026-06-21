import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  activeMarksFor,
  buildSegments,
  diffEdit,
  type InlineMark,
  type MarkRange,
  shiftMarks,
  toggleMark,
  wordRangeAt,
} from '../../features/auria/richText';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { AuriaDocEditorToolbar, DocFormatAction } from './AuriaDocEditorToolbar';

type Selection = { start: number; end: number };
type Align = 'left' | 'center' | 'right';
type Snapshot = { text: string; marks: MarkRange[]; align: Align };

const HIGHLIGHT_BG = 'rgba(255, 214, 92, 0.5)';

export function AuriaDocEditor({
  visible,
  title,
  body,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const bodyBase = useMemo(() => bodyTextStyle(ds, theme), [ds, theme]);

  const [titleText, setTitleText] = useState(title);
  const [text, setText] = useState(body);
  const [marks, setMarks] = useState<MarkRange[]>([]);
  const [align, setAlign] = useState<Align>('left');
  // Selection is UNCONTROLLED (controlling it fights the keyboard and makes
  // format buttons land on the wrong range). We mirror it into a ref via
  // onSelectionChange — the ref survives the input blurring when a toolbar
  // button is pressed, so ops always read the user's real selection.
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const selRef = useRef<Selection>({ start: 0, end: 0 });
  const [editing, setEditing] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const lastPush = useRef(0);

  const trackSelection = (s: Selection) => {
    selRef.current = s;
    setSelection(s);
  };

  /** Reposition the caret/selection imperatively (uncontrolled input). */
  const setCaret = (start: number, end: number) => {
    trackSelection({ start, end });
    requestAnimationFrame(() => inputRef.current?.setNativeProps({ selection: { start, end } }));
  };

  // Reset to the artifact each time the editor opens.
  useEffect(() => {
    if (visible) {
      setTitleText(title);
      setText(body);
      setMarks([]);
      setAlign('left');
      trackSelection({ start: 0, end: 0 });
      undoStack.current = [];
      redoStack.current = [];
      lastPush.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, title, body]);

  const snapshot = (): Snapshot => ({ text, marks, align });

  const pushHistory = (force = false) => {
    const now = Date.now();
    if (!force && now - lastPush.current < 600 && undoStack.current.length > 0) return;
    lastPush.current = now;
    undoStack.current.push(snapshot());
    if (undoStack.current.length > 200) undoStack.current.shift();
    redoStack.current = [];
  };

  const restore = (snap: Snapshot) => {
    setText(snap.text);
    setMarks(snap.marks);
    setAlign(snap.align);
    setCaret(snap.text.length, snap.text.length);
  };

  const undo = () => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(snapshot());
    restore(prev);
  };
  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(snapshot());
    restore(next);
  };

  // --- typing: keep marks in sync with the platform's edits (selection is
  // uncontrolled, so the platform owns the caret) ---
  const onChangeText = (next: string) => {
    const d = diffEdit(text, next);
    // Coalesce rapid typing into one undo step; break on whitespace/paste.
    const breaks = d.insertLen !== 1 || /\s/.test(next.slice(d.from, d.from + d.insertLen));
    pushHistory(breaks);
    setMarks((current) => shiftMarks(current, d.from, d.to, d.insertLen));
    setText(next);
  };

  // --- helpers that edit the text + shift marks together ---
  const replaceText = (from: number, to: number, insert: string, caret: Selection) => {
    pushHistory(true);
    setMarks((current) => shiftMarks(current, from, to, insert.length));
    setText((current) => current.slice(0, from) + insert + current.slice(to));
    setCaret(caret.start, caret.end);
  };

  const lineStartAt = (pos: number) => text.lastIndexOf('\n', pos - 1) + 1;
  const lineEndAt = (pos: number) => {
    const idx = text.indexOf('\n', pos);
    return idx === -1 ? text.length : idx;
  };

  const togglePrefix = (build: (lineText: string) => string | null) => {
    const sel = selRef.current;
    const ls = lineStartAt(sel.start);
    const le = lineEndAt(sel.start);
    const lineText = text.slice(ls, le);
    const replacement = build(lineText);
    if (replacement === null) return;
    const delta = replacement.length - lineText.length;
    replaceText(ls, le, replacement, {
      start: Math.max(ls, sel.start + delta),
      end: Math.max(ls, sel.end + delta),
    });
  };

  const applyInline = (type: InlineMark) => {
    let { start, end } = selRef.current;
    if (start === end) {
      const word = wordRangeAt(text, start);
      start = word.start;
      end = word.end;
    }
    if (end <= start) return;
    pushHistory(true);
    setMarks((current) => toggleMark(current, type, start, end));
    setCaret(start, end);
  };

  const insertAtCaret = (insert: string) => {
    const sel = selRef.current;
    replaceText(sel.start, sel.end, insert, {
      start: sel.start + insert.length,
      end: sel.start + insert.length,
    });
  };

  const handleAction = (action: DocFormatAction) => {
    switch (action) {
      case 'bold':
        return applyInline('bold');
      case 'italic':
        return applyInline('italic');
      case 'underline':
        return applyInline('underline');
      case 'strike':
        return applyInline('strike');
      case 'color':
        return applyInline('color');
      case 'highlight':
        return applyInline('highlight');
      case 'mention':
        return insertAtCaret('@');
      case 'align-left':
        pushHistory(true);
        return setAlign('left');
      case 'align-center':
        pushHistory(true);
        return setAlign('center');
      case 'align-right':
        pushHistory(true);
        return setAlign('right');
      case 'bullet':
        return togglePrefix((l) =>
          /^•\s/.test(l) ? l.replace(/^•\s+/, '') : `• ${l.replace(/^(☐|☑|\d+\.)\s+/, '')}`,
        );
      case 'checklist':
        return togglePrefix((l) =>
          /^☐\s/.test(l)
            ? `☑ ${l.replace(/^☐\s+/, '')}`
            : /^☑\s/.test(l)
              ? l.replace(/^☑\s+/, '')
              : `☐ ${l.replace(/^(•|\d+\.)\s+/, '')}`,
        );
      case 'numbered':
        return togglePrefix((l) => {
          if (/^\d+\.\s/.test(l)) return l.replace(/^\d+\.\s+/, '');
          const ls = lineStartAt(selRef.current.start);
          const prevLineStart = text.lastIndexOf('\n', ls - 2) + 1;
          const prevLine = ls > 0 ? text.slice(prevLineStart, ls - 1) : '';
          const prevNum = prevLine.match(/^(\d+)\.\s/);
          const n = prevNum ? Number(prevNum[1]) + 1 : 1;
          return `${n}. ${l.replace(/^(•|☐|☑)\s+/, '')}`;
        });
      case 'indent':
        return togglePrefix((l) => `  ${l}`);
      case 'outdent':
        return togglePrefix((l) => l.replace(/^ {1,2}/, ''));
      case 'heading':
        // Make the whole current line a heading (bold emphasis).
        {
          const sel = selRef.current;
          const ls = lineStartAt(sel.start);
          const le = lineEndAt(sel.start);
          if (le <= ls) return;
          pushHistory(true);
          setMarks((current) => toggleMark(current, 'bold', ls, le));
          setCaret(ls, le);
        }
        return;
    }
  };

  const activeSet = useMemo(() => {
    const probe =
      selection.start === selection.end
        ? { start: Math.max(0, selection.start - 1), end: selection.start }
        : selection;
    const set = new Set<DocFormatAction>(
      [...activeMarksFor(marks, probe.start, probe.end)] as DocFormatAction[],
    );
    set.add(`align-${align}` as DocFormatAction);
    return set;
  }, [marks, selection, align]);

  const segments = useMemo(() => buildSegments(text, marks), [text, marks]);

  const TopButton = ({
    icon,
    onPress,
    label,
    dim,
  }: {
    icon: Parameters<typeof AuriaIcon>[0]['name'];
    onPress: () => void;
    label: string;
    dim?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      disabled={dim}
      style={({ pressed }) => [styles.topBtn, pressed && styles.topBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AuriaIcon name={icon} size={21} color={dim ? ds.gray300 : ds.gray700} strokeWidth={1.9} />
    </Pressable>
  );

  const alignStyle: TextStyle = { textAlign: align };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={6}
            style={({ pressed }) => [styles.topBtn, pressed && styles.topBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <AuriaIcon name="checkCircle" size={24} color={ds.auriaBlue} strokeWidth={2} />
          </Pressable>
          <View style={styles.topRight}>
            <TopButton icon="undo" onPress={undo} label="Undo" dim={undoStack.current.length === 0} />
            <TopButton icon="redo" onPress={redo} label="Redo" dim={redoStack.current.length === 0} />
            <TopButton icon="plus" onPress={() => insertAtCaret('\n')} label="Insert line" />
            <TopButton icon="sparkles" onPress={() => undefined} label="Ask Auria" />
            <TopButton icon="moreHorizontal" onPress={() => undefined} label="More" />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={titleText}
            onChangeText={setTitleText}
            style={[styles.title, alignStyle]}
            placeholder="Title"
            placeholderTextColor={ds.gray400}
            multiline
          />

          {/* WYSIWYG body: styled Text underneath, transparent editable input on top. */}
          <View style={styles.bodyStack}>
            <Text style={[bodyBase, alignStyle, styles.overlayText]} pointerEvents="none">
              {segments.length === 0
                ? ' '
                : segments.map((seg, i) => (
                    <Text key={i} style={inlineStyle(seg.types, ds)}>
                      {seg.text}
                    </Text>
                  ))}
            </Text>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={onChangeText}
              onSelectionChange={(e) => trackSelection(e.nativeEvent.selection)}
              onFocus={() => setEditing(true)}
              onBlur={() => setEditing(false)}
              style={[bodyBase, alignStyle, StyleSheet.absoluteFill, styles.input]}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Start writing…"
              placeholderTextColor={ds.gray400}
              selectionColor={ds.auriaBlue}
              {...(Platform.OS === 'android' ? { cursorColor: ds.auriaBlue } : null)}
            />
          </View>
        </ScrollView>

        <View style={{ paddingBottom: editing ? 0 : insets.bottom }}>
          <AuriaDocEditorToolbar active={activeSet} onAction={handleAction} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Shared typography so the Text overlay and the TextInput wrap identically. */
function bodyTextStyle(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
): TextStyle {
  return {
    ...auriaTypography.body,
    fontSize: 16,
    lineHeight: 25,
    color: ds.gray800,
    padding: 0,
    margin: 0,
    fontWeight: theme.typography.fontWeight.normal,
    ...(Platform.OS === 'android' ? ({ includeFontPadding: false } as TextStyle) : null),
  };
}

function inlineStyle(types: Set<InlineMark>, ds: ReturnType<typeof useTheme>['ds']): TextStyle {
  const style: TextStyle = {};
  if (types.has('bold')) style.fontWeight = '700';
  if (types.has('italic')) style.fontStyle = 'italic';
  const deco: string[] = [];
  if (types.has('underline')) deco.push('underline');
  if (types.has('strike')) deco.push('line-through');
  if (deco.length) style.textDecorationLine = deco.join(' ') as TextStyle['textDecorationLine'];
  if (types.has('color')) style.color = ds.auriaBlue;
  if (types.has('highlight')) style.backgroundColor = HIGHLIGHT_BG;
  return style;
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ds.gray50 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    topBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    topBtnPressed: { backgroundColor: ds.gray100 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
    title: {
      ...auriaTypography.title,
      fontSize: 30,
      lineHeight: 38,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.5,
      color: ds.gray900,
      paddingTop: 8,
      paddingBottom: 10,
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
    bodyStack: { position: 'relative', minHeight: 320 },
    overlayText: { minHeight: 25 },
    input: {
      color: 'transparent',
      ...(Platform.OS === 'web'
        ? ({ outlineWidth: 0, outlineStyle: 'none', caretColor: ds.auriaBlue } as object)
        : null),
    },
  });
}
