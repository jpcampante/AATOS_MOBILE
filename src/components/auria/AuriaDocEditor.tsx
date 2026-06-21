import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { AuriaDocEditorToolbar, DocFormatAction } from './AuriaDocEditorToolbar';

type Selection = { start: number; end: number };
type Align = 'left' | 'center' | 'right';

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

  const [titleText, setTitleText] = useState(title);
  const [bodyText, setBodyText] = useState(body);
  const [selection, setSelection] = useState<Selection>({ start: body.length, end: body.length });
  const [align, setAlign] = useState<Align>('left');
  const [marks, setMarks] = useState<Set<DocFormatAction>>(new Set());
  const [editing, setEditing] = useState(false);

  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  // Reset to the artifact's content each time the editor is opened.
  useEffect(() => {
    if (visible) {
      setTitleText(title);
      setBodyText(body);
      setSelection({ start: body.length, end: body.length });
      setAlign('left');
      setMarks(new Set());
      undoStack.current = [];
      redoStack.current = [];
    }
  }, [visible, title, body]);

  const pushHistory = () => {
    undoStack.current.push(bodyText);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
  };

  const toggleMark = (mark: DocFormatAction) => {
    setMarks((current) => {
      const next = new Set(current);
      next.has(mark) ? next.delete(mark) : next.add(mark);
      return next;
    });
  };

  const replaceRange = (start: number, end: number, insert: string, caret: Selection) => {
    pushHistory();
    setBodyText((current) => current.slice(0, start) + insert + current.slice(end));
    setSelection(caret);
  };

  const wrap = (pre: string, post: string) => {
    const { start, end } = selection;
    const sel = bodyText.slice(start, end);
    replaceRange(start, end, `${pre}${sel}${post}`, {
      start: start + pre.length,
      end: start + pre.length + sel.length,
    });
  };

  const lineStartFor = (pos: number) => bodyText.lastIndexOf('\n', pos - 1) + 1;

  const prefixLine = (prefix: string) => {
    const ls = lineStartFor(selection.start);
    replaceRange(ls, ls, prefix, {
      start: selection.start + prefix.length,
      end: selection.end + prefix.length,
    });
  };

  const changeIndent = (increase: boolean) => {
    const ls = lineStartFor(selection.start);
    if (increase) {
      replaceRange(ls, ls, '  ', { start: selection.start + 2, end: selection.end + 2 });
    } else {
      const lead = bodyText.slice(ls).match(/^ {1,2}/)?.[0] ?? '';
      if (!lead) return;
      replaceRange(ls, ls + lead.length, '', {
        start: Math.max(ls, selection.start - lead.length),
        end: Math.max(ls, selection.end - lead.length),
      });
    }
  };

  const insertAtCursor = (text: string) => {
    const { start, end } = selection;
    replaceRange(start, end, text, { start: start + text.length, end: start + text.length });
  };

  const handleAction = (action: DocFormatAction) => {
    switch (action) {
      case 'mention':
        insertAtCursor('@');
        break;
      case 'bold':
        wrap('**', '**');
        toggleMark('bold');
        break;
      case 'italic':
        wrap('*', '*');
        toggleMark('italic');
        break;
      case 'underline':
        wrap('<u>', '</u>');
        toggleMark('underline');
        break;
      case 'strike':
        wrap('~~', '~~');
        toggleMark('strike');
        break;
      case 'highlight':
        wrap('==', '==');
        toggleMark('highlight');
        break;
      case 'color':
        toggleMark('color');
        break;
      case 'align-left':
        setAlign('left');
        break;
      case 'align-center':
        setAlign('center');
        break;
      case 'align-right':
        setAlign('right');
        break;
      case 'bullet':
        prefixLine('•  ');
        break;
      case 'checklist':
        prefixLine('☐  ');
        break;
      case 'numbered':
        prefixLine('1.  ');
        break;
      case 'indent':
        changeIndent(true);
        break;
      case 'outdent':
        changeIndent(false);
        break;
      case 'heading':
        prefixLine('# ');
        toggleMark('heading');
        break;
    }
  };

  const undo = () => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push(bodyText);
    const prev = undoStack.current.pop() as string;
    setBodyText(prev);
  };
  const redo = () => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push(bodyText);
    const next = redoStack.current.pop() as string;
    setBodyText(next);
  };

  const activeSet = useMemo(() => {
    const set = new Set(marks);
    set.add(`align-${align}` as DocFormatAction);
    return set;
  }, [marks, align]);

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
      style={({ pressed }) => [styles.topBtn, pressed && styles.topBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AuriaIcon name={icon} size={21} color={dim ? ds.gray300 : ds.gray700} strokeWidth={1.9} />
    </Pressable>
  );

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
            <TopButton icon="plus" onPress={() => insertAtCursor('\n')} label="Insert" />
            <TopButton icon="sparkles" onPress={() => undefined} label="Ask Auria" />
            <TopButton icon="moreHorizontal" onPress={() => undefined} label="More" />
          </View>
        </View>

        <View style={styles.content}>
          <TextInput
            value={titleText}
            onChangeText={setTitleText}
            style={styles.title}
            placeholder="Title"
            placeholderTextColor={ds.gray400}
            multiline
          />
          <TextInput
            value={bodyText}
            onChangeText={(text) => {
              setBodyText(text);
            }}
            onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
            onFocus={() => setEditing(true)}
            onBlur={() => setEditing(false)}
            selection={selection}
            style={[styles.body, { textAlign: align }]}
            multiline
            scrollEnabled
            textAlignVertical="top"
            placeholder="Start writing…"
            placeholderTextColor={ds.gray400}
          />
        </View>

        <View style={{ paddingBottom: editing ? 0 : insets.bottom }}>
          <AuriaDocEditorToolbar active={activeSet} onAction={handleAction} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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
    topBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    topBtnPressed: { backgroundColor: ds.gray100 },
    content: { flex: 1, paddingHorizontal: 20 },
    title: {
      ...auriaTypography.title,
      fontSize: 30,
      lineHeight: 38,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.5,
      color: ds.gray900,
      paddingTop: 8,
      paddingBottom: 6,
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
    body: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 16,
      lineHeight: 25,
      color: ds.gray800,
      paddingTop: 4,
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
  });
}
