import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { Switch } from '@/components/ui/switch';
import { Panel, PanelHeader } from '@/components/kit';

const FEATURES = [
  { key: 'feed_enabled', label: 'Feed', description: 'Posts, wins and comments' },
  { key: 'leaderboard_enabled', label: 'Leaderboard', description: 'Steps, workouts and streaks' },
  { key: 'challenges_enabled', label: 'Weekly challenges', description: 'Group challenges with a target' },
];

export default function CommunityToggle({ settings, settingsId }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => settingsId
      ? db.entities.CommunitySettings.update(settingsId, data)
      : db.entities.CommunitySettings.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-settings'] }),
  });

  const toggle = (key) => {
    updateMutation.mutate({ ...settings, [key]: !settings[key] });
  };

  return (
    <Panel>
      <PanelHeader title="Community features" subtitle="Coach controls" />
      <ul className="divide-y divide-border px-5 sm:px-6 pb-2">
        {FEATURES.map(f => {
          const enabled = settings[f.key] !== false;
          return (
            <li key={f.key} className="flex items-center gap-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">{f.label}</p>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
              <Switch checked={enabled} onCheckedChange={() => toggle(f.key)} aria-label={f.label} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
