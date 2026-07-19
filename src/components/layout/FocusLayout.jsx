import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { SubscriptionContext } from './AppLayout';

export default function FocusLayout() {
  const { user, setUser } = useAuth();
  const [upgradeFeature, setUpgradeFeature] = useState(null);

  return (
    <SubscriptionContext.Provider value={{ user, setUser, openUpgradeModal: setUpgradeFeature }}>
      <div className="min-h-screen bg-muted">
        {/* Minimal top bar */}
        <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-[10px] text-white">▶</span>
            </div>
            <span className="text-sm font-bold font-heading text-foreground">Run My Day</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </Link>
        </header>

        {/* Page content pushed below header */}
        <main className="pt-12 min-h-screen">
          <Outlet />
        </main>
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