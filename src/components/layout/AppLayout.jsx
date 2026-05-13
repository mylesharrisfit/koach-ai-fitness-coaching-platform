import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { base44 } from '@/api/base44Client';
import UpgradeModal from '@/components/subscription/UpgradeModal';

export const SubscriptionContext = createContext({
  user: null,
  setUser: () => {},
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
    <SubscriptionContext.Provider value={{ user, setUser, openUpgradeModal: setUpgradeFeature }}>
      <div className="min-h-screen" style={{ background: '#111111' }}>
        <Sidebar user={user} onUpgrade={setUpgradeFeature} />
        <main
          className="md:ml-[210px] min-h-screen pb-16 md:pb-0 transition-all duration-200"
          style={{ background: '#111111', minHeight: '100vh' }}
        >
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <UpgradeModal
        open={!!upgradeFeature}
        onClose={() => setUpgradeFeature(null)}
        featureKey={upgradeFeature}
        user={user}
        onUserUpdate={setUser}
      />
    </SubscriptionContext.Provider>
  );
}