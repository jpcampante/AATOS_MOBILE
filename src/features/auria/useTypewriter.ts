import { useEffect, useRef, useState } from 'react';

type TypewriterOptions = {
  /** When false, the full text is shown immediately (used for history). */
  enabled?: boolean;
  /** Characters revealed per second — the "writing" pace. */
  cps?: number;
  /** Floor/ceiling on total duration so short notes aren't instant and long
   *  documents don't drag on forever. */
  minMs?: number;
  maxMs?: number;
};

/**
 * A smooth, time-based typewriter. Reveals `text` progressively using
 * requestAnimationFrame (not chunked setInterval, which reads as jittery
 * bursts) with a gentle ease-out so the writing settles at the end instead of
 * stopping abruptly. Returns the visible slice and whether it has finished.
 */
export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const { enabled = true, cps = 42, minMs = 900, maxMs = 11000 } = options;
  const [shown, setShown] = useState(enabled ? '' : text);
  const [done, setDone] = useState(!enabled);
  const rafRef = useRef<number | null>(null);

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
      const t = Math.min(1, (now - start) / duration);
      // Ease-out: writes at a steady clip, then eases into the final words.
      const eased = 1 - Math.pow(1 - t, 1.7);
      const count = Math.max(1, Math.floor(eased * total));
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
  }, [text, enabled, cps, minMs, maxMs]);

  return { shown, done };
}
