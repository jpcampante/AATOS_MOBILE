import type { AuthUser } from './types';

type Claims = Record<string, unknown>;

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** base64url → UTF-8 string, without relying on atob/TextDecoder being present. */
function decodeBase64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of b64) {
    if (char === '=') break;
    const value = BASE64.indexOf(char);
    if (value < 0) throw new Error('invalid base64');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return decodeURIComponent(bytes.map((b) => `%${b.toString(16).padStart(2, '0')}`).join(''));
}

/** Reads a JWT payload. The signature is the server's job; the app only displays claims. */
export function decodeClaims(token: string): Claims | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const claims = JSON.parse(decodeBase64Url(part));
    return claims && typeof claims === 'object' ? (claims as Claims) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function userFromToken(token: string): AuthUser | null {
  const claims = decodeClaims(token);
  if (!claims) return null;
  const email = str(claims.email);
  const id = str(claims.public_uid) || String(claims.user_id ?? '');
  if (!email && !id) return null;

  const firstName = str(claims.given_name);
  const lastName = str(claims.family_name);
  const name = str(claims.name) || [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];
  const words = name.split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.slice(0, 2)).toUpperCase();

  return {
    id,
    email,
    name,
    firstName: firstName || words[0] || name,
    lastName,
    initials,
    pictureUrl: str(claims.picture) || undefined,
  };
}
