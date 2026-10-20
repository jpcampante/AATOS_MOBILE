import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuriaMode } from './api/streamChat';

/**
 * Auria preferences kept on the device (not secrets; tokens stay in secure store).
 * A storage failure never breaks the screen: reads fall back to the default and
 * writes are best effort.
 */
const KEYS = {
  mode: 'auria:mode',
  lastChatId: 'auria:last-chat-id',
} as const;

export const DEFAULT_MODE: AuriaMode = 'fast';

async function read(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, value);
  } catch {
    // Best effort: the preference just won't survive a restart.
  }
}

export async function loadMode(): Promise<AuriaMode> {
  const value = await read(KEYS.mode);
  return value === 'fast' || value === 'deep' ? value : DEFAULT_MODE;
}

export const saveMode = (mode: AuriaMode) => write(KEYS.mode, mode);

export async function loadLastChatId(): Promise<string | null> {
  const value = await read(KEYS.lastChatId);
  return value && /^[0-9a-f-]{8,64}$/i.test(value) ? value : null;
}

export const saveLastChatId = (chatId: string | null) => write(KEYS.lastChatId, chatId);

/** On sign-out: the next account must not reopen this account's chat. */
export const clearAuriaPrefs = async () => {
  await write(KEYS.lastChatId, null);
};
