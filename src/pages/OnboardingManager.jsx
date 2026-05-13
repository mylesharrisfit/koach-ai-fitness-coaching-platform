import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Link2, UserPlus, Check, Clock, Users, ChevronDown, ChevronUp,
  Mail, Shield, AlertCircle, Send, Copy, Eye, CheckCircle2,
  XCircle, Hourglass, Star
} from 'lucide-react';

/* ─── Status config ─── */
const STATUS_CONFIG = {
  pending:   { label: 'Intake Started',    color: '#F59E0B', bg: '#FFFBEB', icon: Hourglass },
  completed: { label: 'Intake Complete',   color: '#3B82F6', bg: '#EFF6FF', icon: CheckCircle2 },
  converted: { label: 'Active Client',     color: '#10B981', bg: '#ECFDF5', icon: Star },
};

const GOAL_LABEL = {
  fat_loss: '🔥 Fat Loss', muscle_gain: '💪 Muscle Gain', hybrid: '⚡ Hybrid',
  strength: '🏋️ Strength', endurance: '🏃 Endurance', general_fitness: '🎯 General',
};

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

/* ─── Intake Response Card ─── */
function ResponseCard({ response, onApprove, isApproving }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
          style={{ background: '#EFF6FF', color: '#3B82F6' }}>
          {response.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{response.name || 'Unknown'}</p>
          <p className="text-xs text-gray-400 truncate">{response.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={response.status} />
          <button onClick={() => setExpanded(e => !e)} className="text-gray-300 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {response.goal && (
          <span className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            {GOAL_LABEL[response.goal] || response.goal}
          </span>
        )}
        {response.age && (
          <span className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            {response.age} yrs
          </span>
        )}
        {response.current_weight && (
          <span className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            {response.current_weight} lbs
          </span>
        )}
        {response.training_days_per_week && (
          <span className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600">
            {response.training_days_per_week}x/week
          </span>
        )}
        <span className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-400">
          {response.created_date ? new Date(response.created_date).toLocaleDateString() : ''}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 py-4 space-y-2.5 bg-gray-50/50">
          {[
            ['Height', response.height],
            ['Phone', response.phone],
            ['Experience', response.previous_experience],
            ['Food Preferences', response.food_preferences],
            ['Health Notes', response.health_conditions],
            ['Motivation', response.motivation],
            ['Schedule', response.schedule_preferences],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className="text-[10px] font-bold text-gray-400 w-28 flex-shrink-0 pt-0.5 uppercase tracking-wide">{label}</span>
              <span className="text-xs text-gray-700 leading-relaxed">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {response.status !== 'converted' && (
        <div className="border-t border-gray-50 px-4 py-3 bg-white flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-2 text-xs"
            onClick={() => onApprove(response)}
            disabled={isApproving}
          >
            <UserPlus className="w-3.5 h-3.5" />
            {isApproving ? 'Approving...' : 'Approve & Create Client'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Stats card ─── */
function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
      <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ─── Main ─── */
export default function OnboardingManager() {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['onboarding-responses'],
    queryFn: () => base44.entities.OnboardingResponse.list('-created_date', 100),
  });

  const approveMutation = useMutation({
    mutationFn: async (resp) => {
      const goalMap = { fat_loss: 'weight_loss', hybrid: 'muscle_gain' };
      const client = await base44.entities.Client.create({
        name: resp.name,
        email: resp.email,
        phone: resp.phone || '',
        goal: goalMap[resp.goal] || resp.goal || 'general_fitness',
        current_weight: resp.current_weight,
        height: resp.height,
        lifecycle_status: 'active',
        status: 'active',
        notes: [
          resp.food_preferences && `Food: ${resp.food_preferences}`,
          resp.health_conditions && `Health: ${resp.health_conditions}`,
          resp.motivation && `Motivation: ${resp.motivation}`,
          resp.schedule_preferences && `Schedule: ${resp.schedule_preferences}`,
        ].filter(Boolean).join('\n\n'),
      });
      await base44.entities.OnboardingResponse.update(resp.id, { status: 'converted', client_id: client.id });
      return client;
    },
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: ['onboarding-responses'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`${client.name} is now an active client!`);
    },
    onError: () => toast.error('Failed to approve. Please try again.'),
  });

  const onboardingUrl = `${window.location.origin}/client-onboarding${user?.email ? `?coach=${encodeURIComponent(user.email)}` : ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(onboardingUrl);
    setCopied(true);
    toast.success('Intake link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const pending = responses.filter(r => r.status !== 'converted');
  const completed = responses.filter(r => r.status === 'completed');
  const converted = responses.filter(r => r.status === 'converted');

  const filtered = filterStatus === 'all' ? responses
    : filterStatus === 'pending' ? responses.filter(r => r.status !== 'converted')
    : responses.filter(r => r.status === filterStatus);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-blue-500" />
          <h1 className="text-xl font-bold text-gray-900">Client Onboarding</h1>
        </div>
        <p className="text-sm text-gray-500">
          Send your private intake link to new clients. Review and approve their intake before they become active clients.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">How it works</p>
        <div className="space-y-2">
          {[
            { n: '1', text: 'Copy your unique intake link below.' },
            { n: '2', text: 'Send it to a prospective client via text, email, or DM.' },
            { n: '3', text: 'Client completes the premium guided onboarding (no account needed yet).' },
            { n: '4', text: 'You review their intake here and click "Approve" to create their client profile.' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.n}
              </span>
              <p className="text-xs text-blue-800 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Intake link card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Your Private Intake Link</p>
            <p className="text-xs text-gray-400">Only share with prospective clients — do not post publicly</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <p className="text-xs text-gray-600 flex-1 truncate font-mono">{onboardingUrl}</p>
          <button onClick={copyLink} className="text-blue-500 hover:text-blue-700 flex-shrink-0 p-1">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <Button className="w-full gap-2" onClick={copyLink} variant={copied ? 'secondary' : 'default'}>
          {copied
            ? <><Check className="w-4 h-4" /> Link Copied!</>
            : <><Link2 className="w-4 h-4" /> Copy Intake Link</>}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Send}        value={responses.length} label="Total Sent"  color="#6366F1" />
        <StatCard icon={Hourglass}   value={pending.length}   label="Pending"     color="#F59E0B" />
        <StatCard icon={CheckCircle2}value={converted.length} label="Approved"    color="#10B981" />
      </div>

      {/* Filter tabs */}
      {responses.length > 0 && (
        <div className="flex gap-2">
          {[
            { id: 'all',       label: `All (${responses.length})` },
            { id: 'pending',   label: `Pending (${pending.length})` },
            { id: 'converted', label: `Active (${converted.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilterStatus(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Response list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-14 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No intakes yet</p>
          <p className="text-xs text-gray-400 mt-1">Copy your link and share it with a prospective client.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ResponseCard
              key={r.id}
              response={r}
              onApprove={approveMutation.mutate}
              isApproving={approveMutation.isPending && approveMutation.variables?.id === r.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}