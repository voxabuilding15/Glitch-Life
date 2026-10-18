import React from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { formatShortDate } from '@/domain/dates';
import { describeDaysLeft, goalProgress } from '@/domain/goals';
import { ProgressRing } from '@/components/charts';
import { HabitIcon } from '@/components/habit';
import { Banner, Button, Card, IconButton, Muted, ProgressBar, Row, Screen, ScreenHeader, SectionTitle, Text, Wrap } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, today, adjustGoal, setGoalCompleted, deleteGoal } = useStore();
  const goal = state.goals.find((g) => g.id === id);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/goals'));

  if (!goal) {
    return (
      <Screen>
        <ScreenHeader title="Goal" onBack={close} />
        <Banner tone="error" message="This goal no longer exists." />
      </Screen>
    );
  }

  const p = goalProgress(goal, state.milestones, state.completions, today);
  const milestones = state.milestones.filter((m) => m.goalId === goal.id).sort((a, b) => a.target - b.target);
  const habits = state.habits.filter((h) => goal.linkedHabitIds.includes(h.id));
  const left = describeDaysLeft(p.daysLeft);
  const completed = !!goal.completedAt;

  const confirmDelete = () =>
    Alert.alert('Delete goal?', `“${goal.title}” and its milestones will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteGoal(goal.id); close(); } },
    ]);

  return (
    <Screen>
      <ScreenHeader
        title="Goal"
        onBack={close}
        right={
          <Row style={{ gap: 0 }}>
            <IconButton icon="edit-2" label="Edit goal" onPress={() => router.push({ pathname: '/goal/form', params: { id: goal.id } })} />
            <IconButton icon="trash-2" label="Delete goal" color={colors.danger} onPress={confirmDelete} />
          </Row>
        }
      />

      <View style={{ gap: 4 }}>
        <Text variant="title" accessibilityRole="header">{goal.title}</Text>
        {goal.description ? <Muted>{goal.description}</Muted> : null}
        {left && !completed ? <Text variant="caption" color={p.overdue ? colors.danger : colors.accent}>{left} · {formatShortDate(goal.targetDate!)}</Text> : null}
      </View>

      <Card>
        <Row style={{ gap: spacing.lg }}>
          <ProgressRing ratio={p.ratio} size={96} stroke={9}>
            <Text variant="heading">{Math.round(p.ratio * 100)}%</Text>
          </ProgressRing>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title" accessibilityLabel={`${p.current} of ${p.target} ${goal.unit}`}>{p.current}/{p.target}</Text>
            <Muted>{goal.unit}</Muted>
            {p.fromHabits > 0 ? <Muted variant="caption">{p.fromHabits} from linked habits</Muted> : null}
          </View>
        </Row>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Feather name="arrow-right-circle" size={18} color={colors.highlight} />
          <Text variant="label" style={{ flex: 1 }}>{p.nextStep}</Text>
        </View>
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
          <SectionTitle title="Milestones" />
          <Card style={{ gap: spacing.md }}>
            {milestones.map((m) => {
              const reached = p.reachedMilestoneIds.includes(m.id);
              return (
                <View key={m.id} style={{ gap: 6 }} accessible accessibilityLabel={`${m.title}, ${m.target} ${goal.unit}, ${reached ? 'reached' : 'not reached'}`}>
                  <Row>
                    <Feather name={reached ? 'check-circle' : 'circle'} size={22} color={reached ? colors.highlight : colors.accent} />
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
          <SectionTitle title="Linked habits" />
          <Wrap>
            {habits.map((h) => (
              <Card key={h.id} onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })} style={{ padding: spacing.sm, paddingRight: spacing.lg }}>
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
        title={completed ? 'Reopen goal' : 'Mark goal as completed'}
        icon={completed ? 'rotate-ccw' : 'award'}
        variant={completed ? 'secondary' : p.targetReached ? 'primary' : 'secondary'}
        onPress={() => setGoalCompleted(goal.id, !completed)}
      />
    </Screen>
  );
}
