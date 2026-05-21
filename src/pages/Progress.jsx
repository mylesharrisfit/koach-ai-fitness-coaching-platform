import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subMonths, subYears, isAfter, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ProgressSidebar, { METRIC_CATEGORIES } from '../components/progress/ProgressSidebar';
import ProgressChart from '../components/progress/ProgressChart';
import ProgressStatsRow from '../components/progress/ProgressStatsRow';
import ProgressDataTable from '../components/progress/ProgressDataTable';
import ProgressPhotos from '../components/progress/ProgressPhotos';
import InBodyScanner from '../components/progress/InBodyScanner';

// Resolve nested field paths like "measurements.chest"
function getFieldValue(ci, field) {
  if (!field) return null;
  const parts = field.split('.');
  let val = ci;
  for (const p of parts) val = val?.[p];
  return val ?? null;
}

// Derive computed metrics
function getDerivedValue(ci, key, clientHeight) {
  if (key === 'lean_mass') {
    if (ci.weight == null || ci.body_fat_pct == null) return null;
    return +(ci.weight * (1 - ci.body_fat_pct / 100)).toFixed(1);
  }
  if (key === 'fat_mass') {
    if (ci.weight == null || ci.body_fat_pct == null) return null;
    return +(ci.weight * (ci.body_fat_pct / 100)).toFixed(1);
  }
  if (key === 'bmi') {
    if (ci.weight == null || !clientHeight) return null;
    // parse height like "5'10" or "70in" or plain number as inches
    let inches = parseFloat(clientHeight);
    const feetMatch = clientHeight?.match(/(\d+)'(\d+)/);
    if (feetMatch) inches = parseInt(feetMatch[1]) * 12 + parseInt(feetMatch[2]);
    if (!inches) return null;
    return +((ci.weight / (inches * inches)) * 703).toFixed(1);
  }
  if (key === 'overall_adherence') {
    const t = ci.compliance_training;
    const n = ci.compliance_nutrition;
    if (t == null && n == null) return null;
    const vals = [t, n].filter(v => v != null);
    return +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  }
  return null;
}

function filterByTimeRange(checkIns, range) {
  if (range === 'All') return checkIns;
  const now = new Date();
  const cutoff = range === '1M' ? subMonths(now, 1)
    : range === '3M' ? subMonths(now, 3)
    : range === '6M' ? subMonths(now, 6)
    : subYears(now, 1);
  return checkIns.filter(ci => isAfter(new Date(ci.date), cutoff));
}

const DEFAULT_METRIC = METRIC_CATEGORIES[0].items[0]; // Body Weight

export default function Progress() {
  const [selectedMetric, setSelectedMetric] = useState(DEFAULT_METRIC);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [timeRange, setTimeRange] = useState('3M');
  const [showInBody, setShowInBody] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 500),
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const selectedClient = activeClients.find(c => c.id === selectedClientId) || activeClients[0] || null;
  const effectiveClientId = selectedClient?.id;

  const clientCheckIns = useMemo(() =>
    allCheckIns.filter(ci => ci.client_id === effectiveClientId)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [allCheckIns, effectiveClientId]
  );

  const filteredCheckIns = useMemo(() =>
    filterByTimeRange(clientCheckIns, timeRange),
    [clientCheckIns, timeRange]
  );

  // Build chart data for the selected metric
  const chartData = useMemo(() => {
    return filteredCheckIns
      .map(ci => {
        const value = selectedMetric.derived
          ? getDerivedValue(ci, selectedMetric.key, selectedClient?.height)
          : getFieldValue(ci, selectedMetric.field);
        if (value == null) return null;
        return {
          date: format(new Date(ci.date), 'MMM d'),
          rawDate: ci.date,
          value: +value,
          notes: ci.notes,
        };
      })
      .filter(Boolean);
  }, [filteredCheckIns, selectedMetric, selectedClient]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckIn.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checkins'] }),
  });

  const handleLog = ({ value, date, notes }) => {
    if (!effectiveClientId) return;
    const payload = {
      client_id: effectiveClientId,
      client_name: selectedClient?.name || '',
      date,
      notes,
    };
    // Map metric key to checkin field
    if (!selectedMetric.derived && selectedMetric.field && !selectedMetric.field.includes('.')) {
      payload[selectedMetric.field] = value;
    } else if (selectedMetric.field?.includes('.')) {
      const [parent, child] = selectedMetric.field.split('.');
      payload[parent] = { [child]: value };
    }
    createMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="mx-3 sm:mx-6 mt-3 sm:mt-6 mb-4 rounded-xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)' }}>
        <div>
          <h1 className="text-xl font-semibold text-white">Progress Tracking</h1>
          <p className="text-sm mt-0.5 text-white/50">Client metrics, trends & body composition over time</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInBody(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
          >
            <ScanLine className="w-4 h-4" /> Upload InBody Scan
          </button>
          {/* Client selector */}
          <Select value={selectedClient?.id || ''} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white h-9 text-sm">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {activeClients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* InBody Sheet */}
      <Sheet open={showInBody} onOpenChange={setShowInBody}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold text-[#111827]">InBody Scan Upload</SheetTitle>
            <p className="text-sm text-[#6B7280]">Upload an InBody scan PDF or photo — AI will extract all metrics automatically</p>
          </SheetHeader>
          <InBodyScanner
            preselectedClient={selectedClient}
            onScanSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['checkins'] });
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-3 sm:mx-6 mb-6 rounded-xl border border-[#E5E7EB] bg-white" style={{ minHeight: 600 }}>
        {/* Left sidebar */}
        <ProgressSidebar activeKey={selectedMetric.key} onSelect={setSelectedMetric} />

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Metric title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMetric.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">{selectedMetric.label}</h2>
                  {selectedClient && (
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      {selectedClient.name} · {clientCheckIns.length} total entries
                    </p>
                  )}
                </div>
              </div>

              {!selectedClient ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                    <span className="text-[#2563EB] text-xl">👤</span>
                  </div>
                  <p className="text-[#374151] font-medium">No client selected</p>
                  <p className="text-[#9CA3AF] text-sm">Select an active client from the dropdown above.</p>
                </div>
              ) : (
                <>
                  {/* Chart */}
                  <ProgressChart
                    data={chartData}
                    metric={selectedMetric}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                  />

                  {/* Stats row */}
                  <ProgressStatsRow data={chartData} metric={selectedMetric} />

                  {/* Data table */}
                  <ProgressDataTable
                    data={chartData}
                    metric={selectedMetric}
                    selectedClient={selectedClient}
                    onLog={handleLog}
                  />

                  {/* Progress photos */}
                  <ProgressPhotos checkIns={clientCheckIns} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}