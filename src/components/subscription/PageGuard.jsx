import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { hasFeature } from '@/lib/subscription';
import LockedPage from './LockedPage';
import { useUpgradeModal } from '@/components/layout/AppLayout';

/**
 * Wraps a page and shows a locked state if the user lacks the required feature.
 * Usage: <PageGuard feature="sales"><SalesPage /></PageGuard>
 */
export default function PageGuard({ feature, children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const { openUpgradeModal } = useUpgradeModal();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return null; // loading

  if (!hasFeature(user, feature)) {
    return <LockedPage featureKey={feature} onUpgrade={openUpgradeModal} />;
  }

  return children;
}