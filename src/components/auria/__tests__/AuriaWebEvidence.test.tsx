import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaWebEvidence } from '../AuriaWebEvidence';
import type { WebSnapshot, WebSource } from '../../../features/auria/webResult';

const source = (index: number): WebSource => ({
  index,
  url: `https://site${index}.example/a`,
  title: `Source ${index}`,
  domain: `site${index}.example`,
  date: '2026-10-13',
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
  sources: [1, 2, 3, 4, 5].map(source),
  truncated: false,
  ...over,
});

describe('AuriaWebEvidence', () => {
  it('says the search is running', () => {
    const { getByText } = renderWithTheme(
      <AuriaWebEvidence result={snapshot({ status: 'searching', inProgress: 1, sources: [] })} />,
    );
    expect(getByText('Searching the web…')).toBeTruthy();
  });

  it('shows four cards and keeps the rest for the list', () => {
    const { getByText, queryByText, getByLabelText } = renderWithTheme(<AuriaWebEvidence result={snapshot()} />);
    expect(getByText('Source 4')).toBeTruthy();
    expect(queryByText('Source 5')).toBeNull();
    expect(getByText('5 sources · 2 search attempts')).toBeTruthy();
    fireEvent.press(getByLabelText('5 sources · 2 search attempts, show the list'));
    expect(getByText('[5] Source 5')).toBeTruthy();
  });

  it('opens the source that was tapped', () => {
    const onOpenSource = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AuriaWebEvidence result={snapshot({ sources: [source(1)] })} onOpenSource={onOpenSource} />,
    );
    fireEvent.press(getByLabelText('Open source 1: Source 1'));
    expect(onOpenSource).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
  });

  it('explains a failed search', () => {
    const { getByText } = renderWithTheme(
      <AuriaWebEvidence result={snapshot({ status: 'failed', sources: [], failureCode: 'provider_timeout' })} />,
    );
    expect(getByText('Web search could not complete.')).toBeTruthy();
    expect(getByText('Search timed out.')).toBeTruthy();
  });

  it('says when the sources come from an earlier search of the turn', () => {
    const { getByText } = renderWithTheme(
      <AuriaWebEvidence result={snapshot({ lastSearchStatus: 'failed', sources: [source(1)] })} />,
    );
    expect(getByText('Sources found earlier in this turn are kept.')).toBeTruthy();
  });
});
