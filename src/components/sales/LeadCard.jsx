import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, MoreHorizontal, Edit, Trash2, ArrowRight, DollarSign } from 'lucide-react';
import { Initials } from '@/components/kit';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const STAGE_LABELS = { lead: 'Lead', booked: 'Booked', closed: 'Closed', active_client: 'Active' };
const STAGE_BADGE = { lead: 'secondary', booked: 'warning', closed: 'success', active_client: 'success' };
const TIER_LABELS = { one_on_one: '1:1 Coaching', group: 'Group', low_ticket: 'Low Ticket' };
const SOURCE_LABELS = { instagram: 'Instagram', referral: 'Referral', website: 'Website', tiktok: 'TikTok', youtube: 'YouTube', other: 'Other' };

export default function LeadCard({ lead, onEdit, onDelete, onAdvance }) {
  const nextStageMap = { lead: 'booked', booked: 'closed', closed: 'active_client' };
  const nextStage = nextStageMap[lead.stage];
  const nextLabel = { lead: 'Mark booked', booked: 'Mark closed', closed: 'Convert to client' };

  return (
    <div className="panel p-4 group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <Initials name={lead.name || ''} />
          <div>
            <p className="text-[15px] font-semibold text-foreground">{lead.name}</p>
            {lead.email && <p className="text-[13px] text-muted-foreground">{lead.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STAGE_BADGE[lead.stage] || 'secondary'}>{STAGE_LABELS[lead.stage]}</Badge>
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
          <Badge variant="outline" >{TIER_LABELS[lead.offer_tier]}</Badge>
        )}
        {lead.source && (
          <Badge variant="outline" >{SOURCE_LABELS[lead.source]}</Badge>
        )}
        {lead.deal_value > 0 && (
          <Badge variant="outline" >
            <DollarSign className="w-2.5 h-2.5 mr-0.5" />{lead.deal_value.toLocaleString()}
          </Badge>
        )}
      </div>

      {(lead.call_date || lead.phone) && (
        <div className="flex items-center gap-3 text-xs text-foreground mb-3">
          {lead.call_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.call_date} {lead.call_time || ''}</span>}
          {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
        </div>
      )}

      {lead.notes && (
        <p className="text-sm text-foreground bg-secondary rounded-lg px-3 py-2 mb-3 line-clamp-2">{lead.notes}</p>
      )}

      {lead.call_link && lead.stage === 'booked' && (
        <a href={lead.call_link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground underline underline-offset-4 decoration-1 mb-2">
          <Phone className="w-3 h-3" /> Join call link
        </a>
      )}

      {nextStage && (
        <Button size="sm" variant="outline" className="w-full mt-1"
          onClick={() => onAdvance(lead, nextStage)}>
          {nextLabel[lead.stage]} <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}