import React, { useState } from 'react';
import { Alert, Modal, Pressable, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/data/store';
import { focusStats } from '@/domain/focus';
import { longestStreak } from '@/domain/habits';
import { LANGUAGE_NAMES, LANGUAGES } from '@/i18n';
import type { ThemeMode } from '@/theme/palette';
import { Avatar, Banner, Button, Card, Chip, Field, Muted, Row, Screen, Segmented, Text, Toggle, Wrap } from '@/components/ui';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { AVATAR_COLORS, radius, spacing } from '@/theme';

const REMINDER_TIMES: [number, number][] = [[7, 0], [9, 0], [12, 0], [18, 0], [20, 0], [21, 30]];
const THEME_OPTIONS: { value: ThemeMode; label: 'you.themeLight' | 'you.themeDark' | 'you.themeSystem'; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'light', label: 'you.themeLight', icon: 'sun' },
  { value: 'dark', label: 'you.themeDark', icon: 'moon' },
  { value: 'system', label: 'you.themeSystem', icon: 'smartphone' },
];

export default function YouScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const i18n = useI18n();
  const { t, lang, setLanguage, duration } = i18n;
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
      await Share.share({ title: t('you.exportTitle'), message: exportData() });
    } catch {
      setNotice({ tone: 'error', text: t('you.shareError') });
    }
  };

  const confirmDelete = () =>
    Alert.alert(t('you.deleteTitle'), t('you.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('you.deleteConfirm'), style: 'destructive', onPress: () => void resetAll().then(() => router.replace('/onboarding')) },
    ]);

  const toggleReminder = async (on: boolean) => {
    const ok = await setDailyReminder(on, preferences.dailyReminderHour, preferences.dailyReminderMinute);
    if (on && !ok) setNotice({ tone: 'error', text: t('you.notifDenied') });
    else setNotice(null);
  };

  return (
    <Screen tabs>
      <Text variant="display" accessibilityRole="header">{t('you.title')}</Text>
      {notice ? <Banner tone={notice.tone} message={notice.text} /> : null}

      <Card>
        <Row style={{ gap: spacing.lg }}>
          <Avatar name={profile.name} color={profile.avatarColor} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title" numberOfLines={1}>{profile.name || t('you.yourName')}</Text>
            {profile.mainGoal ? <Muted variant="caption" numberOfLines={2}>{t('you.focusLabel', { goal: profile.mainGoal })}</Muted> : <Muted variant="caption">{t('you.addName')}</Muted>}
          </View>
          <Button title={t('common.edit')} variant="secondary" style={{ minHeight: 44, paddingHorizontal: spacing.lg }} onPress={() => { setName(profile.name); setEditing(true); }} />
        </Row>
      </Card>

      <Row style={{ gap: spacing.md }}>
        <Tile label={t('you.statHabits')} value={String(completions.length)} />
        <Tile label={t('you.statStreak')} value={t('common.daysShort', { count: best })} />
        <Tile label={t('you.statGoals')} value={String(goalsDone)} />
      </Row>
      <Card onPress={() => router.push('/focus')} label={t('you.openFocusA11y')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text variant="label">{t('you.totalFocus')}</Text>
            <Muted variant="caption">{t('you.sessions', { count: stats.sessionCount })}</Muted>
          </View>
          <Text variant="title">{duration(stats.totalSeconds)}</Text>
        </Row>
      </Card>

      <Section title={t('you.language')}>
        <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
          {LANGUAGES.map((l) => {
            const selected = lang === l;
            return (
              <Pressable
                key={l}
                onPress={() => setLanguage(l)}
                accessibilityRole="radio"
                accessibilityState={{ selected, checked: selected }}
                accessibilityLabel={LANGUAGE_NAMES[l].native}
                style={{
                  minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.lg, flexDirection: i18n.row, alignItems: 'center', gap: spacing.md,
                  borderWidth: selected ? 2 : 1, borderColor: selected ? colors.selected : colors.border, backgroundColor: selected ? colors.surfaceRaised : 'transparent',
                }}
              >
                {/* each language is always shown in its own script/direction */}
                <Text variant="heading" style={{ flex: 1, textAlign: i18n.textAlign, writingDirection: l === 'ar' ? 'rtl' : 'ltr' }}>
                  {LANGUAGE_NAMES[l].native}
                </Text>
                {selected ? <Feather name="check" size={20} color={colors.selected} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title={t('you.appearance')}>
        <Text variant="label">{t('you.theme')}</Text>
        <Segmented
          value={mode}
          onChange={setMode}
          options={THEME_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }))}
        />
        <Text variant="label">{t('you.avatarColor')}</Text>
        <Wrap>
          {AVATAR_COLORS.map((c) => (
            <Pressable key={c} onPress={() => updateProfile({ avatarColor: c })} accessibilityRole="button" accessibilityLabel={t('you.avatarColorA11y', { color: c })}
              accessibilityState={{ selected: profile.avatarColor === c }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, borderWidth: profile.avatarColor === c ? 3 : 1, borderColor: profile.avatarColor === c ? colors.selected : colors.border }} />
          ))}
        </Wrap>
        <Toggle label={t('you.haptics')} description={t('you.hapticsDesc')} value={preferences.hapticsEnabled}
          onChange={(v) => updatePreferences({ hapticsEnabled: v })} />
      </Section>

      <Section title={t('you.notifications')}>
        <Toggle
          label={t('you.dailyReminder')}
          description={preferences.dailyReminderEnabled ? t('you.dailyReminderAt', { time: i18n.time(preferences.dailyReminderHour, preferences.dailyReminderMinute) }) : t('you.dailyReminderDesc')}
          value={preferences.dailyReminderEnabled}
          onChange={(v) => void toggleReminder(v)}
        />
        {preferences.dailyReminderEnabled ? (
          <Wrap>
            {REMINDER_TIMES.map(([h, m]) => (
              <Chip key={`${h}${m}`} label={i18n.time(h, m)} selected={preferences.dailyReminderHour === h && preferences.dailyReminderMinute === m}
                onPress={() => void setDailyReminder(true, h, m)} />
            ))}
          </Wrap>
        ) : null}
        <Toggle label={t('you.focusAlerts')} description={t('you.focusAlertsDesc')} value={preferences.focusAlertsEnabled}
          onChange={(v) => updatePreferences({ focusAlertsEnabled: v })} />
      </Section>

      <Section title={t('you.preferences')}>
        <Text variant="label">{t('you.weekStart')}</Text>
        <Segmented value={preferences.weekStart} onChange={(v) => updatePreferences({ weekStart: v })}
          options={[{ value: 'monday', label: t('you.monday') }, { value: 'sunday', label: t('you.sunday') }]} />
      </Section>

      <Section title={t('you.dataPrivacy')}>
        <Muted>{t('you.privacyText')}</Muted>
        <Button title={t('you.export')} icon="share" variant="secondary" onPress={() => void doExport()} />
      </Section>

      <Section title={t('you.account')}>
        <Muted>{t('you.accountText')}</Muted>
        <Button title={t('you.replay')} icon="compass" variant="secondary" onPress={() => { updatePreferences({ onboardingCompleted: false }); router.replace('/onboarding'); }} />
        <Button title={t('you.deleteAll')} icon="trash-2" variant="danger" onPress={confirmDelete} />
      </Section>

      <Muted variant="caption" style={{ textAlign: 'center' }}>{t('you.version', { version: '1.0.0', tagline: t('app.tagline') })}</Muted>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg, borderWidth: 1, borderColor: colors.border }}>
            <Text variant="heading" accessibilityRole="header">{t('you.editProfile')}</Text>
            <Field label={t('you.name')} value={name} onChangeText={setName} maxLength={40} placeholder={t('you.namePlaceholder')} autoFocus />
            <Row>
              <Button title={t('common.cancel')} variant="secondary" style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button title={t('common.save')} style={{ flex: 1 }} onPress={() => { updateProfile({ name: name.trim() }); setEditing(false); }} />
            </Row>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" color={colors.textMuted} style={{ letterSpacing: lang === 'ar' ? 0 : 1, fontWeight: '600' }} accessibilityRole="header">
        {lang === 'ar' ? title : title.toUpperCase()}
      </Text>
      <Card>{children}</Card>
    </View>
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
