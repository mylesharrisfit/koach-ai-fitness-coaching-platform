import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Programs from './pages/Programs';
import Nutrition from './pages/Nutrition';
import Schedule from './pages/Schedule';
import Messages from './pages/Messages';
import Progress from './pages/Progress';
import Store from './pages/Store';
import Settings from './pages/Settings';
import Assistant from './pages/Assistant';
import Adherence from './pages/Adherence';
import CheckInReview from './pages/CheckInReview';
import Sales from './pages/Sales';
import ClientDashboard from './pages/ClientDashboard';
import Community from './pages/Community';
import Subscription from './pages/Subscription';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Automations from './pages/Automations';
import Analytics from './pages/Analytics';
import RevenueDashboard from './pages/RevenueDashboard';
import Business from './pages/Business';
import ProgramBuilder from './pages/ProgramBuilder';
import WhiteLabel from './pages/WhiteLabel';
import PageGuard from './components/subscription/PageGuard';
import SubmitCheckIn from './pages/SubmitCheckIn';
import CheckInDetail from './pages/CheckInDetail';
import AtRiskClients from './pages/AtRiskClients';
import FastReview from './pages/FastReview';
import ClientProfile from './pages/ClientProfile';
import FocusLayout from './components/layout/FocusLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-body">Loading FitForge...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/progress" element={<PageGuard feature="progress"><Progress /></PageGuard>} />
        <Route path="/store" element={<PageGuard feature="store"><Store /></PageGuard>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/assistant" element={<PageGuard feature="assistant"><Assistant /></PageGuard>} />
        <Route path="/adherence" element={<PageGuard feature="adherence"><Adherence /></PageGuard>} />
        <Route path="/checkin-review" element={<PageGuard feature="checkin_review"><CheckInReview /></PageGuard>} />
        <Route path="/sales" element={<PageGuard feature="sales"><Sales /></PageGuard>} />
        <Route path="/my-day" element={<PageGuard feature="client_dashboard"><ClientDashboard /></PageGuard>} />
        <Route path="/community" element={<PageGuard feature="community"><Community /></PageGuard>} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/exercises" element={<ExerciseLibrary />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/revenue" element={<RevenueDashboard />} />
        <Route path="/business" element={<Business />} />
        <Route path="/program-builder" element={<ProgramBuilder />} />
        <Route path="/white-label" element={<WhiteLabel />} />
        <Route path="/submit-checkin" element={<SubmitCheckIn />} />
        <Route path="/checkin-detail" element={<CheckInDetail />} />
        <Route path="/at-risk" element={<AtRiskClients />} />
        <Route path="/client-profile" element={<ClientProfile />} />
      </Route>
      <Route element={<FocusLayout />}>
        <Route path="/fast-review" element={<FastReview />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App