import React, { useState } from 'react';
import { Alert, Modal, Pressable, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { formatDuration, formatTime } from '@/domain/dates';
import { focusStats } from '@/domain/focus';
import { longestStreak } from '@/domain/habits';
import { Avatar, Banner, Button, Card, Chip, Field, Muted, Row, Screen, Segmented, Text, Toggle, Wrap } from '@/components/ui';
import { AVATAR_COLORS, colors, radius, spacing } from '@/theme';

const REMINDER_TIMES: [number, number][] = [[7, 0], [9, 0], [12, 0], [18, 0], [20, 0], [21, 30]];

export default function YouScreen() {
  const router = useRouter();
  const store = useStore();
  const { state, today, index, updateProfile, updatePreferences, setDailyReminder, exportData, resetAll } = store;
  const { profile, preferences, habits, completions, goals, focusSessions } = state;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  const stats = focusStats(focusSessions, today, preferences.weekStart);
  const best = habits.reduce((m, h) => Math.max(m, longestStreak(h, index, today)), 0);
  const goalsDone = goals.filter((g) => g.completedAt).length;

  const doExport = async () => {
    try {
      await Share.share({ title: 'Glitch Life data', message: exportData() });
    } catch {
      setNotice({ tone: 'error', text: 'Could not open the share sheet.' });
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete all data?', 'Habits, goals, history and focus sessions on this device will be permanently erased.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => void resetAll().then(() => router.replace('/onboarding')) },
    ]);

  const toggleReminder = async (on: boolean) => {
    const ok = await setDailyReminder(on, preferences.dailyReminderHour, preferences.dailyReminderMinute);
    if (on && !ok) setNotice({ tone: 'error', text: 'Notifications are turned off for Glitch Life. Enable them in system settings to get reminders.' });
    else setNotice(null);
  };

  return (
    <Screen tabs>
      <Text variant="display" accessibilityRole="header">You</Text>
      {notice ? <Banner tone={notice.tone} message={notice.text} /> : null}

      <Card>
        <Row style={{ gap: spacing.lg }}>
          <Avatar name={profile.name} color={profile.avatarColor} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title" numberOfLines={1}>{profile.name || 'Your name'}</Text>
            {profile.mainGoal ? <Muted variant="caption" numberOfLines={2}>Focus: {profile.mainGoal}</Muted> : <Muted variant="caption">Add your name to personalize Glitch Life.</Muted>}
          </View>
          <Button title="Edit" variant="secondary" style={{ minHeight: 44, paddingHorizontal: spacing.lg }} onPress={() => { setName(profile.name); setEditing(true); }} />
        </Row>
      </Card>

      <Row style={{ gap: spacing.md }}>
        <Tile label="Habits completed" value={String(completions.length)} />
        <Tile label="Longest streak" value={`${best}d`} />
        <Tile label="Goals achieved" value={String(goalsDone)} />
      </Row>
      <Card onPress={() => router.push('/focus')} label="Open focus history">
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Text variant="label">Total focused time</Text>
            <Muted variant="caption">{stats.sessionCount} session{stats.sessionCount === 1 ? '' : 's'}</Muted>
          </View>
          <Text variant="title">{formatDuration(stats.totalSeconds)}</Text>
        </Row>
      </Card>

      <Section title="Notifications">
        <Toggle label="Daily reminder" description={preferences.dailyReminderEnabled ? `Every day at ${formatTime(preferences.dailyReminderHour, preferences.dailyReminderMinute)}` : 'A gentle nudge to check in on your habits'}
          value={preferences.dailyReminderEnabled} onChange={(v) => void toggleReminder(v)} />
        {preferences.dailyReminderEnabled ? (
          <Wrap>
            {REMINDER_TIMES.map(([h, m]) => (
              <Chip key={`${h}${m}`} label={formatTime(h, m)} selected={preferences.dailyReminderHour === h && preferences.dailyReminderMinute === m}
                onPress={() => void setDailyReminder(true, h, m)} />
            ))}
          </Wrap>
        ) : null}
        <Toggle label="Focus timer alerts" description="Notify me when a focus session ends" value={preferences.focusAlertsEnabled}
          onChange={(v) => updatePreferences({ focusAlertsEnabled: v })} />
      </Section>

      <Section title="Appearance">
        <Text variant="label">Avatar color</Text>
        <Wrap>
          {AVATAR_COLORS.map((c) => (
            <Pressable key={c} onPress={() => updateProfile({ avatarColor: c })} accessibilityRole="button" accessibilityLabel={`Avatar color ${c}`}
              accessibilityState={{ selected: profile.avatarColor === c }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, borderWidth: profile.avatarColor === c ? 3 : 0, borderColor: colors.highlight }} />
          ))}
        </Wrap>
        <Toggle label="Haptic feedback" description="Light vibration when you complete a habit" value={preferences.hapticsEnabled}
          onChange={(v) => updatePreferences({ hapticsEnabled: v })} />
      </Section>

      <Section title="Preferences">
        <Text variant="label">Week starts on</Text>
        <Segmented value={preferences.weekStart} onChange={(v) => updatePreferences({ weekStart: v })}
          options={[{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }]} />
      </Section>

      <Section title="Data & privacy">
        <Muted>Everything you enter is stored only on this device. No account is needed and nothing is uploaded.</Muted>
        <Button title="Export my data" icon="share" variant="secondary" onPress={() => void doExport()} />
      </Section>

      <Section title="Account">
        <Muted>You’re using a local profile. Cloud sync and sign-in aren’t enabled in this version.</Muted>
        <Button title="Replay onboarding" icon="compass" variant="secondary" onPress={() => { updatePreferences({ onboardingCompleted: false }); router.replace('/onboarding'); }} />
        <Button title="Delete all data" icon="trash-2" variant="danger" onPress={confirmDelete} />
      </Section>

      <Muted variant="caption" style={{ textAlign: 'center' }}>Glitch Life 1.0.0 · Build habits. Track progress. Become better.</Muted>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg }}>
            <Text variant="heading" accessibilityRole="header">Edit profile</Text>
            <Field label="Name" value={name} onChangeText={setName} maxLength={40} placeholder="Your name" autoFocus />
            <Row>
              <Button title="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button title="Save" style={{ flex: 1 }} onPress={() => { updateProfile({ name: name.trim() }); setEditing(false); }} />
            </Row>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" color={colors.accent} style={{ letterSpacing: 1 }} accessibilityRole="header">{title.toUpperCase()}</Text>
      <Card>{children}</Card>
    </View>
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
