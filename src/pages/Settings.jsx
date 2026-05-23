import React, { useState } from 'react';
import { User, Plug, Bell, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6">
      <h3 className="font-semibold text-[#1F2A44] mb-1">Profile Settings</h3>
      <p className="text-sm text-[#374151]">Manage your coach profile and account details here.</p>
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
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6">
      <h3 className="font-semibold text-[#1F2A44] mb-1">Security</h3>
      <p className="text-sm text-[#374151]">Manage your password and two-factor authentication.</p>
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