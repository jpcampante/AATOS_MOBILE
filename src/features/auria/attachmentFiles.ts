import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { sessionTokens } from './api/http';
import type { AuriaAttachment } from './types';

const CACHE_DIR = 'auria-attachments';

const safeName = (name: string) => name.replace(/[^\w.\- ]+/g, '_').slice(-80) || 'file';

const inFlight = new Map<string, Promise<string>>();

async function download(attachment: AuriaAttachment, target: File, token: string | null): Promise<string> {
  const downloaded = await File.downloadFileAsync(attachment.url, target, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return downloaded.uri;
}

/**
 * A local copy of an attachment. Private Auria files are only served with the
 * Bearer token (E26) and Android's `Image` drops request headers, so they are
 * downloaded to the cache once (retrying with a refreshed token) and used from
 * there. Concurrent calls for the same file share one download.
 */
export function cachedAttachmentUri(attachment: AuriaAttachment): Promise<string> {
  // One folder per attachment, so the file keeps its own name when shared.
  const dir = new Directory(Paths.cache, CACHE_DIR, attachment.id ?? safeName(attachment.url));
  if (!dir.exists) dir.create({ intermediates: true });
  const target = new File(dir, safeName(attachment.name));
  if (target.exists) return Promise.resolve(target.uri);

  const pending = inFlight.get(target.uri);
  if (pending) return pending;

  const run = (async () => {
    if (!attachment.private) return download(attachment, target, null);
    try {
      return await download(attachment, target, await sessionTokens.getAccessToken());
    } catch {
      if (target.exists) target.delete();
      return download(attachment, target, await sessionTokens.refresh());
    }
  })().finally(() => inFlight.delete(target.uri));
  inFlight.set(target.uri, run);
  return run;
}

/** Opens an attachment file in Android's share/open sheet. */
export async function openAttachment(attachment: AuriaAttachment): Promise<void> {
  const uri = await cachedAttachmentUri(attachment);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { dialogTitle: attachment.name });
}
