import { initialWebSearchState, turnWebMode, webSearchUnavailableReason, type WebSearchState } from '../webSearchChoice';

const ready = (over: Partial<WebSearchState> = {}): WebSearchState => ({
  ...initialWebSearchState,
  status: 'ready',
  available: true,
  companyEnabled: true,
  mode: 'auto',
  ...over,
});

describe('turnWebMode', () => {
  it('searches only with a ready, chosen Auto', () => {
    expect(turnWebMode(ready())).toBe('auto');
  });

  it.each<[string, Partial<WebSearchState>]>([
    ['never chosen', { mode: null }],
    ['chosen Off', { mode: 'off' }],
    ['still loading', { status: 'loading' }],
    ['being saved', { status: 'saving' }],
    ['could not load', { status: 'error' }],
    ['server without search', { available: false }],
    ['company turned it off', { companyEnabled: false }],
  ])('is Off when %s', (_case, over) => {
    expect(turnWebMode(ready(over))).toBe('off');
  });
});

describe('webSearchUnavailableReason', () => {
  it('says why the switch cannot be turned on', () => {
    expect(webSearchUnavailableReason(ready({ companyEnabled: false }))).toBe('Disabled for this company.');
    expect(webSearchUnavailableReason(ready({ available: false }))).toBe('Search is unavailable.');
    expect(webSearchUnavailableReason(ready())).toBeNull();
  });
});
