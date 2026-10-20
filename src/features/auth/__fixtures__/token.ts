const b64url = (value: object) =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** An unsigned JWT with the given claims — the app never verifies signatures. */
export const makeToken = (claims: object) => `${b64url({ alg: 'RS256' })}.${b64url(claims)}.signature`;
