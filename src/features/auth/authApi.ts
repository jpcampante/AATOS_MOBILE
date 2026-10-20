import { Platform } from 'react-native';
import { AUTH_ENDPOINTS, AUTH_URL, CLIENT_ID, REQUEST_TIMEOUT_MS } from './config';
import { AuthError, type AuthErrorCode, type AuthTokens, type CodeRequestResult } from './types';

type Json = Record<string, unknown>;

let userAgent = 'AATOS-Android/1.0';

/**
 * The Authenticator names the device session after the User-Agent, and treats
 * one User-Agent as one device. Including a per-install id keeps two phones of
 * the same person as two rows in "your devices".
 */
export function setDeviceUserAgent(installId: string) {
  const constants = Platform.constants as { Model?: string; Release?: string | number };
  const model = constants?.Model ?? 'Android';
  const release = constants?.Release ?? '';
  userAgent = `AATOS-Android/1.0 (${model}; Android ${release}) install/${installId}`;
}

async function post(path: string, body: Json, accessToken?: string): Promise<{ status: number; data: Json }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${AUTH_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : null),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as Json;
    return { status: response.status, data };
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw new AuthError('timeout');
    throw new AuthError('network');
  } finally {
    clearTimeout(timer);
  }
}

function toError(status: number, data: Json): AuthError {
  if (status >= 500 || typeof data.error !== 'string') return new AuthError('server', status);
  return new AuthError(data.error as AuthErrorCode, status, {
    retryAfter: typeof data.retry_after === 'number' ? data.retry_after : undefined,
    attemptsLeft: typeof data.attempts_left === 'number' ? data.attempts_left : undefined,
    provider: typeof data.provider === 'string' ? data.provider : null,
  });
}

function toTokens(data: Json): AuthTokens {
  const access = data.access_token;
  const refresh = data.refresh_token;
  const expiresIn = Number(data.expires_in);
  if (typeof access !== 'string' || typeof refresh !== 'string' || !Number.isFinite(expiresIn)) {
    throw new AuthError('server');
  }
  return { accessToken: access, refreshToken: refresh, expiresAt: Date.now() + expiresIn * 1000 };
}

export async function requestCode(email: string, fullName?: string): Promise<CodeRequestResult> {
  const { status, data } = await post(AUTH_ENDPOINTS.requestCode, {
    client_id: CLIENT_ID,
    email,
    ...(fullName ? { full_name: fullName } : null),
  });
  if (status !== 200) throw toError(status, data);
  if (data.next === 'need_name') return { kind: 'needName' };
  return {
    kind: 'sent',
    challengeId: String(data.challenge_id),
    purpose: data.purpose === 'signup' ? 'signup' : 'login',
    expiresIn: Number(data.expires_in) || 300,
    resendAfter: Number(data.resend_after) || 30,
  };
}

export async function verifyCode(challengeId: string, code: string): Promise<AuthTokens> {
  const { status, data } = await post(AUTH_ENDPOINTS.verifyCode, {
    client_id: CLIENT_ID,
    challenge_id: challengeId,
    code,
  });
  if (status !== 200) throw toError(status, data);
  return toTokens(data);
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const { status, data } = await post(AUTH_ENDPOINTS.token, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  if (status !== 200) throw toError(status, data);
  return toTokens(data);
}

/** `true` alive, `false` ended on the server (e.g. "sign out everywhere"). */
export async function checkSession(accessToken: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${AUTH_URL}${AUTH_ENDPOINTS.sessionCheck}`, {
      headers: { Accept: 'application/json', 'User-Agent': userAgent, Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (response.status === 401) return false;
    if (!response.ok) throw new AuthError('server', response.status);
    return true;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('network');
  } finally {
    clearTimeout(timer);
  }
}

export async function logoutCurrent(accessToken: string, refreshToken: string): Promise<void> {
  await post(AUTH_ENDPOINTS.logoutCurrent, { refresh_token: refreshToken }, accessToken);
}
