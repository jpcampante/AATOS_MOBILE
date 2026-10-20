import { useEffect, useRef, useState } from 'react';

const TICK_MS = 50;
const MIN_CPS = 40;
const MAX_CPS = 200;
/** Aim to drain the backlog in this many seconds while streaming. */
const DRAIN_SECONDS = 4;
/** After the answer settles, catch up within about a second. */
const FINISH_SECONDS = 1;

/** Never cut a string between the two halves of a surrogate pair (emoji). */
function safeEnd(text: string, end: number): number {
  if (end <= 0 || end >= text.length) return Math.max(0, Math.min(end, text.length));
  const code = text.charCodeAt(end - 1);
  return code >= 0xd800 && code <= 0xdbff ? end - 1 : end;
}

/**
 * Reveals a streamed answer at a steady pace (40–200 chars/s, like the web's
 * text pacer): the backend sends uneven, often large chunks, and pacing them
 * reads like writing instead of jumps. The pace only speeds up within an answer
 * so long answers don't trail. Text that is not live (history) shows at once.
 */
export function usePacedText(target: string, live: boolean): string {
  const [shown, setShown] = useState(() => (live ? 0 : target.length));
  const shownRef = useRef(shown);
  const targetRef = useRef(target);
  targetRef.current = target;
  const cpsRef = useRef(MIN_CPS);
  const carryRef = useRef(0);

  // A preamble removed from the end (delta_reset) can shrink the target.
  if (shownRef.current > target.length) shownRef.current = target.length;

  const behind = shownRef.current < target.length;

  useEffect(() => {
    if (!behind) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min((now - last) / 1000, 0.5);
      last = now;
      const text = targetRef.current;
      const backlog = text.length - shownRef.current;
      if (backlog <= 0) {
        clearInterval(timer);
        return;
      }
      const wanted = backlog / (live ? DRAIN_SECONDS : FINISH_SECONDS);
      cpsRef.current = Math.max(cpsRef.current, Math.min(live ? MAX_CPS : Number.MAX_SAFE_INTEGER, wanted));
      const step = cpsRef.current * dt + carryRef.current;
      const whole = Math.floor(step);
      carryRef.current = step - whole;
      if (whole <= 0) return;
      shownRef.current = safeEnd(text, Math.min(text.length, shownRef.current + whole));
      setShown(shownRef.current);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [behind, live]);

  return target.slice(0, Math.min(shown, shownRef.current, target.length));
}
