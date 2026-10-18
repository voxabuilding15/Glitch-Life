import { describeDaysLeft, goalProgress } from '@/domain/goals';
import type { Goal, GoalMilestone } from '@/domain/types';
import { completion } from './helpers';

const goal = (over: Partial<Goal> = {}): Goal => ({
  id: 'g1', title: 'Learn Python', description: '', targetValue: 30, unit: 'sessions', manualProgress: 0,
  targetDate: null, startDate: '2026-10-01', linkedHabitIds: [], completedAt: null, createdAt: 0, updatedAt: 0, ...over,
});
const ms = (id: string, target: number, title = id): GoalMilestone => ({
  id, goalId: 'g1', title, target, createdAt: 0, updatedAt: 0,
});

describe('goal progress', () => {
  it('reports 12/30 and what to do next', () => {
    const p = goalProgress(goal({ manualProgress: 12 }), [ms('a', 10, 'Basics'), ms('b', 20, 'Projects')], [], '2026-10-18');
    expect(p.current).toBe(12);
    expect(p.ratio).toBeCloseTo(0.4);
    expect(p.reachedMilestoneIds).toEqual(['a']);
    expect(p.nextMilestone?.id).toBe('b');
    expect(p.nextStep).toEqual({ key: 'goal.next.milestone', params: { amount: '8', unit: 'sessions', milestone: 'Projects' } });
  });

  it('adds linked-habit completions made since the goal started', () => {
    const g = goal({ manualProgress: 2, linkedHabitIds: ['h1'] });
    const done = [completion('h1', '2026-10-05'), completion('h1', '2026-09-30'), completion('h2', '2026-10-06')];
    const p = goalProgress(g, [], done, '2026-10-18');
    expect(p.fromHabits).toBe(1);
    expect(p.current).toBe(3);
  });

  it('caps the ratio and prompts completion when reached', () => {
    const p = goalProgress(goal({ manualProgress: 35 }), [], [], '2026-10-18');
    expect(p.ratio).toBe(1);
    expect(p.targetReached).toBe(true);
    expect(p.nextStep.key).toBe('goal.next.reached');
  });

  it('handles deadlines', () => {
    expect(goalProgress(goal({ targetDate: '2026-10-25' }), [], [], '2026-10-18').daysLeft).toBe(7);
    const late = goalProgress(goal({ targetDate: '2026-10-10' }), [], [], '2026-10-18');
    expect(late.overdue).toBe(true);
    expect(describeDaysLeft(late.daysLeft)).toEqual({ key: 'goal.overdue', params: { count: 8 } });
    expect(describeDaysLeft(0)).toEqual({ key: 'goal.dueToday' });
    expect(describeDaysLeft(1)).toEqual({ key: 'goal.daysLeft', params: { count: 1 } });
    expect(describeDaysLeft(null)).toBeNull();
  });
});
