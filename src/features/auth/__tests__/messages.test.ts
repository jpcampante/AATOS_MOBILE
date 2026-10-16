import { authErrorMessage, codeIsDead } from '../messages';
import { AuthError } from '../types';

describe('authErrorMessage', () => {
  it('names the provider an organization enforces', () => {
    expect(authErrorMessage(new AuthError('sso_required', 403, { provider: 'microsoft' }))).toBe(
      'Your company requires signing in with Microsoft. Use AATOS on the web for now.',
    );
    expect(authErrorMessage(new AuthError('sso_required', 403, { provider: null }))).toContain('single sign-on');
  });

  it('counts the attempts left', () => {
    expect(authErrorMessage(new AuthError('invalid_code', 400, { attemptsLeft: 2 }))).toBe('Wrong code. 2 attempts left.');
    expect(authErrorMessage(new AuthError('invalid_code', 400, { attemptsLeft: 1 }))).toBe('Wrong code. 1 attempt left.');
  });

  it('turns long waits into minutes', () => {
    expect(authErrorMessage(new AuthError('rate_limited', 429, { retryAfter: 20 }))).toBe('Too many attempts. Try again in a moment.');
    expect(authErrorMessage(new AuthError('rate_limited', 429, { retryAfter: 600 }))).toBe('Too many attempts. Try again in 10 minutes.');
  });

  it('falls back for unknown errors', () => {
    expect(authErrorMessage(new Error('boom'))).toBe('Something went wrong. Try again.');
    expect(authErrorMessage(new AuthError('network'))).toBe('No connection. Check your internet and try again.');
  });
});

describe('codeIsDead', () => {
  it('is true only when a new code is needed', () => {
    expect(codeIsDead(new AuthError('code_expired', 400))).toBe(true);
    expect(codeIsDead(new AuthError('too_many_attempts', 400))).toBe(true);
    expect(codeIsDead(new AuthError('invalid_code', 400, { attemptsLeft: 1 }))).toBe(false);
    expect(codeIsDead(new AuthError('network'))).toBe(false);
  });
});
