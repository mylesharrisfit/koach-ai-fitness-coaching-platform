import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CONFIDENCE_CONFIG = {
  high:     { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'High confidence' },
  medium:   { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Medium confidence' },
  low:      { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Low confidence' },
  unmapped: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Unmapped — will go to notes' },
};

export default function ImportStep2Mapping({ headers, mapping, confidence, koachFields, onMappingChange, aiLoading }) {
  if (aiLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-gray-700">AI is analyzing your columns…</p>
        <p className="text-xs text-gray-400">This takes a few seconds</p>
      </div>
    );
  }

  const usedFields = new Set(Object.values(mapping).filter(Boolean));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900">Review AI column mapping</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          The AI has proposed a mapping for each column. Adjust any incorrect mappings using the dropdowns.
          Unmapped columns will be stored in client notes.
        </p>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_24px_1fr_100px] gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <div>CSV Column</div>
          <div />
          <div>KOACH Field</div>
          <div>Confidence</div>
        </div>

        <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
          {headers.map((col) => {
            const mapped = mapping[col] || '';
            const conf = confidence[col] || 'unmapped';
            const { icon: Icon, color, bg, label } = CONFIDENCE_CONFIG[conf] || CONFIDENCE_CONFIG.unmapped;

            return (
              <div key={col} className="grid grid-cols-[1fr_24px_1fr_100px] gap-3 items-center px-4 py-2.5">
                {/* CSV column name */}
                <div className="text-sm font-medium text-gray-800 truncate" title={col}>{col}</div>

                {/* Arrow */}
                <div className="text-gray-300 text-xs">→</div>

                {/* KOACH field dropdown */}
                <Select
                  value={mapped || '__unmapped__'}
                  onValueChange={(val) => onMappingChange(col, val === '__unmapped__' ? null : val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select field…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unmapped__">
                      <span className="text-gray-400 italic">Unmapped (→ notes)</span>
                    </SelectItem>
                    {(koachFields || []).map(f => (
                      <SelectItem
                        key={f.key}
                        value={f.key}
                        disabled={usedFields.has(f.key) && mapped !== f.key}
                      >
                        {f.label}
                        {usedFields.has(f.key) && mapped !== f.key && (
                          <span className="text-gray-400 ml-1">(already mapped)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Confidence badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${bg} ${color} w-fit`}>
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{conf}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        {Object.values(mapping).filter(Boolean).length} of {headers.length} columns mapped ·{' '}
        {headers.length - Object.values(mapping).filter(Boolean).length} will be stored in notes
      </p>
    </div>
  );
}