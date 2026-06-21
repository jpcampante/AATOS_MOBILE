import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

/** Shared, functional Copy / Share / Listen behaviours used across Discover and
 *  the chat message toolbar. Each works on iOS, Android and web, degrading to a
 *  toast-friendly result string instead of throwing. */

export async function copyText(text: string): Promise<string> {
  try {
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return 'Copied';
  } catch {
    return 'Copy failed';
  }
}

export async function shareText(text: string, url?: string): Promise<string | null> {
  const payload = url ? `${text}\n${url}` : text;
  try {
    if (Platform.OS === 'web') {
      const nav =
        typeof navigator !== 'undefined'
          ? (navigator as Navigator & { share?: (d: { text: string; url?: string }) => Promise<void> })
          : null;
      if (nav?.share) {
        await nav.share(url ? { text, url } : { text });
        return null;
      }
      await Clipboard.setStringAsync(payload);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return 'Link copied to clipboard';
    }
    await Share.share({ message: payload });
    return null;
  } catch {
    return null; // user dismissed the share sheet
  }
}

/** Start reading text aloud. Returns false if speech is unavailable. */
export function speak(
  text: string,
  handlers?: { onDone?: () => void; onStopped?: () => void },
): boolean {
  try {
    Speech.speak(text, {
      onDone: handlers?.onDone,
      onStopped: handlers?.onStopped,
      onError: handlers?.onStopped,
    });
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  void Speech.stop().catch(() => {});
}

export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
