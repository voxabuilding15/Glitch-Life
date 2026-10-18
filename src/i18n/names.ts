import type { Lang } from './types';

/** Calendar names. Arabic uses the Gregorian month names used in Morocco; digits stay Western (0-9). */
export const MONTHS: Record<Lang, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'],
};

export const MONTHS_SHORT: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  ar: MONTHS.ar,
};

/** Index 0 = Sunday. */
export const WEEKDAYS: Record<Lang, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};

export const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
  ar: ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
};

export const WEEKDAY_LETTERS: Record<Lang, string[]> = {
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  fr: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
};

export const DURATION_UNITS: Record<Lang, { h: string; m: string; mAlone: string; s: string }> = {
  en: { h: 'h', m: 'm', mAlone: 'min', s: 's' },
  fr: { h: ' h', m: ' min', mAlone: 'min', s: ' s' },
  ar: { h: ' س', m: ' د', mAlone: 'دقيقة', s: ' ث' },
};
