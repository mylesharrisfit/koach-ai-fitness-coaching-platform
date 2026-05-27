import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Send, Image as ImageIcon, Eye, EyeOff,
  MoreHorizontal, Flag, EyeOff as Hide, MessageCircle, Share2,
  Users, MessageSquare, Trophy, ChevronRight, Pin, Megaphone
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import CommunityFeedTab from '@/components/portal/community/CommunityFeedTab';
import CommunityGroupChat from '@/components/portal/community/CommunityGroupChat';
import CommunityMembersTab from '@/components/portal/community/CommunityMembersTab';

const TABS = [
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'chat', label: 'Group Chat', icon: Users },
  { id: 'members', label: 'Members', icon: Trophy },
];

export default function PortalCommunity({ user }) {
  const [activeTab, setActiveTab] = useState('feed');
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-community-client', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: settings = [] } = useQuery({
    queryKey: ['community-settings'],
    queryFn: () => base44.entities.CommunitySettings.list('-created_date', 1),
  });
  const communitySettings = settings[0];

  const { data: allClients = [] } = useQuery({
    queryKey: ['community-all-clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 100),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.filter({ is_hidden: false }, '-created_date', 50),
    refetchInterval: 30000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    });
    return unsub;
  }, [queryClient]);

  const coachName = communitySettings?.coach_name || 'Your Coach';
  const memberCount = allClients.length;
  const unreadCount = posts.filter(p => p.is_announcement && !p.is_hidden).length;

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: '#F8F9FA' }}>
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-0" style={{ boxShadow: '0 1px 0 #F1F5F9' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-slate-900 font-black text-2xl">Community</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">{coachName}'s Community</p>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                {memberCount} members
              </span>
            </div>
          </div>
          <button className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mt-1">
            <Search className="w-4.5 h-4.5 text-slate-500" size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold transition-all relative flex-1 justify-center"
                style={{ color: isActive ? '#2563EB' : '#94A3B8' }}>
                <Icon size={14} />
                {tab.label}
                {isActive && (
                  <motion.div layoutId="community-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CommunityFeedTab user={user} myClient={myClient} posts={posts} allClients={allClients} queryClient={queryClient} />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CommunityGroupChat user={user} myClient={myClient} allClients={allClients} />
            </motion.div>
          )}
          {activeTab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CommunityMembersTab user={user} myClient={myClient} allClients={allClients} posts={posts} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}