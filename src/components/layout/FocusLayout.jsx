import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { X, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { SubscriptionContext } from './AppLayout';

export default function FocusLayout() {
  const [user, setUser] = useState(null);
  const [upgradeFeature, setUpgradeFeature] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <SubscriptionContext.Provider value={{ user, setUser, openUpgradeModal: setUpgradeFeature }}>
      <div className="min-h-screen bg-background dark bg-noise">
        <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" aria-hidden="true" />

        {/* Minimal top bar */}
        <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-background/90 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <span className="text-[10px]">▶</span>
            </div>
            <span className="text-sm font-bold font-heading text-foreground">Run My Day</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/60 active:scale-95"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </Link>
        </header>

        {/* Page content pushed below header */}
        <main className="pt-12 min-h-screen relative z-10">
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