import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import { AppState as RNAppState } from 'react-native';
import { msUntilNextMidnight, toDateKey } from '@/domain/dates';
import { endTimestamp, hasElapsed, type TimerInit } from '@/domain/focus';
import { buildCompletionIndex, type CompletionIndex } from '@/domain/habits';
import type {
  AppState, DateKey, Goal, GoalMilestone, Habit, HabitSchedule, HabitTarget, UserPreferences, UserProfile,
} from '@/domain/types';
import {
  cancelNotification, ensureNotificationPermission, scheduleDailyReminder, scheduleFocusEnd,
} from '@/services/notifications';
import { reducer } from './reducer';
import { createInitialState, makeId } from './schema';
import { clearState, loadState, saveState } from './storage';

export interface HabitInput {
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string | null;
  schedule: HabitSchedule;
  target: HabitTarget | null;
  startDate: DateKey;
}

export interface GoalInput {
  id?: string;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  targetDate: DateKey | null;
  linkedHabitIds: string[];
  milestones: { title: string; target: number }[];
}

type Status = 'loading' | 'ready' | 'error';

interface Store {
  status: Status;
  loadError: string | null;
  recovered: boolean;
  saveError: string | null;
  state: AppState;
  today: DateKey;
  index: CompletionIndex;
  retryLoad: () => void;
  saveHabit: (input: HabitInput) => Habit;
  deleteHabit: (id: string) => void;
  setCompletion: (habitId: string, date: DateKey, done: boolean) => void;
  saveGoal: (input: GoalInput) => Goal;
  deleteGoal: (id: string) => void;
  adjustGoal: (id: string, delta: number) => void;
  setGoalCompleted: (id: string, done: boolean) => void;
  updateProfile: (patch: Partial<Pick<UserProfile, 'name' | 'avatarColor' | 'focusAreas' | 'mainGoal'>>) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  setDailyReminder: (enabled: boolean, hour: number, minute: number) => Promise<boolean>;
  startTimer: (init: TimerInit) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => Promise<void>;
  resetTimer: () => void;
  clearFocusHistory: () => void;
  resetAll: () => Promise<void>;
  exportData: () => string;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

function useToday(): DateKey {
  const [today, setToday] = useState(() => toDateKey(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toDateKey(new Date()));
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, msUntilNextMidnight(new Date()) + 500);
    };
    schedule();
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') {
        refresh();
        clearTimeout(timer);
        schedule();
      }
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);
  return today;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(Date.now()));
  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recovered, setRecovered] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const today = useToday();

  const stateRef = useRef(state);
  stateRef.current = state;
  const saveChain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadState()
      .then((res) => {
        if (cancelled) return;
        dispatch({ type: 'HYDRATE', state: res.state });
        setRecovered(res.recovered);
        setLoadError(null);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'Could not read your data.');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Persist every change, one write at a time and in order.
  useEffect(() => {
    if (status !== 'ready') return;
    const snapshot = state;
    saveChain.current = saveChain.current
      .then(() => saveState(snapshot))
      .then(() => setSaveError(null))
      .catch(() => setSaveError('Your latest changes could not be saved on this device.'));
  }, [state, status]);

  // Finish the timer from timestamps: on a tick, when returning to the app, and after launch.
  useEffect(() => {
    if (status !== 'ready') return;
    const check = () => {
      const t = stateRef.current.activeTimer;
      const now = Date.now();
      if (t && hasElapsed(t, now)) dispatch({ type: 'TIMER_FINISH', now, sessionId: makeId() });
    };
    check();
    const interval = setInterval(check, 1000);
    const sub = RNAppState.addEventListener('change', (s) => s === 'active' && check());
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [status]);

  const index = useMemo(() => buildCompletionIndex(state.completions), [state.completions]);

  const saveHabit = useCallback((input: HabitInput): Habit => {
    const now = Date.now();
    const existing = input.id ? stateRef.current.habits.find((h) => h.id === input.id) : undefined;
    const habit: Habit = {
      id: existing?.id ?? makeId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      name: input.name.trim(),
      description: input.description.trim(),
      icon: input.icon,
      color: input.color,
      schedule: input.schedule,
      target: input.target,
      startDate: input.startDate,
    };
    dispatch({ type: 'HABIT_SAVE', habit });
    return habit;
  }, []);

  const saveGoal = useCallback((input: GoalInput): Goal => {
    const now = Date.now();
    const existing = input.id ? stateRef.current.goals.find((g) => g.id === input.id) : undefined;
    const goal: Goal = {
      id: existing?.id ?? makeId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      title: input.title.trim(),
      description: input.description.trim(),
      targetValue: input.targetValue,
      unit: input.unit.trim() || 'steps',
      manualProgress: existing?.manualProgress ?? 0,
      targetDate: input.targetDate,
      startDate: existing?.startDate ?? toDateKey(new Date()),
      linkedHabitIds: input.linkedHabitIds,
      completedAt: existing?.completedAt ?? null,
    };
    const old = stateRef.current.milestones.filter((m) => m.goalId === goal.id);
    const milestones: GoalMilestone[] = input.milestones.map((m, i) => ({
      id: old[i]?.id ?? makeId(),
      goalId: goal.id,
      title: m.title.trim(),
      target: m.target,
      createdAt: old[i]?.createdAt ?? now,
      updatedAt: now,
    }));
    dispatch({ type: 'GOAL_SAVE', goal, milestones });
    return goal;
  }, []);

  const setDailyReminder = useCallback(async (enabled: boolean, hour: number, minute: number) => {
    const prefs = stateRef.current.preferences;
    await cancelNotification(prefs.dailyReminderNotificationId);
    if (!enabled) {
      dispatch({
        type: 'PREFERENCES_UPDATE',
        patch: { dailyReminderEnabled: false, dailyReminderHour: hour, dailyReminderMinute: minute, dailyReminderNotificationId: null },
      });
      return true;
    }
    const allowed = await ensureNotificationPermission();
    const id = allowed ? await scheduleDailyReminder(hour, minute) : null;
    dispatch({
      type: 'PREFERENCES_UPDATE',
      patch: { dailyReminderEnabled: id !== null, dailyReminderHour: hour, dailyReminderMinute: minute, dailyReminderNotificationId: id },
    });
    return id !== null;
  }, []);

  const startTimer = useCallback(async (init: TimerInit) => {
    const now = Date.now();
    let notificationId: string | null = null;
    if (stateRef.current.preferences.focusAlertsEnabled && (await ensureNotificationPermission())) {
      notificationId = await scheduleFocusEnd(now + init.plannedSeconds * 1000, init.taskName);
    }
    dispatch({ type: 'TIMER_START', init, now, notificationId });
  }, []);

  const pauseTimer = useCallback(() => {
    void cancelNotification(stateRef.current.activeTimer?.notificationId);
    dispatch({ type: 'TIMER_PAUSE', now: Date.now() });
  }, []);

  const resumeTimer = useCallback(async () => {
    const t = stateRef.current.activeTimer;
    const now = Date.now();
    let notificationId: string | null = null;
    if (t && stateRef.current.preferences.focusAlertsEnabled && (await ensureNotificationPermission())) {
      notificationId = await scheduleFocusEnd(endTimestamp({ ...t, status: 'paused' }, now), t.taskName);
    }
    dispatch({ type: 'TIMER_RESUME', now, notificationId });
  }, []);

  const resetTimer = useCallback(() => {
    void cancelNotification(stateRef.current.activeTimer?.notificationId);
    dispatch({ type: 'TIMER_RESET' });
  }, []);

  const resetAll = useCallback(async () => {
    const prefs = stateRef.current.preferences;
    await cancelNotification(prefs.dailyReminderNotificationId);
    await cancelNotification(stateRef.current.activeTimer?.notificationId);
    await saveChain.current.catch(() => undefined);
    await clearState().catch(() => undefined);
    dispatch({ type: 'RESET_ALL', now: Date.now() });
  }, []);

  const exportData = useCallback(() => {
    const { preferences, ...rest } = stateRef.current;
    const { dailyReminderNotificationId: _omit, ...prefs } = preferences;
    return JSON.stringify({ app: 'Glitch Life', exportedAt: new Date().toISOString(), ...rest, preferences: prefs }, null, 2);
  }, []);

  const value = useMemo<Store>(
    () => ({
      status, loadError, recovered, saveError, state, today, index,
      retryLoad: () => setAttempt((a) => a + 1),
      saveHabit,
      deleteHabit: (id) => dispatch({ type: 'HABIT_DELETE', id }),
      setCompletion: (habitId, date, done) =>
        dispatch({ type: 'COMPLETION_SET', habitId, date, done, id: makeId(), now: Date.now() }),
      saveGoal,
      deleteGoal: (id) => dispatch({ type: 'GOAL_DELETE', id }),
      adjustGoal: (id, delta) => dispatch({ type: 'GOAL_ADJUST', id, delta, now: Date.now() }),
      setGoalCompleted: (id, done) => dispatch({ type: 'GOAL_SET_COMPLETED', id, done, now: Date.now() }),
      updateProfile: (patch) => dispatch({ type: 'PROFILE_UPDATE', patch, now: Date.now() }),
      updatePreferences: (patch) => dispatch({ type: 'PREFERENCES_UPDATE', patch }),
      setDailyReminder,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      clearFocusHistory: () => dispatch({ type: 'FOCUS_HISTORY_CLEAR' }),
      resetAll,
      exportData,
    }),
    [status, loadError, recovered, saveError, state, today, index, saveHabit, saveGoal, setDailyReminder,
      startTimer, pauseTimer, resumeTimer, resetTimer, resetAll, exportData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
