import { cachedWebImageUri, resetWebImageFailures } from '../webImageFile';

const SIGNED = `/auria/web-image/?u=abc-def&s=${'a1'.repeat(20)}`;
const OTHER = `/auria/web-image/?u=ghi-jkl&s=${'b2'.repeat(20)}`;

const mockFile = { exists: false, uri: 'file:///cache/web/img', delete: jest.fn() };
const mockDownload = jest.fn();

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  Directory: jest.fn().mockImplementation(() => ({ exists: true, create: jest.fn() })),
  File: Object.assign(
    jest.fn().mockImplementation(() => mockFile),
    { downloadFileAsync: (...args: unknown[]) => mockDownload(...args) },
  ),
}));

jest.mock('../api/http', () => ({
  sessionTokens: {
    getAccessToken: jest.fn().mockResolvedValue('token-1'),
    refresh: jest.fn().mockResolvedValue('token-2'),
  },
}));

describe('cachedWebImageUri', () => {
  beforeEach(() => {
    resetWebImageFailures();
    mockFile.exists = false;
    mockDownload.mockReset();
    mockDownload.mockResolvedValue({ uri: 'file:///cache/web/img' });
  });

  it('downloads the image with the access token', async () => {
    await expect(cachedWebImageUri(SIGNED)).resolves.toBe('file:///cache/web/img');
    expect(mockDownload).toHaveBeenCalledWith(
      expect.stringContaining(SIGNED),
      mockFile,
      { headers: { Authorization: 'Bearer token-1' } },
    );
  });

  it('refuses anything that is not the signed route', async () => {
    await expect(cachedWebImageUri('https://news.example/photo.jpg')).rejects.toThrow();
    await expect(cachedWebImageUri('/auria/web-image/?u=abc&s=nope')).rejects.toThrow();
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('tries again once with a fresh token', async () => {
    mockDownload.mockRejectedValueOnce(new Error('401')).mockResolvedValueOnce({ uri: 'file:///cache/web/img' });
    await expect(cachedWebImageUri(SIGNED)).resolves.toBe('file:///cache/web/img');
    expect(mockDownload).toHaveBeenLastCalledWith(expect.any(String), mockFile, {
      headers: { Authorization: 'Bearer token-2' },
    });
  });

  it('does not ask again for an image the server would not serve', async () => {
    mockDownload.mockRejectedValue(new Error('404'));
    await expect(cachedWebImageUri(OTHER)).rejects.toThrow();
    const tries = mockDownload.mock.calls.length;
    await expect(cachedWebImageUri(OTHER)).rejects.toThrow();
    expect(mockDownload).toHaveBeenCalledTimes(tries);
  });

  it('shares one download between callers of the same image', async () => {
    const both = await Promise.all([cachedWebImageUri(SIGNED), cachedWebImageUri(SIGNED)]);
    expect(both).toEqual(['file:///cache/web/img', 'file:///cache/web/img']);
    expect(mockDownload).toHaveBeenCalledTimes(1);
  });
});
