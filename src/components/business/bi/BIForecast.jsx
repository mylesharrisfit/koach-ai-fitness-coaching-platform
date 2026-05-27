import React, { useState, useMemo } from 'react';
import { TrendingUp, Minus, TrendingDown, Sliders } from 'lucide-react';

const SCENARIOS = [
  { key: 'conservative', label: 'Conservative', icon: TrendingDown, color: '#EF4444', churnMult: 1.5, convMult: 0.5 },
  { key: 'base', label: 'Base Case', icon: Minus, color: '#F59E0B', churnMult: 1.0, convMult: 1.0 },
  { key: 'optimistic', label: 'Optimistic', icon: TrendingUp, color: '#22C55E', churnMult: 0.5, convMult: 1.5 },
];

export default function BIForecast({ clients, leads }) {
  const [activeScenario, setActiveScenario] = useState('base');
  const [whatIfLeads, setWhatIfLeads] = useState(0);
  const [whatIfChurn, setWhatIfChurn] = useState(0);
  const [whatIfPriceIncrease, setWhatIfPriceIncrease] = useState(0);

  const activeClients = useMemo(() => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'), [clients]);
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [activeClients]);
  const avgRate = activeClients.length > 0 ? mrr / activeClients.length : 0;

  const pipelineLeads = leads.filter(l => l.stage === 'lead' || l.stage === 'booked');
  const convertedLeads = leads.filter(l => l.stage === 'active_client');
  const conversionRate = leads.length > 0 ? convertedLeads.length / leads.length : 0.3;
  const avgLeadValue = pipelineLeads.length > 0
    ? pipelineLeads.reduce((s, l) => s + (l.deal_value || avgRate), 0) / pipelineLeads.length
    : avgRate;

  const scenario = SCENARIOS.find(s => s.key === activeScenario);

  const forecast = useMemo(() => {
    const months = [30, 60, 90];
    return months.map(days => {
      const monthFraction = days / 30;
      const expectedChurnCount = Math.max(0, (activeClients.length * 0.05 * scenario.churnMult * monthFraction));
      const expectedNewClients = pipelineLeads.length * conversionRate * scenario.convMult * Math.min(monthFraction, 1);
      const whatIfNew = whatIfLeads * (avgLeadValue || avgRate);
      const whatIfChurnLoss = whatIfChurn * avgRate;
      const priceBoost = mrr * (whatIfPriceIncrease / 100);

      const projectedMrr = mrr
        + (expectedNewClients * avgRate)
        - (expectedChurnCount * avgRate)
        + whatIfNew
        - whatIfChurnLoss
        + priceBoost;

      return {
        label: `${days}d`,
        mrr: Math.max(0, Math.round(projectedMrr)),
        change: Math.round(projectedMrr - mrr),
      };
    });
  }, [activeScenario, whatIfLeads, whatIfChurn, whatIfPriceIncrease, mrr, activeClients, pipelineLeads, conversionRate, avgRate, avgLeadValue]);

  const ScenarioIcon = scenario.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Revenue Forecast</h3>
          <p className="text-xs text-gray-400 mt-0.5">30 / 60 / 90 day projections</p>
        </div>
        <div className="flex gap-1">
          {SCENARIOS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => setActiveScenario(s.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${activeScenario === s.key ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={activeScenario === s.key ? { background: s.color } : {}}>
                <Icon className="w-3 h-3" /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {forecast.map(f => (
          <div key={f.label} className="text-center p-3 rounded-xl border" style={{ borderColor: `${scenario.color}30`, background: `${scenario.color}08` }}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{f.label}</p>
            <p className="text-lg font-bold" style={{ color: scenario.color }}>${f.mrr.toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: f.change >= 0 ? '#22C55E' : '#EF4444' }}>
              {f.change >= 0 ? '+' : ''}{f.change.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs font-bold text-gray-700">What-if Scenarios</p>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Convert extra leads', value: whatIfLeads, setter: setWhatIfLeads, max: 10, unit: 'leads', hint: `+$${Math.round(whatIfLeads * avgLeadValue).toLocaleString()}/mo` },
            { label: 'Expected client losses', value: whatIfChurn, setter: setWhatIfChurn, max: 10, unit: 'clients', hint: `-$${Math.round(whatIfChurn * avgRate).toLocaleString()}/mo`, negative: true },
            { label: 'Price increase', value: whatIfPriceIncrease, setter: setWhatIfPriceIncrease, max: 50, unit: '%', hint: `+$${Math.round(mrr * (whatIfPriceIncrease / 100)).toLocaleString()}/mo` },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <p className="text-xs text-gray-600 w-32 flex-shrink-0">{item.label}</p>
              <input type="range" min={0} max={item.max} value={item.value}
                onChange={e => item.setter(Number(e.target.value))}
                className="flex-1 accent-primary h-1" />
              <span className="text-xs font-bold text-gray-700 w-8 text-right">{item.value}{item.unit === '%' ? '%' : ''}</span>
              <span className="text-[10px] font-semibold w-20 text-right" style={{ color: item.negative ? '#EF4444' : '#22C55E' }}>{item.hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}