import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, HABIT_COLORS, HABIT_ICONS, radius, spacing } from '@/theme';
import { WEEKDAY_SHORT } from '@/domain/dates';
import type { Habit, HabitSchedule, Weekday } from '@/domain/types';
import { Chip, Muted, Text, Wrap } from './ui';

export function habitAccent(habit: Pick<Habit, 'color'>): string {
  return habit.color ?? colors.primary;
}

export function describeSchedule(s: HabitSchedule, weekStartsMonday = true): string {
  if (s.type === 'daily') return 'Every day';
  if (s.days.length === 7) return 'Every day';
  const order: Weekday[] = weekStartsMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  return order.filter((d) => s.days.includes(d)).map((d) => WEEKDAY_SHORT[d]).join(', ');
}

export function describeTarget(h: Pick<Habit, 'target'>): string | null {
  return h.target ? `${h.target.value} ${h.target.unit}` : null;
}

export function HabitIcon({ habit, size = 44 }: { habit: Pick<Habit, 'icon' | 'color'>; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2.4, alignItems: 'center', justifyContent: 'center',
      backgroundColor: habitAccent(habit) + '33',
    }}>
      <Feather name={habit.icon as React.ComponentProps<typeof Feather>['name']} size={size * 0.48} color={habit.color ?? colors.highlight} />
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
  const accent = habitAccent(habit);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 }}>
      <Pressable
        onPress={onOpen}
        disabled={!onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${habit.name}`}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      >
        <HabitIcon habit={habit} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" numberOfLines={1} style={done ? { opacity: 0.6, textDecorationLine: 'line-through' } : undefined}>
            {habit.name}
          </Text>
          {subtitle ? <Muted variant="caption" numberOfLines={1}>{subtitle}</Muted> : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: !!disabled }}
        accessibilityLabel={`${habit.name}, ${done ? 'completed' : 'not completed'}`}
        style={{
          width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
          backgroundColor: done ? colors.highlight : 'transparent',
          borderWidth: 2, borderColor: done ? colors.highlight : accent,
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {done ? <Feather name="check" size={22} color={colors.onPrimary} /> : null}
      </Pressable>
    </View>
  );
}

export function IconPicker({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string | null }) {
  return (
    <Wrap>
      {HABIT_ICONS.map((name) => {
        const selected = name === value;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            accessibilityRole="button"
            accessibilityLabel={`Icon ${name}`}
            accessibilityState={{ selected }}
            style={{
              width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: selected ? colors.surfaceRaised : 'transparent',
              borderWidth: 1.5, borderColor: selected ? color ?? colors.highlight : colors.border,
            }}
          >
            <Feather name={name} size={22} color={selected ? color ?? colors.highlight : colors.accent} />
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
  return (
    <Wrap>
      {allowNone ? <Chip label="Default" selected={value === null} onPress={() => onChange(null)} /> : null}
      {HABIT_COLORS.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          accessibilityRole="button"
          accessibilityLabel={`Color ${c}`}
          accessibilityState={{ selected: value === c }}
          style={{
            width: 40, height: 40, borderRadius: 20, backgroundColor: c, alignItems: 'center', justifyContent: 'center',
            borderWidth: value === c ? 3 : 0, borderColor: colors.highlight,
          }}
        >
          {value === c ? <Feather name="check" size={18} color={colors.onPrimary} /> : null}
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
  const order: Weekday[] = weekStartsMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {order.map((d) => {
        const on = value.includes(d);
        return (
          <Pressable
            key={d}
            onPress={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}
            accessibilityRole="button"
            accessibilityLabel={WEEKDAY_SHORT[d]}
            accessibilityState={{ selected: on }}
            style={{
              flex: 1, minHeight: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: on ? colors.highlight : colors.surface, borderWidth: 1, borderColor: on ? colors.highlight : colors.border,
            }}
          >
            <Text variant="caption" color={on ? colors.onPrimary : colors.highlight} style={{ fontWeight: '600' }}>
              {WEEKDAY_SHORT[d].slice(0, 2)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
