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

  // When user upgrades inside modal, update context immediately (no reload)
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <SubscriptionContext.Provider value={{ user, setUser, openUpgradeModal: setUpgradeFeature }}>
      <div className="min-h-screen bg-[#F6F7FB]">
        <Sidebar user={user} onUpgrade={setUpgradeFeature} />
        <main className="md:ml-[240px] min-h-screen transition-all duration-300 relative z-10 pb-16 md:pb-0 bg-[#F6F7FB]">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <UpgradeModal
        open={!!upgradeFeature}
        onClose={() => setUpgradeFeature(null)}
        featureKey={upgradeFeature}
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    </SubscriptionContext.Provider>
  );
}