import React from 'react';
import { Pressable, View, type ColorValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { Text } from './ui';

type IconName = React.ComponentProps<typeof Feather>['name'];

const TABS: Record<string, { icon: IconName; label: 'tabs.today' | 'tabs.habits' | 'tabs.goals' | 'tabs.you' }> = {
  index: { icon: 'sun', label: 'tabs.today' },
  habits: { icon: 'check-circle', label: 'tabs.habits' },
  goals: { icon: 'target', label: 'tabs.goals' },
  you: { icon: 'user', label: 'tabs.you' },
};

/** Props handed to a custom `tabBar` by Expo Router (SDK 58). */
interface Props {
  state: { index: number; routes: { key: string; name: string }[] };
  emitter: { emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
  navigateToTab: (routeKey: string) => void;
}

/** Fixed bottom navigation: exactly four tabs, themed, localized, and mirrored in RTL. */
export function TabBar({ state, emitter, navigateToTab }: Props) {
  const { colors } = useTheme();
  const { t, row } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: row, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1,
        paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {state.routes.map((route, i) => {
        const cfg = TABS[route.name];
        if (!cfg) return null;
        const focused = state.index === i;
        const color: ColorValue = focused ? colors.selected : colors.textMuted;
        const label = t(cfg.label);
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t('tabs.a11y', { name: label })}
            onPress={() => {
              const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigateToTab(route.key);
            }}
            style={{ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            <Feather name={cfg.icon} size={24} color={color} />
            <Text variant="caption" color={color as string} style={{ fontWeight: focused ? '700' : '500', fontSize: 12, textAlign: 'center' }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
