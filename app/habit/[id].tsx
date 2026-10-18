import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import {
  addMonths, formatShortDate, leadingBlanks, MONTH_NAMES, weekdayLetters, yearMonthOf, monthKeys,
} from '@/domain/dates';
import {
  completionRate, currentStreak, isCompleted, isScheduledOn, longestStreak, totalCompletions,
} from '@/domain/habits';
import { HeatGrid, type HeatDay } from '@/components/charts';
import { HabitIcon, describeSchedule, describeTarget } from '@/components/habit';
import { Banner, Button, Card, IconButton, Muted, Row, Screen, ScreenHeader, SectionTitle, Text } from '@/components/ui';
import { lightTap } from '@/services/haptics';
import { colors, spacing } from '@/theme';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, today, index, setCompletion, deleteHabit } = useStore();
  const habit = state.habits.find((h) => h.id === id);
  const { weekStart, hapticsEnabled } = state.preferences;
  const base = yearMonthOf(today);
  const [offset, setOffset] = useState(0);
  const { year, month0 } = addMonths(base.year, base.month0, offset);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const cells = useMemo<HeatDay[]>(() => {
    if (!habit) return [];
    const blanks = Array.from({ length: leadingBlanks(year, month0, weekStart) }, (_, i): HeatDay => ({
      key: `b${i}`, day: 0, ratio: null, isFuture: true, isToday: false, blank: true,
    }));
    const days = monthKeys(year, month0).map((key): HeatDay => {
      const scheduled = isScheduledOn(habit, key);
      const done = isCompleted(index, habit.id, key);
      return {
        key, day: Number(key.slice(8)), isFuture: key > today, isToday: key === today,
        // Completed days stay visible even if the schedule changed; missed scheduled days show as 0.
        ratio: done ? 1 : scheduled ? 0 : null,
      };
    });
    const all = [...blanks, ...days];
    while (all.length % 7 !== 0) all.push({ key: `p${all.length}`, day: 0, ratio: null, isFuture: true, isToday: false, blank: true });
    return all;
  }, [habit, index, year, month0, today, weekStart]);

  if (!habit) {
    return (
      <Screen>
        <ScreenHeader title="Habit" onBack={close} />
        <Banner tone="error" message="This habit no longer exists." />
      </Screen>
    );
  }

  const doneToday = isCompleted(index, habit.id, today);
  const scheduledToday = isScheduledOn(habit, today);
  const rate30 = completionRate(habit, index, today, 30);
  const rate7 = completionRate(habit, index, today, 7);
  const monthDone = monthKeys(year, month0).filter((k) => isCompleted(index, habit.id, k)).length;
  const recent = state.completions
    .filter((c) => c.habitId === habit.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);

  const toggleDay = (key: string) => {
    if (key > today || key < habit.startDate) return;
    lightTap(hapticsEnabled);
    setCompletion(habit.id, key, !isCompleted(index, habit.id, key));
  };

  const confirmDelete = () =>
    Alert.alert('Delete habit?', `“${habit.name}” and all of its history will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteHabit(habit.id); close(); } },
    ]);

  return (
    <Screen>
      <ScreenHeader
        title="Habit"
        onBack={close}
        right={
          <Row style={{ gap: 0 }}>
            <IconButton icon="edit-2" label="Edit habit" onPress={() => router.push({ pathname: '/habit/form', params: { id: habit.id } })} />
            <IconButton icon="trash-2" label="Delete habit" color={colors.danger} onPress={confirmDelete} />
          </Row>
        }
      />

      <Row>
        <HabitIcon habit={habit} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" accessibilityRole="header">{habit.name}</Text>
          <Muted variant="caption">
            {describeSchedule(habit.schedule, weekStart === 'monday')}{describeTarget(habit) ? ` · ${describeTarget(habit)}` : ''}
          </Muted>
        </View>
      </Row>
      {habit.description ? <Muted>{habit.description}</Muted> : null}

      <Button
        title={!scheduledToday ? 'Not scheduled today' : doneToday ? 'Completed today — tap to undo' : 'Mark complete today'}
        icon={doneToday ? 'rotate-ccw' : 'check'}
        variant={doneToday ? 'secondary' : 'primary'}
        disabled={!scheduledToday}
        onPress={() => toggleDay(today)}
      />

      <Row style={{ gap: spacing.md }}>
        <Tile label="Current streak" value={`${currentStreak(habit, index, today)}d`} />
        <Tile label="Longest streak" value={`${longestStreak(habit, index, today)}d`} />
        <Tile label="Total" value={String(totalCompletions(habit, state.completions))} />
      </Row>
      <Row style={{ gap: spacing.md }}>
        <Tile label="Last 7 days" value={rate7 === null ? '–' : `${Math.round(rate7 * 100)}%`} />
        <Tile label="Last 30 days" value={rate30 === null ? '–' : `${Math.round(rate30 * 100)}%`} />
      </Row>

      <View style={{ gap: spacing.sm }}>
        <SectionTitle title="History" />
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <IconButton icon="chevron-left" label="Previous month" onPress={() => setOffset((o) => o - 1)} />
            <Text variant="label">{MONTH_NAMES[month0]} {year}</Text>
            <IconButton icon="chevron-right" label="Next month" disabled={offset >= 0} onPress={() => setOffset((o) => o + 1)} />
          </Row>
          <HeatGrid cells={cells} weekdayLabels={weekdayLetters(weekStart)} onPressDay={toggleDay} />
          <Muted variant="caption">{monthDone} completed this month. Tap a past day to correct your record.</Muted>
        </Card>
      </View>

      <View style={{ gap: spacing.sm }}>
        <SectionTitle title="Recent completions" />
        <Card style={{ gap: spacing.sm }}>
          {recent.length === 0 ? (
            <Muted>No completions yet. Your first check-in will show up here.</Muted>
          ) : (
            recent.map((c) => (
              <Row key={c.id} style={{ justifyContent: 'space-between' }}>
                <Text>{formatShortDate(c.date)}</Text>
                <Muted variant="caption">{new Date(c.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Muted>
              </Row>
            ))
          )}
        </Card>
      </View>
      <Muted variant="caption" style={{ textAlign: 'center' }}>Started {formatShortDate(habit.startDate)}</Muted>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' }}>
      <Text variant="title" accessibilityLabel={`${label}: ${value}`}>{value}</Text>
      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>{label}</Text>
    </Card>
  );
}
