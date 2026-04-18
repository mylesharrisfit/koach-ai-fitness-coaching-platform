import React from 'react';
import { hasFeature } from '@/lib/subscription';
import LockedPage from './LockedPage';
import { useUpgradeModal } from '@/components/layout/AppLayout';

/**
 * Wraps a page and shows a locked state if the user lacks the required feature.
 * Uses context user so tier changes reflect instantly without reload.
 */
export default function PageGuard({ feature, children }) {
  const { user, openUpgradeModal } = useUpgradeModal();

  if (user === null) return null; // loading

  if (!hasFeature(user, feature)) {
    return <LockedPage featureKey={feature} onUpgrade={openUpgradeModal} />;
  }

  return children;
}