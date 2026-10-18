import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { useStore } from '@/data/store';
import { useTheme } from '@/settings/SettingsProvider';

export default function TabsLayout() {
  const { state } = useStore();
  const { colors } = useTheme();
  if (!state.preferences.onboardingCompleted) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tabBar={(props) => <TabBar {...(props as any)} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
