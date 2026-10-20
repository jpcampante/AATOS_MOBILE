import { fetch as expoFetch } from 'expo/fetch';
import { sessionManager } from '../../auth/AuthProvider';
import { AURIA_API_URL, AURIA_REQUEST_TIMEOUT_MS, SETTINGS_URL } from './config';
import { createHttpClient, type TokenSource } from './httpClient';
import { createStreamChat } from './streamChat';

/** The 001 session: refreshes ahead of expiry and once more after a 401. */
export const sessionTokens: TokenSource = {
  getAccessToken: () => sessionManager.getAccessToken(),
  refresh: async () => (await sessionManager.refresh())?.accessToken ?? null,
};

/** `/auria/...` on aatos-system. */
export const auriaHttp = createHttpClient({
  baseUrl: AURIA_API_URL,
  tokens: sessionTokens,
  timeoutMs: AURIA_REQUEST_TIMEOUT_MS,
});

/** One streamed Auria turn. `expo/fetch` gives a readable body stream on Android. */
export const streamChat = createStreamChat({
  baseUrl: AURIA_API_URL,
  tokens: sessionTokens,
  fetchImpl: (url, init) => expoFetch(url, init),
});

/** The billing service (plan and balance). */
export const billingHttp = createHttpClient({
  baseUrl: SETTINGS_URL,
  tokens: sessionTokens,
  timeoutMs: AURIA_REQUEST_TIMEOUT_MS,
});
