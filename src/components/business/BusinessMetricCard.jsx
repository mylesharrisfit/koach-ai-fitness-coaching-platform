import React from 'react';

export default function BusinessMetricCard({ icon: Icon, label, value, sub, subColor, iconColor, iconBg, dark }) {
  if (dark) {
    return (
      <div className="bg-sidebar rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-white/50 font-medium leading-tight">{label}</span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <Icon className="w-4 h-4 text-white/30" />
          </div>
        </div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {sub && <p className="text-xs text-white/40">{sub}</p>}
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground leading-tight">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}