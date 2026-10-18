import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { greetingKey } from '@/domain/dates';
import { dayStats, habitsForDay, isCompleted, weeklyChart } from '@/domain/habits';
import { describeDaysLeft, goalProgress } from '@/domain/goals';
import { focusStats } from '@/domain/focus';
import { Button, Card, EmptyState, Muted, ProgressBar, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { ProgressRing } from '@/components/charts';
import { HabitRow, describeTarget } from '@/components/habit';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { lightTap, successTap } from '@/services/haptics';
import { radius, spacing } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const i18n = useI18n();
  const { t, tm, row, icon, unit } = i18n;
  const { state, today, index, setCompletion } = useStore();
  const { habits, goals, milestones, completions, preferences, profile, activeTimer, focusSessions } = state;

  const scheduled = habitsForDay(habits, today);
  const stats = dayStats(habits, index, today);
  const week = weeklyChart(habits, index, today, preferences.weekStart, i18n.lang);
  const activeGoals = goals.filter((g) => !g.completedAt);
  const focus = focusStats(focusSessions, today, preferences.weekStart);
  const allDone = stats.scheduled > 0 && stats.done === stats.scheduled;
  const firstName = profile.name.trim().split(' ')[0];
  const pct = Math.round((stats.ratio ?? 0) * 100);

  const toggle = (habitId: string, done: boolean) => {
    if (done) lightTap(preferences.hapticsEnabled);
    else successTap(preferences.hapticsEnabled);
    setCompletion(habitId, today, !done);
  };

  const greeting = t(greetingKey(new Date()));

  return (
    <Screen tabs>
      <View style={{ gap: 4 }}>
        <Text variant="display" accessibilityRole="header">
          {firstName ? `${greeting}${i18n.rtl ? '،' : ','} ${firstName}` : greeting}{i18n.rtl ? '' : '.'}
        </Text>
        <Muted>{i18n.longDate(today)}</Muted>
        <Muted>{profile.mainGoal ? t('today.focusLine', { goal: profile.mainGoal }) : t('today.makeCount')}</Muted>
      </View>

      {habits.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title={t('today.emptyTitle')}
          message={t('today.emptyMsg')}
          actionLabel={t('today.emptyCta')}
          onAction={() => router.push('/habit/form')}
        />
      ) : (
        <>
          <LinearGradient
            colors={colors.gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }}
          >
            <Row style={{ gap: spacing.lg }}>
              <ProgressRing ratio={stats.ratio ?? 0} size={104} stroke={10}>
                <Text variant="title" accessibilityLabel={t('today.percentA11y', { percent: pct })} style={{ textAlign: 'center' }}>{pct}%</Text>
              </ProgressRing>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="caption" color={colors.textMuted}>{t('today.dailyProgress')}</Text>
                <Text variant="title" accessibilityLiveRegion="polite">{t('today.completed', { done: stats.done, total: stats.scheduled })}</Text>
                <Muted variant="caption">
                  {stats.scheduled === 0
                    ? t('today.nothingScheduled')
                    : allDone
                      ? t('today.allDone')
                      : t('today.toGo', { count: stats.scheduled - stats.done })}
                </Muted>
              </View>
            </Row>
          </LinearGradient>

          <View style={{ gap: spacing.sm }}>
            <SectionTitle title={t('today.habitsTitle')} action={t('today.allHabits')} onAction={() => router.push('/habits')} />
            {scheduled.length === 0 ? (
              <Card><Muted>{t('today.noneScheduled')}</Muted></Card>
            ) : (
              <Card style={{ gap: spacing.sm }}>
                {scheduled.map((h) => {
                  const done = isCompleted(index, h.id, today);
                  return (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      done={done}
                      subtitle={describeTarget(h, i18n) ?? undefined}
                      onToggle={() => toggle(h.id, done)}
                      onOpen={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
                    />
                  );
                })}
              </Card>
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <SectionTitle title={t('today.thisWeek')} />
            <Card>
              <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
                {week.map((d) => (
                  <View
                    key={d.date}
                    style={{ alignItems: 'center', gap: 6, flex: 1 }}
                    accessible
                    accessibilityLabel={t('chart.dayA11y', {
                      day: i18n.weekdayName(new Date(`${d.date}T00:00:00Z`).getUTCDay()),
                      value: d.ratio === null ? t('chart.nothingScheduled') : t('chart.percent', { percent: Math.round(d.ratio * 100) }),
                    })}
                  >
                    <View style={{ height: 56, width: 14, borderRadius: 7, backgroundColor: colors.track, justifyContent: 'flex-end', overflow: 'hidden' }}>
                      <View style={{ height: `${Math.round((d.isFuture ? 0 : d.ratio ?? 0) * 100)}%`, backgroundColor: d.isToday ? colors.selected : colors.primary, borderRadius: 7 }} />
                    </View>
                    <Text variant="caption" color={d.isToday ? colors.text : colors.textMuted} style={[{ textAlign: 'center' }, d.isToday ? { fontWeight: '700' } : null]}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </>
      )}

      <Card onPress={() => router.push('/focus')} label={t('today.openFocusA11y')}>
        <Row>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="clock" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{t('today.focusTimer')}</Text>
            <Muted variant="caption">
              {activeTimer && activeTimer.status !== 'finished'
                ? t(activeTimer.status === 'running' ? 'today.focusRunning' : 'today.focusPaused')
                : focus.todaySeconds > 0
                  ? t('today.focusedToday', { time: i18n.duration(focus.todaySeconds) })
                  : t('today.focusStart')}
            </Muted>
          </View>
          <Feather name={icon('chevron-right')} size={22} color={colors.accent} />
        </Row>
      </Card>

      {activeGoals.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionTitle title={t('today.activeGoals')} action={t('today.seeAll')} onAction={() => router.push('/goals')} />
          <Card style={{ gap: spacing.lg }}>
            {activeGoals.slice(0, 3).map((g) => {
              const p = goalProgress(g, milestones, completions, today);
              const left = describeDaysLeft(p.daysLeft);
              const text = t('goal.progressText', { current: p.current, target: p.target, unit: unit(g.unit) });
              return (
                <View key={g.id} style={{ gap: 6 }} accessible accessibilityLabel={`${g.title}, ${text}`}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>{g.title}</Text>
                    <Muted variant="caption">{text}</Muted>
                  </Row>
                  <ProgressBar ratio={p.ratio} />
                  {left ? <Muted variant="caption">{tm(left)}</Muted> : null}
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      {habits.length > 0 ? <Button title={t('today.addHabit')} icon="plus" variant="secondary" onPress={() => router.push('/habit/form')} /> : null}
    </Screen>
  );
}
