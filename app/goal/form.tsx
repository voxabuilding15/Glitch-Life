import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { canAddGoal, currentPlan } from '@/domain/entitlements';
import { DateField } from '@/components/DateField';
import { Banner, Button, Card, Chip, Field, IconButton, Muted, Row, Screen, ScreenHeader, Text, Wrap } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { spacing } from '@/theme';

const UNITS = ['sessions', 'hours', 'pages', 'km', 'steps'];
interface MilestoneDraft { title: string; target: string }

export default function GoalFormScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, unit: unitLabel } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, today, saveGoal } = useStore();
  const existing = id ? state.goals.find((g) => g.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [targetValue, setTargetValue] = useState(existing ? String(existing.targetValue) : '');
  const [unit, setUnit] = useState(existing?.unit ?? 'sessions');
  const [targetDate, setTargetDate] = useState<string | null>(existing?.targetDate ?? null);
  const [linked, setLinked] = useState<string[]>(existing?.linkedHabitIds ?? []);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(
    existing ? state.milestones.filter((m) => m.goalId === existing.id).sort((a, b) => a.target - b.target).map((m) => ({ title: m.title, target: String(m.target) })) : [],
  );
  const [submitted, setSubmitted] = useState(false);

  const target = Number(targetValue);
  const errors = {
    title: !title.trim() ? t('goalForm.errTitle') : title.trim().length > 80 ? t('goalForm.errTitleLong') : null,
    target: !(target > 0 && target <= 1_000_000) ? t('goalForm.errTarget') : null,
    description: description.length > 300 ? t('goalForm.errDesc') : null,
    date: targetDate && targetDate < today && !existing ? t('goalForm.errDate') : null,
    milestones: milestones.some((m) => !m.title.trim() || !(Number(m.target) > 0) || (target > 0 && Number(m.target) > target))
      ? t('goalForm.errMilestones') : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const limitReached = !existing && !canAddGoal(currentPlan(), state.goals.filter((g) => !g.completedAt).length);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/goals'));

  const submit = () => {
    setSubmitted(true);
    if (!valid || limitReached) return;
    const g = saveGoal({
      id: existing?.id, title, description, targetValue: target, unit, targetDate, linkedHabitIds: linked,
      milestones: milestones.map((m) => ({ title: m.title, target: Number(m.target) })),
    });
    if (existing) close();
    else router.replace({ pathname: '/goal/[id]', params: { id: g.id } });
  };

  if (id && !existing) {
    return (
      <Screen>
        <ScreenHeader title={t('goal.title')} onBack={close} />
        <Banner tone="error" message={t('goal.notFound')} />
      </Screen>
    );
  }

  const uLabel = unitLabel(unit);

  return (
    <Screen>
      <ScreenHeader title={existing ? t('goalForm.edit') : t('goalForm.new')} onBack={close} />
      {limitReached ? <Banner tone="error" message={t('goalForm.limit')} /> : null}

      <Field label={t('goalForm.title')} value={title} onChangeText={setTitle} placeholder={t('goalForm.titlePlaceholder')} maxLength={90} error={submitted ? errors.title : null} />
      <Field label={t('goalForm.description')} value={description} onChangeText={setDescription} multiline maxLength={320}
        placeholder={t('goalForm.descPlaceholder')} error={submitted ? errors.description : null} />

      <View style={{ gap: spacing.sm }}>
        <Field label={t('goalForm.target')} value={targetValue} onChangeText={setTargetValue} keyboardType="numeric" placeholder={t('goalForm.targetPlaceholder')}
          error={submitted ? errors.target : null} hint={t('goalForm.targetHint')} />
        <Wrap>{UNITS.map((u) => <Chip key={u} label={unitLabel(u)} selected={unit === u} onPress={() => setUnit(u)} />)}</Wrap>
      </View>

      <DateField label={t('goalForm.targetDate')} value={targetDate} today={today} allowEmpty onChange={setTargetDate}
        quick={[{ label: t('goalForm.plus1w'), days: 7 }, { label: t('goalForm.plus1m'), days: 30 }, { label: t('goalForm.plus3m'), days: 90 }]} />
      {submitted && errors.date ? <Text variant="caption" color={colors.danger}>{errors.date}</Text> : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.textMuted}>{t('goalForm.milestones')}</Text>
        <Muted variant="caption">{t('goalForm.milestonesHint', { unit: uLabel })}</Muted>
        {milestones.map((m, i) => (
          <Card key={i} style={{ padding: spacing.md, gap: spacing.sm }}>
            <Row>
              <View style={{ flex: 1 }}>
                <Field label={t('goalForm.milestoneName', { n: i + 1 })} value={m.title} placeholder={t('goalForm.milestonePlaceholder')} maxLength={60}
                  onChangeText={(v) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
              </View>
              <IconButton icon="x" label={t('goalForm.removeMilestone', { n: i + 1 })} onPress={() => setMilestones((l) => l.filter((_, j) => j !== i))} />
            </Row>
            <Field label={t('goalForm.reachedAt', { unit: uLabel })} value={m.target} keyboardType="numeric" placeholder={t('goalForm.targetPlaceholder')}
              onChangeText={(v) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, target: v } : x)))} />
          </Card>
        ))}
        {submitted && errors.milestones ? <Text variant="caption" color={colors.danger}>{errors.milestones}</Text> : null}
        <Button title={t('goalForm.addMilestone')} icon="plus" variant="secondary" onPress={() => setMilestones((l) => [...l, { title: '', target: '' }])} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.textMuted}>{t('goalForm.linked')}</Text>
        <Muted variant="caption">{t('goalForm.linkedHint')}</Muted>
        {state.habits.length === 0 ? (
          <Muted variant="caption">{t('goalForm.createHabitFirst')}</Muted>
        ) : (
          <Wrap>
            {state.habits.map((h) => (
              <Chip key={h.id} label={h.name} icon={h.icon as never} selected={linked.includes(h.id)}
                onPress={() => setLinked((l) => (l.includes(h.id) ? l.filter((x) => x !== h.id) : [...l, h.id]))} />
            ))}
          </Wrap>
        )}
      </View>

      <Button title={existing ? t('common.saveChanges') : t('goalForm.create')} icon="check" onPress={submit} disabled={limitReached} />
    </Screen>
  );
}
