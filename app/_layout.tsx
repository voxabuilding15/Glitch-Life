import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { LocaleProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/data/store';
import { configureNotifications } from '@/services/notifications';
import { Banner, Button, Muted, Text } from '@/components/ui';
import { SettingsProvider, useI18n, useSettings, useTheme } from '@/settings/SettingsProvider';
import { spacing } from '@/theme';

function Gate() {
  const { status, loadError, retryLoad, saveError, recovered } = useStore();
  const { colors } = useTheme();
  const { t } = useI18n();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.text} size="large" accessibilityLabel={t('common.loading')} />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <Text variant="title">{t('app.loadErrorTitle')}</Text>
        <Muted>{loadError ? t('app.loadErrorMsg') : ''}</Muted>
        <Button title={t('common.tryAgain')} onPress={retryLoad} icon="refresh-cw" />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {saveError || recovered ? (
        <View style={{ position: 'absolute', top: 48, left: 16, right: 16, zIndex: 10 }}>
          <Banner tone={saveError ? 'error' : 'info'} message={saveError ? t('app.saveError') : t('app.recovered')} />
        </View>
      ) : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </View>
  );
}

function Shell() {
  const { ready } = useSettings();
  const { colors, isDark } = useTheme();
  const { rtl } = useI18n();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <LocaleProvider direction={rtl ? 'rtl' : 'ltr'}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StoreProvider>
        <Gate />
      </StoreProvider>
    </LocaleProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
  }, []);
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Shell />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
