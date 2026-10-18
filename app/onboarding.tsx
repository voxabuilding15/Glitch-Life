import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import type { HabitTarget } from '@/domain/types';
import { Button, Chip, Field, Muted, ProgressBar, Row, Screen, Text, Wrap } from '@/components/ui';
import { colors, spacing } from '@/theme';

type Icon = React.ComponentProps<typeof Feather>['name'];
interface Suggestion { name: string; icon: string; target: HabitTarget | null }

const CATEGORIES: { id: string; label: string; icon: Icon; habits: Suggestion[] }[] = [
  { id: 'health', label: 'Health', icon: 'heart', habits: [
    { name: 'Drink enough water', icon: 'droplet', target: { value: 8, unit: 'glasses' } },
    { name: 'Sleep before 11 PM', icon: 'moon', target: null },
  ] },
  { id: 'fitness', label: 'Fitness', icon: 'activity', habits: [
    { name: 'Exercise for 30 minutes', icon: 'activity', target: { value: 30, unit: 'minutes' } },
    { name: 'Take a walk', icon: 'map', target: { value: 20, unit: 'minutes' } },
  ] },
  { id: 'learning', label: 'Learning', icon: 'book-open', habits: [
    { name: 'Read for 20 minutes', icon: 'book-open', target: { value: 20, unit: 'minutes' } },
    { name: 'Practice English', icon: 'globe', target: { value: 15, unit: 'minutes' } },
    { name: 'Study programming', icon: 'code', target: { value: 30, unit: 'minutes' } },
  ] },
  { id: 'productivity', label: 'Productivity', icon: 'zap', habits: [
    { name: 'Plan the day', icon: 'edit-3', target: null },
    { name: 'Deep work block', icon: 'briefcase', target: { value: 60, unit: 'minutes' } },
  ] },
  { id: 'growth', label: 'Personal development', icon: 'star', habits: [
    { name: 'Meditate', icon: 'smile', target: { value: 10, unit: 'minutes' } },
    { name: 'Write in a journal', icon: 'feather', target: null },
  ] },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { state, today, saveHabit, updateProfile, updatePreferences } = useStore();
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const suggestions = useMemo(
    () => CATEGORIES.filter((c) => areas.length === 0 || areas.includes(c.id)).flatMap((c) => c.habits),
    [areas],
  );

  const finishAndGo = (createFirst: boolean) => {
    updatePreferences({ onboardingCompleted: true });
    router.replace('/');
    if (createFirst) router.push('/habit/form');
  };

  const skip = () => finishAndGo(false);

  const finish = () => {
    updateProfile({ focusAreas: areas, mainGoal: goal.trim() });
    const existing = new Set(state.habits.map((h) => h.name.toLowerCase()));
    let created = 0;
    for (const s of suggestions.filter((x) => picked.includes(x.name))) {
      if (existing.has(s.name.toLowerCase())) continue;
      saveHabit({ name: s.name, description: '', icon: s.icon, color: null, schedule: { type: 'daily' }, target: s.target, startDate: today });
      created += 1;
    }
    finishAndGo(created === 0 && state.habits.length === 0);
  };

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: spacing.lg }}><ProgressBar ratio={(step + 1) / 3} /></View>
        <Button title="Skip" variant="ghost" onPress={skip} style={{ minHeight: 44, paddingHorizontal: spacing.md }} />
      </Row>

      <View style={{ gap: spacing.xs }}>
        <Muted variant="caption">STEP {step + 1} OF 3</Muted>
        <Text variant="display" accessibilityRole="header">
          {step === 0 ? 'What do you want to improve?' : step === 1 ? 'What is your main goal?' : 'Which habits do you want to build?'}
        </Text>
        <Muted>
          {step === 0 ? 'Pick any that matter to you. You can change this later.'
            : step === 1 ? 'One sentence is plenty. It will show on your Today screen.'
              : 'Tap to add suggestions — they’ll be ready on your Today screen.'}
        </Muted>
      </View>

      {step === 0 ? (
        <Wrap>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} icon={c.icon} selected={areas.includes(c.id)} onPress={() => toggle(areas, setAreas, c.id)} />
          ))}
        </Wrap>
      ) : step === 1 ? (
        <View style={{ gap: spacing.md }}>
          <Field label="Main goal" value={goal} onChangeText={setGoal} placeholder="e.g. Get fit and learn to code" maxLength={100} />
          <Wrap>
            {['Be more consistent', 'Get healthier', 'Learn a new skill', 'Reduce stress'].map((g) => (
              <Chip key={g} label={g} selected={goal === g} onPress={() => setGoal(g)} />
            ))}
          </Wrap>
        </View>
      ) : (
        <Wrap>
          {suggestions.map((s) => (
            <Chip key={s.name} label={s.name} icon={s.icon as Icon} selected={picked.includes(s.name)} onPress={() => toggle(picked, setPicked, s.name)} />
          ))}
        </Wrap>
      )}

      <View style={{ flex: 1 }} />
      <Row>
        {step > 0 ? <Button title="Back" variant="secondary" style={{ flex: 1 }} onPress={() => setStep(step - 1)} /> : null}
        {step < 2 ? (
          <Button title="Next" icon="arrow-right" style={{ flex: 2 }} onPress={() => setStep(step + 1)} />
        ) : (
          <Button title={picked.length ? `Add ${picked.length} & start` : 'Finish'} icon="check" style={{ flex: 2 }} onPress={finish} />
        )}
      </Row>
      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>You can skip anytime and set everything up later.</Text>
    </Screen>
  );
}
