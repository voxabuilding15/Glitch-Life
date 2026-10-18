import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { formatLongDate, greetingFor } from '@/domain/dates';
import { dayStats, habitsForDay, isCompleted, weeklyChart } from '@/domain/habits';
import { describeDaysLeft, goalProgress } from '@/domain/goals';
import { focusStats } from '@/domain/focus';
import { formatDuration } from '@/domain/dates';
import { Button, Card, EmptyState, Muted, ProgressBar, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { ProgressRing } from '@/components/charts';
import { HabitRow, describeTarget } from '@/components/habit';
import { lightTap, successTap } from '@/services/haptics';
import { colors, gradients, radius, spacing } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { state, today, index, setCompletion } = useStore();
  const { habits, goals, milestones, completions, preferences, profile, activeTimer, focusSessions } = state;

  const scheduled = habitsForDay(habits, today);
  const stats = dayStats(habits, index, today);
  const week = weeklyChart(habits, index, today, preferences.weekStart);
  const activeGoals = goals.filter((g) => !g.completedAt);
  const focus = focusStats(focusSessions, today, preferences.weekStart);
  const allDone = stats.scheduled > 0 && stats.done === stats.scheduled;
  const firstName = profile.name.trim().split(' ')[0];

  const toggle = (habitId: string, done: boolean) => {
    if (done) lightTap(preferences.hapticsEnabled);
    else successTap(preferences.hapticsEnabled);
    setCompletion(habitId, today, !done);
  };

  return (
    <Screen tabs>
      <View style={{ gap: 4 }}>
        <Text variant="display" accessibilityRole="header">
          {greetingFor(new Date())}{firstName ? `, ${firstName}` : ''}.
        </Text>
        <Muted>{formatLongDate(today)}</Muted>
        <Muted>{profile.mainGoal ? `Your focus: ${profile.mainGoal}` : 'Make today count.'}</Muted>
      </View>

      {habits.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title="Start with one habit"
          message="Small daily actions add up. Create your first habit and check it off here every day."
          actionLabel="Create your first habit"
          onAction={() => router.push('/habit/form')}
        />
      ) : (
        <>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }}>
            <Row style={{ gap: spacing.lg }}>
              <ProgressRing ratio={stats.ratio ?? 0} size={104} stroke={10}>
                <Text variant="title" accessibilityLabel={`${Math.round((stats.ratio ?? 0) * 100)} percent complete`}>
                  {Math.round((stats.ratio ?? 0) * 100)}%
                </Text>
              </ProgressRing>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="caption" color={colors.accent}>DAILY PROGRESS</Text>
                <Text variant="title" accessibilityLiveRegion="polite">
                  {stats.done}/{stats.scheduled} habits completed
                </Text>
                <Muted variant="caption">
                  {stats.scheduled === 0
                    ? 'Nothing scheduled today. Enjoy the rest.'
                    : allDone
                      ? 'All done — great consistency!'
                      : `${stats.scheduled - stats.done} to go. One tap each.`}
                </Muted>
              </View>
            </Row>
          </LinearGradient>

          <View style={{ gap: spacing.sm }}>
            <SectionTitle title="Today’s habits" action="All habits" onAction={() => router.push('/habits')} />
            {scheduled.length === 0 ? (
              <Card><Muted>No habits are scheduled for today.</Muted></Card>
            ) : (
              <Card style={{ gap: spacing.sm }}>
                {scheduled.map((h) => {
                  const done = isCompleted(index, h.id, today);
                  return (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      done={done}
                      subtitle={describeTarget(h) ?? undefined}
                      onToggle={() => toggle(h.id, done)}
                      onOpen={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
                    />
                  );
                })}
              </Card>
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <SectionTitle title="This week" />
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {week.map((d, i) => (
                  <View key={d.date} style={{ alignItems: 'center', gap: 6, flex: 1 }} accessible accessibilityLabel={`${d.label}, ${d.ratio === null ? 'nothing scheduled' : Math.round(d.ratio * 100) + ' percent'}`}>
                    <View style={{ height: 56, width: 14, borderRadius: 7, backgroundColor: 'rgba(125,160,202,0.18)', justifyContent: 'flex-end', overflow: 'hidden' }}>
                      <View style={{ height: `${Math.round((d.isFuture ? 0 : d.ratio ?? 0) * 100)}%`, backgroundColor: d.isToday ? colors.highlight : colors.primary, borderRadius: 7 }} />
                    </View>
                    <Text variant="caption" color={d.isToday ? colors.highlight : colors.textMuted} style={d.isToday ? { fontWeight: '700' } : undefined}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </>
      )}

      <Card onPress={() => router.push('/focus')} label="Open focus timer">
        <Row>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="clock" size={24} color={colors.highlight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading">Focus Timer</Text>
            <Muted variant="caption">
              {activeTimer && activeTimer.status !== 'finished'
                ? `Session ${activeTimer.status === 'running' ? 'running' : 'paused'} — tap to open`
                : focus.todaySeconds > 0 ? `${formatDuration(focus.todaySeconds)} focused today` : 'Start a distraction-free session'}
            </Muted>
          </View>
          <Feather name="chevron-right" size={22} color={colors.accent} />
        </Row>
      </Card>

      {activeGoals.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionTitle title="Active goals" action="See all" onAction={() => router.push('/goals')} />
          <Card style={{ gap: spacing.lg }}>
            {activeGoals.slice(0, 3).map((g) => {
              const p = goalProgress(g, milestones, completions, today);
              return (
                <View key={g.id} style={{ gap: 6 }} accessible accessibilityLabel={`${g.title}, ${p.current} of ${p.target} ${g.unit}`}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>{g.title}</Text>
                    <Muted variant="caption">{p.current}/{p.target} {g.unit}</Muted>
                  </Row>
                  <ProgressBar ratio={p.ratio} />
                  {p.daysLeft !== null ? <Muted variant="caption">{describeDaysLeft(p.daysLeft)}</Muted> : null}
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      {habits.length > 0 ? <Button title="Add a habit" icon="plus" variant="secondary" onPress={() => router.push('/habit/form')} /> : null}
    </Screen>
  );
}
