import {
  addDays, addMonths, diffDays, formatClock, formatDuration, greetingKey, isValidDateKey,
  monthKeys, startOfWeek, toDateKey, weekKeys, weekdayOf,
} from '@/domain/dates';

describe('dates', () => {
  it('builds local date keys', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(diffDays('2026-03-01', '2026-03-31')).toBe(30);
    expect(diffDays('2026-03-31', '2026-03-01')).toBe(-30);
  });

  it('is stable across DST changes', () => {
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
  });

  it('computes weeks for both week starts', () => {
    expect(weekdayOf('2026-10-18')).toBe(0); // Sunday
    expect(startOfWeek('2026-10-18', 'monday')).toBe('2026-10-12');
    expect(startOfWeek('2026-10-18', 'sunday')).toBe('2026-10-18');
    expect(weekKeys('2026-10-14', 'monday')).toEqual([
      '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
    ]);
  });

  it('validates keys and months', () => {
    expect(isValidDateKey('2026-02-29')).toBe(false);
    expect(isValidDateKey('2028-02-29')).toBe(true);
    expect(monthKeys(2026, 1)).toHaveLength(28);
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month0: 0 });
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month0: 11 });
  });

  it('greets by time of day', () => {
    expect(greetingKey(new Date(2026, 0, 1, 8))).toBe('greeting.morning');
    expect(greetingKey(new Date(2026, 0, 1, 14))).toBe('greeting.afternoon');
    expect(greetingKey(new Date(2026, 0, 1, 20))).toBe('greeting.evening');
    expect(greetingKey(new Date(2026, 0, 1, 2))).toBe('greeting.night');
  });

  it('formats durations', () => {
    expect(formatClock(1500)).toBe('25:00');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(0.2)).toBe('00:01');
    expect(formatDuration(5400)).toBe('1h 30m');
    expect(formatDuration(1500)).toBe('25 min');
  });
});

import { leadingBlanks, weekdayLetters } from '@/domain/dates';
describe('month grid helpers', () => {
  it('aligns the first of the month to the week start', () => {
    // Oct 1 2026 is a Thursday
    expect(leadingBlanks(2026, 9, 'monday')).toBe(3);
    expect(leadingBlanks(2026, 9, 'sunday')).toBe(4);
    expect(weekdayLetters('monday')).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });
});
