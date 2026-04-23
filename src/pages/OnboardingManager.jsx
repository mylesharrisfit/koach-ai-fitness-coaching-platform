import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link2, UserPlus, Check, Clock, Users, ChevronDown, ChevronUp, X } from 'lucide-react';

const GOAL_LABEL = {
  fat_loss: '🔥 Fat Loss', muscle_gain: '💪 Muscle Gain', hybrid: '⚡ Hybrid',
  strength: '🏋️ Strength', endurance: '🏃 Endurance', general_fitness: '🎯 General Fitness',
};
const ACTIVITY_LABEL = {
  sedentary: 'Sedentary', lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active', very_active: 'Very Active', athlete: 'Athlete',
};

function ResponseCard({ response, onConvert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary">{response.name?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1F2A44] truncate">{response.name}</p>
          <p className="text-xs text-[#9CA3AF] truncate">{response.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {response.status === 'converted' ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">
              <Check className="w-3 h-3 mr-1" /> Converted
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[10px]">
              <Clock className="w-3 h-3 mr-1" /> Pending
            </Badge>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {response.goal && (
          <span className="text-[11px] bg-[#F6F7FB] border border-[#E7EAF3] px-2 py-0.5 rounded-full text-[#374151]">
            {GOAL_LABEL[response.goal] || response.goal}
          </span>
        )}
        {response.activity_level && (
          <span className="text-[11px] bg-[#F6F7FB] border border-[#E7EAF3] px-2 py-0.5 rounded-full text-[#374151]">
            {ACTIVITY_LABEL[response.activity_level]}
          </span>
        )}
        {response.current_weight && (
          <span className="text-[11px] bg-[#F6F7FB] border border-[#E7EAF3] px-2 py-0.5 rounded-full text-[#374151]">
            {response.current_weight} lbs
          </span>
        )}
        {response.training_days_per_week && (
          <span className="text-[11px] bg-[#F6F7FB] border border-[#E7EAF3] px-2 py-0.5 rounded-full text-[#374151]">
            {response.training_days_per_week}x/week
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#F0F2F8] px-4 py-3 space-y-2.5 bg-[#F8F9FC]">
          {response.age && <DetailRow label="Age" value={`${response.age} years`} />}
          {response.height && <DetailRow label="Height" value={response.height} />}
          {response.phone && <DetailRow label="Phone" value={response.phone} />}
          {response.previous_experience && <DetailRow label="Experience" value={response.previous_experience} />}
          {response.food_preferences && <DetailRow label="Food Prefs" value={response.food_preferences} />}
          {response.schedule_preferences && <DetailRow label="Schedule" value={response.schedule_preferences} />}
          {response.health_conditions && <DetailRow label="Health Notes" value={response.health_conditions} />}
          {response.motivation && <DetailRow label="Motivation" value={response.motivation} />}
        </div>
      )}

      {/* Action */}
      {response.status !== 'converted' && (
        <div className="border-t border-[#F0F2F8] px-4 py-3 bg-white">
          <Button size="sm" className="w-full gap-2" onClick={() => onConvert(response)}>
            <UserPlus className="w-3.5 h-3.5" /> Convert to Client
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-[11px] font-semibold text-[#9CA3AF] w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-[#374151] leading-relaxed">{value}</span>
    </div>
  );
}

export default function OnboardingManager() {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['onboarding-responses'],
    queryFn: () => base44.entities.OnboardingResponse.list('-created_date', 50),
  });

  const convertMutation = useMutation({
    mutationFn: async (resp) => {
      const goal = resp.goal === 'fat_loss' ? 'weight_loss'
        : resp.goal === 'hybrid' ? 'muscle_gain'
        : resp.goal || 'general_fitness';
      const client = await base44.entities.Client.create({
        name: resp.name,
        email: resp.email,
        phone: resp.phone || '',
        goal,
        current_weight: resp.current_weight,
        height: resp.height,
        notes: [
          resp.food_preferences && `Food: ${resp.food_preferences}`,
          resp.schedule_preferences && `Schedule: ${resp.schedule_preferences}`,
          resp.health_conditions && `Health: ${resp.health_conditions}`,
          resp.motivation && `Motivation: ${resp.motivation}`,
        ].filter(Boolean).join('\n\n'),
        lifecycle_status: 'active',
        status: 'active',
      });
      await base44.entities.OnboardingResponse.update(resp.id, { status: 'converted', client_id: client.id });
      return client;
    },
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: ['onboarding-responses'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`${client.name} added as a client!`);
    },
    onError: () => toast.error('Failed to convert. Please try again.'),
  });

  const onboardingUrl = `${window.location.origin}/client-onboarding${user?.email ? `?coach=${encodeURIComponent(user.email)}` : ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(onboardingUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const pending = responses.filter(r => r.status !== 'converted');
  const converted = responses.filter(r => r.status === 'converted');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1F2A44]">Client Onboarding</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Send your intake link and convert responses into clients.</p>
      </div>

      {/* Link card */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center">
            <Link2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F2A44]">Your Onboarding Link</p>
            <p className="text-xs text-[#9CA3AF]">Share with new clients to collect their info</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl px-3 py-2">
          <p className="text-xs text-[#374151] flex-1 truncate font-mono">{onboardingUrl}</p>
        </div>
        <Button className="w-full gap-2" onClick={copyLink} variant={copied ? 'secondary' : 'default'}>
          {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Link2 className="w-4 h-4" /> Copy Link</>}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: responses.length, icon: Users, color: 'text-[#1F2A44]' },
          { label: 'Pending', value: pending.length, icon: Clock, color: 'text-amber-600' },
          { label: 'Converted', value: converted.length, icon: Check, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E7EAF3] rounded-2xl p-3 text-center">
            <p className={cn('text-2xl font-bold tabular-nums', s.color)}>{s.value}</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Responses */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse" />)}
        </div>
      ) : responses.length === 0 ? (
        <div className="bg-white border border-[#E7EAF3] rounded-2xl py-14 text-center">
          <p className="text-sm font-semibold text-[#374151]">No responses yet</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Share your link to start receiving intakes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.length > 0 && (
            <>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Pending ({pending.length})</p>
              {pending.map(r => <ResponseCard key={r.id} response={r} onConvert={convertMutation.mutate} />)}
            </>
          )}
          {converted.length > 0 && (
            <>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mt-4">Converted ({converted.length})</p>
              {converted.map(r => <ResponseCard key={r.id} response={r} onConvert={convertMutation.mutate} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}