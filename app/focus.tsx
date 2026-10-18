import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { formatClock, formatDuration, formatShortDate, toDateKey } from '@/domain/dates';
import { focusStats, parseMinutes, PRESET_MINUTES, remainingMs, timerRatio } from '@/domain/focus';
import { ProgressRing } from '@/components/charts';
import { Banner, Button, Card, Chip, Field, Muted, Row, Screen, ScreenHeader, Segmented, Text, Wrap } from '@/components/ui';
import { successTap } from '@/services/haptics';
import { colors, radius, spacing } from '@/theme';

type Tab = 'timer' | 'history';

export default function FocusScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('timer');
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Screen>
      <ScreenHeader title="Focus Timer" onBack={close} />
      <Segmented value={tab} onChange={setTab} options={[{ value: 'timer', label: 'Timer' }, { value: 'history', label: 'History' }]} />
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

function TimerPanel() {
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
      setError('Enter a whole number of minutes between 1 and 240.');
      return;
    }
    setError(null);
    await startTimer({ plannedSeconds: mins * 60, taskName: task, habitId, goalId });
  };

  const confirmReset = () =>
    Alert.alert('Reset timer?', 'This session will be discarded and won’t be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetTimer },
    ]);

  /* ----- finished ----- */
  if (timer?.status === 'finished') {
    return (
      <View style={{ gap: spacing.lg }}>
        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={38} color={colors.onPrimary} />
          </View>
          <Text variant="title" accessibilityLiveRegion="polite">Session complete</Text>
          <Muted style={{ textAlign: 'center' }}>
            {formatDuration(timer.plannedSeconds)} of focus{timer.taskName ? ` on “${timer.taskName}”` : ''} saved to your history.
          </Muted>
        </Card>
        <Button title="Done" icon="check" onPress={resetTimer} />
      </View>
    );
  }

  /* ----- active (running / paused) ----- */
  if (timer) {
    const remaining = remainingMs(timer, now) / 1000;
    const link = linkLabel(state, timer.habitId, timer.goalId);
    return (
      <View style={{ gap: spacing.lg, alignItems: 'center' }}>
        <ProgressRing ratio={timerRatio(timer, now)} size={280} stroke={14}>
          <Text
            style={{ fontSize: 56, fontWeight: '700', fontVariant: ['tabular-nums'] }}
            accessibilityRole="timer"
            accessibilityLabel={`${formatDuration(Math.ceil(remaining))} remaining`}
          >
            {formatClock(remaining)}
          </Text>
          <Muted>{timer.status === 'paused' ? 'Paused' : `of ${formatDuration(timer.plannedSeconds)}`}</Muted>
        </ProgressRing>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text variant="heading">{timer.taskName || 'Focus session'}</Text>
          {link ? <Muted variant="caption">{link}</Muted> : null}
        </View>
        <Row style={{ gap: spacing.md, alignSelf: 'stretch' }}>
          <Button title="Reset" icon="rotate-ccw" variant="secondary" style={{ flex: 1 }} onPress={confirmReset} />
          {running ? (
            <Button title="Pause" icon="pause" style={{ flex: 2 }} onPress={pauseTimer} />
          ) : (
            <Button title="Resume" icon="play" style={{ flex: 2 }} onPress={() => void resumeTimer()} />
          )}
        </Row>
      </View>
    );
  }

  /* ----- setup ----- */
  const shownMinutes = customMode ? parseMinutes(custom) ?? 0 : minutes;
  const link = linkLabel(state, habitId, goalId);
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <ProgressRing ratio={0} size={240} stroke={12}>
          <Text style={{ fontSize: 52, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{formatClock(shownMinutes * 60)}</Text>
          <Muted>{shownMinutes ? `${shownMinutes} minute${shownMinutes === 1 ? '' : 's'}` : 'Choose a duration'}</Muted>
        </ProgressRing>
      </View>

      <Wrap>
        {PRESET_MINUTES.map((m) => (
          <Chip key={m} label={`${m} min`} selected={!customMode && minutes === m} onPress={() => { setCustomMode(false); setMinutes(m); setError(null); }} />
        ))}
        <Chip label="Custom" icon="edit-2" selected={customMode} onPress={() => setCustomMode(true)} />
      </Wrap>
      {customMode ? (
        <Field label="Custom duration (minutes)" value={custom} onChangeText={setCustom} keyboardType="number-pad" placeholder="e.g. 35" maxLength={3} error={error} />
      ) : error ? <Banner tone="error" message={error} /> : null}

      <Field label="Task (optional)" value={task} onChangeText={setTask} placeholder="What will you work on?" maxLength={80} />

      <Pressable
        onPress={() => setPicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Link a habit or goal"
        style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
      >
        <Feather name="link" size={18} color={colors.accent} />
        <Text style={{ flex: 1 }} color={link ? colors.highlight : colors.textMuted}>{link ?? 'Link a habit or goal (optional)'}</Text>
        <Feather name="chevron-right" size={20} color={colors.accent} />
      </Pressable>

      <Button title="Start focus" icon="play" onPress={() => void start()} />
      <Muted variant="caption" style={{ textAlign: 'center' }}>
        The timer keeps counting in the background. A notification will let you know when it ends, if allowed.
      </Muted>

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

function linkLabel(state: ReturnType<typeof useStore>['state'], habitId: string | null, goalId: string | null): string | null {
  const h = habitId ? state.habits.find((x) => x.id === habitId) : null;
  const g = goalId ? state.goals.find((x) => x.id === goalId) : null;
  if (h) return `Habit · ${h.name}`;
  if (g) return `Goal · ${g.title}`;
  return null;
}

function LinkPicker({ visible, onClose, onPick, habitId, goalId }: {
  visible: boolean;
  onClose: () => void;
  onPick: (habitId: string | null, goalId: string | null) => void;
  habitId: string | null;
  goalId: string | null;
}) {
  const { state } = useStore();
  const goals = state.goals.filter((g) => !g.completedAt);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '70%', padding: spacing.lg, gap: spacing.md }}>
          <Text variant="heading" accessibilityRole="header">Link to…</Text>
          <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
            <Chip label="Nothing" selected={!habitId && !goalId} onPress={() => onPick(null, null)} />
            {state.habits.length > 0 ? <Muted variant="caption">HABITS</Muted> : null}
            <Wrap>{state.habits.map((h) => <Chip key={h.id} label={h.name} selected={habitId === h.id} onPress={() => onPick(h.id, null)} />)}</Wrap>
            {goals.length > 0 ? <Muted variant="caption">GOALS</Muted> : null}
            <Wrap>{goals.map((g) => <Chip key={g.id} label={g.title} selected={goalId === g.id} onPress={() => onPick(null, g.id)} />)}</Wrap>
            {state.habits.length === 0 && goals.length === 0 ? <Muted>Create a habit or goal to link it here.</Muted> : null}
          </ScrollView>
          <Button title="Close" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function HistoryPanel() {
  const { state, today, clearFocusHistory } = useStore();
  const sessions = state.focusSessions;
  const stats = focusStats(sessions, today, state.preferences.weekStart);

  const confirmClear = () =>
    Alert.alert('Clear focus history?', 'All saved focus sessions will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearFocusHistory },
    ]);

  return (
    <View style={{ gap: spacing.lg }}>
      <Row style={{ gap: spacing.md }}>
        <Stat label="Today" value={formatDuration(stats.todaySeconds)} />
        <Stat label="This week" value={formatDuration(stats.weekSeconds)} />
        <Stat label="All time" value={formatDuration(stats.totalSeconds)} />
      </Row>
      {sessions.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: spacing.sm }}>
          <Feather name="clock" size={28} color={colors.accent} />
          <Text variant="heading">No sessions yet</Text>
          <Muted style={{ textAlign: 'center' }}>Finish a focus session and it will appear here.</Muted>
        </Card>
      ) : (
        <>
          <Card style={{ gap: spacing.md }}>
            {sessions.slice(0, 50).map((s) => (
              <Row key={s.id} style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="label" numberOfLines={1}>{s.taskName || 'Focus session'}</Text>
                  <Muted variant="caption">{formatShortDate(toDateKey(new Date(s.endedAt)))} · {new Date(s.endedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Muted>
                </View>
                <Text variant="label" color={colors.accent}>{formatDuration(s.elapsedSeconds)}</Text>
              </Row>
            ))}
          </Card>
          <Muted variant="caption" style={{ textAlign: 'center' }}>{stats.sessionCount} session{stats.sessionCount === 1 ? '' : 's'} total</Muted>
          <Button title="Clear history" variant="danger" icon="trash-2" onPress={confirmClear} />
        </>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' }}>
      <Text variant="heading" accessibilityLabel={`${label}: ${value}`}>{value}</Text>
      <Text variant="caption" color={colors.textMuted}>{label}</Text>
    </Card>
  );
}
