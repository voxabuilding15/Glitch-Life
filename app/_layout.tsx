import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/data/store';
import { configureNotifications } from '@/services/notifications';
import { Banner, Button, Muted, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

function Gate() {
  const { status, loadError, retryLoad, saveError, recovered } = useStore();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.highlight} size="large" accessibilityLabel="Loading your data" />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <Text variant="title">Couldn’t open your data</Text>
        <Muted>{loadError ?? 'Something went wrong reading local storage.'}</Muted>
        <Button title="Try again" onPress={retryLoad} icon="refresh-cw" />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {saveError ? (
        <View style={{ position: 'absolute', top: 48, left: 16, right: 16, zIndex: 10 }}>
          <Banner tone="error" message={saveError} />
        </View>
      ) : recovered ? (
        <View style={{ position: 'absolute', top: 48, left: 16, right: 16, zIndex: 10 }}>
          <Banner message="Saved data was unreadable, so Glitch Life started fresh. A backup was kept on this device." />
        </View>
      ) : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StoreProvider>
        <Gate />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
