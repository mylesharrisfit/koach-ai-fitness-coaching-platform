import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Flame, Zap, Snowflake, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import confetti from 'canvas-confetti';

export const KANBAN_STAGES = [
  { key: 'new_lead',      label: '🆕 New Lead',       color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { key: 'dmd',           label: '💬 DM\'d',           color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'call_booked',   label: '📞 Call Booked',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'proposal_sent', label: '📄 Proposal Sent',   color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'closed_won',    label: '🎉 Closed / Won',    color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { key: 'lost',          label: '❌ Lost',             color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
];

const SOURCE_LABELS = {
  instagram: 'IG', referral: 'Ref', store_purchase: 'Store',
  website: 'Web', cold_outreach: 'Cold', dm: 'DM',
  tiktok: 'TT', youtube: 'YT', other: 'Other',
};

function getTemperature(lead) {
  if (!lead.last_contact_date) return 'cold';
  const days = differenceInDays(new Date(), new Date(lead.last_contact_date));
  if (days <= 1) return 'hot';
  if (days <= 3) return 'warm';
  return 'cold';
}

function TemperatureIcon({ temp }) {
  if (temp === 'hot') return <Flame className="w-3 h-3 text-orange-500" title="Hot" />;
  if (temp === 'warm') return <Zap className="w-3 h-3 text-yellow-500" title="Warm" />;
  return <Snowflake className="w-3 h-3 text-blue-400" title="Cold" />;
}

function daysInStage(lead) {
  if (!lead.stage_changed_at) return null;
  return differenceInDays(new Date(), new Date(lead.stage_changed_at));
}

function KanbanLeadCard({ lead, index, onView }) {
  const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const temp = getTemperature(lead);
  const days = daysInStage(lead);
  const isFollowUpOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date();

  const avatarColors = ['#6366F1', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#14B8A6'];
  const avatarColor = avatarColors[lead.name.charCodeAt(0) % avatarColors.length];

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onView(lead)}
          className={cn(
            'bg-white rounded-xl border border-[#E5E7EB] p-3 cursor-pointer select-none',
            'hover:shadow-md hover:border-blue-200 transition-all group',
            snapshot.isDragging && 'shadow-xl border-blue-400 rotate-1 scale-105'
          )}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-[#111827] text-xs leading-tight truncate">{lead.name}</p>
                <TemperatureIcon temp={temp} />
              </div>
              {lead.source && (
                <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] mt-0.5">
                  {SOURCE_LABELS[lead.source] || lead.source}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            {lead.deal_value > 0 ? (
              <span className="text-xs font-bold text-emerald-600">${lead.deal_value.toLocaleString()}/mo</span>
            ) : <span />}
            {days !== null && (
              <span className="text-[10px] text-[#9CA3AF]">Day {days}</span>
            )}
          </div>

          {lead.follow_up_date && (
            <div className={cn(
              'mt-1.5 flex items-center gap-1 text-[10px]',
              isFollowUpOverdue ? 'text-red-500' : 'text-[#9CA3AF]'
            )}>
              {isFollowUpOverdue && <AlertCircle className="w-2.5 h-2.5" />}
              <Clock className="w-2.5 h-2.5" />
              Follow up: {isValid(new Date(lead.follow_up_date)) ? format(new Date(lead.follow_up_date), 'MMM d') : ''}
            </div>
          )}

          {/* Hover quick actions */}
          <div className="mt-2 pt-2 border-t border-[#F3F4F6] hidden group-hover:flex items-center gap-1 text-[10px] text-[#6B7280]">
            <span className="cursor-pointer hover:text-blue-600">💬 Msg</span>
            <span className="text-[#E5E7EB] mx-0.5">·</span>
            <span className="cursor-pointer hover:text-blue-600">📅 Book</span>
            <span className="text-[#E5E7EB] mx-0.5">·</span>
            <span className="cursor-pointer hover:text-blue-600">👤 View</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ stage, leads, onView, onAddLead }) {
  const total = leads.reduce((s, l) => s + (l.deal_value || 0), 0);

  return (
    <div className="flex-shrink-0 w-64 flex flex-col" style={{ maxHeight: 'calc(100vh - 320px)' }}>
      {/* Column header */}
      <div
        className="rounded-t-xl px-3 py-2.5 border border-b-0 flex-shrink-0"
        style={{ background: stage.bg, borderColor: stage.border }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</p>
          <span
            className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
            style={{ background: stage.color }}
          >
            {leads.length}
          </span>
        </div>
        {total > 0 && (
          <p className="text-[10px] mt-0.5" style={{ color: stage.color }}>
            ${total.toLocaleString()} potential
          </p>
        )}
      </div>

      {/* Droppable area */}
      <Droppable droppableId={stage.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 overflow-y-auto rounded-b-xl border border-t-0 p-2 space-y-2 min-h-[100px] transition-colors',
              snapshot.isDraggingOver
                ? 'bg-blue-50 border-blue-300'
                : 'bg-[#F9FAFB] border-[#E5E7EB]'
            )}
          >
            {leads.map((lead, i) => (
              <KanbanLeadCard key={lead.id} lead={lead} index={i} onView={onView} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add lead button */}
      <button
        onClick={() => onAddLead(stage.key)}
        className="mt-1 w-full text-[11px] font-semibold text-[#9CA3AF] hover:text-[#374151] py-1.5 flex items-center justify-center gap-1 rounded-lg hover:bg-[#F3F4F6] transition-colors"
      >
        <Plus className="w-3 h-3" /> Add Lead
      </button>
    </div>
  );
}

export default function KanbanBoard({ leads, onUpdate, onView, onAddLead }) {
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStage = destination.droppableId;
    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    if (newStage === 'closed_won') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }

    onUpdate(draggableId, { stage: newStage, stage_changed_at: new Date().toISOString() });
    const stageLabel = KANBAN_STAGES.find(s => s.key === newStage)?.label || newStage;
    toast.success(`${lead.name} moved to ${stageLabel} ✓`);
  };

  const stageLeads = (stageKey) => leads.filter(l => l.stage === stageKey);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {KANBAN_STAGES.map(stage => (
          <KanbanColumn
            key={stage.key}
            stage={stage}
            leads={stageLeads(stage.key)}
            onView={onView}
            onAddLead={onAddLead}
          />
        ))}
      </div>
    </DragDropContext>
  );
}