/* Dark-mode audit harness: renders one real page component (chosen via
 * ?page=) inside the real providers with mocked auth + data, forced dark.
 *
 * v2 (incident follow-up): the page list now covers every page hosting a
 * --kc-* token without a .dark override (Sales, Settings, Subscription,
 * ExerciseLibrary, OnboardingManager, Business, …), and the driver crawls
 * tabs/modals/drill-downs after load — see run-audit.mjs. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import ClientProfile from '@/pages/ClientProfile';
import ProgramBuilder from '@/pages/ProgramBuilder';
import Nutrition from '@/pages/Nutrition';
import Invoicing from '@/pages/Invoicing';
import ClientOnboarding from '@/pages/ClientOnboarding';
import Adherence from '@/pages/Adherence';
import Community from '@/pages/Community.jsx';
import Programs from '@/pages/Programs';
import ExerciseLibrary from '@/pages/ExerciseLibrary';
import Sales from '@/pages/Sales';
import Settings from '@/pages/Settings';
import AccountSettings from '@/pages/AccountSettings';
import AtRiskClients from '@/pages/AtRiskClients';
import Assistant from '@/pages/Assistant';
import Subscription from '@/pages/Subscription';
import OnboardingManager from '@/pages/OnboardingManager';
import EmailCenter from '@/pages/EmailCenter';
import MarketingTools from '@/pages/MarketingTools';
import Business from '@/pages/Business';
import PaymentTracking from '@/pages/PaymentTracking';
import ClientDashboard from '@/pages/ClientDashboard';
import Schedule from '@/pages/Schedule';
import WhiteLabel from '@/pages/WhiteLabel';

const PAGES = {
  Dashboard: { el: <Dashboard />, entry: '/?dark=1' },
  Clients: { el: <Clients />, entry: '/clients' },
  ClientProfile: { el: <ClientProfile />, entry: '/client-profile?id=client-1' },
  ProgramBuilder: { el: <ProgramBuilder />, entry: '/program-builder?id=prog-1' },
  Nutrition: { el: <Nutrition />, entry: '/nutrition' },
  Invoicing: { el: <Invoicing />, entry: '/invoicing' },
  ClientOnboarding: { el: <ClientOnboarding />, entry: '/client-onboarding' },
  Adherence: { el: <Adherence />, entry: '/adherence' },
  Community: { el: <Community />, entry: '/community' },
  Programs: { el: <Programs />, entry: '/programs' },
  ExerciseLibrary: { el: <ExerciseLibrary />, entry: '/exercise-library' },
  Sales: { el: <Sales />, entry: '/sales' },
  Settings: { el: <Settings />, entry: '/settings' },
  AccountSettings: { el: <AccountSettings />, entry: '/account-settings' },
  AtRiskClients: { el: <AtRiskClients />, entry: '/at-risk-clients' },
  Assistant: { el: <Assistant />, entry: '/assistant' },
  Subscription: { el: <Subscription />, entry: '/subscription' },
  OnboardingManager: { el: <OnboardingManager />, entry: '/onboarding-manager' },
  EmailCenter: { el: <EmailCenter />, entry: '/email-center' },
  MarketingTools: { el: <MarketingTools />, entry: '/marketing-tools' },
  Business: { el: <Business />, entry: '/business' },
  PaymentTracking: { el: <PaymentTracking />, entry: '/payment-tracking' },
  ClientDashboard: { el: <ClientDashboard />, entry: '/client-dashboard?id=client-1' },
  Schedule: { el: <Schedule />, entry: '/schedule' },
  WhiteLabel: { el: <WhiteLabel />, entry: '/white-label' },
};

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return <pre id="audit-render-error" style={{ color: '#f88', padding: 20 }}>
        RENDER ERROR: {String(this.state.err?.message || this.state.err)}
      </pre>;
    }
    return this.props.children;
  }
}

const params = new URLSearchParams(window.location.search);
const pageName = params.get('page') || 'Dashboard';
const page = PAGES[pageName];

// Force dark before paint.
document.documentElement.classList.add('dark');

const qc = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, gcTime: Infinity } } });

const root = createRoot(document.getElementById('root'));
if (!page) {
  root.render(<pre id="audit-render-error">UNKNOWN PAGE: {pageName}</pre>);
} else {
  root.render(
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[page.entry]}>
          <Routes>
            <Route path="*" element={page.el} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
  // Signal readiness for the driver after data settles.
  setTimeout(() => { window.__auditReady = true; }, 1000);
}
