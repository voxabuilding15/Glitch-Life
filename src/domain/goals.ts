import { diffDays } from './dates';
import type { Msg } from '@/i18n/types';
import type { DateKey, Goal, GoalMilestone, HabitCompletion } from './types';

export interface GoalProgress {
  current: number;
  target: number;
  /** 0–1, capped. */
  ratio: number;
  /** Progress contributed automatically by linked habit completions. */
  fromHabits: number;
  reachedMilestoneIds: string[];
  nextMilestone: GoalMilestone | null;
  /** What to do next, as a translatable message. */
  nextStep: Msg;
  daysLeft: number | null;
  overdue: boolean;
  targetReached: boolean;
}

/** Completions of linked habits on/after the goal's start date each count as one unit of progress. */
export function linkedHabitProgress(goal: Goal, completions: HabitCompletion[]): number {
  if (!goal.linkedHabitIds.length) return 0;
  const linked = new Set(goal.linkedHabitIds);
  return completions.filter((c) => linked.has(c.habitId) && c.date >= goal.startDate).length;
}

export function goalProgress(
  goal: Goal,
  milestones: GoalMilestone[],
  completions: HabitCompletion[],
  today: DateKey,
): GoalProgress {
  const fromHabits = linkedHabitProgress(goal, completions);
  const current = Math.max(0, goal.manualProgress + fromHabits);
  const target = Math.max(1, goal.targetValue);
  const own = milestones.filter((m) => m.goalId === goal.id).sort((a, b) => a.target - b.target);
  const reached = own.filter((m) => current >= m.target);
  const nextMilestone = own.find((m) => current < m.target) ?? null;
  const targetReached = current >= target;

  let nextStep: Msg;
  if (goal.completedAt) nextStep = { key: 'goal.next.completed' };
  else if (targetReached) nextStep = { key: 'goal.next.reached' };
  else if (nextMilestone && nextMilestone.target < target) {
    nextStep = {
      key: 'goal.next.milestone',
      params: { amount: formatCount(nextMilestone.target - current), unit: goal.unit, milestone: nextMilestone.title },
    };
  } else nextStep = { key: 'goal.next.togo', params: { amount: formatCount(target - current), unit: goal.unit } };

  const daysLeft = goal.targetDate ? diffDays(today, goal.targetDate) : null;
  return {
    current,
    target,
    ratio: Math.min(1, current / target),
    fromHabits,
    reachedMilestoneIds: reached.map((m) => m.id),
    nextMilestone,
    nextStep,
    daysLeft,
    overdue: !goal.completedAt && daysLeft !== null && daysLeft < 0,
    targetReached,
  };
}

function formatCount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Deadline wording as a translatable message (plural-aware via `count`). */
export function describeDaysLeft(daysLeft: number | null): Msg | null {
  if (daysLeft === null) return null;
  if (daysLeft < 0) return { key: 'goal.overdue', params: { count: -daysLeft } };
  if (daysLeft === 0) return { key: 'goal.dueToday' };
  return { key: 'goal.daysLeft', params: { count: daysLeft } };
}
