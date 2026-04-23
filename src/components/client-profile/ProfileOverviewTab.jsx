import React from 'react';
import { Mail, Phone, Target, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import ClientFeedbackHistory from '@/components/clients/ClientFeedbackHistory';

const goalLabels = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness'
};

const InfoRow = ({ icon: IconComp, label, value }) => (
  value ? (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F0F2F8] last:border-0">
      <IconComp className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
      <span className="text-xs text-[#9CA3AF] w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-[#1F2A44] flex-1 min-w-0">{value}</span>
    </div>
  ) : null
);

export default function ProfileOverviewTab({ client, checkIns }) {
  return (
    <div className="space-y-4">
      {/* Contact & details card */}
      <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
        <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-1">Details</h3>
        <InfoRow icon={Mail}        label="Email"   value={client.email} />
        <InfoRow icon={Phone}       label="Phone"   value={client.phone} />
        <InfoRow icon={Target}      label="Goal"    value={goalLabels[client.goal] || 'General Fitness'} />
        <InfoRow icon={Calendar}    label="Started" value={client.start_date ? format(new Date(client.start_date), 'MMM d, yyyy') : null} />
        <InfoRow icon={DollarSign}  label="Rate"    value={client.monthly_rate ? `$${client.monthly_rate}/mo` : null} />
      </div>

      {/* Body metrics */}
      {(client.current_weight || client.target_weight || client.height) && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Body Metrics</h3>
          <div className="grid grid-cols-3 gap-3">
            {client.current_weight && (
              <div className="bg-[#F6F7FB] rounded-xl p-3 text-center">
                <p className="text-base font-bold text-[#1F2A44]">{client.current_weight}</p>
                <p className="text-[10px] text-[#9CA3AF]">Current (lbs)</p>
              </div>
            )}
            {client.target_weight && (
              <div className="bg-[#F6F7FB] rounded-xl p-3 text-center">
                <p className="text-base font-bold text-[#1F2A44]">{client.target_weight}</p>
                <p className="text-[10px] text-[#9CA3AF]">Target (lbs)</p>
              </div>
            )}
            {client.height && (
              <div className="bg-[#F6F7FB] rounded-xl p-3 text-center">
                <p className="text-base font-bold text-[#1F2A44]">{client.height}</p>
                <p className="text-[10px] text-[#9CA3AF]">Height</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {client.tags?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {client.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#EEF4FF] text-primary border border-blue-100 rounded-lg px-2 py-0.5 font-medium">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {client.notes && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">Coach Notes</h3>
          <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Recent check-ins summary */}
      {checkIns.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Recent Activity</h3>
          <ClientFeedbackHistory checkIns={checkIns} />
        </div>
      )}
    </div>
  );
}