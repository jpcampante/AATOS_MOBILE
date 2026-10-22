import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tells the screen reader once, when the work ends. The live steps change too
 * often to be read aloud one by one, so only the ending is announced.
 */
export function useAnnounceWhenFinished(active: boolean, message: string) {
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && !active) AccessibilityInfo.announceForAccessibility(message);
    wasActive.current = active;
  }, [active, message]);
}
