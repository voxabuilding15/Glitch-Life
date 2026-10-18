import { layoutFor, mirrorIcon } from '@/i18n';
import { makeI18n } from '@/settings/SettingsProvider';
import { weekKeys } from '@/domain/dates';

describe('RTL layout', () => {
  it('uses LTR rows for English and French', () => {
    for (const lang of ['en', 'fr'] as const) {
      const l = layoutFor(lang);
      expect(l).toMatchObject({ rtl: false, row: 'row', rowReverse: 'row-reverse', textAlign: 'left', writingDirection: 'ltr' });
    }
  });

  it('mirrors rows, text alignment and writing direction for Arabic', () => {
    expect(layoutFor('ar')).toMatchObject({ rtl: true, row: 'row-reverse', rowReverse: 'row', textAlign: 'right', writingDirection: 'rtl' });
  });

  it('does not double-flip when the OS already mirrors native layouts', () => {
    expect(layoutFor('ar', true).row).toBe('row'); // native RTL + Arabic: native flip is enough
    expect(layoutFor('en', true).row).toBe('row-reverse'); // native RTL forced onto an LTR language: we undo it
  });

  it('mirrors directional icons only in RTL', () => {
    expect(mirrorIcon('chevron-left', true)).toBe('chevron-right');
    expect(mirrorIcon('chevron-right', true)).toBe('chevron-left');
    expect(mirrorIcon('arrow-right', true)).toBe('arrow-left');
    expect(mirrorIcon('chevron-left', false)).toBe('chevron-left');
    expect(mirrorIcon('check', true)).toBe('check');
  });

  it('exposes direction through the i18n value and switches instantly with the language', () => {
    const fr = makeI18n('fr', () => undefined, false);
    const ar = makeI18n('ar', () => undefined, false);
    expect(fr.rtl).toBe(false);
    expect(fr.icon('chevron-left')).toBe('chevron-left');
    expect(ar.rtl).toBe(true);
    expect(ar.icon('chevron-left')).toBe('chevron-right');
    expect(ar.weekdayLetters('monday')).toHaveLength(7);
    expect(weekKeys('2026-10-14', 'monday')).toHaveLength(7); // week data itself stays chronological; only rendering mirrors
  });
});
