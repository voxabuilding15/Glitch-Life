import type { AppState, UserPreferences, UserProfile } from '@/domain/types';

export const SCHEMA_VERSION = 1;

export function makeId(): string {
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${Date.now().toString(36)}-${hex()}${hex()}-${hex()}`;
}

export function defaultPreferences(): UserPreferences {
  return {
    weekStart: 'monday',
    hapticsEnabled: true,
    dailyReminderEnabled: false,
    dailyReminderHour: 20,
    dailyReminderMinute: 0,
    dailyReminderNotificationId: null,
    focusAlertsEnabled: true,
    onboardingCompleted: false,
  };
}

export function defaultProfile(now: number): UserProfile {
  return {
    id: makeId(),
    name: '',
    avatarColor: '#5483B3',
    focusAreas: [],
    mainGoal: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialState(now: number): AppState {
  return {
    version: SCHEMA_VERSION,
    profile: defaultProfile(now),
    preferences: defaultPreferences(),
    habits: [],
    completions: [],
    goals: [],
    milestones: [],
    focusSessions: [],
    activeTimer: null,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/**
 * Turns whatever was persisted into a usable state. Unknown/missing fields fall back to
 * defaults, so older saves keep working; returns null only if the payload is unusable.
 */
export function migrateState(raw: unknown, now: number): AppState | null {
  if (!isObj(raw)) return null;
  if (typeof raw.version === 'number' && raw.version > SCHEMA_VERSION) return null;
  const base = createInitialState(now);

  const completions = arr<AppState['completions'][number]>(raw.completions).filter(
    (c) => isObj(c) && typeof c.habitId === 'string' && typeof c.date === 'string',
  );
  // Enforce "one completion per habit per date" even for corrupted data.
  const seen = new Set<string>();
  const unique = completions.filter((c) => {
    const key = `${c.habitId}:${c.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    version: SCHEMA_VERSION,
    profile: { ...base.profile, ...(isObj(raw.profile) ? (raw.profile as Partial<UserProfile>) : {}) },
    preferences: { ...base.preferences, ...(isObj(raw.preferences) ? (raw.preferences as Partial<UserPreferences>) : {}) },
    habits: arr(raw.habits),
    completions: unique,
    goals: arr(raw.goals),
    milestones: arr(raw.milestones),
    focusSessions: arr(raw.focusSessions),
    activeTimer: isObj(raw.activeTimer) ? (raw.activeTimer as unknown as AppState['activeTimer']) : null,
  };
}
