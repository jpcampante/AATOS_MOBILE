import { useCallback, useRef } from 'react';

export type UseMicLevel = {
  /** Begin capturing; resolves false if denied/unavailable. */
  start: () => Promise<boolean>;
  stop: () => void;
  supported: boolean;
};

type Options = { onLevel: (level: number) => void };

/**
 * Microphone amplitude (0..1). Web implementation via the Web Audio API —
 * the default file; `useMicLevel.native.ts` overrides it with expo-audio.
 */
export function useMicLevel({ onLevel }: Options): UseMicLevel {
  const onLevelRef = useRef(onLevel);
  onLevelRef.current = onLevel;
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!supported) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        onLevelRef.current(Math.max(0, Math.min(1, rms * 3.4)));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
      return true;
    } catch {
      stop();
      return false;
    }
  }, [supported, stop]);

  return { start, stop, supported };
}
