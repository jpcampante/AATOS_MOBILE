import { AccessibilityInfo } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useAnnounceWhenFinished } from '../useAnnounceWhenFinished';
import { useElapsed } from '../useElapsed';
import { STEP_MS, TAIL_MS, useStepReveal } from '../useStepReveal';
import { applyWorkEvent, startWorkRun, type WorkRun } from '../workRun';

beforeEach(() => jest.useFakeTimers({ now: 10_000 }));
afterEach(() => jest.useRealTimers());

describe('useStepReveal', () => {
  it('reveals live steps one by one, then settles after a pause', () => {
    const { result, rerender } = renderHook((props: { total: number; active: boolean }) => useStepReveal(props.total, props.active, 'fast'), {
      initialProps: { total: 3, active: true },
    });
    expect(result.current).toEqual({ shown: 0, settled: false });

    act(() => jest.advanceTimersByTime(0));
    expect(result.current.shown).toBe(1);
    act(() => jest.advanceTimersByTime(STEP_MS.fast));
    expect(result.current.shown).toBe(2);
    act(() => jest.advanceTimersByTime(STEP_MS.fast));
    expect(result.current.shown).toBe(3);

    rerender({ total: 3, active: false });
    expect(result.current.settled).toBe(false); // the last step still gets its moment
    act(() => jest.advanceTimersByTime(STEP_MS.fast + TAIL_MS));
    expect(result.current.settled).toBe(true);
  });

  it('shows a finished turn at once', () => {
    const { result } = renderHook(() => useStepReveal(4, false, 'deep'));
    expect(result.current).toEqual({ shown: 4, settled: true });
  });

  it('goes at the deep pace in deep mode', () => {
    const { result } = renderHook(() => useStepReveal(2, true, 'deep'));
    act(() => jest.advanceTimersByTime(0));
    act(() => jest.advanceTimersByTime(STEP_MS.fast));
    expect(result.current.shown).toBe(1);
    act(() => jest.advanceTimersByTime(STEP_MS.deep - STEP_MS.fast));
    expect(result.current.shown).toBe(2);
  });
});

describe('useElapsed', () => {
  it('ticks every second while working and freezes when done', () => {
    const live = startWorkRun('x', 'fast', 10_000);
    const { result, rerender } = renderHook((props: { run: WorkRun }) => useElapsed(props.run), { initialProps: { run: live } });
    expect(result.current).toBe(0);

    act(() => jest.advanceTimersByTime(3000));
    expect(result.current).toBe(3000);

    rerender({ run: applyWorkEvent(live, { type: 'complete', at: 14_000 }) });
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current).toBe(4000);
  });
});

describe('useAnnounceWhenFinished', () => {
  it('announces once, when the work ends', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    const { rerender } = renderHook((props: { active: boolean; message: string }) => useAnnounceWhenFinished(props.active, props.message), {
      initialProps: { active: true, message: 'Working for 1s' },
    });
    rerender({ active: true, message: 'Working for 2s' });
    expect(announce).not.toHaveBeenCalled();

    rerender({ active: false, message: 'Reasoned for 2 seconds · Fast' });
    rerender({ active: false, message: 'Reasoned for 2 seconds · Fast' });
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Reasoned for 2 seconds · Fast');
    announce.mockRestore();
  });

  it('stays quiet for a turn that was already finished', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    renderHook(() => useAnnounceWhenFinished(false, 'Reasoned for 2 seconds · Fast'));
    expect(announce).not.toHaveBeenCalled();
    announce.mockRestore();
  });
});
