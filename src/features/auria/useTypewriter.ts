import { useEffect, useMemo, useRef, useState } from 'react';

type TypewriterOptions = {
  /** When false, the full text is shown immediately (used for history). */
  enabled?: boolean;
  /** Characters revealed per second — the "writing" pace. */
  cps?: number;
  /** Floor/ceiling on total duration so short notes aren't instant and very
   *  long documents stay reasonable. */
  minMs?: number;
  maxMs?: number;
  /**
   * 'word' reveals whole words at a time (token-stream feel, like ChatGPT /
   * Claude writing a document). 'char' reveals character by character.
   */
  mode?: 'word' | 'char';
};

/** Indices just past each word, so we can snap a char count up to a whole word. */
function wordBoundaries(text: string): number[] {
  const bounds: number[] = [];
  const re = /\S+\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    bounds.push(m.index + m[0].length);
  }
  if (bounds.length === 0 || bounds[bounds.length - 1] !== text.length) {
    bounds.push(text.length);
  }
  return bounds;
}

/**
 * A smooth, steady typewriter that mirrors how Claude / ChatGPT stream a
 * reply: a constant cadence (no acceleration) revealing whole words at a time,
 * driven by requestAnimationFrame. Returns the visible slice and whether it
 * has finished.
 */
export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const { enabled = true, cps = 26, minMs = 1200, maxMs = 26000, mode = 'word' } = options;
  const [shown, setShown] = useState(enabled ? '' : text);
  const [done, setDone] = useState(!enabled);
  const rafRef = useRef<number | null>(null);
  const bounds = useMemo(
    () => (mode === 'word' ? wordBoundaries(text) : null),
    [text, mode],
  );

  useEffect(() => {
    const total = text.length;
    if (!enabled || total === 0) {
      setShown(text);
      setDone(true);
      return;
    }

    setShown('');
    setDone(false);
    const duration = Math.min(maxMs, Math.max(minMs, (total / cps) * 1000));
    let start = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      // Linear, steady cadence — the constant clip of a token stream.
      const t = Math.min(1, (now - start) / duration);
      const target = Math.floor(t * total);

      let count = target;
      if (bounds) {
        // Snap up to the end of the current word so we never show a half-word.
        count = bounds.find((b) => b >= target) ?? total;
      }

      setShown(text.slice(0, count));
      if (t >= 1) {
        setShown(text);
        setDone(true);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [text, enabled, cps, minMs, maxMs, bounds]);

  return { shown, done };
}
