import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Pencil, Users, Copy, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import NutritionPlanDetailModal from './NutritionPlanDetailModal';
import { getFoodImageUrl } from '@/lib/foodImages';

function PlanBadge({ plan }) {
  const label = plan.is_template ? 'Template' : plan.tracking_mode === 'habits' ? 'Habit Mode' : 'Macro Tracking';
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-foreground border border-border">
      {label}
    </span>
  );
}

function MacroRow({ plan }) {
  if (plan.tracking_mode === 'habits') return null;
  const items = [
    { label: 'kcal',    value: plan.calories },
    { label: 'protein', value: plan.protein_g, unit: 'g' },
    { label: 'carbs',   value: plan.carbs_g,   unit: 'g' },
    { label: 'fats',    value: plan.fats_g,    unit: 'g' },
  ].filter(i => i.value);
  if (!items.length) return null;
  return (
    <div className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2">
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <div className="w-px h-4 bg-border" />}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-foreground">{item.value}{item.unit || ''}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function DropdownMenu({ onEdit, onAssign, onDuplicate, onDelete, onClose }) {
  return (
    <div
      className="absolute top-8 right-0 z-20 w-44 bg-card border border-border rounded-xl shadow-sm py-1 overflow-hidden"
      onMouseLeave={onClose}
    >
      {[
        { icon: Pencil, label: 'Edit Plan',      action: onEdit,      style: '' },
        { icon: Users,  label: 'Assign Clients', action: onAssign,    style: '' },
        { icon: Copy,   label: 'Duplicate',       action: onDuplicate, style: '' },
        { icon: Trash2, label: 'Delete',          action: onDelete,    style: 'text-destructive' },
      ].map(({ icon: Icon, label, action, style }) => (
        <button
          key={label}
          onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
          className={cn('flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium hover:bg-background transition-colors text-left', style || 'text-foreground')}
        >
          <Icon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
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
  const clientCount = (plan.assigned_clients || []).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.04 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
        className="relative bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground transition-colors duration-150 flex flex-col"
      >
        {/* Body */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <PlanBadge plan={plan} />
            <div className="relative">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered || menuOpen ? 1 : 0 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
            <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-1">{plan.title}</h3>
            {plan.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{plan.description}</p>
            )}
          </div>

          <MacroRow plan={plan} />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{clientCount} {clientCount === 1 ? 'client' : 'clients'}</span>
            {plan.meals?.[0]?.foods?.slice(0, 3).map((food, i) => (
              <img
                key={i}
                src={getFoodImageUrl(food.name || food.food_name, 32)}
                alt={food.name || food.food_name}
                loading="lazy"
                className="w-5 h-5 rounded-full object-cover border border-white -ml-1 first:ml-1"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setDetailOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary transition-colors"
          >
            View <ArrowRight className="w-3 h-3" />
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