import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { fr } from '@/i18n/fr';
import {
  isRtlLang, languageFromLocale, pluralCategory, translate, translateMsg,
} from '@/i18n';
import { describeDaysLeft, goalProgress } from '@/domain/goals';
import { formatClockTime, formatDuration, formatLongDate, formatShortDate, formatTime, weekdayLetters } from '@/domain/dates';
import { makeI18n } from '@/settings/SettingsProvider';
import type { Goal } from '@/domain/types';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const enKeys = Object.keys(en);

describe('translation completeness', () => {
  it.each([['fr', fr], ['ar', ar]] as const)('%s defines every English key', (_name, dict) => {
    const missing = enKeys.filter((k) => !(k in dict));
    expect(missing).toEqual([]);
  });

  it.each([['fr', fr], ['ar', ar]] as const)('%s keeps the same {placeholders} as English', (_name, dict) => {
    const bad = enKeys.filter((k) => JSON.stringify(placeholders((en as Record<string, string>)[k])) !== JSON.stringify(placeholders(dict[k])));
    // plural forms such as "one" may legitimately drop {count} ("one day") — only flag *added* unknown names
    const reallyBad = bad.filter((k) => !placeholders(dict[k]).every((p) => placeholders((en as Record<string, string>)[k]).includes(p)) || !k.includes('_'));
    expect(reallyBad).toEqual([]);
  });

  it.each([['fr', fr], ['ar', ar]] as const)('%s has no leftover untranslated English text', (_name, dict) => {
    // Allowed to match English: brand/format strings, symbols and units that are international.
    const allowed = new Set(['notif.reminderTitle', 'unit.km', 'unit.pages', 'goal.progressText', 'habitForm.targetPlaceholder',
      'goalForm.targetPlaceholder', 'goal.title', 'focus.session', 'habit.title', 'you.version', 'habits.rowA11y', 'chart.dayA11y',
      'common.minutesShort', 'unit.minutes', 'goalForm.plus1w', 'goalForm.plus1m', 'goalForm.plus3m', 'common.back2', 'unit.sessions', 'focus.customPlaceholder',
      'common.daysShort', 'habit.total', 'goal.milestoneA11y', 'focus.minutes_one', 'focus.minutes_other', 'focus.pause',
      'you.notifications', 'you.avatarA11yEmpty']); // French cognates / format-only strings
    const same = enKeys.filter((k) => dict[k] === (en as Record<string, string>)[k] && !allowed.has(k));
    expect(same).toEqual([]);
  });

  it('Arabic provides the full set of plural forms for counted strings', () => {
    const bases = enKeys.filter((k) => k.endsWith('_other')).map((k) => k.replace(/_other$/, ''));
    for (const b of bases) {
      for (const cat of ['zero', 'one', 'two', 'few', 'many', 'other']) {
        // goal.daysLeft/overdue "zero" are never used (0 days = due today) but are still defined for completeness
        expect(ar[`${b}_${cat}`]).toBeDefined();
      }
    }
  });
});

describe('translate()', () => {
  it('interpolates params and falls back to English, then the key', () => {
    expect(translate('en', 'today.completed', { done: 3, total: 5 })).toBe('3/5 habits completed');
    expect(translate('fr', 'today.completed', { done: 3, total: 5 })).toBe('3/5 habitudes accomplies');
    expect(translate('ar', 'today.completed', { done: 3, total: 5 })).toBe('3/5 عادات مكتملة');
    expect(translate('fr', 'does.not.exist')).toBe('does.not.exist');
  });

  it('handles plural rules per language', () => {
    expect([0, 1, 2, 3, 10, 11, 99, 100, 101].map((n) => pluralCategory('ar', n))).toEqual(
      ['zero', 'one', 'two', 'few', 'few', 'many', 'many', 'other', 'other'],
    );
    expect(pluralCategory('fr', 0)).toBe('one');
    expect(pluralCategory('fr', 1)).toBe('one');
    expect(pluralCategory('fr', 2)).toBe('other');
    expect(pluralCategory('en', 1)).toBe('one');
    expect(pluralCategory('en', 0)).toBe('other');
    expect(translate('en', 'focus.minutes', { count: 1 })).toBe('1 minute');
    expect(translate('en', 'focus.minutes', { count: 25 })).toBe('25 minutes');
    expect(translate('fr', 'focus.minutes', { count: 1 })).toBe('1 minute');
    expect(translate('ar', 'focus.minutes', { count: 2 })).toBe('دقيقتان');
    expect(translate('ar', 'focus.minutes', { count: 5 })).toBe('5 دقائق');
    expect(translate('ar', 'focus.minutes', { count: 25 })).toBe('25 دقيقة');
  });

  it('translates domain messages, including the unit parameter', () => {
    const goal: Goal = {
      id: 'g', title: 'x', description: '', targetValue: 30, unit: 'sessions', manualProgress: 12, targetDate: '2026-10-20',
      startDate: '2026-10-01', linkedHabitIds: [], completedAt: null, createdAt: 0, updatedAt: 0,
    };
    const p = goalProgress(goal, [], [], '2026-10-18');
    expect(makeI18n('en', () => undefined, false).tm(p.nextStep)).toBe('18 sessions to go.');
    expect(makeI18n('fr', () => undefined, false).tm(p.nextStep)).toBe('Encore 18 séances.');
    expect(makeI18n('ar', () => undefined, false).tm(p.nextStep)).toBe('تبقّى 18 جلسات.');
    expect(translateMsg('fr', describeDaysLeft(2)!)).toBe('2 jours restants');
    expect(translateMsg('ar', describeDaysLeft(2)!)).toBe('تبقّى يومان');
  });

  it('detects the device language', () => {
    expect(languageFromLocale('fr_MA')).toBe('fr');
    expect(languageFromLocale('ar-MA')).toBe('ar');
    expect(languageFromLocale('en-US')).toBe('en');
    expect(languageFromLocale('de_DE')).toBe('en');
    expect(languageFromLocale(undefined)).toBe('en');
    expect(isRtlLang('ar')).toBe(true);
    expect(isRtlLang('fr')).toBe(false);
  });
});

describe('localized formatting', () => {
  it('formats dates per language', () => {
    expect(formatLongDate('2026-10-18', 'en')).toBe('Sunday, October 18, 2026');
    expect(formatLongDate('2026-10-18', 'fr')).toBe('dimanche 18 octobre 2026');
    expect(formatLongDate('2026-10-18', 'ar')).toBe('الأحد 18 أكتوبر 2026');
    expect(formatShortDate('2026-03-05', 'fr')).toBe('5 mars 2026');
    expect(formatShortDate('2026-03-05', 'en')).toBe('Mar 5, 2026');
  });

  it('formats durations and clock times per language', () => {
    expect(formatDuration(5400, 'en')).toBe('1h 30m');
    expect(formatDuration(5400, 'fr')).toBe('1 h 30 min');
    expect(formatDuration(5400, 'ar')).toBe('1 س 30 د');
    expect(formatDuration(1500, 'ar')).toBe('25 دقيقة');
    expect(formatTime(20, 0, 'en')).toBe('8:00 PM');
    expect(formatTime(20, 0, 'fr')).toBe('20:00');
    expect(formatTime(20, 0, 'ar')).toBe('8:00 م');
    expect(formatClockTime(new Date(2026, 0, 1, 9, 5).getTime(), 'fr')).toBe('09:05');
  });

  it('orders week-day letters from the chosen week start', () => {
    expect(weekdayLetters('monday', 'fr')).toEqual(['L', 'M', 'M', 'J', 'V', 'S', 'D']);
    expect(weekdayLetters('sunday', 'ar')[0]).toBe('ح');
  });
});
