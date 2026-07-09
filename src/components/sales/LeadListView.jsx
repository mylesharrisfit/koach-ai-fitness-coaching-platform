import React, { useState, useMemo } from 'react';
import { differenceInDays, format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowUpDown, AlertCircle, CheckSquare, Square, Trash2, Download } from 'lucide-react';
import { KANBAN_STAGES } from './KanbanBoard';
import { toast } from 'sonner';

const SOURCE_LABELS = {
  instagram: 'Instagram', referral: 'Referral', store_purchase: 'Store Purchase',
  website: 'Website', cold_outreach: 'Cold Outreach', dm: 'DM',
  tiktok: 'TikTok', youtube: 'YouTube', other: 'Other',
};

function StageChip({ stage }) {
  const s = KANBAN_STAGES.find(s => s.key === stage);
  if (!s) return <span className="text-xs text-muted-foreground">{stage}</span>;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function ScoreBar({ score }) {
  const color = score >= 70 ? 'rgb(var(--success))' : score >= 40 ? 'rgb(var(--warning))' : 'rgb(var(--destructive))';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function LeadListView({ leads, onView, onUpdate, onDelete, search, onSearchChange }) {
  const [sortKey, setSortKey] = useState('created_date');
  const [sortDir, setSortDir] = useState(-1);
  const [selected, setSelected] = useState([]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const sorted = useMemo(() => {
    return [...leads]
      .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
        if (typeof va === 'string') return sortDir * va.localeCompare(vb);
        return sortDir * (va - vb);
      });
  }, [leads, sortKey, sortDir, search]);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === sorted.length ? [] : sorted.map(l => l.id));

  const bulkDelete = () => {
    selected.forEach(id => onDelete(id));
    setSelected([]);
    toast.success(`${selected.length} leads deleted`);
  };

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Phone', 'Source', 'Stage', 'Value', 'Score', 'Last Contact']];
    sorted.forEach(l => rows.push([l.name, l.email, l.phone, l.source, l.stage, l.deal_value, l.lead_score, l.last_contact_date]));
    const csv = rows.map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
    toast.success('Leads exported ✓');
  };

  const SortHeader = ({ col, label }) => (
    <th
      onClick={() => handleSort(col)}
      className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 px-2 cursor-pointer hover:text-foreground whitespace-nowrap select-none"
    >
      <span className="flex items-center gap-1">{label}<ArrowUpDown className="w-2.5 h-2.5 opacity-40" /></span>
    </th>
  );

  return (
    <div>
      {/* Bulk actions bar */}
      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-sidebar rounded-xl text-white text-xs font-semibold">
          <span>{selected.length} selected</span>
          <button onClick={bulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setSelected([])} className="ml-auto text-white/50 hover:text-white">✕</button>
        </div>
      )}

      {/* Export button when none selected */}
      {selected.length === 0 && (
        <div className="flex justify-end mb-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-background">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-muted bg-background">
              <tr>
                <th className="pl-4 pr-2 pb-2">
                  <button onClick={toggleAll}>
                    {selected.length === sorted.length && sorted.length > 0
                      ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </th>
                <SortHeader col="name" label="Lead" />
                <SortHeader col="source" label="Source" />
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 px-2">Stage</th>
                <SortHeader col="lead_score" label="Score" />
                <SortHeader col="deal_value" label="Value" />
                <SortHeader col="last_contact_date" label="Last Contact" />
                <SortHeader col="follow_up_date" label="Follow-up" />
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 px-2">Days</th>
                <th className="pb-2 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-background">
              {sorted.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-sm text-muted-foreground">No leads found</td></tr>
              )}
              {sorted.map(lead => {
                const avatarColors = ['rgb(var(--primary))', 'rgb(var(--warning))', 'rgb(var(--primary))', 'rgb(var(--ai))', 'rgb(var(--success))', '#EC4899'];
                const avatarColor = avatarColors[lead.name.charCodeAt(0) % avatarColors.length];
                const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const followOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date();
                const daysPipeline = lead.created_date ? differenceInDays(new Date(), new Date(lead.created_date)) : 0;
                const lastContact = lead.last_contact_date && isValid(new Date(lead.last_contact_date))
                  ? format(new Date(lead.last_contact_date), 'MMM d')
                  : '—';
                const followUpStr = lead.follow_up_date && isValid(new Date(lead.follow_up_date))
                  ? format(new Date(lead.follow_up_date), 'MMM d')
                  : '—';

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onView(lead)}
                    className="hover:bg-background cursor-pointer transition-colors"
                  >
                    <td className="pl-4 pr-2 py-3" onClick={e => { e.stopPropagation(); toggleSelect(lead.id); }}>
                      {selected.includes(lead.id)
                        ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: avatarColor }}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-xs">{lead.name}</p>
                          {lead.email && <p className="text-[10px] text-muted-foreground">{lead.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="text-[10px] text-foreground">{SOURCE_LABELS[lead.source] || lead.source || '—'}</span>
                    </td>
                    <td className="px-2 py-3"><StageChip stage={lead.stage} /></td>
                    <td className="px-2 py-3 w-24"><ScoreBar score={lead.lead_score || 50} /></td>
                    <td className="px-2 py-3">
                      {lead.deal_value > 0
                        ? <span className="text-xs font-bold text-success">${lead.deal_value.toLocaleString()}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">{lastContact}</td>
                    <td className="px-2 py-3">
                      <span className={cn('text-xs', followOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                        {followOverdue && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                        {followUpStr}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">{daysPipeline}d</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); onView(lead); }}
                        className="text-[10px] font-semibold text-primary hover:text-primary"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}