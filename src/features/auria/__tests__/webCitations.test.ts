import { citationIndex, linkCitations } from '../webCitations';
import type { WebSource } from '../webResult';

const source = (index: number): WebSource => ({
  index,
  url: `https://site${index}.example/a`,
  title: `Source ${index}`,
  domain: `site${index}.example`,
});

const sources = [source(1), source(2)];

describe('linkCitations', () => {
  it('turns a citation the server sent into a citation link', () => {
    expect(linkCitations('The price rose [1].', sources)).toBe('The price rose [[1]](auriacite:1).');
  });

  it('turns each citation of a group', () => {
    expect(linkCitations('Both agree [1][2].', sources)).toBe('Both agree [[1]](auriacite:1)[[2]](auriacite:2).');
  });

  it('leaves an index with no source behind it alone', () => {
    expect(linkCitations('See note [7].', sources)).toBe('See note [7].');
  });

  it('leaves a real markdown link alone', () => {
    expect(linkCitations('See [1](https://other.example).', sources)).toBe('See [1](https://other.example).');
  });

  it('leaves code untouched', () => {
    expect(linkCitations('Use `list[1]` here.', sources)).toBe('Use `list[1]` here.');
    expect(linkCitations('```\nitems[1]\n```', sources)).toBe('```\nitems[1]\n```');
  });

  it('keeps the text as it is when the turn has no sources', () => {
    expect(linkCitations('Nothing to cite [1].', [])).toBe('Nothing to cite [1].');
  });
});

describe('citationIndex', () => {
  it('reads the source of a citation link', () => {
    expect(citationIndex('auriacite:2')).toBe(2);
  });

  it('is null for a normal link', () => {
    expect(citationIndex('https://example.com')).toBeNull();
    expect(citationIndex('auriacite:0')).toBeNull();
    expect(citationIndex('auriacite:x')).toBeNull();
  });
});
