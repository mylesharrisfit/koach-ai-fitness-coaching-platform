import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TodayView from '@/components/dashboard/TodayView';

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Real-time subscriptions — invalidate on any change
  useEffect(() => {
    const unsubCI = base44.entities.CheckIn.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['checkins-review'] });
    });
    const unsubMsg = base44.entities.Message.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['messages-unread'] });
    });
    const unsubClient = base44.entities.Client.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    });
    return () => { unsubCI(); unsubMsg(); unsubClient(); };
  }, [queryClient]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 100),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => base44.entities.Message.filter({ is_read: false }, '-created_date', 30),
  });

  return <TodayView clients={clients} checkIns={checkIns} messages={messages} />;
}