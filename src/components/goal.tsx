import React from 'react';
import { View } from 'react-native';
import { describeDaysLeft, type GoalProgress } from '@/domain/goals';
import type { Goal } from '@/domain/types';
import { colors, spacing } from '@/theme';
import { Card, Muted, ProgressBar, Row, Text } from './ui';

export function GoalCard({ goal, progress, onPress }: { goal: Goal; progress: GoalProgress; onPress: () => void }) {
  const left = describeDaysLeft(progress.daysLeft);
  return (
    <Card
      onPress={onPress}
      label={`${goal.title}, ${progress.current} of ${progress.target} ${goal.unit}`}
      style={{ gap: spacing.sm }}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text variant="heading" style={{ flex: 1 }} numberOfLines={2}>{goal.title}</Text>
        <Text variant="label" color={colors.accent}>{Math.round(progress.ratio * 100)}%</Text>
      </Row>
      <ProgressBar ratio={progress.ratio} color={goal.completedAt ? colors.highlight : colors.primary} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption">{progress.current}/{progress.target} {goal.unit}</Text>
        {left && !goal.completedAt ? (
          <Text variant="caption" color={progress.overdue ? colors.danger : colors.textMuted}>{left}</Text>
        ) : null}
      </Row>
      <View><Muted variant="caption">{progress.nextStep}</Muted></View>
    </Card>
  );
}
