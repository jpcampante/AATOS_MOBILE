import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from './types';

/** Encrypted on-device storage (Android Keystore). Never AsyncStorage. */
const KEYS = {
  access: 'myceo.accessToken',
  refresh: 'myceo.refreshToken',
  expiresAt: 'myceo.expiresAt',
  installId: 'aatos.installId',
} as const;

export type TokenStore = {
  load(): Promise<AuthTokens | null>;
  save(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
};

export const secureTokenStore: TokenStore = {
  async load() {
    const [accessToken, refreshToken, expiresAt] = await Promise.all([
      SecureStore.getItemAsync(KEYS.access),
      SecureStore.getItemAsync(KEYS.refresh),
      SecureStore.getItemAsync(KEYS.expiresAt),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken, expiresAt: Number(expiresAt) || 0 };
  },
  async save(tokens) {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.access, tokens.accessToken),
      SecureStore.setItemAsync(KEYS.refresh, tokens.refreshToken),
      SecureStore.setItemAsync(KEYS.expiresAt, String(tokens.expiresAt)),
    ]);
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.access),
      SecureStore.deleteItemAsync(KEYS.refresh),
      SecureStore.deleteItemAsync(KEYS.expiresAt),
    ]);
  },
};

/** A random id per install, so each phone is its own device on the server. */
export async function getInstallId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEYS.installId);
  if (existing) return existing;
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  await SecureStore.setItemAsync(KEYS.installId, id);
  return id;
}
