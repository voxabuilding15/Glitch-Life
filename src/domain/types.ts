/** Local calendar date as `YYYY-MM-DD` (device time zone at the moment of the action). */
export type DateKey = string;
/** 0 = Sunday … 6 = Saturday (same as `Date#getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WeekStart = 'monday' | 'sunday';

interface Timestamps {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile extends Timestamps {
  name: string;
  avatarColor: string;
  focusAreas: string[];
  mainGoal: string;
}

export interface UserPreferences {
  weekStart: WeekStart;
  hapticsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  /** Id of the scheduled OS notification for the daily reminder, if any. */
  dailyReminderNotificationId: string | null;
  focusAlertsEnabled: boolean;
  onboardingCompleted: boolean;
}

export type HabitSchedule = { type: 'daily' } | { type: 'days'; days: Weekday[] };

export interface HabitTarget {
  value: number;
  unit: string;
}

export interface Habit extends Timestamps {
  name: string;
  description: string;
  icon: string;
  color: string | null;
  schedule: HabitSchedule;
  target: HabitTarget | null;
  startDate: DateKey;
}

/** Stored separately from the habit so history/streaks survive edits. One per habit per date. */
export interface HabitCompletion {
  id: string;
  habitId: string;
  date: DateKey;
  completedAt: number;
  createdAt: number;
}

export interface Goal extends Timestamps {
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  /** Progress added manually by the user. */
  manualProgress: number;
  targetDate: DateKey | null;
  startDate: DateKey;
  linkedHabitIds: string[];
  completedAt: number | null;
}

/** A measurable checkpoint: reached once goal progress >= `target`. */
export interface GoalMilestone extends Timestamps {
  goalId: string;
  title: string;
  target: number;
}

export interface FocusSession {
  id: string;
  taskName: string;
  plannedSeconds: number;
  elapsedSeconds: number;
  startedAt: number;
  endedAt: number;
  habitId: string | null;
  goalId: string | null;
  createdAt: number;
}

export type TimerStatus = 'running' | 'paused' | 'finished';

/** Persisted timer state. Remaining time is always derived from timestamps. */
export interface ActiveTimer {
  status: TimerStatus;
  plannedSeconds: number;
  taskName: string;
  habitId: string | null;
  goalId: string | null;
  startedAt: number;
  /** Milliseconds accumulated across previous running segments. */
  accumulatedMs: number;
  /** Start of the current running segment (only while running). */
  runningSince: number | null;
  notificationId: string | null;
  /** Set once the session has been saved. */
  sessionId: string | null;
}

export interface AppState {
  version: number;
  profile: UserProfile;
  preferences: UserPreferences;
  habits: Habit[];
  completions: HabitCompletion[];
  goals: Goal[];
  milestones: GoalMilestone[];
  focusSessions: FocusSession[];
  activeTimer: ActiveTimer | null;
}
