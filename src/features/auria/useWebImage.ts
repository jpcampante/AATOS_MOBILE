import { useEffect, useState } from 'react';
import { cachedWebImageUri } from './webImageFile';

/**
 * The local file of a source's picture or logo (E28), or null while it loads
 * and when the server would not serve it. The caller draws its own fallback,
 * so a missing image never leaves an empty frame.
 */
export function useWebImage(path?: string): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUri(null);
      return;
    }
    let active = true;
    setUri(null);
    cachedWebImageUri(path).then(
      (local) => {
        if (active) setUri(local);
      },
      () => undefined, // the fallback stays
    );
    return () => {
      active = false;
    };
  }, [path]);

  return uri;
}
