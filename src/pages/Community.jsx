import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, MessageSquare, Trophy, Target, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeader from '../components/shared/PageHeader';
import CommunityFeed from '../components/community/CommunityFeed';
import Leaderboard from '../components/community/Leaderboard';
import WeeklyChallenges from '../components/community/WeeklyChallenges';
import CommunityToggle from '../components/community/CommunityToggle';

const TABS = [
  { key: 'feed', icon: MessageSquare, label: 'Feed', settingKey: 'feed_enabled' },
  { key: 'leaderboard', icon: Trophy, label: 'Leaderboard', settingKey: 'leaderboard_enabled' },
  { key: 'challenges', icon: Target, label: 'Challenges', settingKey: 'challenges_enabled' },
];

export default function Community() {
  const [activeTab, setActiveTab] = useState('feed');
  const [currentUser, setCurrentUser] = useState(null);
  const [isCoach, setIsCoach] = useState(false);
  const [showCoachSettings, setShowCoachSettings] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      setIsCoach(user?.role === 'admin');
    }).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ['community-settings'],
    queryFn: () => base44.entities.CommunitySettings.list(),
  });

  const settings = settingsArr[0] || { feed_enabled: true, leaderboard_enabled: true, challenges_enabled: true };
  const settingsId = settingsArr[0]?.id;

  const enabledTabs = TABS.filter(t => settings[t.settingKey] !== false);

  // Redirect if active tab gets disabled
  React.useEffect(() => {
    const tab = TABS.find(t => t.key === activeTab);
    if (tab && settings[tab.settingKey] === false && enabledTabs.length > 0) {
      setActiveTab(enabledTabs[0].key);
    }
  }, [settings]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Community"
        subtitle="Feed, leaderboards & challenges for your clients"
        actions={isCoach && (
          <button
            onClick={() => setShowCoachSettings(!showCoachSettings)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
              showCoachSettings ? "border-primary bg-[#EEF4FF] text-primary" : "border-[#E7EAF3] hover:border-primary/40 text-[#374151]"
            )}
          >
            <Settings2 className="w-4 h-4" />
            Manage Features
          </button>
        )}
      />

      {showCoachSettings && isCoach && (
        <div className="mb-6 max-w-sm">
          <CommunityToggle settings={settings} settingsId={settingsId} />
        </div>
      )}

      {enabledTabs.length === 0 ? (
        <div className="text-center py-20 text-[#374151]">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-[#1F2A44]">Community features are disabled</p>
          {isCoach && <p className="text-sm mt-1">Click "Manage Features" to enable them.</p>}
        </div>
      ) : (
        <>
          {/* Tabs */}
          {enabledTabs.length > 1 && (
            <div className="flex gap-1 bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-1 mb-6 w-fit">
              {enabledTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.key ? "bg-white shadow-sm text-[#1F2A44]" : "text-[#374151] hover:text-[#1F2A44]"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {activeTab === 'feed' && (
              <>
                <div className="lg:col-span-2">
                  <CommunityFeed currentUser={currentUser} />
                </div>
                <div className="space-y-5">
                  {settings.leaderboard_enabled !== false && <Leaderboard clients={clients} />}
                  {settings.challenges_enabled !== false && (
                    <div>
                      <p className="text-xs font-semibold text-[#374151] uppercase tracking-wider mb-3">Active Challenges</p>
                      <WeeklyChallenges isCoach={isCoach} compact />
                    </div>
                  )}
                </div>
              </>
            )}
            {activeTab === 'leaderboard' && (
              <div className="lg:col-span-3">
                <Leaderboard clients={clients} />
              </div>
            )}
            {activeTab === 'challenges' && (
              <div className="lg:col-span-3">
                <WeeklyChallenges isCoach={isCoach} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}