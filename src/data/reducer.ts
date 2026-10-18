import { completedSession, createTimer, pauseTimer, resumeTimer, type TimerInit } from '@/domain/focus';
import type {
  ActiveTimer,
  AppState,
  DateKey,
  Goal,
  GoalMilestone,
  Habit,
  UserPreferences,
  UserProfile,
} from '@/domain/types';
import { createInitialState } from './schema';

export type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'RESET_ALL'; now: number }
  | { type: 'PROFILE_UPDATE'; patch: Partial<Omit<UserProfile, 'id' | 'createdAt'>>; now: number }
  | { type: 'PREFERENCES_UPDATE'; patch: Partial<UserPreferences> }
  | { type: 'HABIT_SAVE'; habit: Habit }
  | { type: 'HABIT_DELETE'; id: string }
  | { type: 'COMPLETION_SET'; habitId: string; date: DateKey; done: boolean; id: string; now: number }
  | { type: 'GOAL_SAVE'; goal: Goal; milestones: GoalMilestone[] }
  | { type: 'GOAL_DELETE'; id: string }
  | { type: 'GOAL_ADJUST'; id: string; delta: number; now: number }
  | { type: 'GOAL_SET_COMPLETED'; id: string; done: boolean; now: number }
  | { type: 'TIMER_START'; init: TimerInit; now: number; notificationId: string | null }
  | { type: 'TIMER_PAUSE'; now: number }
  | { type: 'TIMER_RESUME'; now: number; notificationId: string | null }
  | { type: 'TIMER_SET_NOTIFICATION'; notificationId: string | null }
  | { type: 'TIMER_RESET' }
  | { type: 'TIMER_FINISH'; now: number; sessionId: string }
  | { type: 'FOCUS_HISTORY_CLEAR' };

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'RESET_ALL':
      return createInitialState(action.now);

    case 'PROFILE_UPDATE':
      return { ...state, profile: { ...state.profile, ...action.patch, updatedAt: action.now } };
    case 'PREFERENCES_UPDATE':
      return { ...state, preferences: { ...state.preferences, ...action.patch } };

    case 'HABIT_SAVE':
      return { ...state, habits: upsert(state.habits, action.habit) };
    case 'HABIT_DELETE':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
        completions: state.completions.filter((c) => c.habitId !== action.id),
        goals: state.goals.map((g) =>
          g.linkedHabitIds.includes(action.id)
            ? { ...g, linkedHabitIds: g.linkedHabitIds.filter((id) => id !== action.id) }
            : g,
        ),
        focusSessions: state.focusSessions.map((s) => (s.habitId === action.id ? { ...s, habitId: null } : s)),
        activeTimer:
          state.activeTimer?.habitId === action.id ? { ...state.activeTimer, habitId: null } : state.activeTimer,
      };

    case 'COMPLETION_SET': {
      const exists = state.completions.some((c) => c.habitId === action.habitId && c.date === action.date);
      if (action.done) {
        if (exists) return state; // never create a duplicate for the same habit and date
        return {
          ...state,
          completions: [
            ...state.completions,
            { id: action.id, habitId: action.habitId, date: action.date, completedAt: action.now, createdAt: action.now },
          ],
        };
      }
      if (!exists) return state;
      return {
        ...state,
        completions: state.completions.filter((c) => !(c.habitId === action.habitId && c.date === action.date)),
      };
    }

    case 'GOAL_SAVE':
      return {
        ...state,
        goals: upsert(state.goals, action.goal),
        milestones: [...state.milestones.filter((m) => m.goalId !== action.goal.id), ...action.milestones],
      };
    case 'GOAL_DELETE':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.id),
        milestones: state.milestones.filter((m) => m.goalId !== action.id),
        focusSessions: state.focusSessions.map((s) => (s.goalId === action.id ? { ...s, goalId: null } : s)),
        activeTimer: state.activeTimer?.goalId === action.id ? { ...state.activeTimer, goalId: null } : state.activeTimer,
      };
    case 'GOAL_ADJUST':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id
            ? { ...g, manualProgress: Math.max(0, g.manualProgress + action.delta), updatedAt: action.now }
            : g,
        ),
      };
    case 'GOAL_SET_COMPLETED':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, completedAt: action.done ? action.now : null, updatedAt: action.now } : g,
        ),
      };

    case 'TIMER_START': {
      const timer: ActiveTimer = { ...createTimer(action.init, action.now), notificationId: action.notificationId };
      return { ...state, activeTimer: timer };
    }
    case 'TIMER_PAUSE':
      return state.activeTimer ? { ...state, activeTimer: pauseTimer(state.activeTimer, action.now) } : state;
    case 'TIMER_RESUME':
      return state.activeTimer
        ? { ...state, activeTimer: { ...resumeTimer(state.activeTimer, action.now), notificationId: action.notificationId } }
        : state;
    case 'TIMER_SET_NOTIFICATION':
      return state.activeTimer && state.activeTimer.status === 'running'
        ? { ...state, activeTimer: { ...state.activeTimer, notificationId: action.notificationId } }
        : state;
    case 'TIMER_RESET':
      return { ...state, activeTimer: null };
    case 'TIMER_FINISH': {
      const t = state.activeTimer;
      if (!t || t.status === 'finished') return state;
      const session = completedSession(t, action.sessionId, action.now);
      return {
        ...state,
        focusSessions: [session, ...state.focusSessions],
        activeTimer: { ...t, status: 'finished', runningSince: null, accumulatedMs: t.plannedSeconds * 1000, notificationId: null, sessionId: session.id },
      };
    }
    case 'FOCUS_HISTORY_CLEAR':
      return { ...state, focusSessions: [] };
  }
}
