/**
 * Authenticator endpoints. Values come from `EXPO_PUBLIC_*` env vars (see
 * `.env.example`) so dev and production builds differ only in configuration.
 * The client id is public (the app is a public client); it is not a secret.
 */
const DEFAULT_AUTH_URL = 'https://authenticator-dev.mydailyceo.com';
/** The "AATOS Android" app in the Authenticator's `deploy/client_apps.json`. */
const DEFAULT_CLIENT_ID = 'myceo_app_aatos_android';

export const AUTH_URL = (process.env.EXPO_PUBLIC_MYCEO_AUTH_URL || DEFAULT_AUTH_URL).replace(/\/+$/, '');
export const CLIENT_ID = process.env.EXPO_PUBLIC_MYCEO_CLIENT_ID || DEFAULT_CLIENT_ID;

export const AUTH_ENDPOINTS = {
  requestCode: '/auth/mobile/code/request/',
  verifyCode: '/auth/mobile/code/verify/',
  token: '/auth/token/',
  sessionCheck: '/auth/session/check/',
  logoutCurrent: '/auth/account/sessions/current/logout/',
} as const;

/** Refresh when the access token has less than this left. */
export const REFRESH_MARGIN_MS = 5 * 60 * 1000;
export const REQUEST_TIMEOUT_MS = 15_000;
