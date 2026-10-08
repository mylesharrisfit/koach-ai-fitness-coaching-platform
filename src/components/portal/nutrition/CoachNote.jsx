import React from 'react';
import { Initials } from '@/components/kit';
import { usePortalCoach } from '@/lib/usePortalCoach';

export default function CoachNote({ note, coachName }) {
  const coach = usePortalCoach();
  if (!note) return null;
  const name = coachName || coach.name;
  return (
    <section className="panel flex items-start gap-3 p-4">
      <Initials name={name === 'Your coach' ? 'Coach' : name} src={coach.avatarUrl} tone="ink" size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-foreground">{name}</p>
        <p className="text-[13px] text-muted-foreground">Note on your meal plan</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{note}</p>
      </div>
    </section>
  );
}
