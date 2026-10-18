import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, useColorScheme } from 'react-native';
import {
  languageFromLocale, layoutFor, mirrorIcon, translate, translateMsg,
  type Lang, type LayoutInfo, type Msg, type MessageKey, type Params,
} from '@/i18n';
import {
  formatClockTime, formatDuration, formatLongDate, formatMonthYear, formatShortDate, formatTime, monthName,
  weekdayLetters, weekdayName, weekdayShort,
} from '@/domain/dates';
import type { WeekStart } from '@/domain/types';
import { ensureContrast, paletteFor, resolveScheme, type Palette, type Scheme, type ThemeMode } from '@/theme/palette';
import { loadSettings, saveSettings, type AppSettings } from './storage';

function deviceLanguage(): Lang {
  try {
    return languageFromLocale(I18nManager.getConstants().localeIdentifier);
  } catch {
    return 'en';
  }
}

function nativeIsRTL(): boolean {
  try {
    return I18nManager.getConstants().isRTL;
  } catch {
    return false;
  }
}

// The app mirrors layouts itself (instantly, per selected language), so opt out of OS-level mirroring.
try {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
} catch {
  // not available on every platform
}

interface SettingsValue extends AppSettings {
  ready: boolean;
  setLanguage: (l: Lang) => void;
  setThemeMode: (m: ThemeMode) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children, initial }: { children: React.ReactNode; initial?: AppSettings }) {
  const [settings, setSettings] = useState<AppSettings>(initial ?? { language: 'en', themeMode: 'system' });
  const [ready, setReady] = useState(!!initial);
  const writeChain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    loadSettings(deviceLanguage()).then((s) => {
      if (cancelled) return;
      setSettings(s);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeChain.current = writeChain.current.then(() => saveSettings(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({
      ...settings,
      ready,
      setLanguage: (language) => update({ language }),
      setThemeMode: (themeMode) => update({ themeMode }),
    }),
    [settings, ready, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}

/* ---------------- theme ---------------- */

export interface ThemeValue {
  colors: Palette;
  scheme: Scheme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  /** Adjusts a user-picked color so it stays legible on the current theme's surface. */
  accent: (color: string | null) => string;
}

export function useTheme(): ThemeValue {
  const { themeMode, setThemeMode } = useSettings();
  const system = useColorScheme();
  const scheme = resolveScheme(themeMode, system);
  const colors = useMemo(() => paletteFor(scheme), [scheme]);
  return useMemo(
    () => ({
      colors,
      scheme,
      isDark: scheme === 'dark',
      mode: themeMode,
      setMode: setThemeMode,
      accent: (c) => ensureContrast(c ?? colors.primary, colors.surface, scheme),
    }),
    [colors, scheme, themeMode, setThemeMode],
  );
}

/* ---------------- i18n ---------------- */

export interface I18nValue extends LayoutInfo {
  lang: Lang;
  setLanguage: (l: Lang) => void;
  t: (key: MessageKey, params?: Params) => string;
  /** Translate a `Msg` produced by domain code (units inside params are translated too). */
  tm: (msg: Msg) => string;
  unit: (u: string) => string;
  icon: <T extends string>(name: T) => T;
  longDate: (key: string) => string;
  shortDate: (key: string) => string;
  monthYear: (year: number, month0: number) => string;
  month: (month0: number) => string;
  weekdayShort: (day: number) => string;
  weekdayName: (day: number) => string;
  weekdayLetters: (weekStart: WeekStart) => string[];
  duration: (seconds: number) => string;
  time: (hour: number, minute: number) => string;
  clockTime: (epochMs: number) => string;
}

export function makeI18n(lang: Lang, setLanguage: (l: Lang) => void, nativeRTL = nativeIsRTL()): I18nValue {
  const layout = layoutFor(lang, nativeRTL);
  const unit = (u: string) => translate(lang, `unit.${u}`) === `unit.${u}` ? u : translate(lang, `unit.${u}`);
  return {
    ...layout,
    lang,
    setLanguage,
    t: (key, params) => translate(lang, key, params),
    tm: (msg) => translateMsg(lang, msg.params?.unit ? { ...msg, params: { ...msg.params, unit: unit(String(msg.params.unit)) } } : msg),
    unit,
    icon: (name) => mirrorIcon(name, layout.rtl),
    longDate: (k) => formatLongDate(k, lang),
    shortDate: (k) => formatShortDate(k, lang),
    monthYear: (y, m) => formatMonthYear(y, m, lang),
    month: (m) => monthName(m, lang),
    weekdayShort: (d) => weekdayShort(d, lang),
    weekdayName: (d) => weekdayName(d, lang),
    weekdayLetters: (w) => weekdayLetters(w, lang),
    duration: (s) => formatDuration(s, lang),
    time: (h, m) => formatTime(h, m, lang),
    clockTime: (ms) => formatClockTime(ms, lang),
  };
}

export function useI18n(): I18nValue {
  const { language, setLanguage } = useSettings();
  return useMemo(() => makeI18n(language, setLanguage), [language, setLanguage]);
}
