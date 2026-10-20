import { createSseDecoder, createSseParser, type SseFrame } from '../sse';

function collect() {
  const frames: SseFrame[] = [];
  return { frames, onFrame: (f: SseFrame) => frames.push(f) };
}

describe('createSseParser', () => {
  it('parses event and data lines', () => {
    const { frames, onFrame } = collect();
    const parser = createSseParser(onFrame);
    parser.push('event: delta\ndata: {"content":"Hi"}\n\n');
    expect(frames).toEqual([{ event: 'delta', data: '{"content":"Hi"}' }]);
  });

  it('handles a frame split across chunks', () => {
    const { frames, onFrame } = collect();
    const parser = createSseParser(onFrame);
    parser.push('event: del');
    parser.push('ta\ndata: {"con');
    expect(frames).toHaveLength(0);
    parser.push('tent":"A"}\n');
    parser.push('\n');
    expect(frames).toEqual([{ event: 'delta', data: '{"content":"A"}' }]);
  });

  it('handles several frames in one chunk', () => {
    const { frames, onFrame } = collect();
    createSseParser(onFrame).push(
      'event: status\ndata: {"phase":"started"}\n\nevent: delta\ndata: {"content":"x"}\n\nevent: done\ndata: {}\n\n',
    );
    expect(frames.map((f) => f.event)).toEqual(['status', 'delta', 'done']);
  });

  it('accepts CRLF line endings and joins multi-line data', () => {
    const { frames, onFrame } = collect();
    createSseParser(onFrame).push('event: x\r\ndata: line1\r\ndata: line2\r\n\r\n');
    expect(frames).toEqual([{ event: 'x', data: 'line1\nline2' }]);
  });

  it('ignores comments and frames without data; defaults the event name', () => {
    const { frames, onFrame } = collect();
    createSseParser(onFrame).push(': keep-alive\n\nevent: lonely\n\ndata: {"a":1}\n\n');
    expect(frames).toEqual([{ event: 'message', data: '{"a":1}' }]);
  });

  it('flushes a last frame without the blank line', () => {
    const { frames, onFrame } = collect();
    const parser = createSseParser(onFrame);
    parser.push('event: error\ndata: {"code":"x"}');
    expect(frames).toHaveLength(0);
    parser.flush();
    expect(frames).toEqual([{ event: 'error', data: '{"code":"x"}' }]);
  });
});

describe('createSseDecoder', () => {
  it('decodes UTF-8 split in the middle of a character', () => {
    const { frames, onFrame } = collect();
    const decoder = createSseDecoder(onFrame);
    const bytes = new TextEncoder().encode('event: delta\ndata: {"content":"ação 🎉"}\n\n');
    // Split inside the "ç" (2 bytes) and inside the emoji (4 bytes).
    const cut1 = bytes.indexOf(0xc3) + 1;
    const cut2 = bytes.indexOf(0xf0) + 2;
    decoder.push(bytes.slice(0, cut1));
    decoder.push(bytes.slice(cut1, cut2));
    decoder.push(bytes.slice(cut2));
    decoder.end();
    expect(frames).toEqual([{ event: 'delta', data: '{"content":"ação 🎉"}' }]);
    expect(JSON.parse(frames[0].data).content).toBe('ação 🎉');
  });
});
