import {
  buildCompletionIndex, completionRate, currentStreak, dayStats, longestStreak, monthSummary, weeklyChart,
} from '@/domain/habits';
import { completion, days, habit } from './helpers';

const idx = (...pairs: [string, string][]) => buildCompletionIndex(pairs.map(([h, d]) => completion(h, d)));

describe('streaks', () => {
  const today = '2026-10-18';

  it('counts consecutive completed days ending today', () => {
    const i = idx(['h1', '2026-10-18'], ['h1', '2026-10-17'], ['h1', '2026-10-16']);
    expect(currentStreak(habit(), i, today)).toBe(3);
  });

  it('does not break the streak when today is still open', () => {
    const i = idx(['h1', '2026-10-17'], ['h1', '2026-10-16']);
    expect(currentStreak(habit(), i, today)).toBe(2);
  });

  it('breaks on a missed past day', () => {
    const i = idx(['h1', '2026-10-18'], ['h1', '2026-10-16']);
    expect(currentStreak(habit(), i, today)).toBe(1);
  });

  it('skips unscheduled days', () => {
    // Mon/Wed/Fri habit; 2026-10-18 is a Sunday. Fri 16, Wed 14, Mon 12 completed.
    const h = habit({ schedule: days([1, 3, 5]) });
    const i = idx(['h1', '2026-10-16'], ['h1', '2026-10-14'], ['h1', '2026-10-12']);
    expect(currentStreak(h, i, today)).toBe(3);
  });

  it('ignores days before the start date and is 0 for future habits', () => {
    const i = idx(['h1', '2026-10-17']);
    expect(currentStreak(habit({ startDate: '2026-10-17' }), i, today)).toBe(1);
    expect(currentStreak(habit({ startDate: '2026-11-01' }), i, today)).toBe(0);
  });

  it('finds the longest streak across history', () => {
    const i = idx(
      ['h1', '2026-10-01'], ['h1', '2026-10-02'], ['h1', '2026-10-03'], ['h1', '2026-10-04'],
      ['h1', '2026-10-10'], ['h1', '2026-10-11'],
      ['h1', '2026-10-17'], ['h1', '2026-10-18'],
    );
    const h = habit({ startDate: '2026-10-01' });
    expect(longestStreak(h, i, today)).toBe(4);
    expect(currentStreak(h, i, today)).toBe(2);
  });

  it('computes completion rate over a window', () => {
    const i = idx(['h1', '2026-10-18'], ['h1', '2026-10-17']);
    expect(completionRate(habit(), i, today, 4)).toBe(0.5);
    expect(completionRate(habit({ startDate: '2026-12-01' }), i, today, 4)).toBeNull();
  });
});

describe('daily and weekly stats', () => {
  const habits = [habit({ id: 'a' }), habit({ id: 'b' }), habit({ id: 'c', schedule: days([1]) })];

  it('calculates a day from real records', () => {
    const i = idx(['a', '2026-10-12'], ['c', '2026-10-12']);
    const s = dayStats(habits, i, '2026-10-12'); // Monday: a, b, c scheduled
    expect(s).toMatchObject({ scheduled: 3, done: 2 });
    expect(s.ratio).toBeCloseTo(2 / 3);
    expect(dayStats(habits, i, '2026-10-13').scheduled).toBe(2); // Tuesday: c not scheduled
    expect(dayStats([], i, '2026-10-13').ratio).toBeNull();
  });

  it('builds the weekly chart with future days flagged', () => {
    const i = idx(['a', '2026-10-12'], ['b', '2026-10-12'], ['a', '2026-10-13']);
    const week = weeklyChart(habits.slice(0, 2), i, '2026-10-14', 'monday');
    expect(week.map((d) => d.label).join('')).toBe('MTWTFSS');
    expect(week[0].ratio).toBe(1);
    expect(week[1].ratio).toBe(0.5);
    expect(week[2].isToday).toBe(true);
    expect(week[3].isFuture).toBe(true);
  });

  it('summarizes a month', () => {
    const i = idx(['a', '2026-10-01'], ['b', '2026-10-01'], ['a', '2026-10-02']);
    const m = monthSummary(habits.slice(0, 2), i, 2026, 9, '2026-10-03', 'monday');
    expect(m.days).toHaveLength(31);
    expect(m.perfectDays).toBe(1);
    expect(m.totalDone).toBe(3);
    expect(m.totalScheduled).toBe(6);
    expect(m.average).toBeCloseTo((1 + 0.5 + 0) / 3);
  });
});
