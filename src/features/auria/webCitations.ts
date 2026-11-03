/**
 * The `[n]` citations the Auria writes in an answer, turned into something the
 * Markdown renderer can draw as a chip.
 *
 * The web rewrites the parsed tree (`remarkWebCitations`); here the text is
 * rewritten before `react-native-marked` parses it, so a citation becomes a
 * link with the `auriacite:` scheme that `AuriaMarkdown` renders as a chip.
 * Only an `[n]` the server actually sent as a source counts, and code, links
 * and images are left exactly as they are.
 */
import type { WebSource } from './webResult';

/** The link scheme that marks a citation (never a real URL). */
// No hyphen: the Markdown renderer only treats `scheme:` as a URL when the
// scheme is plain letters, and a mangled href would never reach the chip.
export const CITATION_SCHEME = 'auriacite:';

/** The source a citation link points at, or null when the href is a normal link. */
export function citationIndex(href: string): number | null {
  if (!href.startsWith(CITATION_SCHEME)) return null;
  const index = Number(href.slice(CITATION_SCHEME.length));
  return Number.isSafeInteger(index) && index > 0 ? index : null;
}

/** Spans of the text the rewrite must not touch: fenced blocks and inline code. */
function opaqueSpans(text: string): [number, number][] {
  const spans: [number, number][] = [];
  for (const match of text.matchAll(/```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`/g)) {
    spans.push([match.index, match.index + match[0].length]);
  }
  return spans;
}

/**
 * Rewrites every `[n]` that matches a source into a citation link. An `[n]`
 * that is already a markdown link or reference (`[1](…)`, `[1][ref]`), one
 * inside code, or one with no source behind it stays plain text.
 */
export function linkCitations(text: string, sources: WebSource[]): string {
  if (!text || sources.length === 0) return text;
  const known = new Set(sources.map((s) => s.index));
  const opaque = opaqueSpans(text);
  let out = '';
  let last = 0;
  for (const match of text.matchAll(/\[(\d{1,2})\]/g)) {
    const index = Number(match[1]);
    const start = match.index;
    const end = start + match[0].length;
    if (!known.has(index)) continue;
    if (opaque.some(([from, to]) => start >= from && end <= to)) continue;
    // Already a link or a reference: the answer meant it as one. `[1][2]`, with
    // both sent as sources, is a group of citations, not a reference.
    if (text[end] === '(') continue;
    if (text[end] === '[') {
      const next = /^\[(\d{1,2})\]/.exec(text.slice(end));
      if (!next || !known.has(Number(next[1]))) continue;
    }
    out += text.slice(last, start) + `[[${index}]](${CITATION_SCHEME}${index})`;
    last = end;
  }
  return last === 0 ? text : out + text.slice(last);
}
