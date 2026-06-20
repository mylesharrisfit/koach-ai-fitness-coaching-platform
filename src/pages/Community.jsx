import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Trophy, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import GroupListView from '../components/community/GroupListView';
import GroupDetailView from '../components/community/GroupDetailView';
import GroupFormModal from '../components/community/GroupFormModal';
import ChallengesHub from '../components/community/ChallengesHub';

export default function Community() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isCoach, setIsCoach] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [mainTab, setMainTab] = useState('groups'); // 'groups' | 'challenges'

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      setIsCoach(user?.role === 'admin');
    }).catch(() => {});
  }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => base44.entities.CommunityGroup.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const handleCreate = () => {
    setEditingGroup(null);
    setShowForm(true);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleSelect = (group) => {
    setSelectedGroup(group);
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  // When groups update, keep selectedGroup in sync
  const liveGroup = selectedGroup ? groups.find(g => g.id === selectedGroup.id) || selectedGroup : null;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="rounded-xl p-5 text-white flex items-center justify-between" style={{ background: '#0E1525' }}>
        <div>
          <h1 className="text-xl font-semibold text-white">Community</h1>
          <p className="text-sm text-white/50 mt-0.5">
            {liveGroup ? liveGroup.name : mainTab === 'challenges' ? 'Fitness challenges for your clients' : 'Your groups and communities'}
          </p>
        </div>
        {!liveGroup && isCoach && mainTab === 'groups' && (
          <button onClick={handleCreate}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            + Create Community
          </button>
        )}
      </div>

      {/* Main tab switcher (only show when not in group detail) */}
      {!liveGroup && (
        <div className="flex gap-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl p-1 w-fit">
          <button onClick={() => setMainTab('groups')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'groups' ? 'bg-white shadow-sm text-[#0E1525]' : 'text-[#6B7280] hover:text-[#0E1525]')}>
            <Globe className="w-4 h-4" /> Groups
          </button>
          <button onClick={() => setMainTab('challenges')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'challenges' ? 'bg-white shadow-sm text-[#0E1525]' : 'text-[#6B7280] hover:text-[#0E1525]')}>
            <Trophy className="w-4 h-4" /> Challenges
          </button>
        </div>
      )}

      {/* Content */}
      {mainTab === 'challenges' && !liveGroup ? (
        <ChallengesHub isCoach={isCoach} user={currentUser} />
      ) : liveGroup ? (
        <GroupDetailView
          group={liveGroup}
          clients={clients}
          currentUser={currentUser}
          isCoach={isCoach}
          onBack={handleBack}
        />
      ) : (
        <GroupListView
          groups={groups}
          clients={clients}
          isCoach={isCoach}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      )}

      {/* Create / Edit modal */}
      <GroupFormModal
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setEditingGroup(null); }}
        group={editingGroup}
        currentUser={currentUser}
      />
    </div>
  );
}