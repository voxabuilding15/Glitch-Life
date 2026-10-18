import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { canAddHabit, currentPlan } from '@/domain/entitlements';
import type { Weekday } from '@/domain/types';
import { ColorPicker, DayPicker, HabitIcon, IconPicker } from '@/components/habit';
import { DateField } from '@/components/DateField';
import { Banner, Button, Chip, Field, Muted, Screen, ScreenHeader, Segmented, Text, Wrap } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { spacing } from '@/theme';

const UNITS = ['minutes', 'times', 'pages', 'glasses', 'km'];

export default function HabitFormScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, unit: unitLabel } = useI18n();
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
    name: !name.trim() ? t('habitForm.errName') : name.trim().length > 60 ? t('habitForm.errNameLong') : null,
    description: description.length > 200 ? t('habitForm.errDesc') : null,
    days: mode === 'days' && days.length === 0 ? t('habitForm.errDays') : null,
    target: targetValue.trim() && !(Number(targetValue) > 0 && Number(targetValue) <= 100000) ? t('habitForm.errTarget') : null,
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
        <ScreenHeader title={t('habit.title')} onBack={close} />
        <Banner tone="error" message={t('habitForm.notFound')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={existing ? t('habitForm.edit') : t('habitForm.new')} onBack={close} />
      {limitReached ? <Banner tone="error" message={t('habitForm.limit')} /> : null}

      <View style={{ alignItems: 'center' }}>
        <HabitIcon habit={{ icon, color }} size={72} />
      </View>

      <Field label={t('habitForm.name')} value={name} onChangeText={setName} placeholder={t('habitForm.namePlaceholder')} maxLength={70}
        error={submitted ? errors.name : null} returnKeyType="next" />
      <Field label={t('habitForm.description')} value={description} onChangeText={setDescription} multiline maxLength={220}
        placeholder={t('habitForm.descPlaceholder')} error={submitted ? errors.description : null} />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.textMuted}>{t('habitForm.icon')}</Text>
        <IconPicker value={icon} onChange={setIcon} color={color} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.textMuted}>{t('habitForm.color')}</Text>
        <ColorPicker value={color} onChange={setColor} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.textMuted}>{t('habitForm.schedule')}</Text>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'daily', label: t('habitForm.everyDay') }, { value: 'days', label: t('habitForm.selectedDays') }]} />
        {mode === 'days' ? <DayPicker value={days} onChange={setDays} weekStartsMonday={mondayFirst} /> : null}
        {submitted && errors.days ? <Text variant="caption" color={colors.danger}>{errors.days}</Text> : null}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Field label={t('habitForm.target')} value={targetValue} onChangeText={setTargetValue} keyboardType="numeric"
          placeholder={t('habitForm.targetPlaceholder')} error={submitted ? errors.target : null} hint={t('habitForm.targetHint')} />
        <Wrap>
          {UNITS.map((u) => <Chip key={u} label={unitLabel(u)} selected={unit === u} onPress={() => setUnit(u)} />)}
        </Wrap>
      </View>

      <DateField label={t('habitForm.startDate')} value={startDate} today={today} onChange={(v) => v && setStartDate(v)} quick={[{ label: t('habitForm.tomorrow'), days: 1 }]} />

      <Button title={existing ? t('common.saveChanges') : t('habitForm.create')} onPress={submit} icon="check" disabled={limitReached} />
      {submitted && !valid ? <Muted style={{ textAlign: 'center' }}>{t('habitForm.fixFields')}</Muted> : null}
    </Screen>
  );
}
