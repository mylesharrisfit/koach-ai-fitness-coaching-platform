import { useState, useCallback } from 'react';
import { hasFeature, withinLimit, getUserTier } from '@/lib/subscription';

/**
 * Hook to manage subscription gating and the upgrade modal.
 * Usage:
 *   const { canAccess, checkLimit, UpgradeGate } = useSubscription(user);
 *   if (!canAccess('sales')) return <UpgradeGate feature="sales" />;
 */
export function useSubscription(user) {
  const [modalFeature, setModalFeature] = useState(null);

  const canAccess = useCallback((featureKey) => {
    return hasFeature(user, featureKey);
  }, [user]);

  const checkLimit = useCallback((limitKey, currentCount) => {
    return withinLimit(user, limitKey, currentCount);
  }, [user]);

  const requireFeature = useCallback((featureKey) => {
    if (!hasFeature(user, featureKey)) {
      setModalFeature(featureKey);
      return false;
    }
    return true;
  }, [user]);

  const requireLimit = useCallback((limitKey, currentCount, featureKey = 'clients') => {
    if (!withinLimit(user, limitKey, currentCount)) {
      setModalFeature(featureKey);
      return false;
    }
    return true;
  }, [user]);

  const closeModal = useCallback(() => setModalFeature(null), []);

  const tier = getUserTier(user);

  return {
    tier,
    canAccess,
    checkLimit,
    requireFeature,
    requireLimit,
    modalFeature,
    closeModal,
    openUpgradeModal: setModalFeature,
  };
}