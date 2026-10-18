import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { canAddGoal, currentPlan } from '@/domain/entitlements';
import { DateField } from '@/components/DateField';
import { Banner, Button, Card, Chip, Field, IconButton, Muted, Row, Screen, ScreenHeader, Text, Wrap } from '@/components/ui';
import { colors, spacing } from '@/theme';

const UNITS = ['sessions', 'hours', 'pages', 'km', 'steps'];
interface MilestoneDraft { title: string; target: string }

export default function GoalFormScreen() {
  const router = useRouter();
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
    title: !title.trim() ? 'Give your goal a title.' : title.trim().length > 80 ? 'Keep the title under 80 characters.' : null,
    target: !(target > 0 && target <= 1_000_000) ? 'Enter a target greater than 0.' : null,
    description: description.length > 300 ? 'Keep the description under 300 characters.' : null,
    date: targetDate && targetDate < today && !existing ? 'Pick a date in the future.' : null,
    milestones: milestones.some((m) => !m.title.trim() || !(Number(m.target) > 0) || (target > 0 && Number(m.target) > target))
      ? 'Each milestone needs a name and a target between 1 and your goal target.' : null,
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
        <ScreenHeader title="Goal" onBack={close} />
        <Banner tone="error" message="This goal no longer exists." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={existing ? 'Edit goal' : 'New goal'} onBack={close} />
      {limitReached ? <Banner tone="error" message="Active goal limit reached for the free plan." /> : null}

      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Learn Python" maxLength={90} error={submitted ? errors.title : null} />
      <Field label="Description (optional)" value={description} onChangeText={setDescription} multiline maxLength={320}
        placeholder="What does success look like?" error={submitted ? errors.description : null} />

      <View style={{ gap: spacing.sm }}>
        <Field label="Target" value={targetValue} onChangeText={setTargetValue} keyboardType="numeric" placeholder="e.g. 30"
          error={submitted ? errors.target : null} hint="How much you need to complete to reach this goal." />
        <Wrap>{UNITS.map((u) => <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />)}</Wrap>
      </View>

      <DateField label="Target date (optional)" value={targetDate} today={today} allowEmpty onChange={setTargetDate}
        quick={[{ label: '+1 week', days: 7 }, { label: '+1 month', days: 30 }, { label: '+3 months', days: 90 }]} />
      {submitted && errors.date ? <Text variant="caption" color={colors.danger}>{errors.date}</Text> : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.accent}>Milestones (optional)</Text>
        <Muted variant="caption">Checkpoints along the way, measured in {unit}. They are reached automatically as your progress grows.</Muted>
        {milestones.map((m, i) => (
          <Card key={i} style={{ padding: spacing.md, gap: spacing.sm }}>
            <Row>
              <View style={{ flex: 1 }}>
                <Field label={`Milestone ${i + 1} name`} value={m.title} placeholder="e.g. Finish the basics" maxLength={60}
                  onChangeText={(v) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
              </View>
              <IconButton icon="x" label={`Remove milestone ${i + 1}`} onPress={() => setMilestones((l) => l.filter((_, j) => j !== i))} />
            </Row>
            <Field label={`Reached at (${unit})`} value={m.target} keyboardType="numeric" placeholder="e.g. 10"
              onChangeText={(v) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, target: v } : x)))} />
          </Card>
        ))}
        {submitted && errors.milestones ? <Text variant="caption" color={colors.danger}>{errors.milestones}</Text> : null}
        <Button title="Add milestone" icon="plus" variant="secondary" onPress={() => setMilestones((l) => [...l, { title: '', target: '' }])} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color={colors.accent}>Linked habits (optional)</Text>
        <Muted variant="caption">Each completion of a linked habit counts as +1 progress.</Muted>
        {state.habits.length === 0 ? (
          <Muted variant="caption">Create a habit first to link it here.</Muted>
        ) : (
          <Wrap>
            {state.habits.map((h) => (
              <Chip key={h.id} label={h.name} icon={h.icon as never} selected={linked.includes(h.id)}
                onPress={() => setLinked((l) => (l.includes(h.id) ? l.filter((x) => x !== h.id) : [...l, h.id]))} />
            ))}
          </Wrap>
        )}
      </View>

      <Button title={existing ? 'Save changes' : 'Create goal'} icon="check" onPress={submit} disabled={limitReached} />
    </Screen>
  );
}
