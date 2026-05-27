import React, { useState } from 'react';
import { User, Plug, Bell, Shield, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import IntegrationsTab from '../components/integrations/IntegrationsTab';
import DefaultAssignmentSettings from '../components/settings/DefaultAssignmentSettings';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'auto-assign', label: 'Auto-Assign', icon: Zap },
];

function ProfileTab() {
  return (
    <div className="space-y-3">
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
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6">
      <h3 className="font-semibold text-[#1F2A44] mb-1">Notification Preferences</h3>
      <p className="text-sm text-[#374151]">Configure when and how you receive notifications.</p>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-3">
      <Link to="/account-settings"
        className="flex items-center justify-between bg-white border border-[#E7EAF3] rounded-2xl p-5 hover:border-blue-300 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#1F2A44] text-sm">Account Settings</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Password, 2FA, sessions, privacy, data export & danger zone</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </Link>
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