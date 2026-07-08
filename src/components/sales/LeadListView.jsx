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
  if (!s) return <span className="text-xs text-[#9CA3AF]">{stage}</span>;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function ScoreBar({ score }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
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
      className="text-left text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] pb-2 px-2 cursor-pointer hover:text-[#374151] whitespace-nowrap select-none"
    >
      <span className="flex items-center gap-1">{label}<ArrowUpDown className="w-2.5 h-2.5 opacity-40" /></span>
    </th>
  );

  return (
    <div>
      {/* Bulk actions bar */}
      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-[#111827] rounded-xl text-white text-xs font-semibold">
          <span>{selected.length} selected</span>
          <button onClick={bulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30">
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
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#374151] px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#F3F4F6] bg-[#F9FAFB]">
              <tr>
                <th className="pl-4 pr-2 pb-2">
                  <button onClick={toggleAll}>
                    {selected.length === sorted.length && sorted.length > 0
                      ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                      : <Square className="w-3.5 h-3.5 text-[#D1D5DB]" />}
                  </button>
                </th>
                <SortHeader col="name" label="Lead" />
                <SortHeader col="source" label="Source" />
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] pb-2 px-2">Stage</th>
                <SortHeader col="lead_score" label="Score" />
                <SortHeader col="deal_value" label="Value" />
                <SortHeader col="last_contact_date" label="Last Contact" />
                <SortHeader col="follow_up_date" label="Follow-up" />
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] pb-2 px-2">Days</th>
                <th className="pb-2 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {sorted.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-sm text-[#9CA3AF]">No leads found</td></tr>
              )}
              {sorted.map(lead => {
                const avatarColors = ['#6366F1', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'];
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
                    className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  >
                    <td className="pl-4 pr-2 py-3" onClick={e => { e.stopPropagation(); toggleSelect(lead.id); }}>
                      {selected.includes(lead.id)
                        ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                        : <Square className="w-3.5 h-3.5 text-[#D1D5DB]" />}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: avatarColor }}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-[#111827] text-xs">{lead.name}</p>
                          {lead.email && <p className="text-[10px] text-[#9CA3AF]">{lead.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="text-[10px] text-[#374151]">{SOURCE_LABELS[lead.source] || lead.source || '—'}</span>
                    </td>
                    <td className="px-2 py-3"><StageChip stage={lead.stage} /></td>
                    <td className="px-2 py-3 w-24"><ScoreBar score={lead.lead_score || 50} /></td>
                    <td className="px-2 py-3">
                      {lead.deal_value > 0
                        ? <span className="text-xs font-bold text-emerald-600">${lead.deal_value.toLocaleString()}</span>
                        : <span className="text-[#D1D5DB]">—</span>}
                    </td>
                    <td className="px-2 py-3 text-xs text-[#6B7280]">{lastContact}</td>
                    <td className="px-2 py-3">
                      <span className={cn('text-xs', followOverdue ? 'text-red-500 font-semibold' : 'text-[#6B7280]')}>
                        {followOverdue && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                        {followUpStr}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-[#9CA3AF]">{daysPipeline}d</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); onView(lead); }}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800"
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