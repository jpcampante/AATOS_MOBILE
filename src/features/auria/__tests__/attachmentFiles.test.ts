import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { sessionTokens } from '../api/http';
import { cachedAttachmentUri, openAttachment } from '../attachmentFiles';
import type { AuriaAttachment } from '../types';

// In-memory stand-in for the device's cache folder.
const mockFs = new Set<string>();

jest.mock('expo-file-system', () => {
  const join = (parts: unknown[]) => parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/');
  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return mockFs.has(this.uri);
    }
    create() {
      mockFs.add(this.uri);
    }
  }
  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return mockFs.has(this.uri);
    }
    delete() {
      mockFs.delete(this.uri);
    }
    static downloadFileAsync = jest.fn();
  }
  return { Directory, File, Paths: { cache: { uri: 'file:///cache' } } };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('../api/http', () => ({
  sessionTokens: { getAccessToken: jest.fn(), refresh: jest.fn() },
}));

const download = File.downloadFileAsync as unknown as jest.Mock;
const tokens = sessionTokens as unknown as { getAccessToken: jest.Mock; refresh: jest.Mock };

const privateFile = (id: string, name = 'notes.txt'): AuriaAttachment => ({
  id,
  name,
  url: `https://api.test/auria/chat/attachments/${id}`,
  isImage: false,
  private: true,
});

beforeEach(() => {
  mockFs.clear();
  jest.clearAllMocks();
  tokens.getAccessToken.mockResolvedValue('t1');
  tokens.refresh.mockResolvedValue('t2');
  download.mockImplementation(async (_url: string, target: { uri: string }) => {
    mockFs.add(target.uri);
    return { uri: target.uri };
  });
});

describe('cachedAttachmentUri', () => {
  it('downloads a private file with the Bearer token into its own folder, keeping its name', async () => {
    const uri = await cachedAttachmentUri(privateFile('a1', 'Q3 report.pdf'));

    expect(uri).toBe('file:///cache/auria-attachments/a1/Q3 report.pdf');
    expect(download).toHaveBeenCalledWith(
      'https://api.test/auria/chat/attachments/a1',
      expect.objectContaining({ uri }),
      { headers: { Authorization: 'Bearer t1' } },
    );
  });

  it('uses the cached copy the second time', async () => {
    await cachedAttachmentUri(privateFile('a2'));
    await cachedAttachmentUri(privateFile('a2'));
    expect(download).toHaveBeenCalledTimes(1);
  });

  it('shares one download between calls made at the same time', async () => {
    const [a, b] = await Promise.all([cachedAttachmentUri(privateFile('a3')), cachedAttachmentUri(privateFile('a3'))]);
    expect(a).toBe(b);
    expect(download).toHaveBeenCalledTimes(1);
  });

  it('retries once with a refreshed token when the download fails', async () => {
    download.mockRejectedValueOnce(new Error('401'));
    const uri = await cachedAttachmentUri(privateFile('a4'));

    expect(uri).toContain('/a4/');
    expect(download).toHaveBeenCalledTimes(2);
    expect(download.mock.calls[1][2]).toEqual({ headers: { Authorization: 'Bearer t2' } });
  });

  it('fails when the retry fails too', async () => {
    download.mockRejectedValue(new Error('401'));
    await expect(cachedAttachmentUri(privateFile('a5'))).rejects.toThrow('401');
  });

  it('downloads public files without a token', async () => {
    await cachedAttachmentUri({ name: 'logo.png', url: 'https://cdn.test/logo.png', isImage: true, private: false });
    expect(download.mock.calls[0][2]).toEqual({ headers: {} });
    expect(tokens.getAccessToken).not.toHaveBeenCalled();
  });

  it('makes unsafe file names safe', async () => {
    const uri = await cachedAttachmentUri(privateFile('a6', '../../etc/passwd'));
    expect(uri).toBe('file:///cache/auria-attachments/a6/.._.._etc_passwd');
  });
});

describe('openAttachment', () => {
  it('hands the local copy to the share sheet with the file name as title', async () => {
    await openAttachment(privateFile('b1', 'notes.txt'));
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/auria-attachments/b1/notes.txt', { dialogTitle: 'notes.txt' });
  });

  it('fails when the device cannot share', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await expect(openAttachment(privateFile('b2'))).rejects.toThrow('Sharing is not available');
  });
});
