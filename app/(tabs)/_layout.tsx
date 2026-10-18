import React from 'react';
import type { ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/data/store';
import { colors } from '@/theme';

type Name = React.ComponentProps<typeof Feather>['name'];
const tab = (title: string, icon: Name) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Feather name={icon} size={size} color={color as string} />,
  tabBarAccessibilityLabel: `${title} tab`,
});

export default function TabsLayout() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  if (!state.preferences.onboardingCompleted) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={tab('Today', 'sun')} />
      <Tabs.Screen name="habits" options={tab('Habits', 'check-circle')} />
      <Tabs.Screen name="goals" options={tab('Goals', 'target')} />
      <Tabs.Screen name="you" options={tab('You', 'user')} />
    </Tabs>
  );
}
