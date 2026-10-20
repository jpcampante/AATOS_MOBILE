import { AuthError } from './types';

const PROVIDER_LABEL: Record<string, string> = {
  microsoft: 'Microsoft',
  google: 'Google',
  oidc: 'your company’s single sign-on',
};

function waitLabel(seconds?: number) {
  if (!seconds || seconds <= 60) return 'in a moment';
  return `in ${Math.ceil(seconds / 60)} minutes`;
}

/** User-facing copy for any error thrown during sign-in. */
export function authErrorMessage(error: unknown): string {
  if (!(error instanceof AuthError)) return 'Something went wrong. Try again.';
  switch (error.code) {
    case 'invalid_email':
      return 'Enter a valid email address.';
    case 'sso_required': {
      const via = (error.provider && PROVIDER_LABEL[error.provider]) || 'single sign-on';
      return `Your company requires signing in with ${via}. Use AATOS on the web for now.`;
    }
    case 'signup_closed':
      return 'Sign-up is invite-only. Ask your company admin for an invite.';
    case 'not_allowed':
      return 'This email can’t sign in to the app.';
    case 'rate_limited':
      return `Too many attempts. Try again ${waitLabel(error.retryAfter)}.`;
    case 'invalid_code': {
      const left = error.attemptsLeft;
      return left ? `Wrong code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.` : 'Wrong code.';
    }
    case 'code_expired':
      return 'This code expired. Send a new one.';
    case 'too_many_attempts':
      return 'Too many wrong attempts. Send a new code.';
    case 'challenge_used':
    case 'invalid_challenge':
      return 'This code is no longer valid. Send a new one.';
    case 'network':
    case 'timeout':
      return 'No connection. Check your internet and try again.';
    case 'invalid_client':
      return 'The app isn’t set up to sign in yet. Contact support.';
    default:
      return 'Something went wrong. Try again.';
  }
}

/** Errors after which the current code can't be used anymore. */
export function codeIsDead(error: unknown): boolean {
  return (
    error instanceof AuthError &&
    ['code_expired', 'too_many_attempts', 'challenge_used', 'invalid_challenge'].includes(error.code)
  );
}
