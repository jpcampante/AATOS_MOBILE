/**
 * A tiny rich-text model used by the document editor. Inline emphasis is stored
 * as character-range marks over a plain string, so the same text drives an
 * editable <TextInput> and a styled <Text> overlay (true WYSIWYG).
 */

export type InlineMark = 'bold' | 'italic' | 'underline' | 'strike' | 'highlight' | 'color';

export type MarkRange = { start: number; end: number; type: InlineMark };

export type StyledSegment = { text: string; types: Set<InlineMark> };

export const INLINE_MARKS: InlineMark[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'highlight',
  'color',
];

/** Clamp + drop empty/inverted ranges. */
function clean(ranges: MarkRange[]): MarkRange[] {
  return ranges.filter((r) => r.end > r.start);
}

/** Merge touching/overlapping ranges of the same type into a minimal set. */
function normalizeMarks(ranges: MarkRange[]): MarkRange[] {
  const out: MarkRange[] = [];
  for (const type of INLINE_MARKS) {
    const ofType = clean(ranges.filter((r) => r.type === type)).sort((a, b) => a.start - b.start);
    let current: MarkRange | null = null;
    for (const r of ofType) {
      if (current && r.start <= current.end) {
        current.end = Math.max(current.end, r.end);
      } else {
        if (current) out.push(current);
        current = { ...r };
      }
    }
    if (current) out.push(current);
  }
  return out;
}

/** True when every character in [start,end) already carries `type`. */
function isRangeMarked(
  ranges: MarkRange[],
  type: InlineMark,
  start: number,
  end: number,
): boolean {
  if (end <= start) return false;
  let pos = start;
  const spans = ranges
    .filter((r) => r.type === type && r.end > start && r.start < end)
    .sort((a, b) => a.start - b.start);
  for (const s of spans) {
    if (s.start > pos) return false;
    pos = Math.max(pos, s.end);
    if (pos >= end) return true;
  }
  return pos >= end;
}

/** Remove `type` coverage from [start,end), splitting ranges as needed. */
function removeMark(ranges: MarkRange[], type: InlineMark, start: number, end: number): MarkRange[] {
  const out: MarkRange[] = [];
  for (const r of ranges) {
    if (r.type !== type || r.end <= start || r.start >= end) {
      out.push(r);
      continue;
    }
    if (r.start < start) out.push({ type, start: r.start, end: start });
    if (r.end > end) out.push({ type, start: end, end: r.end });
  }
  return out;
}

/** Toggle a mark over a range: clears it if fully set, otherwise applies it. */
export function toggleMark(
  ranges: MarkRange[],
  type: InlineMark,
  start: number,
  end: number,
): MarkRange[] {
  if (end <= start) return ranges;
  if (isRangeMarked(ranges, type, start, end)) {
    return normalizeMarks(removeMark(ranges, type, start, end));
  }
  return normalizeMarks([...ranges, { type, start, end }]);
}

/** Which marks fully cover the selection (drives the toolbar's active state). */
export function activeMarksFor(
  ranges: MarkRange[],
  start: number,
  end: number,
): Set<InlineMark> {
  const set = new Set<InlineMark>();
  if (end <= start) return set;
  for (const type of INLINE_MARKS) {
    if (isRangeMarked(ranges, type, start, end)) set.add(type);
  }
  return set;
}

/**
 * Shift marks after the text changed. `from`/`to` is the replaced span in the
 * OLD string; `insertLen` is how many chars replaced it. Marks that span the
 * edit grow/shrink; marks fully after it slide.
 */
export function shiftMarks(
  ranges: MarkRange[],
  from: number,
  to: number,
  insertLen: number,
): MarkRange[] {
  const delta = insertLen - (to - from);
  const shiftPoint = (p: number) => {
    if (p <= from) return p;
    if (p >= to) return p + delta;
    // Inside the replaced span — collapse to the edit point.
    return from + Math.min(insertLen, p - from);
  };
  return normalizeMarks(
    ranges.map((r) => ({ type: r.type, start: shiftPoint(r.start), end: shiftPoint(r.end) })),
  );
}

/**
 * Diff two strings as a single contiguous edit (common prefix + suffix).
 * Returns the replaced span in the OLD string and the inserted length.
 */
export function diffEdit(
  oldText: string,
  newText: string,
): { from: number; to: number; insertLen: number } {
  if (oldText === newText) return { from: 0, to: 0, insertLen: 0 };
  let start = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (start < minLen && oldText[start] === newText[start]) start++;
  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  return { from: start, to: oldEnd, insertLen: newEnd - start };
}

/** Split text into consecutive styled segments for overlay rendering. */
export function buildSegments(text: string, ranges: MarkRange[]): StyledSegment[] {
  if (text.length === 0) return [];
  const bounds = new Set<number>([0, text.length]);
  for (const r of ranges) {
    if (r.start > 0 && r.start < text.length) bounds.add(r.start);
    if (r.end > 0 && r.end < text.length) bounds.add(r.end);
  }
  const sorted = [...bounds].sort((a, b) => a - b);
  const segments: StyledSegment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const segStart = sorted[i];
    const segEnd = sorted[i + 1];
    if (segEnd <= segStart) continue;
    const types = new Set<InlineMark>();
    for (const r of ranges) {
      if (r.start <= segStart && r.end >= segEnd) types.add(r.type);
    }
    segments.push({ text: text.slice(segStart, segEnd), types });
  }
  return segments;
}

/** The [start,end) of the word under `pos` (used when nothing is selected). */
export function wordRangeAt(text: string, pos: number): { start: number; end: number } {
  const isWord = (c: string) => /\w/.test(c);
  let start = pos;
  let end = pos;
  while (start > 0 && isWord(text[start - 1])) start--;
  while (end < text.length && isWord(text[end])) end++;
  return { start, end };
}
