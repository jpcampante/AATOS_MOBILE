import { act, renderHook } from '@testing-library/react-native';
import type { AuriaAttachment } from '../types';
import { useAttachmentOpener } from '../useAttachmentOpener';

jest.mock('../attachmentFiles', () => ({ openAttachment: jest.fn() }));

const file: AuriaAttachment = { id: 'f1', name: 'notes.txt', url: 'https://api.test/f1', isImage: false, private: true };

function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAttachmentOpener', () => {
  it('marks the file as opening until it opens', async () => {
    const pending = deferred();
    const open = jest.fn(() => pending.promise);
    const { result } = renderHook(() => useAttachmentOpener(undefined, open));

    let opening!: Promise<void>;
    act(() => {
      opening = result.current.openFile(file);
    });
    expect(result.current.openingUrl).toBe(file.url);
    expect(open).toHaveBeenCalledWith(file);

    await act(async () => {
      pending.resolve();
      await opening;
    });
    expect(result.current.openingUrl).toBeNull();
  });

  it('reports a short message when the file could not be opened', async () => {
    const onFailed = jest.fn();
    const open = jest.fn(async () => {
      throw new Error('401');
    });
    const { result } = renderHook(() => useAttachmentOpener(onFailed, open));

    await act(() => result.current.openFile(file));

    expect(onFailed).toHaveBeenCalledWith("Couldn't open notes.txt.");
    expect(result.current.openingUrl).toBeNull();
  });

  it('stays quiet when the screen closed before the file opened', async () => {
    const pending = deferred();
    const onFailed = jest.fn();
    const { result, unmount } = renderHook(() => useAttachmentOpener(onFailed, () => pending.promise));

    let opening!: Promise<void>;
    act(() => {
      opening = result.current.openFile(file);
    });
    unmount();
    pending.reject(new Error('gone'));
    await opening;

    expect(onFailed).not.toHaveBeenCalled();
  });
});
