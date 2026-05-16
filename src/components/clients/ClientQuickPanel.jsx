import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Edit, ExternalLink, Dumbbell, Salad, ClipboardCheck, MessageSquare, Image, Phone, Target, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LifecycleBadge from './LifecycleBadge';
import { compositeAdherenceScore } from '@/lib/adherence';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Target },
  { key: 'program', label: 'Program', icon: Dumbbell },
  { key: 'nutrition', label: 'Nutrition', icon: Salad },
  { key: 'checkins', label: 'Check-ins', icon: ClipboardCheck },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'photos', label: 'Photos', icon: Image },
];

const goalLabels = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness'
};

function OnboardingChecklist({ client, checkIns, program, nutritionPlan }) {
  const steps = [
    { label: 'Intake Form', done: !!(client.notes || client.goal || client.height) },
    { label: 'Program Assigned', done: !!client.assigned_program_id },
    { label: 'Nutrition Plan Set', done: !!client.assigned_nutrition_id },
    { label: 'First Check-in', done: checkIns.length > 0 },
  ];
  const completed = steps.filter(s => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  const color = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';

  return (
    <div className="p-4 bg-[#F6F7FB] rounded-xl space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-[#374151]">Onboarding Progress</p>
        <span className="text-xs font-bold text-[#374151]">{completed}/{steps.length}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {steps.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-500' : 'bg-[#D1D5DB]'}`}>
              {s.done && <svg className="w-2 h-2 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <span className={s.done ? 'text-[#374151] font-medium' : 'text-[#9CA3AF]'}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientQuickPanel({ client, checkIns = [], onClose, onEdit }) {
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();

  const { data: program } = useQuery({
    queryKey: ['program', client?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: client.assigned_program_id }),
    enabled: !!client?.assigned_program_id,
    select: d => d[0],
  });

  const { data: nutritionPlan } = useQuery({
    queryKey: ['nutrition-plan', client?.assigned_nutrition_id],
    queryFn: () => base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id }),
    enabled: !!client?.assigned_nutrition_id,
    select: d => d[0],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-panel', client?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10),
  });

  if (!client) return null;

  const initials = client.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const score = compositeAdherenceScore(checkIns);
  const scoreColor = score === null ? '#9CA3AF' : score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const photoCheckIns = checkIns.filter(ci => ci.photo_urls?.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F8] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EEF4FF] text-primary flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
              {client.avatar_url ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" /> : initials}
            </div>
            <div>
              <p className="font-bold text-[#1F2A44] text-sm leading-tight">{client.name}</p>
              <LifecycleBadge status={client.lifecycle_status || 'lead'} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/client-profile?id=${client.id}`)}>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex border-b border-[#F0F2F8] flex-shrink-0">
          {[
            { label: 'Adherence', value: score !== null ? `${score}%` : '—', color: scoreColor },
            { label: 'Check-ins', value: checkIns.length, color: '#374151' },
            { label: 'Rate', value: client.monthly_rate ? `$${client.monthly_rate}` : '—', color: '#374151' },
          ].map(stat => (
            <div key={stat.label} className="flex-1 flex flex-col items-center py-3 border-r border-[#F0F2F8] last:border-r-0">
              <span className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</span>
              <span className="text-[10px] text-[#9CA3AF]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-[#F0F2F8] flex-shrink-0 bg-[#F8F9FD]">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0',
                tab === t.key ? 'border-primary text-primary bg-white' : 'border-transparent text-[#9CA3AF] hover:text-[#374151]'
              )}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="p-5 space-y-4">
              <OnboardingChecklist client={client} checkIns={checkIns} program={program} nutritionPlan={nutritionPlan} />

              {/* Details */}
              <div className="space-y-2.5">
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-[#374151]">
                    <MessageSquare className="w-4 h-4 text-[#9CA3AF]" />
                    {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm text-[#374151]">
                    <Phone className="w-4 h-4 text-[#9CA3AF]" />
                    {client.phone}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-[#374151]">
                  <Target className="w-4 h-4 text-[#9CA3AF]" />
                  {goalLabels[client.goal] || 'General Fitness'}
                </div>
                {client.start_date && (
                  <div className="flex items-center gap-3 text-sm text-[#374151]">
                    <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                    Started {format(new Date(client.start_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>

              {/* Tags */}
              {client.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map(tag => (
                    <span key={tag} className="text-xs bg-[#EEF4FF] text-primary border border-blue-100 rounded-lg px-2 py-0.5 font-medium">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {client.notes && (
                <div className="p-3 bg-[#F6F7FB] rounded-xl">
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Coach Notes</p>
                  <p className="text-sm text-[#374151] leading-relaxed">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── PROGRAM ── */}
          {tab === 'program' && (
            <div className="p-5 space-y-3">
              {program ? (
                <div className="p-4 bg-[#F6F7FB] rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#1F2A44]">{program.title}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{program.description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100 font-semibold flex-shrink-0">{program.difficulty}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Weeks', value: program.duration_weeks || '—' },
                      { label: 'Days/wk', value: program.days_per_week || '—' },
                      { label: 'Workouts', value: (program.workouts || []).length },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-lg p-2">
                        <p className="text-sm font-bold text-[#1F2A44]">{s.value}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {(program.workouts || []).slice(0, 4).map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#374151]">
                      <Dumbbell className="w-3 h-3 text-[#9CA3AF]" />
                      {w.day_name} · {(w.exercises || []).length} exercises
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Dumbbell className="w-10 h-10 text-[#9CA3AF]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#9CA3AF]">No program assigned yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={onEdit}>Assign Program</Button>
                </div>
              )}
            </div>
          )}

          {/* ── NUTRITION ── */}
          {tab === 'nutrition' && (
            <div className="p-5 space-y-3">
              {nutritionPlan ? (
                <div className="p-4 bg-[#F6F7FB] rounded-xl space-y-3">
                  <p className="font-bold text-[#1F2A44]">{nutritionPlan.title}</p>
                  {nutritionPlan.tracking_mode !== 'habits' && (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'kcal', value: nutritionPlan.calories, color: 'text-orange-500' },
                        { label: 'Protein', value: `${nutritionPlan.protein_g}g`, color: 'text-red-500' },
                        { label: 'Carbs', value: `${nutritionPlan.carbs_g}g`, color: 'text-amber-500' },
                        { label: 'Fats', value: `${nutritionPlan.fats_g}g`, color: 'text-blue-500' },
                      ].map(s => (
                        <div key={s.label} className="bg-white rounded-lg p-2">
                          <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1">
                    {(nutritionPlan.meals || []).slice(0, 4).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#374151]">
                        <Salad className="w-3 h-3 text-[#9CA3AF]" />
                        {m.meal_name}{m.time ? ` · ${m.time}` : ''} · {(m.foods || []).length} foods
                      </div>
                    ))}
                    {(nutritionPlan.meals || []).length > 4 && (
                      <p className="text-[11px] text-[#9CA3AF] pl-5">+{nutritionPlan.meals.length - 4} more meals</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Salad className="w-10 h-10 text-[#9CA3AF]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#9CA3AF]">No nutrition plan assigned yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={onEdit}>Assign Plan</Button>
                </div>
              )}
            </div>
          )}

          {/* ── CHECK-INS ── */}
          {tab === 'checkins' && (
            <div className="p-5 space-y-3">
              {checkIns.length === 0 ? (
                <div className="text-center py-10">
                  <ClipboardCheck className="w-10 h-10 text-[#9CA3AF]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#9CA3AF]">No check-ins yet</p>
                </div>
              ) : checkIns.slice(0, 8).map((ci, i) => (
                <div key={ci.id} className="p-3 bg-[#F6F7FB] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#374151]">{format(new Date(ci.date), 'MMM d, yyyy')}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', ci.review_status === 'reviewed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                      {ci.review_status || 'pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#6B7280] flex-wrap">
                    {ci.weight && <span>⚖️ {ci.weight} lbs</span>}
                    {ci.compliance_training !== undefined && <span>🏋️ {ci.compliance_training}% training</span>}
                    {ci.compliance_nutrition !== undefined && <span>🥗 {ci.compliance_nutrition}% nutrition</span>}
                    {ci.mood && <span>😊 {ci.mood}</span>}
                  </div>
                  {ci.notes && <p className="text-[11px] text-[#6B7280] italic line-clamp-2">"{ci.notes}"</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {tab === 'messages' && (
            <div className="p-5 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="w-10 h-10 text-[#9CA3AF]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#9CA3AF]">No messages yet</p>
                </div>
              ) : messages.map(msg => (
                <div key={msg.id} className={cn('p-3 rounded-xl max-w-[85%] text-sm leading-relaxed', msg.sender === 'coach' ? 'ml-auto bg-primary text-white' : 'bg-[#F6F7FB] text-[#374151]')}>
                  <p>{msg.content}</p>
                  <p className={cn('text-[10px] mt-1 opacity-60')}>{formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── PHOTOS ── */}
          {tab === 'photos' && (
            <div className="p-5">
              {photoCheckIns.length === 0 ? (
                <div className="text-center py-10">
                  <Image className="w-10 h-10 text-[#9CA3AF]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#9CA3AF]">No progress photos yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {photoCheckIns.map(ci => (
                    <div key={ci.id}>
                      <p className="text-xs font-bold text-[#9CA3AF] mb-2">{format(new Date(ci.date), 'MMM d, yyyy')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {ci.photo_urls.map((url, i) => (
                          <img key={i} src={url} alt="Progress" className="w-full aspect-square object-cover rounded-xl border border-[#F0F2F8]" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}