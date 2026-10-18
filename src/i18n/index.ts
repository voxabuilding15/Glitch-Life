import { ar } from './ar';
import { en, type TranslationKey } from './en';
import { fr } from './fr';
import type { Lang, Msg, Params, PluralCategory } from './types';

export * from './types';
export * from './layout';
export type { TranslationKey } from './en';

const DICTS: Record<Lang, Record<string, string>> = { en, fr, ar };

type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
/** Keys callers may pass: plain keys, or the base name of a pluralised key. */
export type MessageKey = {
  [K in TranslationKey]: K extends `${infer B}_${PluralSuffix}` ? B : K;
}[TranslationKey];

export const LANGUAGE_NAMES: Record<Lang, { native: string }> = {
  en: { native: 'English' },
  fr: { native: 'Français' },
  ar: { native: 'العربية' },
};

/** CLDR plural rules for the supported languages (no dependency on Intl.PluralRules support). */
export function pluralCategory(lang: Lang, n: number): PluralCategory {
  const abs = Math.abs(n);
  if (lang === 'en') return abs === 1 ? 'one' : 'other';
  if (lang === 'fr') return abs >= 0 && abs < 2 ? 'one' : 'other';
  if (abs === 0) return 'zero';
  if (abs === 1) return 'one';
  if (abs === 2) return 'two';
  const mod100 = abs % 100;
  if (Number.isInteger(abs) && mod100 >= 3 && mod100 <= 10) return 'few';
  if (Number.isInteger(abs) && mod100 >= 11 && mod100 <= 99) return 'many';
  return 'other';
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

/** Looks up `key` (using plural forms when `params.count` is given), falling back to English, then the key. */
export function translate(lang: Lang, key: string, params?: Params): string {
  const dict = DICTS[lang];
  let template: string | undefined;
  if (params && typeof params.count === 'number') {
    const cat = pluralCategory(lang, params.count);
    template = dict[`${key}_${cat}`] ?? dict[`${key}_other`] ?? en_lookup(`${key}_${pluralCategory('en', params.count)}`);
  }
  template ??= dict[key] ?? en_lookup(key) ?? key;
  return interpolate(template, params);
}

function en_lookup(key: string): string | undefined {
  return (en as Record<string, string>)[key];
}

export const translateMsg = (lang: Lang, msg: Msg): string => translate(lang, msg.key, msg.params);

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'fr' || v === 'ar';
}

/** Maps a device locale like `fr_MA` / `ar-MA` / `en-US` to a supported language (default English). */
export function languageFromLocale(locale: string | null | undefined): Lang {
  const code = (locale ?? '').toLowerCase().split(/[-_]/)[0];
  return isLang(code) ? code : 'en';
}
