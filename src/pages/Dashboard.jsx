import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TodayView from '@/components/dashboard/TodayView';

export default function Dashboard() {
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