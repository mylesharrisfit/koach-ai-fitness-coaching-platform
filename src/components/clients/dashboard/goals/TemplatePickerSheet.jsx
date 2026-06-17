import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Search, LayoutTemplate } from 'lucide-react';

const TYPE_META = {
  numeric:   { label: 'Numeric',   color: '#2563EB', bg: '#eff6ff' },
  nutrition: { label: 'Nutrition', color: '#16a34a', bg: '#f0fdf4' },
  simple:    { label: 'Simple',    color: '#7c3aed', bg: '#f5f3ff' },
};

export default function TemplatePickerSheet({ onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['goal-templates'],
    queryFn: () => base44.entities.GoalTemplate.list(),
  });

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900">Choose a Template</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full text-sm pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {isLoading && <p className="text-xs text-gray-400 text-center py-6">Loading…</p>}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-10">
              <LayoutTemplate className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                {templates.length === 0 ? 'No templates saved yet.' : 'No templates match your search.'}
              </p>
            </div>
          )}

          {filtered.map(t => {
            const meta = TYPE_META[t.goal_type] || TYPE_META.simple;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="w-full text-left p-3.5 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                </div>
                {/* Quick preview line */}
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {t.goal_type === 'numeric' && t.target_value
                    ? `Target: ${t.target_value} ${t.unit || ''}`
                    : t.goal_type === 'nutrition' && t.calories_target
                    ? `${t.calories_target} kcal · ${t.protein_target ?? 0}g P · ${t.carbs_target ?? 0}g C · ${t.fat_target ?? 0}g F`
                    : t.notes || ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}