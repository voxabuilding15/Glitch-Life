import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLang, type Lang } from '@/i18n';
import type { ThemeMode } from '@/theme/palette';

/** Language and theme live under their own key so they are available before app data finishes loading. */
export const SETTINGS_KEY = 'glitchlife.settings';

export interface AppSettings {
  language: Lang;
  themeMode: ThemeMode;
}

export const isThemeMode = (v: unknown): v is ThemeMode => v === 'light' || v === 'dark' || v === 'system';

export function parseSettings(raw: unknown, fallbackLanguage: Lang): AppSettings {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    language: isLang(o.language) ? o.language : fallbackLanguage,
    themeMode: isThemeMode(o.themeMode) ? o.themeMode : 'system',
  };
}

export async function loadSettings(fallbackLanguage: Lang): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return parseSettings(raw ? JSON.parse(raw) : null, fallbackLanguage);
  } catch {
    return parseSettings(null, fallbackLanguage);
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
