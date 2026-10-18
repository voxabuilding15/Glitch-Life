import React from 'react';
import { View } from 'react-native';
import { addDays } from '@/domain/dates';
import type { DateKey } from '@/domain/types';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { spacing } from '@/theme';
import { Card, Chip, IconButton, Muted, Text, Wrap } from './ui';

/** Date input built from simple, tappable controls (no native picker dependency). */
export function DateField({ label, value, today, onChange, allowEmpty = false, quick = [] }: {
  label: string;
  value: DateKey | null;
  today: DateKey;
  onChange: (v: DateKey | null) => void;
  allowEmpty?: boolean;
  quick?: { label: string; days: number }[];
}) {
  const { colors } = useTheme();
  const { t, row, icon, longDate } = useI18n();
  const base = value ?? today;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" color={colors.textMuted}>{label}</Text>
      <Card style={{ gap: spacing.sm, padding: spacing.md }}>
        {/* "previous" always sits at the reading-start side; icons are mirrored for RTL */}
        <View style={{ flexDirection: row, alignItems: 'center' }}>
          <IconButton icon={icon('chevron-left')} label={`${label} −1`} onPress={() => onChange(addDays(base, -1))} />
          <View style={{ flex: 1, alignItems: 'center' }} accessibilityLiveRegion="polite">
            {value ? <Text variant="label" style={{ textAlign: 'center' }}>{longDate(value)}</Text> : <Muted>{t('common.noDate')}</Muted>}
          </View>
          <IconButton icon={icon('chevron-right')} label={`${label} +1`} onPress={() => onChange(addDays(base, 1))} />
        </View>
        <Wrap>
          <Chip label={t('common.today')} onPress={() => onChange(today)} selected={value === today} />
          {quick.map((q) => (
            <Chip key={q.label} label={q.label} onPress={() => onChange(addDays(today, q.days))} selected={value === addDays(today, q.days)} />
          ))}
          {allowEmpty ? <Chip label={t('common.noDate')} onPress={() => onChange(null)} selected={value === null} /> : null}
        </Wrap>
      </Card>
    </View>
  );
}
