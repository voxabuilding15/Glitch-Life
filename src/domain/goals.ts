import { diffDays } from './dates';
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
  /** Plain-language description of what to do next. */
  nextStep: string;
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

  let nextStep: string;
  if (goal.completedAt) nextStep = 'Goal completed. Well done!';
  else if (targetReached) nextStep = 'Target reached — mark this goal as completed.';
  else if (nextMilestone && nextMilestone.target < target) {
    const left = nextMilestone.target - current;
    nextStep = `${formatCount(left)} ${goal.unit} to reach “${nextMilestone.title}”.`;
  } else nextStep = `${formatCount(target - current)} ${goal.unit} to go.`;

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

export function describeDaysLeft(daysLeft: number | null): string | null {
  if (daysLeft === null) return null;
  if (daysLeft < 0) return `${-daysLeft} day${daysLeft === -1 ? '' : 's'} overdue`;
  if (daysLeft === 0) return 'Due today';
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
}
