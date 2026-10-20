import { makeToken } from '../__fixtures__/token';
import { decodeClaims, userFromToken } from '../jwt';

describe('jwt', () => {
  it('decodes UTF-8 claims', () => {
    expect(decodeClaims(makeToken({ name: 'João Ação' }))).toEqual({ name: 'João Ação' });
  });

  it('returns null for malformed tokens', () => {
    expect(decodeClaims('nope')).toBeNull();
    expect(decodeClaims('a.***.c')).toBeNull();
    expect(userFromToken('a.b')).toBeNull();
  });

  it('builds the user from identity claims', () => {
    const user = userFromToken(
      makeToken({
        public_uid: 'u-1',
        user_id: 7,
        email: 'ana@empresa.test',
        name: 'Ana Maria Lima',
        given_name: 'Ana',
        family_name: 'Lima',
        picture: 'https://cdn.test/a.png',
      }),
    );
    expect(user).toEqual({
      id: 'u-1',
      email: 'ana@empresa.test',
      name: 'Ana Maria Lima',
      firstName: 'Ana',
      lastName: 'Lima',
      initials: 'AL',
      pictureUrl: 'https://cdn.test/a.png',
    });
  });

  it('falls back to the email when there is no name', () => {
    const user = userFromToken(makeToken({ user_id: 3, email: 'bruno@empresa.test' }));
    expect(user).toMatchObject({ id: '3', name: 'bruno', firstName: 'bruno', initials: 'BR' });
  });
});
