/**
 * Auria backend (served by aatos-system under `/auria/...`) and the billing
 * service. Values come from `EXPO_PUBLIC_*` env vars (see `.env.example`); the
 * defaults are production (spec 002, D-05).
 */
const DEFAULT_AURIA_API_URL = 'https://pilarone.mydailyceo.com';
const DEFAULT_SETTINGS_URL = 'https://settings.mydailyceo.com';

const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const AURIA_API_URL = trimSlash(process.env.EXPO_PUBLIC_AURIA_API_URL || DEFAULT_AURIA_API_URL);
export const SETTINGS_URL = trimSlash(process.env.EXPO_PUBLIC_SETTINGS_URL || DEFAULT_SETTINGS_URL);

/** Plain (non-streaming) requests. A streamed turn has no overall timeout. */
export const AURIA_REQUEST_TIMEOUT_MS = 20_000;

/** Web search policy the app speaks (`web_mode` is `auto` | `off`). */
export const WEB_POLICY_VERSION = 2;
