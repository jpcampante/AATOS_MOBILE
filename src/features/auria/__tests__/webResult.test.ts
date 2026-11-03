import { isWebSnapshot, mergeWebResult, parseWebResult } from '../webResult';

const SIGNED_IMAGE = `/auria/web-image/?u=abc-def&s=${'a1'.repeat(20)}`;

const snapshot = (over: Record<string, unknown> = {}) => ({
  version: 2,
  execution_id: 'exec-1',
  seq: 3,
  status: 'done',
  last_search_status: 'done',
  in_progress: 0,
  queries: [{ index: 1, text: 'auria pricing', outcome: 'done' }],
  attempts: 2,
  uncertain_attempts: 0,
  sources: [
    {
      index: 1,
      url: 'https://example.com/news',
      title: '  Big   news  ',
      domain: 'Example.com',
      snippet: 'A snippet',
      date: '2026-10-13',
      image: SIGNED_IMAGE,
      icon: 'https://evil.example/icon.png',
    },
  ],
  returned_count: 4,
  usable_count: 1,
  truncated: false,
  ...over,
});

describe('parseWebResult (v2 snapshot)', () => {
  it('reads the snapshot the server sends', () => {
    const result = parseWebResult(snapshot());
    expect(isWebSnapshot(result)).toBe(true);
    expect(result).toMatchObject({
      version: 2,
      executionId: 'exec-1',
      seq: 3,
      status: 'done',
      attempts: 2,
      queries: [{ index: 1, text: 'auria pricing', outcome: 'done' }],
    });
    expect(result?.sources[0]).toEqual({
      index: 1,
      url: 'https://example.com/news',
      title: 'Big news',
      domain: 'example.com',
      snippet: 'A snippet',
      date: '2026-10-13',
      image: SIGNED_IMAGE,
    });
  });

  it('keeps the search in progress visible', () => {
    expect(parseWebResult(snapshot({ status: 'searching', in_progress: 1, sources: [], usable_count: 0 }))).toMatchObject({
      status: 'searching',
      inProgress: 1,
      sources: [],
    });
  });

  it('keeps the failure code', () => {
    expect(parseWebResult(snapshot({ status: 'failed', sources: [], failure_code: 'provider_timeout' }))).toMatchObject({
      failureCode: 'provider_timeout',
    });
  });

  it.each<[string, Record<string, unknown>]>([
    ['no execution', { execution_id: '' }],
    ['an unknown status', { status: 'thinking' }],
    ['a negative seq', { seq: -1 }],
    ['more attempts uncertain than made', { uncertain_attempts: 5, attempts: 2 }],
    ['more than 8 sources', { sources: Array.from({ length: 9 }, (_, i) => ({ index: i + 1, url: 'https://a.example/x', title: 't', domain: 'a.example' })) }],
    ['a source without an index', { sources: [{ url: 'https://a.example/x', title: 't', domain: 'a.example' }] }],
    ['a source that is not http', { sources: [{ index: 1, url: 'javascript:alert(1)', title: 't', domain: 'a.example' }] }],
    ['a query with an unknown outcome', { queries: [{ index: 1, text: 'x', outcome: 'maybe' }] }],
  ])('drops a snapshot with %s', (_case, over) => {
    expect(parseWebResult(snapshot(over))).toBeUndefined();
  });

  it('only accepts images from the signed route', () => {
    const result = parseWebResult(snapshot());
    expect(result?.sources[0].icon).toBeUndefined();
  });
});

describe('parseWebResult (v1 result)', () => {
  const legacy = {
    web_policy_version: 1,
    requested_mode: 'auto',
    effective_mode: 'auto',
    status: 'completed',
    sources: [{ index: 1, url: 'https://old.example/a', title: 'Old', domain: 'old.example' }],
  };

  it('reads an older turn', () => {
    const result = parseWebResult(legacy);
    expect(isWebSnapshot(result)).toBe(false);
    expect(result).toMatchObject({ version: 1, status: 'completed', sources: [{ index: 1, title: 'Old' }] });
  });

  it('reads a turn the server blocked', () => {
    expect(parseWebResult({ ...legacy, status: 'blocked', sources: [] })).toMatchObject({ status: 'blocked', sources: [] });
  });

  it('drops anything that is not a web result', () => {
    expect(parseWebResult(null)).toBeUndefined();
    expect(parseWebResult({ status: 'completed' })).toBeUndefined();
    expect(parseWebResult({ ...legacy, status: 'whatever' })).toBeUndefined();
  });
});

describe('mergeWebResult', () => {
  it('takes a newer snapshot of the same execution', () => {
    expect(mergeWebResult({ execution_id: 'e', seq: 1 }, { execution_id: 'e', seq: 2 })).toMatchObject({ seq: 2 });
  });

  it('ignores one that arrived late', () => {
    expect(mergeWebResult({ execution_id: 'e', seq: 5 }, { execution_id: 'e', seq: 2 })).toMatchObject({ seq: 5 });
  });

  it('takes a snapshot of another execution', () => {
    expect(mergeWebResult({ execution_id: 'e', seq: 9 }, { execution_id: 'f', seq: 0 })).toMatchObject({ execution_id: 'f' });
  });

  it('keeps what the turn had when nothing comes', () => {
    expect(mergeWebResult({ execution_id: 'e', seq: 1 }, null)).toMatchObject({ seq: 1 });
  });
});
