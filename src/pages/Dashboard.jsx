import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TodayView from '@/components/dashboard/TodayView';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Redirect new coaches to onboarding — but NOT if they just completed the premium onboarding flow
  useEffect(() => {
    const justFinishedOnboarding = localStorage.getItem('koach_onboarding_complete') === '1';
    if (justFinishedOnboarding) return; // already done — stay on dashboard

    base44.auth.me().then(user => {
      if (user && !user.onboarding_complete) {
        navigate('/start');
      }
    }).catch(() => {});
  }, [navigate]);

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

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-dashboard'],
    queryFn: () => base44.entities.Payment.filter({ status: 'pending' }, '-created_date', 50).then(pending =>
      base44.entities.Payment.filter({ status: 'failed' }, '-created_date', 50).then(failed => [...pending, ...failed])
    ),
  });

  return <TodayView clients={clients} checkIns={checkIns} messages={messages} payments={payments} />;
}