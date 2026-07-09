/* Dark-mode audit harness: renders one real page component (chosen via
 * ?page=) inside the real providers with mocked auth + data, forced dark. */
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
