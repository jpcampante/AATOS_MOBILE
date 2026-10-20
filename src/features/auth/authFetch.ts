import { sessionManager } from './AuthProvider';

/**
 * `fetch` for MyCEO services: adds the Bearer token, refreshing it first when
 * it is about to expire, and retries once after a 401.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) =>
    fetch(input, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), ...(token ? { Authorization: `Bearer ${token}` } : null) },
    });

  const response = await send(await sessionManager.getAccessToken());
  if (response.status !== 401) return response;

  const refreshed = await sessionManager.refresh();
  return refreshed ? send(refreshed.accessToken) : response;
}
