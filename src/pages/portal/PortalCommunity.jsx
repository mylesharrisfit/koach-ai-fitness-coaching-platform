import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageSquare, Trophy, Target, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import CommunityFeedTab from '@/components/portal/community/CommunityFeedTab';
import CommunityGroupChat from '@/components/portal/community/CommunityGroupChat';
import CommunityMembersTab from '@/components/portal/community/CommunityMembersTab';

const TABS = [
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'chat', label: 'Group Chat', icon: Users },
  { id: 'members', label: 'Members', icon: Trophy },
];

function avatarColor(name) {
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
}

function GroupDetail({ group, user, myClient, allClients, queryClient }) {
  const [activeTab, setActiveTab] = useState('feed');

  const memberIds = group.member_ids || [];
  const members = allClients.filter(c => memberIds.includes(c.id));

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts', group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id, is_hidden: false }, '-created_date', 50),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', group.id] });
    });
    return unsub;
  }, [queryClient, group.id]);

  const enabledTabs = TABS.filter(t => {
    if (t.id === 'feed') return group.feed_enabled !== false;
    return true; // chat and members always available
  });

  return (
    <div className="flex flex-col flex-1">
      {/* Tabs */}
      <div className="bg-white px-5 pb-0" style={{ boxShadow: '0 1px 0 #F1F5F9' }}>
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
                  <motion.div layoutId="portal-community-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#2563EB]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CommunityFeedTab user={user} myClient={myClient} posts={posts} allClients={members} queryClient={queryClient} groupId={group.id} />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CommunityGroupChat user={user} myClient={myClient} allClients={members} />
            </motion.div>
          )}
          {activeTab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CommunityMembersTab user={user} myClient={myClient} allClients={members} posts={posts} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PortalCommunity({ user }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-community-client', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: allClients = [] } = useQuery({
    queryKey: ['community-all-clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 100),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => base44.entities.CommunityGroup.list('-created_date'),
  });

  // Client only sees groups they belong to
  const myGroups = groups.filter(g => {
    const ids = g.member_ids || [];
    return ids.includes(myClient?.id) || ids.includes(user?.id);
  });

  const liveGroup = selectedGroup ? myGroups.find(g => g.id === selectedGroup.id) || selectedGroup : null;

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: '#F8F9FA' }}>
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4" style={{ boxShadow: '0 1px 0 #F1F5F9' }}>
        <div className="flex items-center gap-3 mb-1">
          {liveGroup && (
            <button onClick={() => setSelectedGroup(null)}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
          )}
          <div>
            <h1 className="text-slate-900 font-black text-2xl">
              {liveGroup ? liveGroup.name : 'Community'}
            </h1>
            <p className="text-slate-400 text-sm">
              {liveGroup ? (liveGroup.description || 'Group community') : (myGroups.length + ' group' + (myGroups.length !== 1 ? 's' : ''))}
            </p>
          </div>
        </div>
      </div>

      {/* Group detail */}
      {liveGroup ? (
        <GroupDetail group={liveGroup} user={user} myClient={myClient} allClients={allClients} queryClient={queryClient} />
      ) : (
        <div className="p-4 space-y-3">
          {myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-slate-900 font-black text-lg mb-2">No groups yet</h3>
              <p className="text-slate-400 text-sm">Your coach will add you to a community group soon.</p>
            </div>
          ) : (
            myGroups.map(group => {
              const memberIds = group.member_ids || [];
              const members = allClients.filter(c => memberIds.includes(c.id));
              return (
                <button key={group.id} onClick={() => setSelectedGroup(group)}
                  className="w-full bg-white rounded-2xl overflow-hidden text-left"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  {group.cover_image_url ? (
                    <div className="h-24 overflow-hidden">
                      <img src={group.cover_image_url} alt={group.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #0E1525 0%, #2563EB 100%)' }}>
                      <Users className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                  <div className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-base truncate">{group.name}</p>
                      {group.description && (
                        <p className="text-slate-400 text-sm truncate">{group.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex -space-x-1">
                          {members.slice(0, 4).map(m => (
                            <div key={m.id} className={cn('w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold', avatarColor(m.name))}>
                              {m.name?.[0]?.toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-slate-400 text-xs">{members.length} members</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}