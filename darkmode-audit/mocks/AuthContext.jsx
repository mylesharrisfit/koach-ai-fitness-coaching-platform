/* Mock AuthContext for the dark-mode audit harness — always authenticated,
 * no network. Same export surface as src/lib/AuthContext.jsx. */
import React, { createContext, useContext } from 'react';

const COACH = {
  id: 'coach-1', email: 'coach@audit.local', full_name: 'Audit Coach', role: 'admin',
  subscription_tier: 'elite', billing_status: 'active', stripe_subscription_id: 'sub_x',
};

const value = {
  user: COACH, setUser: () => {}, isAuthenticated: true, isLoadingAuth: false,
  isLoadingPublicSettings: false, authError: null, appPublicSettings: { public_settings: {} },
  authChecked: true, logout: () => {}, navigateToLogin: () => {},
  checkUserAuth: async () => {}, checkAppState: async () => {},
};

const AuthContext = createContext(value);
export const AuthProvider = ({ children }) => <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
export const useAuth = () => useContext(AuthContext);
