import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import ProfileSectionCard from './ProfileSectionCard';
import { toast } from 'sonner';

function PasswordStrength({ password }) {
  const score = !password ? 0 : [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', 'rgb(var(--destructive))', 'rgb(var(--warning))', 'rgb(var(--primary))', 'rgb(var(--success))', 'rgb(var(--success))'];

  return password ? (
    <div className="mt-1.5">
      <div className="flex gap-1 h-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-1 rounded-full transition-all"
            style={{ background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
      <p className="text-[10px]" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  ) : null;
}

export default function ProfileSecurity() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleUpdate = () => {
    if (!current) { toast.error('Enter current password'); return; }
    if (newPass.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPass !== confirm) { toast.error('Passwords do not match'); return; }
    toast.success('Password updated successfully');
    setCurrent(''); setNewPass(''); setConfirm('');
  };

  return (
    <ProfileSectionCard icon="🛡️" title="Account Security">
      <div className="pt-3 space-y-4">
        <p className="text-white/40 text-xs font-semibold">Change Password</p>

        {[
          { label: 'Current Password', value: current, onChange: setCurrent, show: showCurrent, setShow: setShowCurrent },
          { label: 'New Password', value: newPass, onChange: setNewPass, show: showNew, setShow: setShowNew, showStrength: true },
          { label: 'Confirm New Password', value: confirm, onChange: setConfirm, show: showNew, setShow: setShowNew },
        ].map(({ label, value, onChange, show, setShow, showStrength }) => (
          <div key={label}>
            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1.5">{label}</p>
            <div className="flex items-center gap-2 border-b border-white/10 pb-1 focus-within:border-primary transition-colors">
              <input
                type={show ? 'text' : 'password'}
                className="flex-1 bg-transparent text-white/80 text-sm outline-none"
                placeholder="••••••••"
                value={value}
                onChange={e => onChange(e.target.value)}
              />
              <button onClick={() => setShow(s => !s)} className="text-white/30">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {showStrength && <PasswordStrength password={value} />}
          </div>
        ))}

        <button onClick={handleUpdate}
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary)))' }}>
          Update Password
        </button>

        {/* 2FA */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <p className="text-white/80 text-sm">Two-Factor Authentication</p>
            <p className="text-white/30 text-[10px]">Extra layer of security</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full font-bold"
            style={{ background: 'rgb(var(--warning) / 0.15)', color: '#FBB724' }}>Coming Soon</span>
        </div>
      </div>
    </ProfileSectionCard>
  );
}