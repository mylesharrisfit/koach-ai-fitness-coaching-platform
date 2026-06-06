import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark } from 'lucide-react';
import {
  VITAMINS, VITAMIN_TYPES, VITAMIN_TYPE_COLORS
} from '@/lib/nutritionReferenceData';
import RefSearchBar from './RefSearchBar';
import RefFilterChips from './RefFilterChips';

function VitaminCard({ item, isPortal }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const typeColor = VITAMIN_TYPE_COLORS[item.type] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor.bg} ${typeColor.text}`}>
              {item.type}
            </span>
          </div>
          <p className="font-bold text-sm text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">RDA: {item.rda}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPortal && (
            <button
              onClick={e => { e.stopPropagation(); setSaved(v => !v); }}
              className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-500'}`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-slate-300" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">What it does</p>
                <p className="text-sm text-slate-700 leading-relaxed">{item.what_it_does}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {item.upper && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Upper limit</p>
                    <p className="text-xs text-slate-700">{item.upper}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Best time</p>
                  <p className="text-xs text-slate-700">{item.timing}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">⚠️ Deficiency causes</p>
                <p className="text-xs text-slate-700">{item.deficiency}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">🍽️ Best food sources</p>
                <p className="text-xs text-slate-700">{item.sources}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">🎯 At risk</p>
                <p className="text-xs text-slate-700">{item.at_risk}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.with_food ? 'bg-amber-400' : 'bg-slate-300'}`} />
                <p className="text-xs text-slate-500">{item.with_food ? 'Take with food' : 'Can take on empty stomach'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VitaminsTab({ isPortal = false }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');

  const filtered = useMemo(() => {
    return VITAMINS.filter(v => {
      const matchType = type === 'All' || v.type === type;
      const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.what_it_does.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [search, type]);

  return (
    <div className="space-y-3">
      <RefSearchBar value={search} onChange={setSearch} placeholder="Search vitamins & minerals..." />
      <RefFilterChips options={VITAMIN_TYPES} active={type} onChange={setType} />
      <p className="text-xs text-slate-400">{filtered.length} vitamins & minerals</p>
      <div className="space-y-2">
        {filtered.map(item => (
          <VitaminCard key={item.id} item={item} isPortal={isPortal} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">No vitamins match your search.</p>
        )}
      </div>
    </div>
  );
}