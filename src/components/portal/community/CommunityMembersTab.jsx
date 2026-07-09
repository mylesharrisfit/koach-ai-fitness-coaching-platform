import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const GOAL_LABELS = {
  weight_loss: '🏃 Weight Loss',
  muscle_gain: '💪 Muscle Gain',
  strength: '🏋️ Strength',
  endurance: '🚴 Endurance',
  flexibility: '🧘 Flexibility',
  general_fitness: '⚡ General Fitness',
};

function MemberModal({ client, posts, onClose }) {
  const clientPosts = posts.filter(p => p.author_id === client.id && !p.is_anonymous && !p.is_hidden);
  const initials = (client.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
        className="w-full bg-card rounded-t-3xl p-5 pb-10 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl text-white mb-3"
            style={{ background: 'linear-gradient(135deg, rgb(var(--success)), rgb(var(--success)))' }}>
            {initials}
          </div>
          <h3 className="text-foreground font-black text-lg">{client.name}</h3>
          {client.goal && (
            <span className="mt-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
              {GOAL_LABELS[client.goal] || client.goal}
            </span>
          )}
          {client.start_date && (
            <p className="text-muted-foreground text-xs mt-1">Member since {format(parseISO(client.start_date), 'MMMM yyyy')}</p>
          )}
        </div>

        {clientPosts.length > 0 && (
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">Recent Posts</p>
            <div className="space-y-2">
              {clientPosts.slice(0, 3).map(post => (
                <div key={post.id} className="p-3 rounded-2xl bg-muted border border-border">
                  <p className="text-foreground text-sm">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function MemberCard({ client, isCoach, onClick }) {
  const initials = (client.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isOnline = Math.random() > 0.6; // Simulated

  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="bg-card rounded-2xl p-3 flex flex-col items-center gap-2 text-center"
      style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid rgb(var(--muted))' }}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm text-white"
          style={{ background: isCoach ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' : 'linear-gradient(135deg, rgb(var(--success)), rgb(var(--success)))' }}>
          {initials}
        </div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-success' : 'bg-border'}`} />
      </div>
      <div>
        <p className="text-foreground font-bold text-xs leading-tight">{client.name?.split(' ')[0] || 'Member'}</p>
        {isCoach && (
          <span className="text-[8px] font-black text-primary bg-accent px-1.5 py-0.5 rounded-full">COACH</span>
        )}
        {client.goal && !isCoach && (
          <p className="text-muted-foreground text-[9px] mt-0.5">{GOAL_LABELS[client.goal]?.split(' ')[0] || ''}</p>
        )}
      </div>
    </motion.button>
  );
}

export default function CommunityMembersTab({ user, myClient, allClients, posts }) {
  const [selectedMember, setSelectedMember] = useState(null);

  return (
    <div className="px-4 pt-4">
      {/* Coach pinned at top */}
      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">Your Coach</p>
      <div className="bg-card rounded-2xl p-4 flex items-center gap-3 mb-5"
        style={{ boxShadow: '0 2px 12px rgb(var(--primary) / 0.08)', border: '1px solid rgb(var(--accent))' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' }}>
          C
        </div>
        <div className="flex-1">
          <p className="text-foreground font-black text-sm">Your Coach</p>
          <p className="text-muted-foreground text-xs">KOACH AI Platform</p>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <p className="text-success text-[10px] font-semibold">Online</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black text-white"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' }}>Your Coach</span>
      </div>

      {/* Members grid */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Community Members</p>
        <p className="text-muted-foreground text-[10px] font-semibold">{allClients.length} total</p>
      </div>

      {allClients.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-10 h-10 text-border mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 pb-4">
          {allClients.map(client => (
            <MemberCard key={client.id} client={client} isCoach={false}
              onClick={() => setSelectedMember(client)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedMember && (
          <MemberModal client={selectedMember} posts={posts} onClose={() => setSelectedMember(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}