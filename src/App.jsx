import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
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
        <Route path="/progress" element={<Progress />} />
        <Route path="/store" element={<Store />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/adherence" element={<Adherence />} />
        <Route path="/checkin-review" element={<CheckInReview />} />
        <Route path="/sales" element={<Sales />} />
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