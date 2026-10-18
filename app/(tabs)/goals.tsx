import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { goalProgress } from '@/domain/goals';
import { GoalCard } from '@/components/goal';
import { EmptyState, IconButton, Row, Screen, Segmented, Text } from '@/components/ui';
import { useI18n } from '@/settings/SettingsProvider';

export default function GoalsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { state, today } = useStore();
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const { goals, milestones, completions } = state;
  const active = goals.filter((g) => !g.completedAt);
  const done = goals.filter((g) => g.completedAt).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const list = tab === 'active' ? active : done;

  return (
    <Screen tabs>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="display" accessibilityRole="header">{t('goals.title')}</Text>
        <IconButton icon="plus" label={t('goals.add')} filled onPress={() => router.push('/goal/form')} />
      </Row>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: t('goals.tabActive', { count: active.length }) },
          { value: 'done', label: t('goals.tabDone', { count: done.length }) },
        ]}
      />

      {list.length === 0 ? (
        tab === 'active' ? (
          <EmptyState icon="target" title={t('goals.emptyTitle')} message={t('goals.emptyMsg')} actionLabel={t('goals.emptyCta')} onAction={() => router.push('/goal/form')} />
        ) : (
          <EmptyState icon="award" title={t('goals.doneEmptyTitle')} message={t('goals.doneEmptyMsg')} />
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
