import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { goalProgress } from '@/domain/goals';
import { GoalCard } from '@/components/goal';
import { EmptyState, IconButton, Row, Screen, Segmented, Text } from '@/components/ui';

export default function GoalsScreen() {
  const router = useRouter();
  const { state, today } = useStore();
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const { goals, milestones, completions } = state;
  const active = goals.filter((g) => !g.completedAt);
  const done = goals.filter((g) => g.completedAt).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const list = tab === 'active' ? active : done;

  return (
    <Screen tabs>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="display" accessibilityRole="header">Goals</Text>
        <IconButton icon="plus" label="Add goal" filled onPress={() => router.push('/goal/form')} />
      </Row>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: `Active (${active.length})` },
          { value: 'done', label: `Completed (${done.length})` },
        ]}
      />

      {list.length === 0 ? (
        tab === 'active' ? (
          <EmptyState
            icon="target"
            title="No active goals"
            message="Set something measurable, like “Complete 30 study sessions”, and track it step by step."
            actionLabel="Create a goal"
            onAction={() => router.push('/goal/form')}
          />
        ) : (
          <EmptyState icon="award" title="Nothing completed yet" message="Goals you finish will be collected here." />
        )
      ) : (
        list.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            progress={goalProgress(g, milestones, completions, today)}
            onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })}
          />
        ))
      )}
    </Screen>
  );
}
