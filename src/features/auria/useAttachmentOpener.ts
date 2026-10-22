import { useCallback, useEffect, useRef, useState } from 'react';
import { openAttachment } from './attachmentFiles';
import type { AuriaAttachment } from './types';

/**
 * Opens message attachments one at a time: tells which one is opening (for a
 * spinner) and reports a short message when it couldn't be opened.
 */
export function useAttachmentOpener(onFailed?: (message: string) => void, open = openAttachment) {
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const openFile = useCallback(
    async (file: AuriaAttachment) => {
      setOpeningUrl(file.url);
      try {
        await open(file);
      } catch {
        if (mounted.current) onFailed?.(`Couldn't open ${file.name}.`);
      } finally {
        if (mounted.current) setOpeningUrl(null);
      }
    },
    [onFailed, open],
  );

  return { openingUrl, openFile };
}
