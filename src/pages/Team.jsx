import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Users, UserPlus, Mail, Crown, Check, Clock, X, Loader2, ChevronDown, ShieldAlert } from 'lucide-react';
import { useTeamRole } from '@/lib/useTeamRole';

function RoleBadge({ role }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
        style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
        <Crown className="w-2.5 h-2.5" /> Owner
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
      Coach
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
        <Check className="w-3 h-3" /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500">
      <Clock className="w-3 h-3" /> Invite Pending
    </span>
  );
}

function RoleDropdown({ member, onChangeRole }) {
  const [open, setOpen] = useState(false);
  if (member.role_label === 'owner') return null; // can't demote the owner via dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
        title="Change role"
      >
        Change role <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-lg z-10 w-36 overflow-hidden">
          {['owner', 'coach'].map(role => (
            <button
              key={role}
              onClick={() => { onChangeRole(member, role); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 capitalize flex items-center gap-2"
            >
              {role === 'owner' && <Crown className="w-3 h-3 text-amber-500" />}
              {role === member.role_label && <Check className="w-3 h-3 text-blue-500" />}
              {role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, isYou, onRemove, onChangeRole, isOwnerViewing }) {
  const initials = member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: member.role_label === 'owner' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.12)', color: member.role_label === 'owner' ? '#F59E0B' : '#2563EB' }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
          {isYou && <span className="text-[10px] text-gray-400 font-medium">(you)</span>}
        </div>
        <p className="text-xs text-gray-400 truncate">{member.email}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <StatusBadge status={member.invite_status} />
        <RoleBadge role={member.role_label} />
        {/* Owner-only controls */}
        {isOwnerViewing && !isYou && (
          <>
            <RoleDropdown member={member} onChangeRole={onChangeRole} />
            <button onClick={() => onRemove(member)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove from team">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InviteModal({ teamId, userId, onClose, onInvited }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { toast.error('Name and email are required'); return; }

    setLoading(true);
    try {
      // Step 1: Create the TeamMember record — this MUST succeed regardless of email
      await base44.entities.TeamMember.create({
        team_id: teamId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role_label: 'coach',
        invite_status: 'pending',
        invited_by: userId,
      });

      // Step 2: Notify the invited coach by calling onInvited so they appear in the list immediately
      onInvited();

      // Step 3: Try to send invite email — failure must NOT block the UI or undo the invite
      let emailSent = false;
      try {
        const htmlBody = `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#111827;margin-bottom:8px">You've been invited to KOACH AI</h2>
            <p style="color:#4B5563">Hi ${name.trim()},</p>
            <p style="color:#4B5563">You've been invited to join a coaching team on KOACH AI.</p>
            <p style="margin:24px 0">
              <a href="https://app.base44.com" style="background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                Accept Invite &rarr;
              </a>
            </p>
            <p style="color:#6B7280;font-size:13px">Sign up or log in with this email address and you'll be connected to the team automatically.</p>
            <p style="color:#9CA3AF;font-size:12px;margin-top:24px">The KOACH AI Team</p>
          </div>`;

        await Promise.race([
          base44.functions.invoke('sendEmailNotification', {
            to: email.trim().toLowerCase(),
            subject: "You've been invited to join a KOACH AI team",
            html: htmlBody,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ]);
        emailSent = true;
      } catch (emailErr) {
        // Email failed or timed out — invite record is already saved, just warn
        console.warn('Invite email failed:', emailErr.message);
      }

      if (emailSent) {
        toast.success(`Invite sent to ${email.trim()}`);
      } else {
        toast.success(`${name.trim()} added as pending invite — email delivery failed, but they appear in the list.`);
      }

      onClose();
    } catch (err) {
      toast.error(`Failed to create invite: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Invite a Coach</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Full Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="coach@example.com"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="pt-1 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              The coach will receive an email invite. Once they sign up or log in with this email address on KOACH AI, they'll be connected to your team.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Mail className="w-4 h-4" /> Send Invite</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const { isOwner } = useTeamRole();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Find or create the owner's team
  const { data: teams = [], isLoading: loadingTeam } = useQuery({
    queryKey: ['my-team'],
    queryFn: () => base44.entities.Team.filter({ owner_coach_id: user?.id }),
    enabled: !!user?.id,
  });
  const team = teams[0];

  // Load team members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members', team?.id],
    queryFn: () => base44.entities.TeamMember.filter({ team_id: team.id }),
    enabled: !!team?.id,
  });

  // Seed owner as TeamMember if not already present
  const seedOwnerMember = async (teamId) => {
    const existing = await base44.entities.TeamMember.filter({ team_id: teamId });
    const ownerExists = existing.some(m => m.user_id === user.id || m.email === user.email);
    if (!ownerExists) {
      await base44.entities.TeamMember.create({
        team_id: teamId,
        user_id: user.id,
        name: user.full_name || 'Team Owner',
        email: user.email,
        role_label: 'owner',
        invite_status: 'accepted',
        invited_by: user.id,
      });
      qc.invalidateQueries({ queryKey: ['team-members', teamId] });
    }
  };

  // Auto-seed owner member when team loads
  useEffect(() => {
    if (team?.id && user?.id) {
      seedOwnerMember(team.id);
    }
  }, [team?.id, user?.id]);

  // If no team exists yet, seed it
  const handleSeedTeam = async () => {
    const res = await base44.functions.invoke('seedTeam', {});
    qc.invalidateQueries({ queryKey: ['my-team'] });
    toast.success('Team created!');
  };

  const handleRemove = async (member) => {
    if (!confirm(`Remove ${member.name} from the team?`)) return;
    await base44.entities.TeamMember.delete(member.id);
    qc.invalidateQueries({ queryKey: ['team-members', team?.id] });
    toast.success(`${member.name} removed from team`);
  };

  const handleChangeRole = async (member, newRole) => {
    await base44.entities.TeamMember.update(member.id, { role_label: newRole });
    qc.invalidateQueries({ queryKey: ['team-members', team?.id] });
    toast.success(`${member.name} is now ${newRole === 'owner' ? 'an Owner' : 'a Coach'}`);
  };

  const isLoading = loadingTeam || loadingMembers;

  // Sort: owner first, then by invite status
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role_label === 'owner') return -1;
    if (b.role_label === 'owner') return 1;
    return 0;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#111827] rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Team</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {team ? team.name : 'Manage your coaching team'}
          </p>
        </div>
        {team && isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <UserPlus className="w-4 h-4" /> Invite Coach
          </button>
        )}
      </div>

      {/* No team state */}
      {!isLoading && !team && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">No team set up yet</p>
          <p className="text-xs text-gray-400 mb-5">Set up your team to start adding coaches.</p>
          <button onClick={handleSeedTeam}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#2563EB' }}>
            Set Up My Team
          </button>
        </div>
      )}

      {/* Team members list */}
      {team && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Stats row */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50"
            style={{ background: '#FAFAFA' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">
                {sortedMembers.length} {sortedMembers.length === 1 ? 'member' : 'members'} ·{' '}
                {sortedMembers.filter(m => m.invite_status === 'pending').length} pending invite
                {sortedMembers.filter(m => m.invite_status === 'pending').length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="py-12 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
            </div>
          )}

          {/* Members */}
          {!isLoading && sortedMembers.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">No team members found.</div>
          )}
          {!isLoading && sortedMembers.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              isYou={member.user_id === user?.id || member.email === user?.email}
              onRemove={handleRemove}
              onChangeRole={handleChangeRole}
              isOwnerViewing={isOwner}
            />
          ))}
        </div>
      )}

      {/* Info card — owner sees how-to, coach sees read-only note */}
      {team && isOwner && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">How team invites work</p>
          <div className="space-y-1.5">
            {[
              'Click "Invite Coach" and enter their name and email.',
              'They\'ll receive an email with a link to sign up or log in.',
              'Once they log in with that email, they\'ll appear as Active.',
              'Use the "Change role" control to promote a coach to owner.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-blue-800 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {team && !isOwner && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            You have <strong>Coach</strong> access. Only the team owner can invite or remove coaches and manage billing. Contact your team owner for changes.
          </p>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && team && (
        <InviteModal
          teamId={team.id}
          userId={user?.id}
          onClose={() => setShowInvite(false)}
          onInvited={() => qc.invalidateQueries({ queryKey: ['team-members', team.id] })}
        />
      )}
    </div>
  );
}