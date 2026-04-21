import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar, MoreHorizontal, Edit, Trash2, ArrowRight, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const STAGE_LABELS = { lead: 'Lead', booked: 'Booked', closed: 'Closed', active_client: 'Active' };
const STAGE_COLORS = {
  lead: 'bg-violet-50 text-violet-600 border-violet-100',
  booked: 'bg-amber-50 text-amber-600 border-amber-100',
  closed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  active_client: 'bg-[#EEF4FF] text-primary border-blue-100',
};
const TIER_LABELS = { one_on_one: '1:1 Coaching', group: 'Group', low_ticket: 'Low Ticket' };
const SOURCE_LABELS = { instagram: 'Instagram', referral: 'Referral', website: 'Website', tiktok: 'TikTok', youtube: 'YouTube', other: 'Other' };

export default function LeadCard({ lead, onEdit, onDelete, onAdvance }) {
  const nextStageMap = { lead: 'booked', booked: 'closed', closed: 'active_client' };
  const nextStage = nextStageMap[lead.stage];
  const nextLabel = { lead: 'Mark Booked', booked: 'Mark Closed', closed: 'Convert to Client' };

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all group shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {lead.name?.[0] || '?'}
          </div>
          <div>
            <p className="font-semibold text-sm">{lead.name}</p>
            {lead.email && <p className="text-xs text-[#6B7280]">{lead.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-[10px] border", STAGE_COLORS[lead.stage])}>{STAGE_LABELS[lead.stage]}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(lead)}><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(lead.id)}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {lead.offer_tier && (
          <Badge variant="outline" className="text-[10px]">{TIER_LABELS[lead.offer_tier]}</Badge>
        )}
        {lead.source && (
          <Badge variant="outline" className="text-[10px] text-[#6B7280]">{SOURCE_LABELS[lead.source]}</Badge>
        )}
        {lead.deal_value > 0 && (
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/30">
            <DollarSign className="w-2.5 h-2.5 mr-0.5" />{lead.deal_value.toLocaleString()}
          </Badge>
        )}
      </div>

      {(lead.call_date || lead.phone) && (
        <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-3">
          {lead.call_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.call_date} {lead.call_time || ''}</span>}
          {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
        </div>
      )}

      {lead.notes && (
        <p className="text-xs text-[#6B7280] bg-[#F6F7FB] border border-[#E7EAF3] rounded-lg px-3 py-2 mb-3 line-clamp-2">{lead.notes}</p>
      )}

      {lead.call_link && lead.stage === 'booked' && (
        <a href={lead.call_link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline mb-2">
          <Phone className="w-3 h-3" /> Join call link
        </a>
      )}

      {nextStage && (
        <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => onAdvance(lead, nextStage)}>
          {nextLabel[lead.stage]} <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}