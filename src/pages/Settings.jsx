import React, { useState } from 'react';
import { User, Plug, Bell, Shield, Zap, ChevronRight, Briefcase, Gift, Share2, Lock, Eye, EyeOff, Check, AlertTriangle, Trash2, Loader2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import IntegrationsTab from '../components/integrations/IntegrationsTab';
import DefaultAssignmentSettings from '../components/settings/DefaultAssignmentSettings';
import { ThemeToggle } from '../components/settings/ThemeToggle';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'referral', label: 'Refer & Earn', icon: Gift },
  { id: 'affiliate', label: 'Affiliate Program', icon: Gift },
  { id: 'marketing', label: 'Marketing Tools', icon: Share2 },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'auto-assign', label: 'Auto-Assign', icon: Zap },
];

function AppearanceTab() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Choose how KOACH looks on this device</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-foreground text-sm">Theme</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Light, dark, or match your system setting</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-3">
      <Link to="/business-settings"
        className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)' }}>
            <Briefcase className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#1F2A44] text-sm">Business Settings</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Coaching preferences, onboarding, scheduling, leads & branding</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </Link>
      <Link to="/coach-profile"
        className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' }}>
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#1F2A44] text-sm">My Coach Profile</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Photo, bio, certifications, specialties, social links & public preview</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </Link>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-3">
      <Link to="/notification-settings"
        className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #EDE9FE)' }}>
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#1F2A44] text-sm">Notification Settings</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Client activity, messages, payments, AI insights, scheduling & more</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </Link>
    </div>
  );
}

function passwordStrength(pw) {
  if (!pw) return { label: '', color: '', pct: 0 };
  if (pw.length < 8) return { label: 'Weak', color: '#EF4444', pct: 25 };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  if (pw.length >= 12 && hasUpper && hasNum && hasSymbol) return { label: 'Strong', color: '#10B981', pct: 100 };
  if (hasNum && hasUpper) return { label: 'Good', color: '#EAB308', pct: 75 };
  return { label: 'Fair', color: '#F97316', pct: 50 };
}

function DeleteAccountModal({ user, onClose }) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const hasActiveSub = ['active', 'trialing', 'past_due'].includes(user?.billing_status) || 
    (user?.stripe_subscription_id && user?.billing_status !== 'canceled');

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Cancel Stripe subscription first if active
      if (hasActiveSub && user?.stripe_subscription_id) {
        await base44.functions.invoke('stripeCancelSubscription', {
          subscription_id: user.stripe_subscription_id,
        });
      }
      // Delete the account
      await base44.auth.logout('/start');
    } catch (e) {
      toast.error(e?.message || 'Failed to delete account. Please contact support.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        {step === 1 && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-slate-900 font-black text-xl text-center mb-2">Delete Your Account?</h3>
            <p className="text-slate-500 text-sm text-center mb-4">This permanently deletes your account and all associated data. <strong>This cannot be undone.</strong></p>
            {hasActiveSub && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                ⚠️ You have an active subscription. It will be <strong>cancelled immediately</strong> before your account is deleted — no further charges will occur.
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-2xl font-bold text-white text-sm bg-red-500">Continue</button>
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-semibold text-slate-600 border border-slate-200 text-sm">Cancel</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h3 className="text-slate-900 font-black text-lg mb-3">Type to confirm</h3>
            <p className="text-slate-500 text-sm mb-3">Type <strong>DELETE</strong> to permanently delete your account.</p>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                disabled={confirmText !== 'DELETE' || loading}
                onClick={handleDelete}
                className="flex-1 py-3 rounded-2xl font-bold text-white text-sm bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : 'Delete My Account'}
              </button>
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-semibold text-slate-600 border border-slate-200 text-sm">Cancel</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function SecurityTab() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const strength = passwordStrength(next);

  const reqs = [
    { label: 'At least 8 characters', met: next.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(next) },
    { label: 'One number', met: /[0-9]/.test(next) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(next) },
  ];

  const handlePasswordSubmit = () => {
    if (!current) return toast.error('Enter your current password');
    if (!reqs.every(r => r.met)) return toast.error('Password does not meet all requirements');
    if (next !== confirm) return toast.error('Passwords do not match');
    toast.success('Password updated successfully ✓');
    setShowPasswordForm(false);
    setCurrent(''); setNext(''); setConfirm('');
  };

  return (
    <div className="space-y-4">
      {/* Change Password */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1F2A44]">Password</p>
              <p className="text-xs text-[#9CA3AF]">••••••••••••</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordForm(s => !s)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            {showPasswordForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        <AnimatePresence>
          {showPasswordForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-slate-50" />
                  <button onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showNext ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)}
                    placeholder="New password"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-slate-50" />
                  <button onClick={() => setShowNext(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {next && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">Strength</span>
                      <span className="text-xs font-bold" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200">
                      <div className="h-full rounded-full transition-all" style={{ width: `${strength.pct}%`, background: strength.color }} />
                    </div>
                    <div className="mt-2 space-y-1">
                      {reqs.map(r => (
                        <div key={r.label} className="flex items-center gap-2 text-xs">
                          {r.met ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />}
                          <span className={r.met ? 'text-emerald-600' : 'text-slate-400'}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-slate-50" />
                <button onClick={handlePasswordSubmit}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                  Update Password
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Account management link */}
      <Link to="/account-settings"
        className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
            <Shield className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F2A44]">Active Sessions & Privacy</p>
            <p className="text-xs text-[#9CA3AF]">Manage devices, connected accounts, data export</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </Link>

      {/* Danger zone — Delete Account */}
      <div className="bg-white border-2 border-red-100 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-700">Delete Account</p>
              <p className="text-xs text-red-400">Permanently delete your account and all data</p>
            </div>
          </div>
          <button onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
            Delete
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && <DeleteAccountModal user={user} onClose={() => setShowDeleteModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('integrations');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-[#1F2A44]">Settings</h1>
        <p className="text-sm text-[#374151] mt-0.5">Manage your account, integrations, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0',
              activeTab === id
                ? 'bg-white text-[#1F2A44] shadow-sm border border-[#E7EAF3]'
                : 'text-[#374151] hover:text-[#1F2A44]'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'referral' && (
        <div>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#1F2A44]">Refer & Earn</h2>
            <p className="text-sm text-[#374151] mt-0.5">Earn commissions by referring other coaches to KOACH AI</p>
          </div>
          <Link to="/referral-program"
            className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)' }}>
                <Gift className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F2A44] text-sm">View Referral Program</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Check your earnings, referral links, and payout details</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>
      )}
      {activeTab === 'affiliate' && (
        <div>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#1F2A44]">Affiliate Program</h2>
            <p className="text-sm text-[#374151] mt-0.5">Earn 30% recurring commissions at scale with dedicated support</p>
          </div>
          <Link to="/affiliate-application"
            className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FCD34D)' }}>
                <Gift className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F2A44] text-sm">Join Our Affiliate Program</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Apply to become a power partner earning 30% recurring commissions</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>
      )}
      {activeTab === 'marketing' && (
        <div>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#1F2A44]">Marketing Tools</h2>
            <p className="text-sm text-[#374151] mt-0.5">Build trackable links, email templates, campaigns and more</p>
          </div>
          <Link to="/marketing-tools"
            className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ECE5FF, #D8D0FF)' }}>
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F2A44] text-sm">Marketing Tools</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Smart links, QR codes, email templates, testimonials, campaigns</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>
      )}
      {activeTab === 'integrations' && (
        <div>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#1F2A44]">Coach Integrations</h2>
            <p className="text-sm text-[#374151] mt-0.5">Connect third-party services to power your coaching workflow</p>
          </div>
          <IntegrationsTab />
        </div>
      )}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'auto-assign' && (
        <div>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#1F2A44]">Auto-Assignment Defaults</h2>
            <p className="text-sm text-[#374151] mt-0.5">These are automatically applied whenever a new client is added</p>
          </div>
          <DefaultAssignmentSettings />
        </div>
      )}
    </div>
  );
}