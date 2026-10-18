import React from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { describeDaysLeft, goalProgress } from '@/domain/goals';
import { ProgressRing } from '@/components/charts';
import { HabitIcon } from '@/components/habit';
import { Banner, Button, Card, IconButton, Muted, ProgressBar, Row, Screen, ScreenHeader, SectionTitle, Text, Wrap } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { spacing } from '@/theme';

export default function GoalDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, tm, unit, shortDate, icon } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, today, adjustGoal, setGoalCompleted, deleteGoal } = useStore();
  const goal = state.goals.find((g) => g.id === id);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/goals'));

  if (!goal) {
    return (
      <Screen>
        <ScreenHeader title={t('goal.title')} onBack={close} />
        <Banner tone="error" message={t('goal.notFound')} />
      </Screen>
    );
  }

  const p = goalProgress(goal, state.milestones, state.completions, today);
  const milestones = state.milestones.filter((m) => m.goalId === goal.id).sort((a, b) => a.target - b.target);
  const habits = state.habits.filter((h) => goal.linkedHabitIds.includes(h.id));
  const left = describeDaysLeft(p.daysLeft);
  const completed = !!goal.completedAt;
  const u = unit(goal.unit);

  const confirmDelete = () =>
    Alert.alert(t('goal.deleteTitle'), t('goal.deleteMsg', { title: goal.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { deleteGoal(goal.id); close(); } },
    ]);

  return (
    <Screen>
      <ScreenHeader
        title={t('goal.title')}
        onBack={close}
        right={
          <Row style={{ gap: 0 }}>
            <IconButton icon="edit-2" label={t('goal.editA11y')} onPress={() => router.push({ pathname: '/goal/form', params: { id: goal.id } })} />
            <IconButton icon="trash-2" label={t('goal.deleteA11y')} color={colors.danger} onPress={confirmDelete} />
          </Row>
        }
      />

      <View style={{ gap: 4 }}>
        <Text variant="title" accessibilityRole="header">{goal.title}</Text>
        {goal.description ? <Muted>{goal.description}</Muted> : null}
        {left && !completed ? (
          <Text variant="caption" color={p.overdue ? colors.danger : colors.accent}>
            {tm(left)}{goal.targetDate ? ` · ${shortDate(goal.targetDate)}` : ''}
          </Text>
        ) : null}
      </View>

      <Card>
        <Row style={{ gap: spacing.lg }}>
          <ProgressRing ratio={p.ratio} size={96} stroke={9}>
            <Text variant="heading" style={{ textAlign: 'center' }}>{Math.round(p.ratio * 100)}%</Text>
          </ProgressRing>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title" accessibilityLabel={t('goal.cardA11y', { title: goal.title, current: p.current, target: p.target, unit: u })}>{p.current}/{p.target}</Text>
            <Muted>{u}</Muted>
            {p.fromHabits > 0 ? <Muted variant="caption">{t('goal.fromHabits', { count: p.fromHabits })}</Muted> : null}
          </View>
        </Row>
        <Row style={{ gap: spacing.sm }}>
          <Feather name={icon('arrow-right-circle')} size={18} color={colors.text} />
          <Text variant="label" style={{ flex: 1 }}>{tm(p.nextStep)}</Text>
        </Row>
      </Card>

      {!completed ? (
        <Row style={{ gap: spacing.sm }}>
          <Button title="−1" variant="secondary" style={{ flex: 1 }} disabled={goal.manualProgress <= 0} onPress={() => adjustGoal(goal.id, -1)} />
          <Button title="+1" style={{ flex: 2 }} icon="plus" onPress={() => adjustGoal(goal.id, 1)} />
          <Button title="+5" variant="secondary" style={{ flex: 1 }} onPress={() => adjustGoal(goal.id, 5)} />
        </Row>
      ) : null}

      {milestones.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionTitle title={t('goal.milestones')} />
          <Card style={{ gap: spacing.md }}>
            {milestones.map((m) => {
              const reached = p.reachedMilestoneIds.includes(m.id);
              return (
                <View key={m.id} style={{ gap: 6 }} accessible accessibilityLabel={t('goal.milestoneA11y', { title: m.title, target: m.target, unit: u, state: reached ? t('goal.reached') : t('goal.notReached') })}>
                  <Row>
                    <Feather name={reached ? 'check-circle' : 'circle'} size={22} color={reached ? colors.selected : colors.accent} />
                    <Text style={{ flex: 1, opacity: reached ? 0.7 : 1 }}>{m.title}</Text>
                    <Muted variant="caption">{Math.min(p.current, m.target)}/{m.target}</Muted>
                  </Row>
                  <ProgressBar ratio={p.current / m.target} height={5} />
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      {habits.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionTitle title={t('goal.linkedHabits')} />
          <Wrap>
            {habits.map((h) => (
              <Card key={h.id} onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })} style={{ padding: spacing.sm, paddingHorizontal: spacing.md }}>
                <Row style={{ gap: spacing.sm }}>
                  <HabitIcon habit={h} size={32} />
                  <Text variant="label">{h.name}</Text>
                </Row>
              </Card>
            ))}
          </Wrap>
        </View>
      ) : null}

      <Button
        title={completed ? t('goal.reopen') : t('goal.markCompleted')}
        icon={completed ? 'rotate-ccw' : 'award'}
        variant={completed ? 'secondary' : p.targetReached ? 'primary' : 'secondary'}
        onPress={() => setGoalCompleted(goal.id, !completed)}
      />
    </Screen>
  );
}
