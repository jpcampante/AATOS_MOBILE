/**
 * Server-Sent Events reader for a POST response body (EventSource only does GET).
 * The Auria stream sends `event: <name>\ndata: <json>\n\n` frames (plan §4).
 */

export type SseFrame = { event: string; data: string };

/** Text in, frames out. Keeps a partial frame between pushes. */
export function createSseParser(onFrame: (frame: SseFrame) => void) {
  let buffer = '';

  const dispatch = (raw: string) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of raw.split('\n')) {
      if (!line || line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      let value = colon < 0 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') event = value;
      else if (field === 'data') data.push(value);
    }
    if (data.length > 0) onFrame({ event, data: data.join('\n') });
  };

  return {
    push(text: string) {
      buffer += text.replace(/\r\n?/g, '\n');
      let end: number;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const raw = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        dispatch(raw);
      }
    },
    /** The body ended: a last frame may lack its blank line. */
    flush() {
      if (buffer.trim()) dispatch(buffer);
      buffer = '';
    },
  };
}

/** Bytes in (as read from the body stream), frames out. UTF-8 split across chunks is fine. */
export function createSseDecoder(onFrame: (frame: SseFrame) => void) {
  const decoder = new TextDecoder();
  const parser = createSseParser(onFrame);
  return {
    push(bytes: Uint8Array) {
      parser.push(decoder.decode(bytes, { stream: true }));
    },
    end() {
      parser.push(decoder.decode());
      parser.flush();
    },
  };
}
