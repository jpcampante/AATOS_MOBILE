import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { applyWorkEvent, startWorkRun, type WorkEvent, type WorkRun } from '../../../../features/auria/work/workRun';
import { STEP_MS, TAIL_MS } from '../../../../features/auria/work/useStepReveal';
import { renderWithTheme } from '../../../../test/renderWithTheme';
import { AuriaWorkPanel } from '../AuriaWorkPanel';

const play = (events: WorkEvent[], base = startWorkRun('What are my tasks today?', 'fast', 10_000)): WorkRun =>
  events.reduce(applyWorkEvent, base);

const TURN: WorkEvent[] = [
  { type: 'status', phase: 'started' },
  { type: 'status', phase: 'thinking', round: 1 },
  { type: 'tool', name: 'list_my_kanban_tasks', status: 'running', service: 'tasks' },
  { type: 'tool', name: 'list_my_kanban_tasks', status: 'done', ok: true, service: 'tasks' },
  { type: 'tool', name: 'list_calendar_events', status: 'running', service: 'google-calendar' },
  { type: 'tool', name: 'list_calendar_events', status: 'done', ok: true, service: 'google-calendar' },
  { type: 'answer' },
];

/** Lets the steps come in one at a time: each reveal schedules the next after rendering. */
const tick = (ms: number, times = 1) => {
  for (let i = 0; i < times; i += 1) act(() => jest.advanceTimersByTime(ms));
};

const liveLabel = () => screen.getByLabelText(/^Auria is working\./).props.accessibilityLabel as string;

let announce: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers({ now: 10_000 });
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});
afterEach(() => {
  announce.mockRestore();
  jest.useRealTimers();
});

describe('AuriaWorkPanel', () => {
  it('shows the live line from the moment the message is sent', () => {
    renderWithTheme(<AuriaWorkPanel run={startWorkRun('What are my tasks today?', 'fast', 10_000)} />);
    act(() => jest.advanceTimersByTime(0));
    expect(liveLabel()).toBe('Auria is working. Understanding the request');
    expect(screen.getByText('0s')).toBeTruthy();
  });

  it('walks through the steps at the web pace and counts the seconds', () => {
    renderWithTheme(<AuriaWorkPanel run={play(TURN)} />);
    act(() => jest.advanceTimersByTime(0));
    expect(liveLabel()).toBe('Auria is working. Understanding the request');

    tick(STEP_MS.fast, 4);
    expect(liveLabel()).toBe('Auria is working. Scanning your tasks');
    expect(screen.getByText('Gathered workspace context')).toBeTruthy();
    expect(screen.getByText('3s')).toBeTruthy();
  });

  it('closes into "Reasoned for…" with the services, then opens the details', () => {
    const { rerender } = renderWithTheme(<AuriaWorkPanel run={play(TURN)} />);
    tick(STEP_MS.fast, 10);

    rerender(<AuriaWorkPanel run={play([...TURN, { type: 'complete', at: 18_000 }])} />);
    tick(STEP_MS.fast + TAIL_MS);

    const header = screen.getByRole('button', { name: 'Reasoned for 8 seconds · Fast' });
    expect(header).toBeCollapsed();
    expect(screen.getByTestId('service-mark-workspace', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('service-mark-tasks', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('service-mark-google-calendar', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('Scanned your tasks')).toBeNull();

    fireEvent.press(header);
    expect(header).toBeExpanded();
    expect(screen.getByText(/^I worked through your request/)).toBeTruthy();
    expect(screen.getByText('Scanned your tasks')).toBeTruthy();
    expect(screen.getByText('Checked your calendar')).toBeTruthy();
    expect(screen.getByText('Wrote the answer')).toBeTruthy();

    fireEvent.press(header);
    expect(screen.queryByText('Scanned your tasks')).toBeNull();
  });

  it('announces only the end to the screen reader', () => {
    const { rerender } = renderWithTheme(<AuriaWorkPanel run={play(TURN)} />);
    tick(STEP_MS.fast, 10);
    expect(announce).not.toHaveBeenCalled();

    rerender(<AuriaWorkPanel run={play([...TURN, { type: 'complete', at: 18_000 }])} />);
    expect(announce).toHaveBeenCalledWith('Reasoned for 8 seconds · Fast');
  });

  it('says it stopped, keeping what it got to do', () => {
    renderWithTheme(<AuriaWorkPanel run={play([...TURN.slice(0, 3), { type: 'stopped', at: 15_000 }])} />);
    fireEvent.press(screen.getByRole('button', { name: 'Stopped after 5s · Fast' }));
    expect(screen.getByText('Gathered workspace context')).toBeTruthy();
    expect(screen.queryByText('Scanned your tasks')).toBeNull();
  });

  it('lists the documents it delivered', () => {
    renderWithTheme(<AuriaWorkPanel run={play([{ type: 'canvas', name: 'Q3 plan' }, { type: 'complete', at: 12_000 }])} />);
    fireEvent.press(screen.getByRole('button', { name: 'Reasoned for 2 seconds · Fast' }));
    expect(screen.getByText('Created Q3 plan')).toBeTruthy();
    expect(screen.getByText(/editable document/)).toBeTruthy();
  });
});
