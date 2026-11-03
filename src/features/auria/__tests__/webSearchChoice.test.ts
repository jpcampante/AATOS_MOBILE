import {
  initialWebSearchState,
  turnWebMode,
  webSearchButtonView,
  webSearchUnavailableReason,
  type WebSearchState,
} from '../webSearchChoice';

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

describe('webSearchButtonView', () => {
  it('shows the chosen Auto as On and lets it be turned off', () => {
    expect(webSearchButtonView(ready())).toMatchObject({ on: true, blocked: false, reason: null, retry: false });
  });

  it('shows a chat with no choice as Off', () => {
    expect(webSearchButtonView(ready({ mode: null }))).toMatchObject({ on: false, blocked: false });
  });

  it('blocks turning it on and says why', () => {
    expect(webSearchButtonView(ready({ mode: 'off', companyEnabled: false }))).toMatchObject({
      blocked: true,
      reason: 'Disabled for this company.',
    });
    expect(webSearchButtonView(ready({ mode: 'off', available: false }))).toMatchObject({
      blocked: true,
      reason: 'Search is unavailable.',
    });
  });

  it('still lets an On choice be turned off when search became unavailable', () => {
    expect(webSearchButtonView(ready({ available: false }))).toMatchObject({ on: true, blocked: false });
  });

  it('says nothing about availability before the settings were read', () => {
    expect(webSearchButtonView(initialWebSearchState)).toMatchObject({ blocked: true, reason: null, retry: false });
  });

  it('offers a retry when the settings could not be loaded', () => {
    const view = webSearchButtonView(ready({ status: 'error', notice: 'Search settings could not be loaded. Retry to choose search.' }));
    expect(view).toMatchObject({ retry: true, blocked: false, accessibilityLabel: 'Retry web search settings' });
  });
});
