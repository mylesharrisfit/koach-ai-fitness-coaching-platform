import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Pill } from 'lucide-react';

const DEFAULT_MORNING = [
  { name: 'Multivitamin',           dose: '1 serving with breakfast',    why: 'Fills micronutrient gaps from reduced food intake' },
  { name: 'Vitamin D3',             dose: '2,000–5,000 IU',              why: 'Testosterone, immune function, bone health' },
  { name: 'Omega-3 Fish Oil',       dose: '2–3g EPA+DHA',                why: 'Inflammation, joints, brain health, recovery' },
  { name: 'Creatine Monohydrate',   dose: '5g daily (any time)',         why: 'Strength, power output, muscle retention' },
  { name: 'Vitamin C',              dose: '500–1,000mg',                 why: 'Immune support, antioxidant, collagen synthesis' },
];

const DEFAULT_NIGHT = [
  { name: 'Magnesium Glycinate',    dose: '200–400mg before bed',        why: 'Sleep quality, muscle recovery, stress reduction' },
  { name: 'Zinc',                   dose: '15–30mg with food',           why: 'Testosterone, immune health, protein synthesis' },
  { name: 'Ashwagandha KSM-66',     dose: '300–600mg before bed',        why: 'Cortisol reduction, sleep quality, testosterone support' },
];

function normalizeSupplements(raw) {
  if (!raw || raw.length === 0) return { morning: DEFAULT_MORNING, night: DEFAULT_NIGHT };
  const hasTiming = raw.some(s => s.timing || s.time_of_day);
  if (!hasTiming) return { morning: DEFAULT_MORNING, night: DEFAULT_NIGHT };

  const morning = raw
    .filter(s => ['Morning','morning'].includes(s.timing || s.time_of_day))
    .map(s => ({ name: s.name, dose: s.dosage || s.dose || '', why: s.purpose || s.why || '' }));
  const night = raw
    .filter(s => ['Night','night','Before Bed'].includes(s.timing || s.time_of_day))
    .map(s => ({ name: s.name, dose: s.dosage || s.dose || '', why: s.purpose || s.why || '' }));

  return {
    morning: morning.length > 0 ? morning : DEFAULT_MORNING,
    night:   night.length > 0   ? night   : DEFAULT_NIGHT,
  };
}

function StackSection({ title, emoji, items, badgeColor }) {
  return (
    <div className="mb-3">
      <p className={`text-xs font-bold uppercase tracking-wide mb-2`}>
        {emoji} {title}
      </p>
      {items.map(item => (
        <div key={item.name} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Pill className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-900 font-bold text-sm">{item.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{title.split(' ')[0]}</span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">{item.dose}</p>
            <p className="text-slate-400 text-xs mt-0.5 italic">{item.why}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SupplementStack({ customSupplements }) {
  const [open, setOpen] = useState(false);
  const { morning, night } = normalizeSupplements(customSupplements);

  return (
    <div className="mx-4 mb-3 bg-white rounded-[18px] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
        <span className="text-xl">💊</span>
        <div className="flex-1 text-left">
          <p className="text-slate-900 font-bold text-sm">Supplement Stack</p>
          <p className="text-slate-400 text-xs mt-0.5">Morning & night protocol</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-300" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-slate-100 px-4 pb-4 overflow-hidden">

            <p className="text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-3 mb-4">
              ⚠️ These are general recommendations. Your coach may adjust these based on your specific needs.
            </p>

            <StackSection title="Morning Stack" emoji="☀️" items={morning} badgeColor="bg-amber-100 text-amber-700" />
            <StackSection title="Night Stack"   emoji="🌙" items={night}   badgeColor="bg-indigo-100 text-indigo-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}