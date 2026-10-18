import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { addDays, addMonths, leadingBlanks, yearMonthOf } from '@/domain/dates';
import {
  averageRatio, completionRate, currentStreak, dayStats, isCompleted, isScheduledOn, longestStreak, monthSummary, weeklyChart,
} from '@/domain/habits';
import { BarChart, HeatGrid, type HeatDay } from '@/components/charts';
import { HabitRow, describeSchedule } from '@/components/habit';
import { Card, EmptyState, IconButton, Muted, Row, Screen, SectionTitle, Segmented, Text } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { lightTap } from '@/services/haptics';
import { spacing } from '@/theme';

export default function HabitsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const i18n = useI18n();
  const { t, icon, lang } = i18n;
  const { state, today, index, setCompletion } = useStore();
  const { habits, preferences } = state;
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const pct = (r: number | null) => (r === null ? '–' : `${Math.round(r * 100)}%`);

  const weekAnchor = addDays(today, weekOffset * 7);
  const week = useMemo(() => weeklyChart(habits, index, weekAnchor, preferences.weekStart, lang), [habits, index, weekAnchor, preferences.weekStart, lang]);
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
  const sep = i18n.rtl ? '، ' : ', ';
  const weekSummaryText = week.map((d) => `${d.label} ${pct(d.ratio)}`).join(sep);

  return (
    <Screen tabs>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="display" accessibilityRole="header">{t('habits.title')}</Text>
        <IconButton icon="plus" label={t('habits.add')} filled onPress={() => router.push('/habit/form')} />
      </Row>

      {habits.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title={t('habits.emptyTitle')}
          message={t('habits.emptyMsg')}
          actionLabel={t('habits.emptyCta')}
          onAction={() => router.push('/habit/form')}
        />
      ) : (
        <>
          <Row style={{ gap: spacing.md }}>
            <Stat label={t('habits.statToday')} value={pct(todayStats.ratio)} />
            <Stat label={mode === 'week' ? t('habits.statWeekAvg') : t('habits.statMonthAvg')} value={pct(mode === 'week' ? weekAvg : month.average)} />
            <Stat label={t('habits.statBest')} value={t('common.daysShort', { count: bestStreak })} />
          </Row>

          <Segmented
            value={mode}
            onChange={setMode}
            options={[{ value: 'week', label: t('habits.weekly') }, { value: 'month', label: t('habits.monthly') }]}
          />

          {mode === 'week' ? (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <IconButton icon={icon('chevron-left')} label={t('habits.prevWeek')} onPress={() => setWeekOffset((o) => o - 1)} />
                <Text variant="label" style={{ textAlign: 'center' }}>
                  {weekOffset === 0 ? t('habits.thisWeek') : `${i18n.shortDate(week[0].date)} – ${i18n.shortDate(week[6].date)}`}
                </Text>
                <IconButton icon={icon('chevron-right')} label={t('habits.nextWeek')} disabled={weekOffset >= 0} onPress={() => setWeekOffset((o) => o + 1)} />
              </Row>
              <BarChart data={weekData} summary={t('habits.weeklySummary', { details: weekSummaryText })} />
            </Card>
          ) : (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <IconButton icon={icon('chevron-left')} label={t('habits.prevMonth')} onPress={() => setMonthOffset((o) => o - 1)} />
                <Text variant="label" style={{ textAlign: 'center' }}>{i18n.monthYear(year, month0)}</Text>
                <IconButton icon={icon('chevron-right')} label={t('habits.nextMonth')} disabled={monthOffset >= 0} onPress={() => setMonthOffset((o) => o + 1)} />
              </Row>
              <BarChart
                data={month.weeks.map((w, wi) => ({ label: lang === 'ar' ? String(wi + 1) : `${lang === 'fr' ? 'S' : 'W'}${wi + 1}`, value: w.ratio, dim: w.ratio === null }))}
                summary={t('habits.monthlySummary', { details: month.weeks.map((w, wi) => `${wi + 1} ${pct(w.ratio)}`).join(sep) })}
              />
              <HeatGrid cells={cells} weekdayLabels={i18n.weekdayLetters(preferences.weekStart)} />
              <Muted variant="caption">
                {t('habits.monthSummary', { done: month.totalDone, total: month.totalScheduled, count: month.perfectDays })}
              </Muted>
            </Card>
          )}

          <View style={{ gap: spacing.sm }}>
            <SectionTitle title={t('habits.yourHabits')} />
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
                    subtitle={t('habits.rowSubtitle', {
                      schedule: describeSchedule(h.schedule, i18n, preferences.weekStart === 'monday'),
                      streak,
                      rate: pct(rate),
                    })}
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
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' }}>
      <Text variant="title" accessibilityLabel={`${label}: ${value}`} style={{ textAlign: 'center' }}>{value}</Text>
      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>{label}</Text>
    </Card>
  );
}
