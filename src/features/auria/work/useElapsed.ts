import { useEffect, useState } from 'react';
import { elapsedMs, isWorkRunActive, type WorkRun } from './workRun';

/** How long the turn has been working, ticking every second while it runs (frozen once it ends). */
export function useElapsed(run: WorkRun): number {
  const live = isWorkRunActive(run.status);
  const [now, setNow] = useState(() => run.finishedAt ?? Date.now());
  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);
  return elapsedMs(run, now);
}
