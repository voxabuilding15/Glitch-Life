import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { addDays, addMonths, leadingBlanks, MONTH_NAMES, weekdayLetters, yearMonthOf, formatShortDate } from '@/domain/dates';
import {
  averageRatio, completionRate, currentStreak, dayStats, isCompleted, isScheduledOn, longestStreak, monthSummary, weeklyChart,
} from '@/domain/habits';
import { BarChart, HeatGrid, type HeatDay } from '@/components/charts';
import { HabitRow, describeSchedule } from '@/components/habit';
import { Card, EmptyState, IconButton, Muted, Row, Screen, SectionTitle, Segmented, Text } from '@/components/ui';
import { lightTap } from '@/services/haptics';
import { colors, spacing } from '@/theme';

const pct = (r: number | null) => (r === null ? '–' : `${Math.round(r * 100)}%`);

export default function HabitsScreen() {
  const router = useRouter();
  const { state, today, index, setCompletion } = useStore();
  const { habits, preferences } = state;
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const weekAnchor = addDays(today, weekOffset * 7);
  const week = useMemo(() => weeklyChart(habits, index, weekAnchor, preferences.weekStart), [habits, index, weekAnchor, preferences.weekStart]);
  const weekAvg = averageRatio(week);

  const base = yearMonthOf(today);
  const { year, month0 } = addMonths(base.year, base.month0, monthOffset);
  const month = useMemo(() => monthSummary(habits, index, year, month0, today, preferences.weekStart), [habits, index, year, month0, today, preferences.weekStart]);
  const cells: HeatDay[] = useMemo(() => {
    const blanks = Array.from({ length: leadingBlanks(year, month0, preferences.weekStart) }, (_, i): HeatDay => ({
      key: `blank-${i}`, day: 0, ratio: null, isFuture: true, isToday: false, blank: true,
    }));
    const days = month.days.map((d): HeatDay => ({ key: d.date, day: Number(d.date.slice(8)), ratio: d.ratio, isFuture: d.isFuture, isToday: d.isToday }));
    const all = [...blanks, ...days];
    while (all.length % 7 !== 0) all.push({ key: `pad-${all.length}`, day: 0, ratio: null, isFuture: true, isToday: false, blank: true });
    return all;
  }, [month, year, month0, preferences.weekStart]);

  const todayStats = dayStats(habits, index, today);
  const bestStreak = habits.reduce((m, h) => Math.max(m, longestStreak(h, index, today)), 0);

  const weekData = week.map((d) => ({ label: d.label, value: d.isFuture ? null : d.ratio, highlight: d.isToday, dim: d.ratio === null }));
  const weekSummaryText = week.map((d) => `${d.label} ${pct(d.ratio)}`).join(', ');

  return (
    <Screen tabs>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="display" accessibilityRole="header">Habits</Text>
        <IconButton icon="plus" label="Add habit" filled onPress={() => router.push('/habit/form')} />
      </Row>

      {habits.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title="No habits yet"
          message="Create a habit to start tracking streaks and weekly progress."
          actionLabel="Create a habit"
          onAction={() => router.push('/habit/form')}
        />
      ) : (
        <>
          <Row style={{ gap: spacing.md }}>
            <Stat label="Today" value={pct(todayStats.ratio)} />
            <Stat label={mode === 'week' ? 'Week avg' : 'Month avg'} value={pct(mode === 'week' ? weekAvg : month.average)} />
            <Stat label="Best streak" value={`${bestStreak}d`} />
          </Row>

          <Segmented
            value={mode}
            onChange={setMode}
            options={[{ value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }]}
          />

          {mode === 'week' ? (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <IconButton icon="chevron-left" label="Previous week" onPress={() => setWeekOffset((o) => o - 1)} />
                <Text variant="label">
                  {weekOffset === 0 ? 'This week' : `${formatShortDate(week[0].date)} – ${formatShortDate(week[6].date)}`}
                </Text>
                <IconButton icon="chevron-right" label="Next week" disabled={weekOffset >= 0} onPress={() => setWeekOffset((o) => o + 1)} />
              </Row>
              <BarChart data={weekData} summary={`Weekly completion. ${weekSummaryText}`} />
            </Card>
          ) : (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <IconButton icon="chevron-left" label="Previous month" onPress={() => setMonthOffset((o) => o - 1)} />
                <Text variant="label">{MONTH_NAMES[month0]} {year}</Text>
                <IconButton icon="chevron-right" label="Next month" disabled={monthOffset >= 0} onPress={() => setMonthOffset((o) => o + 1)} />
              </Row>
              <BarChart
                data={month.weeks.map((w) => ({ label: w.label, value: w.ratio, dim: w.ratio === null }))}
                summary={`Monthly completion by week. ${month.weeks.map((w) => `${w.label} ${pct(w.ratio)}`).join(', ')}`}
              />
              <HeatGrid cells={cells} weekdayLabels={weekdayLetters(preferences.weekStart)} />
              <Muted variant="caption">
                {month.totalDone} of {month.totalScheduled} habit check-ins · {month.perfectDays} perfect day{month.perfectDays === 1 ? '' : 's'}
              </Muted>
            </Card>
          )}

          <View style={{ gap: spacing.sm }}>
            <SectionTitle title="Your habits" />
            <Card style={{ gap: spacing.sm }}>
              {habits.map((h) => {
                const scheduledToday = isScheduledOn(h, today);
                const done = isCompleted(index, h.id, today);
                const streak = currentStreak(h, index, today);
                const rate = completionRate(h, index, today, 30);
                return (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    done={done}
                    disabled={!scheduledToday}
                    subtitle={`${describeSchedule(h.schedule, preferences.weekStart === 'monday')} · ${streak}-day streak · ${pct(rate)} (30d)`}
                    onToggle={() => {
                      lightTap(preferences.hapticsEnabled);
                      setCompletion(h.id, today, !done);
                    }}
                    onOpen={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
                  />
                );
              })}
            </Card>
          </View>
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' }}>
      <Text variant="title" accessibilityLabel={`${label}: ${value}`}>{value}</Text>
      <Text variant="caption" color={colors.textMuted}>{label}</Text>
    </Card>
  );
}
