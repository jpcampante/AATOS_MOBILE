import { useEffect, useRef, useState } from 'react';

/**
 * A transient toast message that auto-dismisses. Shared by the gallery,
 * projects and image-viewer surfaces (previously duplicated in each). Cancels
 * its timer on unmount so it can't setState after the component is gone.
 */
export function useAuriaToast(durationMs = 2200) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  };

  const showToast = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), durationMs);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { toast, showToast, clearToast };
}
