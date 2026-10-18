import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { LANGUAGE_NAMES, LANGUAGES, type MessageKey } from '@/i18n';
import type { HabitTarget } from '@/domain/types';
import { Button, Chip, Field, Muted, ProgressBar, Row, Screen, Text, Wrap } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { spacing } from '@/theme';

type Icon = React.ComponentProps<typeof Feather>['name'];
interface Suggestion { id: string; nameKey: MessageKey; icon: string; target: HabitTarget | null }

const CATEGORIES: { id: string; labelKey: MessageKey; icon: Icon; habits: Suggestion[] }[] = [
  { id: 'health', labelKey: 'onb.cat.health', icon: 'heart', habits: [
    { id: 'water', nameKey: 'onb.h.water', icon: 'droplet', target: { value: 8, unit: 'glasses' } },
    { id: 'sleep', nameKey: 'onb.h.sleep', icon: 'moon', target: null },
  ] },
  { id: 'fitness', labelKey: 'onb.cat.fitness', icon: 'activity', habits: [
    { id: 'exercise', nameKey: 'onb.h.exercise', icon: 'activity', target: { value: 30, unit: 'minutes' } },
    { id: 'walk', nameKey: 'onb.h.walk', icon: 'map', target: { value: 20, unit: 'minutes' } },
  ] },
  { id: 'learning', labelKey: 'onb.cat.learning', icon: 'book-open', habits: [
    { id: 'read', nameKey: 'onb.h.read', icon: 'book-open', target: { value: 20, unit: 'minutes' } },
    { id: 'english', nameKey: 'onb.h.english', icon: 'globe', target: { value: 15, unit: 'minutes' } },
    { id: 'code', nameKey: 'onb.h.code', icon: 'code', target: { value: 30, unit: 'minutes' } },
  ] },
  { id: 'productivity', labelKey: 'onb.cat.productivity', icon: 'zap', habits: [
    { id: 'plan', nameKey: 'onb.h.plan', icon: 'edit-3', target: null },
    { id: 'deepwork', nameKey: 'onb.h.deepwork', icon: 'briefcase', target: { value: 60, unit: 'minutes' } },
  ] },
  { id: 'growth', labelKey: 'onb.cat.growth', icon: 'star', habits: [
    { id: 'meditate', nameKey: 'onb.h.meditate', icon: 'smile', target: { value: 10, unit: 'minutes' } },
    { id: 'journal', nameKey: 'onb.h.journal', icon: 'feather', target: null },
  ] },
];

const GOAL_IDEAS: MessageKey[] = ['onb.goalIdea1', 'onb.goalIdea2', 'onb.goalIdea3', 'onb.goalIdea4'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, lang, setLanguage, icon } = useI18n();
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
    for (const s of suggestions.filter((x) => picked.includes(x.id))) {
      const name = t(s.nameKey);
      if (existing.has(name.toLowerCase())) continue;
      saveHabit({ name, description: '', icon: s.icon, color: null, schedule: { type: 'daily' }, target: s.target, startDate: today });
      created += 1;
    }
    finishAndGo(created === 0 && state.habits.length === 0);
  };

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const titles: MessageKey[] = ['onb.q1', 'onb.q2', 'onb.q3'];
  const subs: MessageKey[] = ['onb.q1sub', 'onb.q2sub', 'onb.q3sub'];

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}><ProgressBar ratio={(step + 1) / 3} /></View>
        <Button title={t('common.skip')} variant="ghost" onPress={skip} style={{ minHeight: 44, paddingHorizontal: spacing.md }} />
      </Row>

      <Wrap>
        {LANGUAGES.map((l) => (
          <Chip key={l} label={`${LANGUAGE_NAMES[l].flag} ${LANGUAGE_NAMES[l].native}`} selected={lang === l} onPress={() => setLanguage(l)} />
        ))}
      </Wrap>

      <View style={{ gap: spacing.xs }}>
        <Muted variant="caption">{t('onb.step', { n: step + 1 })}</Muted>
        <Text variant="display" accessibilityRole="header">{t(titles[step])}</Text>
        <Muted>{t(subs[step])}</Muted>
      </View>

      {step === 0 ? (
        <Wrap>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={t(c.labelKey)} icon={c.icon} selected={areas.includes(c.id)} onPress={() => toggle(areas, setAreas, c.id)} />
          ))}
        </Wrap>
      ) : step === 1 ? (
        <View style={{ gap: spacing.md }}>
          <Field label={t('onb.goalLabel')} value={goal} onChangeText={setGoal} placeholder={t('onb.goalPlaceholder')} maxLength={100} />
          <Wrap>
            {GOAL_IDEAS.map((k) => (
              <Chip key={k} label={t(k)} selected={goal === t(k)} onPress={() => setGoal(t(k))} />
            ))}
          </Wrap>
        </View>
      ) : (
        <Wrap>
          {suggestions.map((s) => (
            <Chip key={s.id} label={t(s.nameKey)} icon={s.icon as Icon} selected={picked.includes(s.id)} onPress={() => toggle(picked, setPicked, s.id)} />
          ))}
        </Wrap>
      )}

      <View style={{ flex: 1 }} />
      <Row>
        {step > 0 ? <Button title={t('common.back2')} variant="secondary" style={{ flex: 1 }} onPress={() => setStep(step - 1)} /> : null}
        {step < 2 ? (
          <Button title={t('common.next')} icon={icon('arrow-right')} style={{ flex: 2 }} onPress={() => setStep(step + 1)} />
        ) : (
          <Button title={picked.length ? t('onb.addStart', { count: picked.length }) : t('common.finish')} icon="check" style={{ flex: 2 }} onPress={finish} />
        )}
      </Row>
      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>{t('onb.skipHint')}</Text>
    </Screen>
  );
}
