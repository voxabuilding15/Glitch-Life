import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY, loadSettings, parseSettings, saveSettings } from '@/settings/storage';
import { SettingsProvider, useI18n, useTheme, type I18nValue, type ThemeValue } from '@/settings/SettingsProvider';

const mockScheme: { value: 'light' | 'dark' | null } = { value: 'light' };
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: () => mockScheme.value }));

// IS_REACT_ACT_ENVIRONMENT for react-test-renderer
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

interface Probe { i18n: I18nValue; theme: ThemeValue }
function mount(): { probe: { current: Probe | null }; renderer: ReactTestRenderer } {
  const probe: { current: Probe | null } = { current: null };
  function Consumer() {
    probe.current = { i18n: useI18n(), theme: useTheme() };
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<SettingsProvider><Consumer /></SettingsProvider>);
  });
  return { probe, renderer };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockScheme.value = 'light';
});

describe('settings storage', () => {
  it('falls back to defaults for missing or corrupt values', async () => {
    expect(await loadSettings('fr')).toEqual({ language: 'fr', themeMode: 'system' });
    await AsyncStorage.setItem(SETTINGS_KEY, '{not json');
    expect(await loadSettings('en')).toEqual({ language: 'en', themeMode: 'system' });
    expect(parseSettings({ language: 'de', themeMode: 'neon' }, 'ar')).toEqual({ language: 'ar', themeMode: 'system' });
  });

  it('round-trips language and theme', async () => {
    await saveSettings({ language: 'ar', themeMode: 'light' });
    expect(await loadSettings('en')).toEqual({ language: 'ar', themeMode: 'light' });
  });
});

describe('SettingsProvider', () => {
  it('switches language immediately, including direction, and persists it across a restart', async () => {
    let { probe, renderer } = mount();
    await flush();
    expect(probe.current!.i18n.lang).toBe('en');
    expect(probe.current!.i18n.rtl).toBe(false);
    expect(probe.current!.i18n.t('tabs.today')).toBe('Today');

    act(() => probe.current!.i18n.setLanguage('ar'));
    expect(probe.current!.i18n.lang).toBe('ar');
    expect(probe.current!.i18n.rtl).toBe(true);
    expect(probe.current!.i18n.row).toBe('row-reverse');
    expect(probe.current!.i18n.t('tabs.today')).toBe('اليوم');

    act(() => probe.current!.i18n.setLanguage('fr'));
    expect(probe.current!.i18n.rtl).toBe(false);
    expect(probe.current!.i18n.t('tabs.today')).toBe('Aujourd’hui');

    act(() => probe.current!.i18n.setLanguage('ar'));
    await flush();

    // "restart": throw the tree away and mount a brand-new provider that reads from storage
    act(() => renderer.unmount());
    ({ probe, renderer } = mount());
    await flush();
    expect(probe.current!.i18n.lang).toBe('ar');
    expect(probe.current!.i18n.rtl).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem(SETTINGS_KEY))!)).toMatchObject({ language: 'ar' });
  });

  it('switches theme immediately and persists the choice', async () => {
    mockScheme.value = 'dark';
    let { probe, renderer } = mount();
    await flush();
    expect(probe.current!.theme.mode).toBe('system');
    expect(probe.current!.theme.scheme).toBe('dark');

    act(() => probe.current!.theme.setMode('light'));
    expect(probe.current!.theme.scheme).toBe('light');
    expect(probe.current!.theme.colors.bg).toBe('#F2F7FD');

    act(() => probe.current!.theme.setMode('dark'));
    expect(probe.current!.theme.colors.bg).toBe('#021024');

    act(() => probe.current!.theme.setMode('light'));
    await flush();
    act(() => renderer.unmount());
    ({ probe, renderer } = mount());
    await flush();
    expect(probe.current!.theme.mode).toBe('light');
    expect(probe.current!.theme.scheme).toBe('light');
    act(() => renderer.unmount());
  });

  it('system mode follows the device scheme', async () => {
    mockScheme.value = 'light';
    const { probe, renderer } = mount();
    await flush();
    expect(probe.current!.theme.mode).toBe('system');
    expect(probe.current!.theme.scheme).toBe('light');
    act(() => renderer.unmount());
  });

  it('keeps language and theme independent of the app-data store', async () => {
    await AsyncStorage.setItem('glitchlife.state', JSON.stringify({ version: 1, habits: [] }));
    const { probe, renderer } = mount();
    await flush();
    act(() => probe.current!.i18n.setLanguage('fr'));
    await flush();
    expect(JSON.parse((await AsyncStorage.getItem('glitchlife.state'))!)).toEqual({ version: 1, habits: [] });
    act(() => renderer.unmount());
  });
});
