import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import AuthShell, { AuthField, AuthSubmit, AuthError } from './AuthShell.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await supabase.auth.login({ email, password });
      const params = new URLSearchParams(window.location.search);
      navigate(params.get('from_url') || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your email and password.');
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your KOACH AI account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <AuthField label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" />
        <AuthError message={error} />
        <AuthSubmit disabled={submitting || !email || !password}>
          {submitting ? 'Signing in…' : 'Sign In →'}
        </AuthSubmit>
      </form>
      <div className="flex items-center justify-between text-xs text-white/40 pt-1">
        <Link to="/forgot-password" className="hover:text-white/70 transition-colors">Forgot password?</Link>
        <Link to="/signup" className="hover:text-white/70 transition-colors">Create account</Link>
      </div>
    </AuthShell>
  );
}
