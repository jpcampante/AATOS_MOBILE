import { useRef } from 'react';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import type { UseMicLevel } from './useMicLevel';

type Options = { onLevel: (level: number) => void };

/**
 * Microphone amplitude (0..1) on native via expo-audio metering. Works in
 * Expo Go (expo-audio ships with the SDK) — no custom dev build required.
 */
export function useMicLevel({ onLevel }: Options): UseMicLevel {
  const onLevelRef = useRef(onLevel);
  onLevelRef.current = onLevel;
  const activeRef = useRef(false);

  const recorder = useAudioRecorder(
    { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true },
    (status) => {
      if (!activeRef.current) return;
      const metering = (status as { metering?: number }).metering;
      if (typeof metering === 'number' && Number.isFinite(metering)) {
        // dBFS (~-50 quiet .. 0 loud) → 0..1
        onLevelRef.current(Math.max(0, Math.min(1, (metering + 50) / 50)));
      }
    },
  );

  const start = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return false;
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      } catch {
        // best-effort audio mode
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      activeRef.current = true;
      return true;
    } catch {
      return false;
    }
  };

  const stop = () => {
    activeRef.current = false;
    recorder.stop().catch(() => {});
  };

  return { start, stop, supported: true };
}
