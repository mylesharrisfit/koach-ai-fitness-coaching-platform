import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame, Beef, Wheat, Droplets, Users, Copy, Edit, Trash2,
  MoreHorizontal, Leaf, Zap, Eye, UserPlus, Archive, TrendingUp, TrendingDown
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import NutritionPlanDetailModal from './NutritionPlanDetailModal';

// ── Goal theming ──────────────────────────────────────────────
function getGoalTheme(plan) {
  const title = (plan.title || '').toLowerCase();
  const desc = (plan.description || '').toLowerCase();
  const text = title + ' ' + desc;
  if (text.includes('fat loss') || text.includes('cut') || text.includes('deficit')) {
    return {
      gradient: 'linear-gradient(135deg, rgba(251,113,133,0.08) 0%, rgba(253,186,116,0.06) 100%)',
      topBorder: 'linear-gradient(90deg, #F43F5E, #FB923C)',
      icon: '🔥',
      label: 'Fat Loss',
    };
  }
  if (text.includes('bulk') || text.includes('muscle') || text.includes('gain') || text.includes('mass')) {
    return {
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(147,197,253,0.06) 100%)',
      topBorder: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
      icon: '💪',
      label: 'Muscle Gain',
    };
  }
  if (text.includes('maintain') || text.includes('maintenance')) {
    return {
      gradient: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(110,231,183,0.06) 100%)',
      topBorder: 'linear-gradient(90deg, #22C55E, #4ADE80)',
      icon: '⚖️',
      label: 'Maintenance',
    };
  }
  if (plan.tracking_mode === 'habits') {
    return {
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(110,231,183,0.06) 100%)',
      topBorder: 'linear-gradient(90deg, #10B981, #34D399)',
      icon: '🥗',
      label: 'Habit Mode',
    };
  }
  return {
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(196,181,253,0.06) 100%)',
    topBorder: 'linear-gradient(90deg, #A855F7, #C084FC)',
    icon: '🥗',
    label: 'Custom',
  };
}

// ── Macro pill ────────────────────────────────────────────────
function MacroPill({ label, value, unit = 'g', labelColor, bgClass }) {
  return (
    <div className={`flex flex-col items-center px-2 py-2.5 rounded-xl ${bgClass}`}>
      <p className="text-sm font-extrabold text-foreground leading-none">{value}{unit}</p>
      <p className={`text-[9px] font-bold uppercase tracking-wide mt-1 ${labelColor}`}>{label}</p>
    </div>
  );
}

// ── Adherence bar ─────────────────────────────────────────────
function AdherenceBar({ value = 82, weeklyDelta = null }) {
  const color = value >= 80 ? '#22C55E' : value >= 60 ? '#F59E0B' : '#EF4444';
  const deltaPositive = weeklyDelta !== null && weeklyDelta >= 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-muted-foreground font-medium">Adherence</span>
        <div className="flex items-center gap-1.5">
          {weeklyDelta !== null && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${deltaPositive ? 'text-emerald-500' : 'text-red-400'}`}>
              {deltaPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {deltaPositive ? '+' : ''}{weeklyDelta}% vs last wk
            </span>
          )}
          <span className="text-[11px] font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Assigned clients mini popover ─────────────────────────────
function AssignedClientsChip({ count, clients = [] }) {
  if (count === 0) return (
    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
      <Users className="w-3 h-3" /> 0 clients
    </span>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline">
          <Users className="w-3 h-3" /> {count} client{count !== 1 ? 's' : ''}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="start">
        <p className="text-xs font-bold text-foreground mb-2">Assigned Clients</p>
        {clients.length === 0 ? (
          <p className="text-xs text-muted-foreground">{count} client{count !== 1 ? 's' : ''} assigned</p>
        ) : (
          <div className="space-y-1.5">
            {clients.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                  {c.name?.[0] || '?'}
                </div>
                <span className="text-xs text-foreground truncate">{c.name}</span>
              </div>
            ))}
            {count > 6 && <p className="text-[10px] text-muted-foreground pl-8">+{count - 6} more</p>}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Main card ─────────────────────────────────────────────────
export default function NutritionPlanCard({ plan, onEdit, onDuplicate, onDelete, onAssign, index }) {
  const [showDetail, setShowDetail] = useState(false);
  const isHabits = plan.tracking_mode === 'habits';
  const mealCount = (plan.meals || []).length;
  const theme = getGoalTheme(plan);

  // Placeholder adherence & delta
  const adherence = 72 + (index % 3) * 9;
  const weeklyDelta = [-3, 5, 2][index % 3];

  // Assigned clients placeholder (0 for now — would come from props/query in real usage)
  const assignedCount = 0;

  const updatedAt = plan.updated_date
    ? format(new Date(plan.updated_date), 'MMM d, yyyy')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-[#E7EAF3] hover:border-primary/30 hover:shadow-xl transition-all duration-200 group overflow-hidden cursor-default"
      style={{ background: `${theme.gradient}, #ffffff` }}
    >
      {/* Colored top border */}
      <div className="h-[3px]" style={{ background: theme.topBorder }} />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {isHabits ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Leaf className="w-2.5 h-2.5" /> Habit Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-primary border border-blue-100">
                  <Zap className="w-2.5 h-2.5" /> Macro Tracking
                </span>
              )}
              {plan.is_template && (
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-semibold text-[10px]">Template</span>
              )}
            </div>
            {/* Title */}
            <h3 className="font-heading font-bold text-[#1F2A44] text-[15px] leading-tight">{plan.title}</h3>
            {/* Description */}
            {plan.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
            )}
          </div>
          {/* Goal icon + 3-dot menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xl leading-none select-none">{theme.icon}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" /> Edit Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}><Copy className="w-4 h-4 mr-2" /> Duplicate Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={onAssign}><UserPlus className="w-4 h-4 mr-2" /> Assign to Client</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Archive className="w-4 h-4 mr-2" /> Archive Plan</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete Plan</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Macros */}
        {!isHabits && (
          <div className="grid grid-cols-4 gap-1.5">
            <MacroPill label="Kcal" value={plan.calories || 0} unit="" bgClass="bg-white/80 border border-gray-100" labelColor="text-gray-400" />
            <MacroPill label="Protein" value={plan.protein_g || 0} bgClass="bg-blue-50/70 border border-blue-100" labelColor="text-blue-500" />
            <MacroPill label="Carbs" value={plan.carbs_g || 0} bgClass="bg-orange-50/70 border border-orange-100" labelColor="text-orange-500" />
            <MacroPill label="Fats" value={plan.fats_g || 0} bgClass="bg-yellow-50/70 border border-yellow-100" labelColor="text-yellow-600" />
          </div>
        )}

        {/* Habit bullets */}
        {isHabits && (
          <div className="space-y-1.5">
            {(plan.meals || []).slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{m.habit_description || m.meal_name}</span>
              </div>
            ))}
            {(plan.meals || []).length > 3 && (
              <p className="text-xs text-muted-foreground pl-3.5">+{plan.meals.length - 3} more habits</p>
            )}
          </div>
        )}

        {/* Adherence */}
        <AdherenceBar value={adherence} weeklyDelta={weeklyDelta} />

        {/* Bottom meta row */}
        <div className="flex items-center justify-between">
          <AssignedClientsChip count={assignedCount} clients={[]} />
          <div className="flex items-center gap-2">
            {mealCount === 0 ? (
              <span className="text-[11px] text-orange-500 font-semibold">Not configured yet</span>
            ) : (
              <span className="text-[11px] text-muted-foreground">{mealCount} meal{mealCount !== 1 ? 's' : ''} per day</span>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 text-xs h-8 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white border-0 shadow-sm group-hover:shadow-md transition-shadow"
          onClick={() => setShowDetail(true)}
        >
          <Eye className="w-3.5 h-3.5" /> View Plan
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-xs h-8 group-hover:border-primary/40 group-hover:text-primary transition-colors"
          onClick={onAssign}
        >
          <UserPlus className="w-3.5 h-3.5" /> Assign
        </Button>
      </div>

      {/* Last updated */}
      {updatedAt && (
        <p className="px-5 pb-3 text-[10px] text-muted-foreground/60 text-right -mt-2">Updated {updatedAt}</p>
      )}

      <NutritionPlanDetailModal
        open={showDetail}
        onOpenChange={setShowDetail}
        plan={plan}
        onEdit={() => { setShowDetail(false); onEdit(); }}
        onAssign={() => { setShowDetail(false); onAssign?.(); }}
      />
    </motion.div>
  );
}