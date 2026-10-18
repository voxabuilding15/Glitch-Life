import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { canAddHabit, currentPlan } from '@/domain/entitlements';
import type { Weekday } from '@/domain/types';
import { ColorPicker, DayPicker, HabitIcon, IconPicker } from '@/components/habit';
import { DateField } from '@/components/DateField';
import { Banner, Button, Chip, Field, Muted, Screen, ScreenHeader, Segmented, Text, Wrap } from '@/components/ui';
import { colors, spacing } from '@/theme';

const UNITS = ['minutes', 'times', 'pages', 'glasses', 'km'];

export default function HabitFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, today, saveHabit } = useStore();
  const existing = id ? state.habits.find((h) => h.id === id) : undefined;
  const mondayFirst = state.preferences.weekStart === 'monday';

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? 'target');
  const [color, setColor] = useState<string | null>(existing?.color ?? null);
  const [mode, setMode] = useState<'daily' | 'days'>(existing?.schedule.type ?? 'daily');
  const [days, setDays] = useState<Weekday[]>(existing?.schedule.type === 'days' ? existing.schedule.days : [1, 2, 3, 4, 5]);
  const [targetValue, setTargetValue] = useState(existing?.target ? String(existing.target.value) : '');
  const [unit, setUnit] = useState(existing?.target?.unit ?? 'minutes');
  const [startDate, setStartDate] = useState(existing?.startDate ?? today);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: !name.trim() ? 'Give your habit a name.' : name.trim().length > 60 ? 'Keep the name under 60 characters.' : null,
    description: description.length > 200 ? 'Keep the description under 200 characters.' : null,
    days: mode === 'days' && days.length === 0 ? 'Pick at least one day.' : null,
    target: targetValue.trim() && !(Number(targetValue) > 0 && Number(targetValue) <= 100000) ? 'Enter a number greater than 0.' : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const limitReached = !existing && !canAddHabit(currentPlan(), state.habits.length);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const submit = () => {
    setSubmitted(true);
    if (!valid || limitReached) return;
    saveHabit({
      id: existing?.id,
      name,
      description,
      icon,
      color,
      schedule: mode === 'daily' ? { type: 'daily' } : { type: 'days', days: [...days].sort() as Weekday[] },
      target: targetValue.trim() ? { value: Number(targetValue), unit } : null,
      startDate,
    });
    close();
  };

  if (id && !existing) {
    return (
      <Screen>
        <ScreenHeader title="Habit" onBack={close} />
        <Banner tone="error" message="This habit no longer exists." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={existing ? 'Edit habit' : 'New habit'} onBack={close} />
      {limitReached ? <Banner tone="error" message="Habit limit reached for the free plan." /> : null}

      <View style={{ alignItems: 'center' }}>
        <HabitIcon habit={{ icon, color }} size={72} />
      </View>

      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Read for 20 minutes" maxLength={70}
        error={submitted ? errors.name : null} returnKeyType="next" />
      <Field label="Description (optional)" value={description} onChangeText={setDescription} multiline maxLength={220}
        placeholder="Why does this matter to you?" error={submitted ? errors.description : null} />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.accent}>Icon</Text>
        <IconPicker value={icon} onChange={setIcon} color={color} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.accent}>Accent color (optional)</Text>
        <ColorPicker value={color} onChange={setColor} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.accent}>Schedule</Text>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'daily', label: 'Every day' }, { value: 'days', label: 'Selected days' }]} />
        {mode === 'days' ? <DayPicker value={days} onChange={setDays} weekStartsMonday={mondayFirst} /> : null}
        {submitted && errors.days ? <Text variant="caption" color={colors.danger}>{errors.days}</Text> : null}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Field label="Daily target (optional)" value={targetValue} onChangeText={setTargetValue} keyboardType="numeric"
          placeholder="e.g. 20" error={submitted ? errors.target : null} hint="Shown on your habit as a reminder of the goal for the day." />
        <Wrap>
          {UNITS.map((u) => <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />)}
        </Wrap>
      </View>

      <DateField label="Start date" value={startDate} today={today} onChange={(v) => v && setStartDate(v)} quick={[{ label: 'Tomorrow', days: 1 }]} />

      <Button title={existing ? 'Save changes' : 'Create habit'} onPress={submit} icon="check" disabled={limitReached} />
      {submitted && !valid ? <Muted style={{ textAlign: 'center' }}>Fix the highlighted fields to continue.</Muted> : null}
    </Screen>
  );
}
