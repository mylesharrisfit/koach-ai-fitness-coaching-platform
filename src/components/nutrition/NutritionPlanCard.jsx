import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MoreHorizontal, Pencil, Users, Copy, Trash2, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NutritionPlanDetailModal from './NutritionPlanDetailModal';
import { getFoodImageUrl } from '@/lib/foodImages';

const ACCENTS = [
  { bar: 'bg-blue-500',   ring: 'ring-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-600'   },
  { bar: 'bg-orange-500', ring: 'ring-orange-200',  bg: 'bg-orange-50', text: 'text-orange-600' },
  { bar: 'bg-emerald-500',ring: 'ring-emerald-200', bg: 'bg-emerald-50',text: 'text-emerald-600'},
  { bar: 'bg-purple-500', ring: 'ring-purple-200',  bg: 'bg-purple-50', text: 'text-purple-600' },
  { bar: 'bg-amber-500',  ring: 'ring-amber-200',   bg: 'bg-amber-50',  text: 'text-amber-600'  },
];

function getAccent(index) {
  return ACCENTS[index % ACCENTS.length];
}

function PlanBadge({ plan }) {
  if (plan.is_template) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">Template</span>;
  }
  if (plan.tracking_mode === 'habits') {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Habit Mode</span>;
  }
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Macro Tracking</span>;
}

function MacroChip({ label, value, unit = '', color }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className={cn('text-xs font-bold leading-none', color)}>{value ?? '—'}{unit}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function AdherenceBar({ rate }) {
  if (rate == null) {
    return <p className="text-[11px] text-muted-foreground italic">Not configured yet</p>;
  }
  const pct = Math.min(Math.max(rate, 0), 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-medium">Adherence</span>
        <span className={cn('text-[11px] font-bold', textColor)}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function DropdownMenu({ onEdit, onAssign, onDuplicate, onDelete, onClose }) {
  return (
    <div
      className="absolute top-8 right-0 z-20 w-44 bg-white border border-[#E7EAF3] rounded-xl shadow-lg py-1 overflow-hidden"
      onMouseLeave={onClose}
    >
      {[
        { icon: Pencil,  label: 'Edit Plan',       action: onEdit,      style: '' },
        { icon: Users,   label: 'Assign Clients',  action: onAssign,    style: '' },
        { icon: Copy,    label: 'Duplicate',        action: onDuplicate, style: '' },
        { icon: Trash2,  label: 'Delete',           action: onDelete,    style: 'text-destructive' },
      ].map(({ icon: Icon, label, action, style }) => (
        <button
          key={label}
          onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
          className={cn(
            'flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold hover:bg-secondary/60 transition-colors text-left',
            style || 'text-foreground'
          )}
        >
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function NutritionPlanCard({ plan, index, onEdit, onDuplicate, onDelete, onAssign }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const accent = getAccent(index);
  const isHabits = plan.tracking_mode === 'habits';
  const clientCount = (plan.assigned_clients || []).length;

  const planEmoji = isHabits ? '🥗' : plan.is_template ? '📋' : '🍽️';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
        className="relative bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
      >
        {/* Colored accent bar */}
        <div className={cn('h-1 w-full flex-shrink-0', accent.bar)} />

        {/* Body */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Top row: icon + badge + menu */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-lg ring-2', accent.bg, accent.ring)}>
                {planEmoji}
              </div>
              <PlanBadge plan={plan} />
              {plan.is_ai_generated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1">
                  ✦ AI
                </span>
              )}
            </div>

            {/* "..." menu */}
            <div className="relative">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered || menuOpen ? 1 : 0 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
              {menuOpen && (
                <DropdownMenu
                  onEdit={onEdit}
                  onAssign={onAssign}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Title + description */}
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground leading-tight line-clamp-1">{plan.title}</h3>
            {plan.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{plan.description}</p>
            )}
          </div>

          {/* Macro chips — hidden for habit mode */}
          {!isHabits && (
            <div className="flex items-center justify-between bg-secondary/40 rounded-xl px-3 py-2">
              <MacroChip label="kcal"    value={plan.calories}  unit=""  color="text-orange-500" />
              <div className="w-px h-6 bg-border" />
              <MacroChip label="protein" value={plan.protein_g} unit="g" color="text-red-500" />
              <div className="w-px h-6 bg-border" />
              <MacroChip label="carbs"   value={plan.carbs_g}   unit="g" color="text-amber-500" />
              <div className="w-px h-6 bg-border" />
              <MacroChip label="fats"    value={plan.fats_g}    unit="g" color="text-blue-500" />
            </div>
          )}

          {/* Adherence bar */}
          <AdherenceBar rate={plan.adherence_rate ?? null} />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#F1F4FA] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{clientCount} {clientCount === 1 ? 'client' : 'clients'}</span>
            {plan.meals?.[0]?.foods?.slice(0, 3).map((food, i) => (
              <img
                key={i}
                src={getFoodImageUrl(food.name || food.food_name, 32)}
                alt={food.name || food.food_name}
                loading="lazy"
                className="w-6 h-6 rounded-full object-cover border-2 border-white -ml-1 first:ml-1"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>

          {/* View Plan → hover reveal */}
          <motion.button
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 4 }}
            transition={{ duration: 0.15 }}
            onClick={() => setDetailOpen(true)}
            className={cn('flex items-center gap-1 text-xs font-semibold transition-colors', accent.text)}
          >
            View Plan <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </motion.div>

      <NutritionPlanDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        plan={plan}
        onEdit={onEdit}
      />
    </>
  );
}