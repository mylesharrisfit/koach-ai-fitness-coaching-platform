import React from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Salad, Droplets, Footprints } from 'lucide-react';

function LogButton({ icon: IconComp, label, value, max, onIncrement, onDecrement, active, activeColor }) {
  const Icon = IconComp;
  return (
    <div className={cn(
      "bg-card border rounded-2xl p-4 flex flex-col gap-3 transition-all",
      active ? `${activeColor} shadow-sm` : "border-border"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", active ? "text-current" : "text-muted-foreground")} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{value || 0}{max ? `/${max}` : ''}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDecrement}
          className="w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-bold flex items-center justify-center transition-colors"
        >−</button>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          {max && (
            <div
              className={cn("h-full rounded-full transition-all", active ? "bg-current" : "bg-muted-foreground/30")}
              style={{ width: `${Math.min(100, ((value || 0) / max) * 100)}%` }}
            />
          )}
        </div>
        <button
          onClick={onIncrement}
          className="w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-bold flex items-center justify-center transition-colors"
        >+</button>
      </div>
    </div>
  );
}

export default function QuickLog({ log, onChange }) {
  const set = (field, val) => onChange({ ...log, [field]: Math.max(0, val) });

  return (
    <div className="space-y-3">
      <h3 className="font-heading font-semibold text-sm px-1">Quick Log</h3>

      {/* Workout toggle */}
      <button
        onClick={() => set('workout_done', !log?.workout_done)}
        className={cn(
          "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
          log?.workout_done
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card hover:border-primary/30"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
          log?.workout_done ? "bg-primary" : "bg-secondary"
        )}>
          <Dumbbell className={cn("w-5 h-5", log?.workout_done ? "text-primary-foreground" : "text-muted-foreground")} />
        </div>
        <div className="text-left flex-1">
          <p className="font-semibold text-sm">Workout</p>
          <p className="text-xs text-muted-foreground">{log?.workout_done ? "Completed today ✓" : "Tap to mark complete"}</p>
        </div>
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          log?.workout_done ? "bg-primary border-primary" : "border-border"
        )}>
          {log?.workout_done && <span className="text-xs text-primary-foreground font-bold">✓</span>}
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <LogButton icon={Salad} label="Meals" value={log?.meals_logged} max={4} active={log?.meals_logged >= 3} activeColor="border-success/30 text-success" onIncrement={() => set('meals_logged', (log?.meals_logged || 0) + 1)} onDecrement={() => set('meals_logged', (log?.meals_logged || 0) - 1)} />
        <LogButton icon={Droplets} label="Water" value={log?.water_glasses} max={8} active={log?.water_glasses >= 6} activeColor="border-cyan-500/30 text-cyan-500" onIncrement={() => set('water_glasses', (log?.water_glasses || 0) + 1)} onDecrement={() => set('water_glasses', (log?.water_glasses || 0) - 1)} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium">Steps</span>
          </div>
          <span className="text-xs text-muted-foreground">{(log?.steps || 0).toLocaleString()} / 10,000</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
          <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${Math.min(100, ((log?.steps || 0) / 10000) * 100)}%` }} />
        </div>
        <div className="flex gap-2">
          {[1000, 2000, 5000].map(n => (
            <button key={n} onClick={() => set('steps', (log?.steps || 0) + n)}
              className="flex-1 py-1.5 text-xs rounded-xl bg-secondary/50 hover:bg-warning/10 hover:text-warning transition-colors font-medium">
              +{n.toLocaleString()}
            </button>
          ))}
          <button onClick={() => set('steps', 0)} className="px-2 py-1.5 text-xs rounded-xl bg-secondary/30 text-muted-foreground hover:text-destructive transition-colors">Reset</button>
        </div>
      </div>
    </div>
  );
}