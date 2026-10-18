import React from 'react';
import { View } from 'react-native';
import { describeDaysLeft, type GoalProgress } from '@/domain/goals';
import type { Goal } from '@/domain/types';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { spacing } from '@/theme';
import { Card, Muted, ProgressBar, Row, Text } from './ui';

export function GoalCard({ goal, progress, onPress }: { goal: Goal; progress: GoalProgress; onPress: () => void }) {
  const { colors } = useTheme();
  const { t, tm, unit } = useI18n();
  const leftMsg = describeDaysLeft(progress.daysLeft);
  const u = unit(goal.unit);
  return (
    <Card
      onPress={onPress}
      label={t('goal.cardA11y', { title: goal.title, current: progress.current, target: progress.target, unit: u })}
      style={{ gap: spacing.sm }}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text variant="heading" style={{ flex: 1 }} numberOfLines={2}>{goal.title}</Text>
        <Text variant="label" color={colors.accent}>{Math.round(progress.ratio * 100)}%</Text>
      </Row>
      <ProgressBar ratio={progress.ratio} color={goal.completedAt ? colors.selected : colors.primary} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption">{t('goal.progressText', { current: progress.current, target: progress.target, unit: u })}</Text>
        {leftMsg && !goal.completedAt ? (
          <Text variant="caption" color={progress.overdue ? colors.danger : colors.textMuted}>{tm(leftMsg)}</Text>
        ) : null}
      </Row>
      <View><Muted variant="caption">{tm(progress.nextStep)}</Muted></View>
    </Card>
  );
}
