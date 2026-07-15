import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import AuthShell, { AuthField, AuthSubmit, AuthError, AuthNotice } from './AuthShell.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSubmitting(true);
    try {
      const { needsConfirmation } = await supabase.auth.signup({ email, password, full_name: fullName });
      if (needsConfirmation) {
        setNotice('Check your email to confirm your account, then sign in.');
        setSubmitting(false);
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Could not create your account.');
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start coaching with KOACH AI">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="Full name" value={fullName} onChange={setFullName} placeholder="Your name" autoComplete="name" />
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <AuthField label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" autoComplete="new-password" />
        <AuthError message={error} />
        <AuthNotice message={notice} />
        {!notice && (
          <AuthSubmit disabled={submitting || !email || !password}>
            {submitting ? 'Creating account…' : 'Create Account →'}
          </AuthSubmit>
        )}
      </form>
      <div className="text-center text-xs text-white/40 pt-1">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:text-white transition-colors font-semibold">Sign in</Link>
      </div>
    </AuthShell>
  );
}
