import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMarkdown, type useMarkdownHookOptions } from 'react-native-marked';
import { softenPartialMarkdown, splitBlocks } from '../../features/auria/markdownBlocks';
import { usePacedText } from '../../features/auria/usePacedText';
import { auriaTypography, useTheme } from '../../theme';

type AuriaMarkdownProps = {
  /** GitHub-flavored Markdown, as the Auria writes it. */
  text: string;
  /** The answer is still streaming: pace the reveal and soften a half-written tail. */
  live?: boolean;
};

/**
 * An Auria answer rendered as Markdown (headings, lists, bold, code, tables,
 * links) with the theme tokens. While streaming, only the last block is
 * re-parsed; finished blocks are memoized.
 */
export function AuriaMarkdown({ text, live = false }: AuriaMarkdownProps) {
  const shown = usePacedText(text, live);
  const options = useMarkdownOptions();
  const blocks = useMemo(() => splitBlocks(shown), [shown]);

  return (
    <View style={styles.root}>
      {blocks.map((block, index) => {
        const isTail = live && index === blocks.length - 1;
        return <MarkdownBlock key={index} value={isTail ? softenPartialMarkdown(block) : block} options={options} />;
      })}
    </View>
  );
}

const MarkdownBlock = memo(function MarkdownBlock({
  value,
  options,
}: {
  value: string;
  options: useMarkdownHookOptions;
}) {
  const elements = useMarkdown(value, options);
  return <View>{elements}</View>;
});

function useMarkdownOptions(): useMarkdownHookOptions {
  const { ds, theme, isDark } = useTheme();
  return useMemo(() => {
    const body = { ...auriaTypography.body, fontSize: 15, lineHeight: 22, color: ds.gray900 };
    const heading = { ...auriaTypography.title, color: ds.gray900, fontWeight: theme.typography.fontWeight.semibold };
    const mono = { fontFamily: 'monospace', fontSize: 13, lineHeight: 19, color: ds.gray900 };
    return {
      colorScheme: isDark ? 'dark' : 'light',
      // Plain text in the chat: selecting needs a long-press that fights the scroll.
      selectable: false,
      theme: {
        colors: { text: ds.gray900, link: ds.auriaBlue, code: ds.gray100, border: ds.gray200 },
        spacing: { xs: 2, s: 4, m: 8, l: 12 },
      },
      styles: {
        text: body,
        paragraph: { paddingVertical: 2 },
        strong: { fontWeight: theme.typography.fontWeight.semibold },
        em: { fontStyle: 'italic' },
        link: { color: ds.auriaBlue, textDecorationLine: 'underline' },
        h1: { ...heading, fontSize: 22, lineHeight: 28, marginVertical: 4 },
        h2: { ...heading, fontSize: 19, lineHeight: 25, marginVertical: 4 },
        h3: { ...heading, fontSize: 17, lineHeight: 23, marginVertical: 2 },
        h4: { ...heading, fontSize: 15, lineHeight: 22 },
        h5: { ...heading, fontSize: 15, lineHeight: 22 },
        h6: { ...heading, fontSize: 15, lineHeight: 22 },
        codespan: { ...mono, fontStyle: 'normal', backgroundColor: ds.gray100 },
        code: { backgroundColor: ds.gray100, borderRadius: 10, padding: 10, marginVertical: 4 },
        codeText: mono,
        blockquote: { borderLeftWidth: 3, borderLeftColor: ds.gray200, paddingLeft: 10 },
        hr: { backgroundColor: ds.gray200, height: StyleSheet.hairlineWidth, marginVertical: 8 },
        li: body,
        table: { borderWidth: StyleSheet.hairlineWidth, borderColor: ds.gray200, marginVertical: 4 },
        tableCell: { padding: 6 },
      },
    };
  }, [ds, theme, isDark]);
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
});
