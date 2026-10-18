/**
 * Monetization-ready hook. No billing exists yet, so every user gets the full
 * experience (ENFORCE_LIMITS = false). When a billing provider is integrated,
 * resolve the plan from verified purchase state and flip the flag.
 */
export type Plan = 'free' | 'premium';

export const ENFORCE_LIMITS = false;

export const FREE_LIMITS = {
  habits: 10,
  activeGoals: 3,
  historyDays: 90,
} as const;

export function canAddHabit(plan: Plan, currentCount: number): boolean {
  return !ENFORCE_LIMITS || plan === 'premium' || currentCount < FREE_LIMITS.habits;
}

export function canAddGoal(plan: Plan, activeGoalCount: number): boolean {
  return !ENFORCE_LIMITS || plan === 'premium' || activeGoalCount < FREE_LIMITS.activeGoals;
}

export function currentPlan(): Plan {
  return 'free';
}
