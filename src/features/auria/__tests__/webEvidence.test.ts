import { siteName, sourceDate, webEvidenceView } from '../webEvidence';
import type { LegacyWebResult, WebSnapshot, WebSource } from '../webResult';

const source = (index: number): WebSource => ({
  index,
  url: `https://site${index}.example/a`,
  title: `Source ${index}`,
  domain: `www.site${index}.example`,
});

const snapshot = (over: Partial<WebSnapshot> = {}): WebSnapshot => ({
  version: 2,
  executionId: 'exec-1',
  seq: 1,
  status: 'done',
  lastSearchStatus: 'done',
  inProgress: 0,
  queries: [],
  attempts: 2,
  uncertainAttempts: 0,
  sources: [source(1), source(2)],
  truncated: false,
  ...over,
});

describe('webEvidenceView', () => {
  it('says the search is running, with no cards yet', () => {
    const view = webEvidenceView(snapshot({ status: 'searching', inProgress: 1, sources: [] }));
    expect(view).toMatchObject({ label: 'Searching the web…', showLabel: true, searching: true, cards: [] });
  });

  it('drops the label once the cards say it', () => {
    expect(webEvidenceView(snapshot())).toMatchObject({ showLabel: false, label: 'Web sources' });
  });

  it('shows at most four cards and keeps every source in the list', () => {
    const view = webEvidenceView(snapshot({ sources: [1, 2, 3, 4, 5, 6].map(source) }));
    expect(view.cards).toHaveLength(4);
    expect(view.sources).toHaveLength(6);
    expect(view.summary).toBe('6 sources · 2 search attempts');
  });

  it('counts one source and one attempt in the singular', () => {
    expect(webEvidenceView(snapshot({ sources: [source(1)], attempts: 1 })).summary).toBe('1 source · 1 search attempt');
  });

  it('explains a failure in words', () => {
    expect(webEvidenceView(snapshot({ status: 'failed', sources: [], failureCode: 'provider_timeout' }))).toMatchObject({
      label: 'Web search could not complete.',
      failure: 'Search timed out.',
    });
  });

  it('falls back to a general reason for an unknown failure code', () => {
    expect(webEvidenceView(snapshot({ failureCode: 'something_new' })).failure).toBe('Search could not complete.');
  });

  it('says the sources were kept from an earlier search of the turn', () => {
    expect(webEvidenceView(snapshot({ lastSearchStatus: 'failed' })).keptNote).toBe(true);
    expect(webEvidenceView(snapshot()).keptNote).toBe(false);
  });

  it('notes attempts with an uncertain outcome', () => {
    expect(webEvidenceView(snapshot({ uncertainAttempts: 1 })).uncertainNote).toBe('1 attempt has an uncertain outcome.');
    expect(webEvidenceView(snapshot({ uncertainAttempts: 2 })).uncertainNote).toBe('2 attempts have an uncertain outcome.');
    expect(webEvidenceView(snapshot()).uncertainNote).toBeNull();
  });

  it('shows an older turn without cards or attempts', () => {
    const legacy: LegacyWebResult = {
      version: 1,
      requestedMode: 'auto',
      effectiveMode: 'auto',
      status: 'completed',
      lastSearchStatus: null,
      sources: [source(1)],
    };
    expect(webEvidenceView(legacy)).toMatchObject({ cards: [], summary: '1 source', label: 'Web sources' });
  });
});

describe('siteName and sourceDate', () => {
  it('drops the www. from the site', () => {
    expect(siteName(source(1))).toBe('site1.example');
  });

  it('reads a plain day without shifting the time zone', () => {
    expect(sourceDate('2026-10-13')).toContain('2026');
    expect(sourceDate('')).toBe('');
    expect(sourceDate('not a date')).toBe('not a date');
  });
});
