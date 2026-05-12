import React from 'react';
import ClientRevealDashboard from './ClientRevealDashboard';
import CoachRevealDashboard from './CoachRevealDashboard';

export default function OnboardingDashboard({ data, role }) {
  if (role === 'coach') return <CoachRevealDashboard data={data} />;
  return <ClientRevealDashboard data={data} />;
}