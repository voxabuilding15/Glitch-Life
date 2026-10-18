import { addDays, diffDays, monthKeys, startOfWeek, weekdayLetter, weekKeys, weekdayOf } from './dates';
import type { Lang } from '@/i18n/types';
import type { DateKey, Habit, HabitCompletion, WeekStart } from './types';

/** Fast lookup of `habitId:date` pairs. */
export type CompletionIndex = Set<string>;

const k = (habitId: string, date: DateKey) => `${habitId}:${date}`;

export function buildCompletionIndex(completions: HabitCompletion[]): CompletionIndex {
  return new Set(completions.map((c) => k(c.habitId, c.date)));
}

export function isCompleted(index: CompletionIndex, habitId: string, date: DateKey): boolean {
  return index.has(k(habitId, date));
}

/** True when the habit applies on `date` (on/after its start date and on a chosen weekday). */
export function isScheduledOn(habit: Habit, date: DateKey): boolean {
  if (date < habit.startDate) return false;
  if (habit.schedule.type === 'daily') return true;
  return habit.schedule.days.includes(weekdayOf(date));
}

export function habitsForDay(habits: Habit[], date: DateKey): Habit[] {
  return habits.filter((h) => isScheduledOn(h, date));
}

export interface DayStats {
  date: DateKey;
  scheduled: number;
  done: number;
  /** 0–1, or null when nothing was scheduled. */
  ratio: number | null;
}

export function dayStats(habits: Habit[], index: CompletionIndex, date: DateKey): DayStats {
  const scheduled = habitsForDay(habits, date);
  const done = scheduled.filter((h) => isCompleted(index, h.id, date)).length;
  return { date, scheduled: scheduled.length, done, ratio: scheduled.length ? done / scheduled.length : null };
}

/**
 * Current streak: consecutive scheduled days completed, counting back from today.
 * An unfinished today does not break the streak; unscheduled days are skipped.
 */
export function currentStreak(habit: Habit, index: CompletionIndex, today: DateKey): number {
  let cursor = today;
  if (isScheduledOn(habit, today) && !isCompleted(index, habit.id, today)) cursor = addDays(today, -1);
  let streak = 0;
  while (cursor >= habit.startDate) {
    if (isScheduledOn(habit, cursor)) {
      if (!isCompleted(index, habit.id, cursor)) break;
      streak += 1;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(habit: Habit, index: CompletionIndex, today: DateKey): number {
  let best = 0;
  let run = 0;
  const span = diffDays(habit.startDate, today);
  for (let i = 0; i <= span; i++) {
    const d = addDays(habit.startDate, i);
    if (!isScheduledOn(habit, d)) continue;
    if (isCompleted(index, habit.id, d)) {
      run += 1;
      best = Math.max(best, run);
    } else if (d !== today) {
      run = 0;
    }
  }
  return best;
}

/** Completion rate (0–1) over the last `days` days ending today; null if nothing was scheduled. */
export function completionRate(habit: Habit, index: CompletionIndex, today: DateKey, days: number): number | null {
  let scheduled = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (!isScheduledOn(habit, d)) continue;
    scheduled += 1;
    if (isCompleted(index, habit.id, d)) done += 1;
  }
  return scheduled ? done / scheduled : null;
}

export function totalCompletions(habit: Habit, completions: HabitCompletion[]): number {
  return completions.filter((c) => c.habitId === habit.id).length;
}

export interface ChartDay extends DayStats {
  label: string;
  isFuture: boolean;
  isToday: boolean;
}

/** Seven days of the week containing `today`, with real completion percentages. */
export function weeklyChart(
  habits: Habit[],
  index: CompletionIndex,
  today: DateKey,
  weekStart: WeekStart,
  lang: Lang = 'en',
): ChartDay[] {
  return weekKeys(today, weekStart).map((date) => ({
    ...dayStats(habits, index, date),
    label: weekdayLetter(weekdayOf(date), lang),
    isFuture: date > today,
    isToday: date === today,
  }));
}

/** Average of defined daily ratios up to and including today; null if none. */
export function averageRatio(days: { ratio: number | null; isFuture?: boolean }[]): number | null {
  const vals = days.filter((d) => !d.isFuture && d.ratio !== null).map((d) => d.ratio as number);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export interface MonthSummary {
  days: ChartDay[];
  /** Weekly averages within the month, for the monthly bar chart. */
  weeks: { label: string; ratio: number | null }[];
  average: number | null;
  perfectDays: number;
  totalDone: number;
  totalScheduled: number;
}

export function monthSummary(
  habits: Habit[],
  index: CompletionIndex,
  year: number,
  month0: number,
  today: DateKey,
  weekStart: WeekStart,
): MonthSummary {
  const days: ChartDay[] = monthKeys(year, month0).map((date) => ({
    ...dayStats(habits, index, date),
    label: String(Number(date.slice(8, 10))),
    isFuture: date > today,
    isToday: date === today,
  }));
  const groups = new Map<DateKey, ChartDay[]>();
  for (const d of days) {
    const key = startOfWeek(d.date, weekStart);
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  const weeks = [...groups.values()].map((g, i) => ({ label: `W${i + 1}`, ratio: averageRatio(g) }));
  const past = days.filter((d) => !d.isFuture);
  return {
    days,
    weeks,
    average: averageRatio(days),
    perfectDays: past.filter((d) => d.ratio === 1).length,
    totalDone: past.reduce((a, d) => a + d.done, 0),
    totalScheduled: past.reduce((a, d) => a + d.scheduled, 0),
  };
}
