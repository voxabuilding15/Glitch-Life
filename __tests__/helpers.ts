import type { DateKey, Habit, HabitCompletion, Weekday } from '@/domain/types';
import { createInitialState } from '@/data/schema';

export const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Read',
  description: '',
  icon: 'book-open',
  color: null,
  schedule: { type: 'daily' },
  target: null,
  startDate: '2026-01-01',
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

export const days = (d: Weekday[]): Habit['schedule'] => ({ type: 'days', days: d });

export const completion = (habitId: string, date: DateKey): HabitCompletion => ({
  id: `${habitId}-${date}`,
  habitId,
  date,
  completedAt: 0,
  createdAt: 0,
});

export const emptyState = () => createInitialState(1_000);
