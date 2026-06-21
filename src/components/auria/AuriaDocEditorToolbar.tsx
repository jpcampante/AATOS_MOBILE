import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AuriaIconName } from '../icons';

export type DocFormatAction =
  | 'mention'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'color'
  | 'highlight'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'bullet'
  | 'checklist'
  | 'numbered'
  | 'outdent'
  | 'indent'
  | 'heading';

type ToolKind = 'icon' | 'glyph' | 'divider';

type Tool = {
  id: DocFormatAction;
  kind: ToolKind;
  icon?: AuriaIconName;
  glyph?: string;
  /** Text style applied to a letter glyph (B / I / U / S). */
  glyphStyle?: 'bold' | 'italic' | 'underline' | 'strike';
  label?: string;
};

const DIVIDER: Tool = { id: 'mention', kind: 'divider' };

/** Same tool set & order as the reference editor (Docs-style). */
const TOOLS: Tool[] = [
  { id: 'mention', kind: 'icon', icon: 'atSymbol', label: 'Mention' },
  { ...DIVIDER },
  { id: 'bold', kind: 'glyph', glyph: 'B', glyphStyle: 'bold', label: 'Bold' },
  { id: 'italic', kind: 'glyph', glyph: 'I', glyphStyle: 'italic', label: 'Italic' },
  { id: 'underline', kind: 'glyph', glyph: 'U', glyphStyle: 'underline', label: 'Underline' },
  { id: 'strike', kind: 'glyph', glyph: 'S', glyphStyle: 'strike', label: 'Strikethrough' },
  { id: 'color', kind: 'glyph', glyph: 'A', label: 'Text color' },
  { id: 'highlight', kind: 'icon', icon: 'highlighter', label: 'Highlight' },
  { ...DIVIDER },
  { id: 'align-left', kind: 'icon', icon: 'alignLeft', label: 'Align left' },
  { id: 'align-center', kind: 'icon', icon: 'alignCenter', label: 'Align center' },
  { id: 'align-right', kind: 'icon', icon: 'alignRight', label: 'Align right' },
  { ...DIVIDER },
  { id: 'bullet', kind: 'icon', icon: 'list', label: 'Bulleted list' },
  { id: 'checklist', kind: 'icon', icon: 'listCheck', label: 'Checklist' },
  { id: 'numbered', kind: 'icon', icon: 'listNumbered', label: 'Numbered list' },
  { ...DIVIDER },
  { id: 'outdent', kind: 'icon', icon: 'indentDecrease', label: 'Decrease indent' },
  { id: 'indent', kind: 'icon', icon: 'indentIncrease', label: 'Increase indent' },
];

export function AuriaDocEditorToolbar({
  active,
  onAction,
}: {
  /** Set of currently-active formats (for pressed styling). */
  active: Set<DocFormatAction>;
  onAction: (action: DocFormatAction) => void;
}) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  const renderButton = (tool: Tool, index: number) => {
    if (tool.kind === 'divider') {
      return <View key={`div-${index}`} style={styles.divider} />;
    }
    const isActive = active.has(tool.id);
    return (
      <Pressable
        key={tool.id}
        onPress={() => onAction(tool.id)}
        style={({ pressed }) => [
          styles.btn,
          isActive && styles.btnActive,
          pressed && styles.btnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={tool.label}
        accessibilityState={{ selected: isActive }}
      >
        {tool.kind === 'glyph' ? (
          <View style={styles.glyphWrap}>
            <Text
              style={[
                styles.glyph,
                tool.glyphStyle === 'bold' && styles.glyphBold,
                tool.glyphStyle === 'italic' && styles.glyphItalic,
                tool.glyphStyle === 'underline' && styles.glyphUnderline,
                tool.glyphStyle === 'strike' && styles.glyphStrike,
                isActive && styles.glyphActive,
              ]}
            >
              {tool.glyph}
            </Text>
            {tool.id === 'color' ? <View style={styles.colorBar} /> : null}
          </View>
        ) : (
          <AuriaIcon
            name={tool.icon as AuriaIconName}
            size={20}
            color={isActive ? ds.gray900 : ds.gray700}
            strokeWidth={1.9}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {TOOLS.map(renderButton)}
      </ScrollView>
      <View style={styles.pinnedDivider} />
      <Pressable
        onPress={() => onAction('heading')}
        style={({ pressed }) => [
          styles.btn,
          styles.pinnedBtn,
          active.has('heading') && styles.btnActive,
          pressed && styles.btnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Text style"
      >
        <Text style={[styles.glyph, styles.glyphStyleBtn, active.has('heading') && styles.glyphActive]}>
          A
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      backgroundColor: ds.gray50,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.gray200,
      paddingRight: 4,
    },
    scroll: { flex: 1 },
    scrollContent: { alignItems: 'center', paddingHorizontal: 4, gap: 2 },
    btn: {
      minWidth: 38,
      height: 38,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
    },
    btnActive: { backgroundColor: ds.gray200 },
    btnPressed: { backgroundColor: ds.gray100 },
    divider: { width: StyleSheet.hairlineWidth, height: 24, marginHorizontal: 6, backgroundColor: ds.gray300 },
    pinnedDivider: { width: StyleSheet.hairlineWidth, height: 24, marginHorizontal: 4, backgroundColor: ds.gray300 },
    pinnedBtn: { backgroundColor: ds.gray100 },
    glyphWrap: { alignItems: 'center', justifyContent: 'center' },
    glyph: {
      ...auriaTypography.body,
      fontSize: 18,
      lineHeight: 22,
      color: ds.gray800,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    glyphActive: { color: ds.gray900 },
    glyphBold: { fontWeight: theme.typography.fontWeight.bold },
    glyphItalic: { fontStyle: 'italic', fontWeight: theme.typography.fontWeight.medium },
    glyphUnderline: { textDecorationLine: 'underline', fontWeight: theme.typography.fontWeight.medium },
    glyphStrike: { textDecorationLine: 'line-through', fontWeight: theme.typography.fontWeight.medium },
    glyphStyleBtn: { fontWeight: theme.typography.fontWeight.bold, fontSize: 19 },
    colorBar: {
      marginTop: 1,
      width: 18,
      height: 3,
      borderRadius: 2,
      backgroundColor: ds.auriaBlue,
    },
  });
}
