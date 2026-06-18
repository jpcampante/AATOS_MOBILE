import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';

type UseWebSpeechOptions = {
  lang?: string;
  onTranscript: (text: string) => void;
};

/**
 * Live speech-to-text via the Web Speech API. Real on web (Chrome/Safari);
 * a no-op on native (Expo Go has no on-device STT — that needs a dev build).
 */
export function useWebSpeech({ lang = 'pt-PT', onTranscript }: UseWebSpeechOptions) {
  const recRef = useRef<{ stop: () => void } | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const supported =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const start = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SR) return false;
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i += 1) {
          text += event.results[i][0].transcript;
        }
        onTranscriptRef.current(text);
      };
      rec.onerror = () => {};
      rec.start();
      recRef.current = rec;
      return true;
    } catch {
      return false;
    }
  }, [lang]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    recRef.current = null;
  }, []);

  return { supported, start, stop };
}
