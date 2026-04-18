import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { base44 } from '@/api/base44Client';
import UpgradeModal from '@/components/subscription/UpgradeModal';

export const SubscriptionContext = createContext({
  user: null,
  openUpgradeModal: () => {},
});

export function useUpgradeModal() {
  return useContext(SubscriptionContext);
}

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [upgradeFeature, setUpgradeFeature] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <SubscriptionContext.Provider value={{ user, openUpgradeModal: setUpgradeFeature }}>
      <div className="min-h-screen bg-background dark bg-noise">
        <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" aria-hidden="true" />
        <Sidebar user={user} onUpgrade={setUpgradeFeature} />
        <main className="ml-[240px] min-h-screen transition-all duration-300 relative z-10">
          <Outlet />
        </main>
      </div>
      <UpgradeModal
        open={!!upgradeFeature}
        onClose={() => setUpgradeFeature(null)}
        featureKey={upgradeFeature}
        user={user}
      />
    </SubscriptionContext.Provider>
  );
}