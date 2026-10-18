import { reducer } from '@/data/reducer';
import {
  completedSession, createTimer, elapsedMs, endTimestamp, focusStats, hasElapsed, parseMinutes,
  pauseTimer, remainingMs, resumeTimer, timerRatio,
} from '@/domain/focus';
import { emptyState } from './helpers';

const init = { plannedSeconds: 25 * 60, taskName: ' Write ', habitId: null, goalId: null };
const T0 = 1_000_000;

describe('focus timer calculations', () => {
  it('derives remaining time from timestamps, not ticks', () => {
    const t = createTimer(init, T0);
    expect(t.taskName).toBe('Write');
    expect(remainingMs(t, T0)).toBe(25 * 60_000);
    expect(remainingMs(t, T0 + 10 * 60_000)).toBe(15 * 60_000); // e.g. app was backgrounded for 10 min
    expect(timerRatio(t, T0 + 12.5 * 60_000)).toBeCloseTo(0.5);
    expect(endTimestamp(t, T0)).toBe(T0 + 25 * 60_000);
  });

  it('pauses and resumes without losing or gaining time', () => {
    let t = createTimer(init, T0);
    t = pauseTimer(t, T0 + 5 * 60_000);
    expect(t.status).toBe('paused');
    expect(remainingMs(t, T0 + 99 * 60_000)).toBe(20 * 60_000); // paused: time is frozen
    t = resumeTimer(t, T0 + 30 * 60_000);
    expect(remainingMs(t, T0 + 40 * 60_000)).toBe(10 * 60_000);
  });

  it('detects completion and clamps overshoot', () => {
    const t = createTimer(init, T0);
    expect(hasElapsed(t, T0 + 24 * 60_000)).toBe(false);
    expect(hasElapsed(t, T0 + 26 * 60_000)).toBe(true);
    expect(elapsedMs(t, T0 + 60 * 60_000)).toBe(25 * 60_000);
    expect(remainingMs(t, T0 + 60 * 60_000)).toBe(0);
  });

  it('records the true end moment when finishing late', () => {
    const t = createTimer(init, T0);
    const s = completedSession(t, 's1', T0 + 3 * 3_600_000);
    expect(s.endedAt).toBe(T0 + 25 * 60_000);
    expect(s.elapsedSeconds).toBe(1500);
  });

  it('saves one session when the reducer finishes the timer', () => {
    let s = reducer(emptyState(), { type: 'TIMER_START', init, now: T0, notificationId: null });
    s = reducer(s, { type: 'TIMER_FINISH', now: T0 + 26 * 60_000, sessionId: 's1' });
    s = reducer(s, { type: 'TIMER_FINISH', now: T0 + 27 * 60_000, sessionId: 's2' });
    expect(s.focusSessions).toHaveLength(1);
    expect(s.activeTimer?.status).toBe('finished');
    expect(reducer(s, { type: 'TIMER_RESET' }).activeTimer).toBeNull();
  });

  it('totals focused time', () => {
    const mk = (id: string, at: Date, sec: number) => ({
      id, taskName: '', plannedSeconds: sec, elapsedSeconds: sec, startedAt: 0, endedAt: at.getTime(),
      habitId: null, goalId: null, createdAt: 0,
    });
    const sessions = [
      mk('a', new Date(2026, 9, 18, 9), 1500), // today (Sunday)
      mk('b', new Date(2026, 9, 14, 9), 3000), // earlier this Mon-start week
      mk('c', new Date(2026, 8, 1, 9), 600),
    ];
    expect(focusStats(sessions, '2026-10-18', 'monday')).toEqual({
      todaySeconds: 1500, weekSeconds: 4500, totalSeconds: 5100, sessionCount: 3,
    });
  });

  it('parses custom minutes', () => {
    expect(parseMinutes('30')).toBe(30);
    expect(parseMinutes('0')).toBeNull();
    expect(parseMinutes('999')).toBeNull();
    expect(parseMinutes('abc')).toBeNull();
  });
});
