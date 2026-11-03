/**
 * The picture and the logo of a web source (E28).
 *
 * They are only served by the server's signed, authenticated route, and
 * Android's `Image` drops request headers, so each one is downloaded once with
 * the Bearer token and shown from the cache — the same way private attachments
 * work. The news site itself is never contacted by the app.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { AURIA_API_URL } from './api/config';
import { sessionTokens } from './api/http';
import { isWebImagePath } from './webResult';

const CACHE_DIR = 'auria-web-images';

/** A short, stable file name for a signed path (its own signature identifies it). */
function fileNameFor(path: string): string {
  let hash = 0;
  for (const c of path) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return `${(hash >>> 0).toString(36)}.img`;
}

const inFlight = new Map<string, Promise<string>>();
/** Paths the server would not serve: never asked for twice in this session. */
const failed = new Set<string>();

async function download(path: string, target: File, token: string | null): Promise<string> {
  const downloaded = await File.downloadFileAsync(`${AURIA_API_URL}${path}`, target, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return downloaded.uri;
}

/**
 * A local copy of a source's image. Rejects anything that is not the server's
 * signed path, and a path that failed once is not tried again.
 */
export function cachedWebImageUri(path: string): Promise<string> {
  if (!isWebImagePath(path)) return Promise.reject(new Error('not a signed web image path'));
  if (failed.has(path)) return Promise.reject(new Error('this image is not available'));

  const dir = new Directory(Paths.cache, CACHE_DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  const target = new File(dir, fileNameFor(path));
  if (target.exists) return Promise.resolve(target.uri);

  const pending = inFlight.get(path);
  if (pending) return pending;

  const run = (async () => {
    try {
      return await download(path, target, await sessionTokens.getAccessToken());
    } catch {
      // The token may have just expired; a second failure is the image's own.
      if (target.exists) target.delete();
      try {
        return await download(path, target, await sessionTokens.refresh());
      } catch (error) {
        failed.add(path);
        throw error;
      }
    }
  })().finally(() => inFlight.delete(path));
  inFlight.set(path, run);
  return run;
}

/** Forgets the failures (tests, and a fresh session). */
export function resetWebImageFailures(): void {
  failed.clear();
}
