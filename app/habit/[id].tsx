import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { addMonths, leadingBlanks, monthKeys, yearMonthOf } from '@/domain/dates';
import { completionRate, currentStreak, isCompleted, isScheduledOn, longestStreak, totalCompletions } from '@/domain/habits';
import { HeatGrid, type HeatDay } from '@/components/charts';
import { HabitIcon, describeSchedule, describeTarget } from '@/components/habit';
import { Banner, Button, Card, IconButton, Muted, Row, Screen, ScreenHeader, SectionTitle, Text } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { lightTap } from '@/services/haptics';
import { spacing } from '@/theme';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const i18n = useI18n();
  const { t, icon } = i18n;
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
        <ScreenHeader title={t('habit.title')} onBack={close} />
        <Banner tone="error" message={t('habitForm.notFound')} />
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
  const target = describeTarget(habit, i18n);

  const toggleDay = (key: string) => {
    if (key > today || key < habit.startDate) return;
    lightTap(hapticsEnabled);
    setCompletion(habit.id, key, !isCompleted(index, habit.id, key));
  };

  const confirmDelete = () =>
    Alert.alert(t('habit.deleteTitle'), t('habit.deleteMsg', { name: habit.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { deleteHabit(habit.id); close(); } },
    ]);

  const rate = (r: number | null) => (r === null ? '–' : `${Math.round(r * 100)}%`);

  return (
    <Screen>
      <ScreenHeader
        title={t('habit.title')}
        onBack={close}
        right={
          <Row style={{ gap: 0 }}>
            <IconButton icon="edit-2" label={t('habit.editA11y')} onPress={() => router.push({ pathname: '/habit/form', params: { id: habit.id } })} />
            <IconButton icon="trash-2" label={t('habit.deleteA11y')} color={colors.danger} onPress={confirmDelete} />
          </Row>
        }
      />

      <Row>
        <HabitIcon habit={habit} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" accessibilityRole="header">{habit.name}</Text>
          <Muted variant="caption">
            {describeSchedule(habit.schedule, i18n, weekStart === 'monday')}{target ? ` · ${target}` : ''}
          </Muted>
        </View>
      </Row>
      {habit.description ? <Muted>{habit.description}</Muted> : null}

      <Button
        title={!scheduledToday ? t('habit.notScheduled') : doneToday ? t('habit.completedUndo') : t('habit.markComplete')}
        icon={doneToday ? 'rotate-ccw' : 'check'}
        variant={doneToday ? 'secondary' : 'primary'}
        disabled={!scheduledToday}
        onPress={() => toggleDay(today)}
      />

      <Row style={{ gap: spacing.md }}>
        <Tile label={t('habit.streakCurrent')} value={t('common.daysShort', { count: currentStreak(habit, index, today) })} />
        <Tile label={t('habit.streakLongest')} value={t('common.daysShort', { count: longestStreak(habit, index, today) })} />
        <Tile label={t('habit.total')} value={String(totalCompletions(habit, state.completions))} />
      </Row>
      <Row style={{ gap: spacing.md }}>
        <Tile label={t('habit.last7')} value={rate(rate7)} />
        <Tile label={t('habit.last30')} value={rate(rate30)} />
      </Row>

      <View style={{ gap: spacing.sm }}>
        <SectionTitle title={t('habit.history')} />
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <IconButton icon={icon('chevron-left')} label={t('habits.prevMonth')} onPress={() => setOffset((o) => o - 1)} />
            <Text variant="label" style={{ textAlign: 'center' }}>{i18n.monthYear(year, month0)}</Text>
            <IconButton icon={icon('chevron-right')} label={t('habits.nextMonth')} disabled={offset >= 0} onPress={() => setOffset((o) => o + 1)} />
          </Row>
          <HeatGrid cells={cells} weekdayLabels={i18n.weekdayLetters(weekStart)} onPressDay={toggleDay} />
          <Muted variant="caption">{t('habit.historyHint', { count: monthDone })}</Muted>
        </Card>
      </View>

      <View style={{ gap: spacing.sm }}>
        <SectionTitle title={t('habit.recent')} />
        <Card style={{ gap: spacing.sm }}>
          {recent.length === 0 ? (
            <Muted>{t('habit.noCompletions')}</Muted>
          ) : (
            recent.map((c) => (
              <Row key={c.id} style={{ justifyContent: 'space-between' }}>
                <Text>{i18n.shortDate(c.date)}</Text>
                <Muted variant="caption">{i18n.clockTime(c.completedAt)}</Muted>
              </Row>
            ))
          )}
        </Card>
      </View>
      <Muted variant="caption" style={{ textAlign: 'center' }}>{t('habit.started', { date: i18n.shortDate(habit.startDate) })}</Muted>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' }}>
      <Text variant="title" accessibilityLabel={`${label}: ${value}`} style={{ textAlign: 'center' }}>{value}</Text>
      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>{label}</Text>
    </Card>
  );
}
