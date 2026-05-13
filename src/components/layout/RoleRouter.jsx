/**
 * RoleRouter — renders coach app or client portal based on user.role.
 * Placed at the top of the authenticated route tree.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isClientRole, isCoachRole } from '@/lib/useRoleGuard';

export default function RoleRouter({ user, coachElement, clientElement }) {
  const location = useLocation();

  if (!user) return null;

  // Client trying to access a coach route → redirect to portal
  if (isClientRole(user)) {
    const isPortal = location.pathname.startsWith('/portal');
    const isShared = ['/submit-checkin', '/client-onboarding', '/start'].some(p => location.pathname.startsWith(p));
    if (!isPortal && !isShared) {
      return <Navigate to="/portal" replace />;
    }
    return clientElement;
  }

  // Coach trying to access client portal → redirect to dashboard
  if (isCoachRole(user)) {
    if (location.pathname.startsWith('/portal')) {
      return <Navigate to="/" replace />;
    }
    return coachElement;
  }

  return coachElement;
}