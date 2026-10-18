import { addDays, startOfWeek, toDateKey } from './dates';
import type { ActiveTimer, DateKey, FocusSession, WeekStart } from './types';

export const PRESET_MINUTES = [15, 25, 45, 60, 90] as const;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 240;

export interface TimerInit {
  plannedSeconds: number;
  taskName: string;
  habitId: string | null;
  goalId: string | null;
}

export function createTimer(init: TimerInit, now: number): ActiveTimer {
  return {
    status: 'running',
    plannedSeconds: init.plannedSeconds,
    taskName: init.taskName.trim(),
    habitId: init.habitId,
    goalId: init.goalId,
    startedAt: now,
    accumulatedMs: 0,
    runningSince: now,
    notificationId: null,
    sessionId: null,
  };
}

/** Total ms the timer has actually run, derived purely from timestamps. */
export function elapsedMs(t: ActiveTimer, now: number): number {
  const segment = t.status === 'running' && t.runningSince !== null ? Math.max(0, now - t.runningSince) : 0;
  const total = t.accumulatedMs + segment;
  return Math.min(total, t.plannedSeconds * 1000);
}

export function remainingMs(t: ActiveTimer, now: number): number {
  return Math.max(0, t.plannedSeconds * 1000 - elapsedMs(t, now));
}

/** 0–1 progress through the session. */
export function timerRatio(t: ActiveTimer, now: number): number {
  return t.plannedSeconds > 0 ? elapsedMs(t, now) / (t.plannedSeconds * 1000) : 0;
}

export function hasElapsed(t: ActiveTimer, now: number): boolean {
  return t.status === 'running' && remainingMs(t, now) <= 0;
}

/** Epoch ms at which a running timer will finish. */
export function endTimestamp(t: ActiveTimer, now: number): number {
  return now + remainingMs(t, now);
}

export function pauseTimer(t: ActiveTimer, now: number): ActiveTimer {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', accumulatedMs: elapsedMs(t, now), runningSince: null, notificationId: null };
}

export function resumeTimer(t: ActiveTimer, now: number): ActiveTimer {
  if (t.status !== 'paused') return t;
  return { ...t, status: 'running', runningSince: now };
}

/**
 * Builds the history record for a timer that has run to completion. When the app was
 * in the background, the true end moment is used rather than the time the app noticed.
 */
export function completedSession(t: ActiveTimer, id: string, now: number): FocusSession {
  const endedAt = t.runningSince !== null ? Math.min(now, t.runningSince + (t.plannedSeconds * 1000 - t.accumulatedMs)) : now;
  return {
    id,
    taskName: t.taskName,
    plannedSeconds: t.plannedSeconds,
    elapsedSeconds: t.plannedSeconds,
    startedAt: t.startedAt,
    endedAt,
    habitId: t.habitId,
    goalId: t.goalId,
    createdAt: now,
  };
}

export interface FocusStats {
  todaySeconds: number;
  weekSeconds: number;
  totalSeconds: number;
  sessionCount: number;
}

export function focusStats(sessions: FocusSession[], today: DateKey, weekStart: WeekStart): FocusStats {
  const weekFrom = startOfWeek(today, weekStart);
  const weekTo = addDays(weekFrom, 6);
  let todaySeconds = 0;
  let weekSeconds = 0;
  let totalSeconds = 0;
  for (const s of sessions) {
    const day = toDateKey(new Date(s.endedAt));
    totalSeconds += s.elapsedSeconds;
    if (day === today) todaySeconds += s.elapsedSeconds;
    if (day >= weekFrom && day <= weekTo) weekSeconds += s.elapsedSeconds;
  }
  return { todaySeconds, weekSeconds, totalSeconds, sessionCount: sessions.length };
}

export function parseMinutes(input: string): number | null {
  if (!/^\d{1,3}$/.test(input.trim())) return null;
  const n = Number(input);
  return n >= MIN_MINUTES && n <= MAX_MINUTES ? n : null;
}
