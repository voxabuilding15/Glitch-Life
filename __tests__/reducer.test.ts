import { reducer, type Action } from '@/data/reducer';
import { migrateState, SCHEMA_VERSION } from '@/data/schema';
import { habit, emptyState } from './helpers';

const done = (habitId: string, date: string, id = 'c1', now = 5): Action => ({
  type: 'COMPLETION_SET', habitId, date, done: true, id, now,
});

describe('habit completion', () => {
  it('marks complete and incomplete', () => {
    let s = reducer(emptyState(), { type: 'HABIT_SAVE', habit: habit() });
    s = reducer(s, done('h1', '2026-10-18'));
    expect(s.completions).toHaveLength(1);
    s = reducer(s, { type: 'COMPLETION_SET', habitId: 'h1', date: '2026-10-18', done: false, id: 'x', now: 6 });
    expect(s.completions).toHaveLength(0);
  });

  it('never creates a duplicate record for the same habit and date', () => {
    let s = reducer(emptyState(), done('h1', '2026-10-18', 'a'));
    s = reducer(s, done('h1', '2026-10-18', 'b'));
    expect(s.completions).toHaveLength(1);
    expect(s.completions[0].id).toBe('a');
    s = reducer(s, done('h1', '2026-10-19', 'c'));
    expect(s.completions).toHaveLength(2);
  });

  it('keeps history separate from the habit definition and cascades on delete', () => {
    let s = reducer(emptyState(), { type: 'HABIT_SAVE', habit: habit() });
    s = reducer(s, done('h1', '2026-10-18'));
    s = reducer(s, { type: 'HABIT_SAVE', habit: habit({ name: 'Renamed' }) });
    expect(s.habits).toHaveLength(1);
    expect(s.completions).toHaveLength(1);
    s = reducer(s, { type: 'HABIT_DELETE', id: 'h1' });
    expect(s.habits).toHaveLength(0);
    expect(s.completions).toHaveLength(0);
  });
});

describe('persistence schema', () => {
  it('fills defaults for older/partial saves and de-duplicates completions', () => {
    const s = migrateState(
      {
        version: 1,
        habits: [habit()],
        completions: [
          { id: '1', habitId: 'h1', date: '2026-10-18' },
          { id: '2', habitId: 'h1', date: '2026-10-18' },
          { nope: true },
        ],
        preferences: { weekStart: 'sunday' },
      },
      1,
    );
    expect(s?.completions).toHaveLength(1);
    expect(s?.preferences.weekStart).toBe('sunday');
    expect(s?.preferences.hapticsEnabled).toBe(true);
    expect(s?.goals).toEqual([]);
  });

  it('rejects unusable or newer-version payloads', () => {
    expect(migrateState('garbage', 1)).toBeNull();
    expect(migrateState(null, 1)).toBeNull();
    expect(migrateState({ version: SCHEMA_VERSION + 1 }, 1)).toBeNull();
  });
});
