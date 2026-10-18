import React from 'react';
import { View } from 'react-native';
import { addDays, formatLongDate } from '@/domain/dates';
import type { DateKey } from '@/domain/types';
import { colors, spacing } from '@/theme';
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
  const base = value ?? today;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" color={colors.accent}>{label}</Text>
      <Card style={{ gap: spacing.sm, padding: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="chevron-left" label={`${label}: previous day`} onPress={() => onChange(addDays(base, -1))} />
          <View style={{ flex: 1, alignItems: 'center' }} accessibilityLiveRegion="polite">
            {value ? <Text variant="label" style={{ textAlign: 'center' }}>{formatLongDate(value)}</Text> : <Muted>No date</Muted>}
          </View>
          <IconButton icon="chevron-right" label={`${label}: next day`} onPress={() => onChange(addDays(base, 1))} />
        </View>
        <Wrap>
          <Chip label="Today" onPress={() => onChange(today)} selected={value === today} />
          {quick.map((q) => (
            <Chip key={q.label} label={q.label} onPress={() => onChange(addDays(today, q.days))} selected={value === addDays(today, q.days)} />
          ))}
          {allowEmpty ? <Chip label="No date" onPress={() => onChange(null)} selected={value === null} /> : null}
        </Wrap>
      </Card>
    </View>
  );
}
