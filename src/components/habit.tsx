import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HABIT_COLORS, HABIT_ICONS, radius, spacing } from '@/theme';
import type { Habit, HabitSchedule, Weekday } from '@/domain/types';
import { useI18n, useTheme, type I18nValue } from '@/settings/SettingsProvider';
import { Chip, Muted, Text, Wrap } from './ui';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export function describeSchedule(s: HabitSchedule, i18n: I18nValue, weekStartsMonday = true): string {
  if (s.type === 'daily' || s.days.length === 7) return i18n.t('habits.everyDay');
  const order: Weekday[] = weekStartsMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  return order.filter((d) => s.days.includes(d)).map((d) => i18n.weekdayShort(d)).join(i18n.rtl ? '، ' : ', ');
}

export function describeTarget(h: Pick<Habit, 'target'>, i18n: I18nValue): string | null {
  return h.target ? `${h.target.value} ${i18n.unit(h.target.unit)}` : null;
}

export function HabitIcon({ habit, size = 44 }: { habit: Pick<Habit, 'icon' | 'color'>; size?: number }) {
  const { accent } = useTheme();
  const tint = accent(habit.color);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2.4, alignItems: 'center', justifyContent: 'center', backgroundColor: tint + '26' }}>
      <Feather name={habit.icon as FeatherName} size={size * 0.48} color={tint} />
    </View>
  );
}

/** One habit with a one-tap complete/incomplete checkbox. */
export function HabitRow({ habit, done, onToggle, onOpen, subtitle, disabled }: {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onOpen?: () => void;
  subtitle?: string;
  disabled?: boolean;
}) {
  const { colors, accent } = useTheme();
  const { t, row } = useI18n();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: spacing.md, minHeight: 56 }}>
      <Pressable
        onPress={onOpen}
        disabled={!onOpen}
        accessibilityRole="button"
        accessibilityLabel={t('habits.open', { name: habit.name })}
        style={{ flex: 1, flexDirection: row, alignItems: 'center', gap: spacing.md }}
      >
        <HabitIcon habit={habit} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" numberOfLines={1} style={done ? { opacity: 0.6, textDecorationLine: 'line-through' } : undefined}>
            {habit.name}
          </Text>
          {subtitle ? <Muted variant="caption" numberOfLines={2}>{subtitle}</Muted> : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: !!disabled }}
        accessibilityLabel={t('habits.rowA11y', { name: habit.name, state: done ? t('habits.stateDone') : t('habits.stateOpen') })}
        style={{
          width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
          backgroundColor: done ? colors.selected : 'transparent', borderWidth: 2,
          borderColor: done ? colors.selected : accent(habit.color), opacity: disabled ? 0.4 : 1,
        }}
      >
        {done ? <Feather name="check" size={22} color={colors.onSelected} /> : null}
      </Pressable>
    </View>
  );
}

export function IconPicker({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string | null }) {
  const { colors, accent } = useTheme();
  const { t } = useI18n();
  const tint = accent(color);
  return (
    <Wrap>
      {HABIT_ICONS.map((name) => {
        const selected = name === value;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            accessibilityRole="button"
            accessibilityLabel={t('habitForm.iconA11y', { name })}
            accessibilityState={{ selected }}
            style={{
              width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: selected ? colors.surfaceRaised : 'transparent', borderWidth: 1.5, borderColor: selected ? tint : colors.border,
            }}
          >
            <Feather name={name} size={22} color={selected ? tint : colors.textMuted} />
          </Pressable>
        );
      })}
    </Wrap>
  );
}

export function ColorPicker({ value, onChange, allowNone = true }: {
  value: string | null;
  onChange: (v: string | null) => void;
  allowNone?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Wrap>
      {allowNone ? <Chip label={t('common.default')} selected={value === null} onPress={() => onChange(null)} /> : null}
      {HABIT_COLORS.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          accessibilityRole="button"
          accessibilityLabel={t('habitForm.colorA11y', { color: c })}
          accessibilityState={{ selected: value === c }}
          style={{
            width: 40, height: 40, borderRadius: 20, backgroundColor: c, alignItems: 'center', justifyContent: 'center',
            borderWidth: value === c ? 3 : 1, borderColor: value === c ? colors.selected : colors.border,
          }}
        >
          {value === c ? <Feather name="check" size={18} color="#021024" /> : null}
        </Pressable>
      ))}
    </Wrap>
  );
}

export function DayPicker({ value, onChange, weekStartsMonday }: {
  value: Weekday[];
  onChange: (v: Weekday[]) => void;
  weekStartsMonday: boolean;
}) {
  const { colors } = useTheme();
  const { row, weekdayShort, lang } = useI18n();
  const order: Weekday[] = weekStartsMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  return (
    <View style={{ flexDirection: row, gap: 6 }}>
      {order.map((d) => {
        const on = value.includes(d);
        const label = weekdayShort(d);
        return (
          <Pressable
            key={d}
            onPress={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: on }}
            style={{
              flex: 1, minHeight: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: on ? colors.selected : colors.surface, borderWidth: 1, borderColor: on ? colors.selected : colors.border,
            }}
          >
            <Text variant="caption" color={on ? colors.onSelected : colors.text} style={{ fontWeight: '600', textAlign: 'center' }}>
              {lang === 'ar' ? label : label.slice(0, 2)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
