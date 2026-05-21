import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, MessageSquare, Trophy, Target, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CommunityFeed from '../components/community/CommunityFeed';
import Leaderboard from '../components/community/Leaderboard';
import WeeklyChallenges from '../components/community/WeeklyChallenges';
import CommunityToggle from '../components/community/CommunityToggle';

const TABS = [
  { key: 'feed',        icon: MessageSquare, label: 'Feed',        settingKey: 'feed_enabled' },
  { key: 'leaderboard', icon: Trophy,        label: 'Leaderboard', settingKey: 'leaderboard_enabled' },
  { key: 'challenges',  icon: Target,        label: 'Challenges',  settingKey: 'challenges_enabled' },
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

  React.useEffect(() => {
    const tab = TABS.find(t => t.key === activeTab);
    if (tab && settings[tab.settingKey] === false && enabledTabs.length > 0) {
      setActiveTab(enabledTabs[0].key);
    }
  }, [settings]);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      {/* Dark header banner */}
      <div className="bg-[#111827] rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Community</h1>
          <p className="text-sm text-white/50 mt-0.5">Feed, leaderboards and challenges for your clients</p>
        </div>
        <div className="flex items-center gap-2">
          {isCoach && (
            <button
              onClick={() => setShowCoachSettings(!showCoachSettings)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Settings
            </button>
          )}
          {isCoach && activeTab === 'challenges' && (
            <button
              onClick={() => {}} // WeeklyChallenges manages its own modal via New Challenge button
              className="px-4 py-2 bg-white text-[#111827] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              + New Challenge
            </button>
          )}
        </div>
      </div>

      {showCoachSettings && isCoach && (
        <div className="max-w-sm">
          <CommunityToggle settings={settings} settingsId={settingsId} />
        </div>
      )}

      {enabledTabs.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E7EB] rounded-xl">
          <Users className="w-10 h-10 mx-auto mb-3 text-[#D1D5DB]" />
          <p className="font-semibold text-sm text-[#374151]">Community features are disabled</p>
          {isCoach && <p className="text-xs text-[#9CA3AF] mt-1">Click "Settings" to enable them.</p>}
        </div>
      ) : (
        <>
          {/* Tabs */}
          {enabledTabs.length > 1 && (
            <div className="flex gap-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl p-1 w-fit">
              {enabledTabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.key ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]')}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab content */}
          <div className={cn(activeTab === 'feed' && 'grid grid-cols-1 lg:grid-cols-3 gap-6')}>
            {activeTab === 'feed' && (
              <>
                <div className="lg:col-span-2">
                  <CommunityFeed currentUser={currentUser} />
                </div>
                <div className="space-y-5">
                  {settings.leaderboard_enabled !== false && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Leaderboard</p>
                      <Leaderboard clients={clients} />
                    </div>
                  )}
                  {settings.challenges_enabled !== false && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">Active Challenges</p>
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