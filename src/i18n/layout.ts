import type { Lang } from './types';

export const RTL_LANGS: Lang[] = ['ar'];
export const isRtlLang = (lang: Lang): boolean => RTL_LANGS.includes(lang);

export interface LayoutInfo {
  rtl: boolean;
  /** flexDirection for a visual "start → end" row, correct even if the OS already mirrored layouts. */
  row: 'row' | 'row-reverse';
  /** Opposite of `row`. */
  rowReverse: 'row' | 'row-reverse';
  textAlign: 'left' | 'right';
  writingDirection: 'ltr' | 'rtl';
}

/**
 * We mirror the UI ourselves (not via I18nManager.forceRTL, which needs an app restart), so the language
 * switch is immediate. If the OS has already flipped native layouts (`nativeRTL`), the two flips cancel.
 */
export function layoutFor(lang: Lang, nativeRTL = false): LayoutInfo {
  const rtl = isRtlLang(lang);
  const flip = rtl !== nativeRTL;
  return {
    rtl,
    row: flip ? 'row-reverse' : 'row',
    rowReverse: flip ? 'row' : 'row-reverse',
    textAlign: rtl ? 'right' : 'left',
    writingDirection: rtl ? 'rtl' : 'ltr',
  };
}

const MIRRORED: Record<string, string> = {
  'chevron-left': 'chevron-right',
  'chevron-right': 'chevron-left',
  'arrow-left': 'arrow-right',
  'arrow-right': 'arrow-left',
  'arrow-right-circle': 'arrow-left-circle',
  'arrow-left-circle': 'arrow-right-circle',
};

/** Directional icons are swapped in RTL; everything else is left alone. */
export function mirrorIcon<T extends string>(name: T, rtl: boolean): T {
  return rtl ? ((MIRRORED[name] ?? name) as T) : name;
}
