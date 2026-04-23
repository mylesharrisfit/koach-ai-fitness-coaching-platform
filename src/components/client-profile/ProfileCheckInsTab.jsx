import React, { useState } from 'react';
import { ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const moodEmoji = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😤' };

const Pill = ({ label, value, color = 'bg-[#F6F7FB] text-[#374151]' }) => (
  value !== undefined && value !== null ? (
    <div className={`flex flex-col items-center rounded-xl px-3 py-2 flex-1 ${color}`}>
      <span className="text-sm font-bold tabular-nums">{value}</span>
      <span className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</span>
    </div>
  ) : null
);

function CheckInCard({ ci }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8F9FD] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EEF4FF] flex items-center justify-center text-sm">
            {moodEmoji[ci.mood] || '📋'}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#1F2A44]">{format(new Date(ci.date), 'MMM d, yyyy')}</p>
            <p className="text-xs text-[#9CA3AF]">
              {ci.weight ? `${ci.weight} lbs` : ''}
              {ci.weight && (ci.compliance_training != null) ? ' · ' : ''}
              {ci.compliance_training != null ? `${ci.compliance_training}% training` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ci.coach_responded && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-md px-1.5 py-0.5 font-medium">Responded</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#F0F2F8]">
          <div className="flex gap-2 pt-3">
            <Pill label="Weight" value={ci.weight ? `${ci.weight} lbs` : null} />
            <Pill label="Sleep" value={ci.sleep_hours ? `${ci.sleep_hours}h` : null} />
            <Pill label="Energy" value={ci.energy_level ? `${ci.energy_level}/5` : null} />
          </div>

          {(ci.compliance_training != null || ci.compliance_nutrition != null) && (
            <div className="flex gap-2">
              {ci.compliance_training != null && (
                <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-blue-700">{ci.compliance_training}%</p>
                  <p className="text-[10px] text-[#9CA3AF]">Training</p>
                </div>
              )}
              {ci.compliance_nutrition != null && (
                <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-emerald-700">{ci.compliance_nutrition}%</p>
                  <p className="text-[10px] text-[#9CA3AF]">Nutrition</p>
                </div>
              )}
            </div>
          )}

          {ci.notes && (
            <div>
              <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold tracking-wide mb-1">Client Notes</p>
              <p className="text-sm text-[#374151] leading-relaxed">{ci.notes}</p>
            </div>
          )}
          {ci.coach_notes && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-[10px] text-primary uppercase font-semibold tracking-wide mb-1">Coach Response</p>
              <p className="text-sm text-[#374151] leading-relaxed">{ci.coach_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfileCheckInsTab({ client, checkIns }) {
  if (checkIns.length === 0) return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
        <ClipboardCheck className="w-5 h-5 text-[#9CA3AF]" />
      </div>
      <p className="text-sm font-semibold text-[#374151]">No check-ins yet</p>
      <p className="text-xs text-[#9CA3AF] mt-1">Check-ins submitted by the client will appear here</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {checkIns.map(ci => <CheckInCard key={ci.id} ci={ci} />)}
    </div>
  );
}