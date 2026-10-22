import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteAttachment, uploadAttachment } from './api/attachments';
import { AURIA_API_URL } from './api/config';
import { describeAuriaError, isAuriaApiError, AuriaApiError } from './api/errors';
import { absolutizeUrl } from './mappers';
import { attachmentProblem, resolveFile, type PickedFile } from './attachments';
import type { AuriaAttachment } from './types';

/** A file in the composer, uploading as soon as it is picked. */
export type ComposerAttachment = {
  id: string;
  uri: string;
  name: string;
  isImage: boolean;
  status: 'uploading' | 'ready' | 'failed';
  progress: number;
  /** Set once uploaded. */
  uuid?: string;
  /** Server URL as returned by the upload (goes into the message). */
  url?: string;
  /** Why it failed, for the person. */
  error?: string;
};

let seq = 0;
const nextId = () => `att-${(seq += 1)}`;

/**
 * The composer's attachment queue (E24/E27): validates (20 MB, accepted types),
 * uploads right away with progress, and removes from the server what the person
 * takes out before sending.
 */
export function useAuriaAttachments() {
  const [items, setItems] = useState<ComposerAttachment[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  useEffect(
    () => () => {
      controllers.current.forEach((c) => c.abort());
    },
    [],
  );

  const patch = useCallback((id: string, change: Partial<ComposerAttachment>) => {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...change } : item)));
  }, []);

  /** Adds picked files; returns the ones refused before uploading, with the reason. */
  const add = useCallback(
    (picked: PickedFile[], chatId: string | null): { name: string; reason: string }[] => {
      const refused: { name: string; reason: string }[] = [];
      picked.forEach((raw, index) => {
        const file = resolveFile(raw, index + 1);
        const problem = attachmentProblem(file);
        if (problem) {
          refused.push({ name: file.name, reason: describeAuriaError(new AuriaApiError({ code: problem })).message });
          return;
        }
        const id = nextId();
        const controller = new AbortController();
        controllers.current.set(id, controller);
        setItems((list) => [...list, { id, uri: file.uri, name: file.name, isImage: file.isImage, status: 'uploading', progress: 0 }]);
        uploadAttachment(file, chatId, (progress) => patch(id, { progress }), controller.signal)
          .then((res) => patch(id, { status: 'ready', progress: 1, uuid: res.uuid, url: res.url, name: res.filename || file.name }))
          .catch((err: unknown) => {
            if (isAuriaApiError(err) && err.code === 'aborted') return;
            patch(id, {
              status: 'failed',
              error: isAuriaApiError(err) ? describeAuriaError(err).message : 'Upload failed. Try again.',
            });
          })
          .finally(() => controllers.current.delete(id));
      });
      return refused;
    },
    [patch],
  );

  const remove = useCallback((id: string) => {
    setItems((list) => {
      const item = list.find((x) => x.id === id);
      if (item?.status === 'uploading') controllers.current.get(id)?.abort();
      // Best effort: an upload nobody sends would stay in the person's library.
      if (item?.uuid) void deleteAttachment(item.uuid).catch(() => {});
      return list.filter((x) => x.id !== id);
    });
  }, []);

  /** After sending: the files now belong to the message. */
  const clear = useCallback(() => setItems([]), []);

  const ready = items.filter((item) => item.status === 'ready' && item.uuid && item.url);

  return {
    items,
    uploading: items.some((item) => item.status === 'uploading'),
    hasFailed: items.some((item) => item.status === 'failed'),
    /** Uploaded files, as the message carries them. */
    readyFiles: ready.map(
      (item): AuriaAttachment => ({
        id: item.uuid,
        name: item.name,
        url: absolutizeUrl(item.url as string, AURIA_API_URL),
        isImage: item.isImage,
        private: true,
      }),
    ),
    /** Same files, with the server's own URL for the message text. */
    readyForMessage: ready.map((item) => ({ uuid: item.uuid as string, name: item.name, url: item.url as string, isImage: item.isImage })),
    add,
    remove,
    clear,
  };
}

export type AuriaAttachments = ReturnType<typeof useAuriaAttachments>;
