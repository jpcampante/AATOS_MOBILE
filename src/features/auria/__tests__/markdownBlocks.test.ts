import { markdownToPlainText, softenPartialMarkdown, splitBlocks } from '../markdownBlocks';

describe('splitBlocks', () => {
  it('splits on blank lines', () => {
    expect(splitBlocks('# Title\n\nFirst paragraph\nstill first\n\n- a\n- b')).toEqual([
      '# Title',
      'First paragraph\nstill first',
      '- a\n- b',
    ]);
  });

  it('keeps a code fence whole, blank lines included', () => {
    const text = 'Intro\n\n```ts\nconst a = 1;\n\nconst b = 2;\n```\n\nAfter';
    expect(splitBlocks(text)).toEqual(['Intro', '```ts\nconst a = 1;\n\nconst b = 2;\n```', 'After']);
  });

  it('keeps an unclosed fence (still streaming) as the last block', () => {
    expect(splitBlocks('Text\n\n```\ncode\n\nmore')).toEqual(['Text', '```\ncode\n\nmore']);
  });

  it('ignores extra blank lines and CRLF', () => {
    expect(splitBlocks('\r\n\r\nA\r\n\r\n\r\nB\r\n')).toEqual(['A', 'B']);
    expect(splitBlocks('')).toEqual([]);
  });
});

describe('softenPartialMarkdown', () => {
  it('shows a half-received link as its label', () => {
    expect(softenPartialMarkdown('See [the report](https://exa')).toBe('See the report');
    expect(softenPartialMarkdown('See [the rep')).toBe('See ');
  });

  it('drops a dangling bold marker', () => {
    expect(softenPartialMarkdown('This is **')).toBe('This is ');
  });

  it('leaves complete Markdown alone', () => {
    expect(softenPartialMarkdown('A [link](https://a.b) and **bold**')).toBe('A [link](https://a.b) and **bold**');
  });
});

describe('markdownToPlainText', () => {
  it('strips formatting for copy and read aloud', () => {
    const md = '## Plan\n\n**Bold** and *italic* with `code` and [a link](https://x.y).\n\n- one\n- two\n\n| A | B |\n|---|---|\n| 1 | 2 |';
    expect(markdownToPlainText(md)).toBe('Plan\n\nBold and italic with code and a link.\n\n• one\n• two\n\n| A | B |\n| 1 | 2 |');
  });
});
