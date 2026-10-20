/**
 * Helpers to render a streaming Markdown answer cheaply: the text is split in
 * blocks (blank-line separated, code fences kept whole) so only the last block
 * is re-parsed while the answer grows.
 */

/** Splits Markdown into top-level blocks. Never splits inside a ``` / ~~~ fence. */
export function splitBlocks(text: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  let fence: string | null = null;

  const flush = () => {
    const block = current.join('\n').replace(/^\n+|\n+$/g, '');
    if (block) blocks.push(block);
    current = [];
  };

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const marker = /^\s*(```|~~~)/.exec(line)?.[1] ?? null;
    if (marker) {
      if (fence === null) fence = marker;
      else if (marker === fence) fence = null;
    }
    if (fence === null && line.trim() === '' && !marker) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();
  return blocks;
}

/**
 * The live tail of an answer can end mid-syntax. Show a half-received link as
 * its label only, and drop a dangling `[`, `![` or `**` so it doesn't flash as text.
 */
export function softenPartialMarkdown(block: string): string {
  return block
    .replace(/!?\[([^\]]*)\]\([^)]*$/, '$1')
    .replace(/!?\[[^\]]*$/, '')
    // Only an unmatched marker is dangling; `**bold**` at the end is complete.
    .replace(/(\*\*|__)\s*$/, (marker) => ((block.match(/\*\*|__/g)?.length ?? 0) % 2 === 1 ? '' : marker));
}

/** Plain text of an answer, for copy, share and read aloud. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // [ \t] and not \s: in multiline mode \s would also eat the blank line above.
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
    .replace(/^[ \t]*[-*+][ \t]+/gm, '• ')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*\n?/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
