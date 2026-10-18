import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { formatClock, toDateKey } from '@/domain/dates';
import { focusStats, parseMinutes, PRESET_MINUTES, remainingMs, timerRatio } from '@/domain/focus';
import { ProgressRing } from '@/components/charts';
import { Banner, Button, Card, Chip, Field, Muted, Row, Screen, ScreenHeader, Segmented, Text, Wrap } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { successTap } from '@/services/haptics';
import { radius, spacing } from '@/theme';

type Tab = 'timer' | 'history';

export default function FocusScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('timer');
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Screen>
      <ScreenHeader title={t('focus.title')} onBack={close} />
      <Segmented value={tab} onChange={setTab} options={[{ value: 'timer', label: t('focus.tabTimer') }, { value: 'history', label: t('focus.tabHistory') }]} />
      {tab === 'timer' ? <TimerPanel /> : <HistoryPanel />}
    </Screen>
  );
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Digits and the colon always read left-to-right, even inside an RTL layout. */
const clockStyle = { fontWeight: '700' as const, fontVariant: ['tabular-nums' as const], writingDirection: 'ltr' as const, textAlign: 'center' as const };

function TimerPanel() {
  const { colors } = useTheme();
  const i18n = useI18n();
  const { t, row, icon, duration } = i18n;
  const { state, startTimer, pauseTimer, resumeTimer, resetTimer } = useStore();
  const timer = state.activeTimer;
  const [minutes, setMinutes] = useState<number>(25);
  const [custom, setCustom] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [task, setTask] = useState('');
  const [habitId, setHabitId] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const running = timer?.status === 'running';
  const now = useNow(running);

  useEffect(() => {
    if (timer?.status === 'finished') successTap(state.preferences.hapticsEnabled);
  }, [timer?.status, state.preferences.hapticsEnabled]);

  const start = async () => {
    const mins = customMode ? parseMinutes(custom) : minutes;
    if (mins === null) {
      setError(t('focus.customError'));
      return;
    }
    setError(null);
    await startTimer({ plannedSeconds: mins * 60, taskName: task, habitId, goalId });
  };

  const confirmReset = () =>
    Alert.alert(t('focus.resetTitle'), t('focus.resetMsg'), [
      { text: t('focus.keepGoing'), style: 'cancel' },
      { text: t('focus.reset'), style: 'destructive', onPress: resetTimer },
    ]);

  const linkLabel = (h: string | null, g: string | null): string | null => {
    const habit = h ? state.habits.find((x) => x.id === h) : null;
    const goal = g ? state.goals.find((x) => x.id === g) : null;
    if (habit) return t('focus.linkHabit', { name: habit.name });
    if (goal) return t('focus.linkGoal', { name: goal.title });
    return null;
  };

  /* ----- finished ----- */
  if (timer?.status === 'finished') {
    return (
      <View style={{ gap: spacing.lg }}>
        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.selected, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={38} color={colors.onSelected} />
          </View>
          <Text variant="title" accessibilityLiveRegion="polite">{t('focus.complete')}</Text>
          <Muted style={{ textAlign: 'center' }}>
            {timer.taskName
              ? t('focus.completeMsgTask', { duration: duration(timer.plannedSeconds), task: timer.taskName })
              : t('focus.completeMsg', { duration: duration(timer.plannedSeconds) })}
          </Muted>
        </Card>
        <Button title={t('common.done')} icon="check" onPress={resetTimer} />
      </View>
    );
  }

  /* ----- active (running / paused) ----- */
  if (timer) {
    const remaining = remainingMs(timer, now) / 1000;
    const link = linkLabel(timer.habitId, timer.goalId);
    return (
      <View style={{ gap: spacing.lg, alignItems: 'center' }}>
        <ProgressRing ratio={timerRatio(timer, now)} size={280} stroke={14}>
          <Text style={[{ fontSize: 56 }, clockStyle]} accessibilityRole="timer" accessibilityLabel={t('focus.remainingA11y', { time: duration(Math.ceil(remaining)) })}>
            {formatClock(remaining)}
          </Text>
          <Muted>{timer.status === 'paused' ? t('focus.paused') : t('focus.ofDuration', { duration: duration(timer.plannedSeconds) })}</Muted>
        </ProgressRing>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text variant="heading" style={{ textAlign: 'center' }}>{timer.taskName || t('focus.session')}</Text>
          {link ? <Muted variant="caption" style={{ textAlign: 'center' }}>{link}</Muted> : null}
        </View>
        <Row style={{ gap: spacing.md, alignSelf: 'stretch' }}>
          <Button title={t('focus.reset')} icon="rotate-ccw" variant="secondary" style={{ flex: 1 }} onPress={confirmReset} />
          {running ? (
            <Button title={t('focus.pause')} icon="pause" style={{ flex: 2 }} onPress={pauseTimer} />
          ) : (
            <Button title={t('focus.resume')} icon="play" style={{ flex: 2 }} onPress={() => void resumeTimer()} />
          )}
        </Row>
      </View>
    );
  }

  /* ----- setup ----- */
  const shownMinutes = customMode ? parseMinutes(custom) ?? 0 : minutes;
  const link = linkLabel(habitId, goalId);
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <ProgressRing ratio={0} size={240} stroke={12}>
          <Text style={[{ fontSize: 52 }, clockStyle]}>{formatClock(shownMinutes * 60)}</Text>
          <Muted>{shownMinutes ? t('focus.minutes', { count: shownMinutes }) : t('focus.chooseDuration')}</Muted>
        </ProgressRing>
      </View>

      <Wrap>
        {PRESET_MINUTES.map((m) => (
          <Chip key={m} label={t('common.minutesShort', { count: m })} selected={!customMode && minutes === m} onPress={() => { setCustomMode(false); setMinutes(m); setError(null); }} />
        ))}
        <Chip label={t('focus.custom')} icon="edit-2" selected={customMode} onPress={() => setCustomMode(true)} />
      </Wrap>
      {customMode ? (
        <Field label={t('focus.customLabel')} value={custom} onChangeText={setCustom} keyboardType="number-pad" placeholder={t('focus.customPlaceholder')} maxLength={3} error={error} />
      ) : error ? <Banner tone="error" message={error} /> : null}

      <Field label={t('focus.task')} value={task} onChangeText={setTask} placeholder={t('focus.taskPlaceholder')} maxLength={80} />

      <Pressable
        onPress={() => setPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={t('focus.linkA11y')}
        style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, flexDirection: row, alignItems: 'center', gap: spacing.sm }}
      >
        <Feather name="link" size={18} color={colors.accent} />
        <Text style={{ flex: 1 }} color={link ? colors.text : colors.textMuted}>{link ?? t('focus.linkPlaceholder')}</Text>
        <Feather name={icon('chevron-right')} size={20} color={colors.accent} />
      </Pressable>

      <Button title={t('focus.start')} icon="play" onPress={() => void start()} />
      <Muted variant="caption" style={{ textAlign: 'center' }}>{t('focus.hint')}</Muted>

      <LinkPicker
        visible={picker}
        onClose={() => setPicker(false)}
        habitId={habitId}
        goalId={goalId}
        onPick={(h, g) => { setHabitId(h); setGoalId(g); setPicker(false); }}
      />
    </View>
  );
}

function LinkPicker({ visible, onClose, onPick, habitId, goalId }: {
  visible: boolean;
  onClose: () => void;
  onPick: (habitId: string | null, goalId: string | null) => void;
  habitId: string | null;
  goalId: string | null;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { state } = useStore();
  const goals = state.goals.filter((g) => !g.completedAt);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={t('common.close')} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '70%', padding: spacing.lg, gap: spacing.md }}>
          <Text variant="heading" accessibilityRole="header">{t('focus.linkTo')}</Text>
          <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
            <Wrap><Chip label={t('focus.nothing')} selected={!habitId && !goalId} onPress={() => onPick(null, null)} /></Wrap>
            {state.habits.length > 0 ? <Muted variant="caption">{t('focus.habitsHdr')}</Muted> : null}
            <Wrap>{state.habits.map((h) => <Chip key={h.id} label={h.name} selected={habitId === h.id} onPress={() => onPick(h.id, null)} />)}</Wrap>
            {goals.length > 0 ? <Muted variant="caption">{t('focus.goalsHdr')}</Muted> : null}
            <Wrap>{goals.map((g) => <Chip key={g.id} label={g.title} selected={goalId === g.id} onPress={() => onPick(null, g.id)} />)}</Wrap>
            {state.habits.length === 0 && goals.length === 0 ? <Muted>{t('focus.createFirst')}</Muted> : null}
          </ScrollView>
          <Button title={t('common.close')} variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function HistoryPanel() {
  const { colors } = useTheme();
  const i18n = useI18n();
  const { t, duration } = i18n;
  const { state, today, clearFocusHistory } = useStore();
  const sessions = state.focusSessions;
  const stats = focusStats(sessions, today, state.preferences.weekStart);

  const confirmClear = () =>
    Alert.alert(t('focus.clearTitle'), t('focus.clearMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('focus.clear'), style: 'destructive', onPress: clearFocusHistory },
    ]);

  return (
    <View style={{ gap: spacing.lg }}>
      <Row style={{ gap: spacing.md }}>
        <Stat label={t('focus.statToday')} value={duration(stats.todaySeconds)} />
        <Stat label={t('focus.statWeek')} value={duration(stats.weekSeconds)} />
        <Stat label={t('focus.statAll')} value={duration(stats.totalSeconds)} />
      </Row>
      {sessions.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: spacing.sm }}>
          <Feather name="clock" size={28} color={colors.accent} />
          <Text variant="heading">{t('focus.noSessions')}</Text>
          <Muted style={{ textAlign: 'center' }}>{t('focus.noSessionsMsg')}</Muted>
        </Card>
      ) : (
        <>
          <Card style={{ gap: spacing.md }}>
            {sessions.slice(0, 50).map((s) => (
              <Row key={s.id} style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="label" numberOfLines={1}>{s.taskName || t('focus.session')}</Text>
                  <Muted variant="caption">{i18n.shortDate(toDateKey(new Date(s.endedAt)))} · {i18n.clockTime(s.endedAt)}</Muted>
                </View>
                <Text variant="label" color={colors.accent}>{duration(s.elapsedSeconds)}</Text>
              </Row>
            ))}
          </Card>
          <Muted variant="caption" style={{ textAlign: 'center' }}>{t('focus.sessionsTotal', { count: stats.sessionCount })}</Muted>
          <Button title={t('focus.clear')} variant="danger" icon="trash-2" onPress={confirmClear} />
        </>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' }}>
      <Text variant="heading" accessibilityLabel={`${label}: ${value}`} style={{ textAlign: 'center' }}>{value}</Text>
      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>{label}</Text>
    </Card>
  );
}
