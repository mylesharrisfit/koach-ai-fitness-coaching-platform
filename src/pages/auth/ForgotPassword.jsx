import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import AuthShell, { AuthField, AuthSubmit, AuthError, AuthNotice } from './AuthShell.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await supabase.auth.requestPasswordReset(email);
      // Don't reveal whether the email exists.
      setNotice('If that email has an account, a reset link is on its way.');
    } catch (err) {
      setError(err.message || 'Could not send the reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <AuthError message={error} />
        <AuthNotice message={notice} />
        {!notice && (
          <AuthSubmit disabled={submitting || !email}>
            {submitting ? 'Sending…' : 'Send Reset Link →'}
          </AuthSubmit>
        )}
      </form>
      <div className="text-center text-xs text-white/40 pt-1">
        <Link to="/login" className="hover:text-white/70 transition-colors">Back to sign in</Link>
      </div>
    </AuthShell>
  );
}
