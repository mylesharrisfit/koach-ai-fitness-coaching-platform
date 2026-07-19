import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Retained for API compatibility with pages that still read these
  // (App.jsx, PremiumOnboarding, ProtectedRoute). Supabase Auth has no separate
  // public-settings probe — the session IS the source of truth — so this is
  // always false and appPublicSettings stays null.
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    checkSupabaseAuth();
    // Reflect login/logout/token-refresh across the shell.
    const unsub = supabase.auth.onAuthStateChange?.(() => checkSupabaseAuth());
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  /**
   * Supabase auth check. The session is the source of truth; me() rejects when
   * signed out. No Base44 public-settings probe.
   */
  const checkSupabaseAuth = async () => {
    try {
      const currentUser = await supabase.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      acceptPendingTeamInvite(currentUser);
    } catch (_) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  /**
   * Auto-accept a pending team invite for this user.
   * Matches by email (case-insensitive). Sets user_id and flips invite_status → "accepted".
   * Silent no-op if no pending invite exists.
   */
  const acceptPendingTeamInvite = async (currentUser) => {
    if (!currentUser?.email) return;
    try {
      const pending = await supabase.entities.TeamMember.filter({ invite_status: 'pending' });
      const match = pending.find(
        m => m.email?.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (match) {
        await supabase.entities.TeamMember.update(match.id, {
          user_id: currentUser.id,
          invite_status: 'accepted',
        });
      }
    } catch (_) {
      // Non-critical — never block login
    }
  };

  // Kept for API compatibility with existing callers (App.jsx, ProtectedRoute,
  // PremiumOnboarding). Both simply re-run the Supabase session check.
  const checkUserAuth = () => checkSupabaseAuth();
  const checkAppState = () => checkSupabaseAuth();

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Signs out the Supabase session and redirects to /login.
    supabase.auth.logout();
  };

  const navigateToLogin = () => {
    supabase.auth.redirectToLogin();
  };

  // Imperative auth helpers so pages/components never import the auth client
  // directly.
  const me = () => supabase.auth.me();
  const updateMe = (data) => supabase.auth.updateMe(data);

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      me,
      updateMe,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
