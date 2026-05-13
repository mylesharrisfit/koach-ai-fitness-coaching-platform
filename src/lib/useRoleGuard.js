/**
 * Role-based access control for KOACH AI.
 *
 * ROLES:
 *   admin / coach  → full coach platform access
 *   client         → restricted client portal only
 *   (no role)      → treated as coach (backwards compat)
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Routes that clients are NEVER allowed to see
export const COACH_ONLY_ROUTES = [
  '/clients', '/programs', '/nutrition', '/schedule', '/messages',
  '/progress', '/store', '/settings', '/assistant', '/adherence',
  '/checkin-review', '/sales', '/my-day', '/community', '/subscription',
  '/exercises', '/automations', '/analytics', '/revenue', '/business',
  '/program-builder', '/white-label', '/coaching-templates',
  '/onboarding-manager', '/migration', '/food-library',
  '/fast-review', '/at-risk', '/client-profile', '/checkin-detail',
  '/onboarding', '/start',
];

// Routes that are part of the client portal
export const CLIENT_PORTAL_ROUTES = [
  '/portal', '/portal/workouts', '/portal/nutrition',
  '/portal/checkin', '/portal/progress', '/portal/messages', '/portal/habits',
];

export function isCoachRole(user) {
  if (!user) return false;
  return !user.role || user.role === 'admin' || user.role === 'coach';
}

export function isClientRole(user) {
  if (!user) return false;
  return user.role === 'client';
}

/**
 * Hook: redirects users to the correct area based on role.
 * Call inside authenticated route components.
 */
export function useRoleGuard(user) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    if (isClientRole(user)) {
      // Clients must stay in /portal/*
      const isPortal = location.pathname.startsWith('/portal');
      const isPublic = ['/client-onboarding', '/start'].some(p => location.pathname.startsWith(p));
      if (!isPortal && !isPublic) {
        navigate('/portal', { replace: true });
      }
    } else if (isCoachRole(user)) {
      // Coaches who land on portal routes get redirected to dashboard
      if (location.pathname.startsWith('/portal')) {
        navigate('/', { replace: true });
      }
    }
  }, [user, location.pathname]);
}