import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ImportStep1Upload from './ImportStep1Upload';
import ImportStep2Mapping from './ImportStep2Mapping';
import ImportStep3Review from './ImportStep3Review';
import ImportStep4Complete from './ImportStep4Complete';

const STEPS = ['Upload', 'Map Columns', 'Review', 'Done'];

export default function ImportClientsModal({ open, onOpenChange, existingEmails = [], onImportComplete }) {
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState(null);       // { headers, rows, fileName }
  const [jobId, setJobId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mapping, setMapping] = useState({});
  const [confidence, setConfidence] = useState({});
  const [koachFields, setKoachFields] = useState([]);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null);        // { imported, skipped, flagged, error_log }

  const reset = () => {
    setStep(0);
    setParsed(null);
    setJobId(null);
    setAiLoading(false);
    setMapping({});
    setConfidence({});
    setKoachFields([]);
    setCommitting(false);
    setResult(null);
  };

  const handleClose = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  // Step 1 → 2: file parsed, create job + run AI mapping
  const handleParsed = useCallback(async ({ headers, rows, fileName }) => {
    setParsed({ headers, rows, fileName });
    setStep(1);
    setAiLoading(true);

    try {
      // Create staging job
      const job = await base44.entities.ClientImportJob.create({
        coach_id: 'me',
        status: 'pending',
        file_name: fileName,
        headers,
        sample_rows: rows.slice(0, 5),
        all_rows: rows,
        total_rows: rows.length,
      });
      setJobId(job.id);

      // Run AI mapping
      const res = await base44.functions.invoke('mapImportColumns', {
        headers,
        sample_rows: rows.slice(0, 5),
      });

      setMapping(res.data.mapping || {});
      setConfidence(res.data.confidence || {});
      setKoachFields(res.data.koach_fields || []);

      // Update job with mapping
      await base44.entities.ClientImportJob.update(job.id, {
        status: 'mapped',
        column_mapping: res.data.mapping || {},
        mapping_confidence: res.data.confidence || {},
      });
    } catch (e) {
      toast.error('AI mapping failed: ' + e.message);
    }
    setAiLoading(false);
  }, []);

  const handleMappingChange = (csvCol, koachField) => {
    setMapping(prev => ({ ...prev, [csvCol]: koachField }));
    if (koachField) {
      setConfidence(prev => ({ ...prev, [csvCol]: prev[csvCol] === 'unmapped' ? 'medium' : prev[csvCol] }));
    } else {
      setConfidence(prev => ({ ...prev, [csvCol]: 'unmapped' }));
    }
  };

  // Step 2 → 3: save mapping to job
  const handleMappingConfirm = async () => {
    if (jobId) {
      await base44.entities.ClientImportJob.update(jobId, {
        column_mapping: mapping,
        mapping_confidence: confidence,
      });
    }
    setStep(2);
  };

  // Step 3 → 4: confirm + commit
  const handleConfirmImport = async () => {
    setCommitting(true);
    try {
      // Mark job as confirmed
      if (jobId) {
        await base44.entities.ClientImportJob.update(jobId, { status: 'confirmed' });
      }

      // Run commit
      const res = await base44.functions.invoke('commitClientImport', { job_id: jobId });
      if (res.data?.error) throw new Error(res.data.error);

      setResult(res.data);
      setStep(3);
      onImportComplete?.();
    } catch (e) {
      toast.error('Import failed: ' + e.message);
    }
    setCommitting(false);
  };

  const stepTitles = ['Upload CSV', 'Map Columns', 'Review & Confirm', 'Import Complete'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/*
        DialogContent gets p-0, no gap, overflow-hidden, and a hard max-height.
        Inside we place a plain div that is the true flex column — this escapes
        any internal DialogContent styles that could fight flex-1 on children.
      */}
      <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden" style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}>

        {/* ── HEADER (fixed) ── */}
        <div style={{ flexShrink: 0 }} className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {step > 0 && step < 3 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  disabled={committing}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <DialogTitle className="text-base font-bold text-gray-900">
                Import Clients from CSV
              </DialogTitle>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  i === step
                    ? 'bg-blue-100 text-blue-700'
                    : i < step
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-gray-50 text-gray-400'
                }`}>
                  <span>{i < step ? '✓' : i + 1}</span>
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${i < step ? 'bg-emerald-300' : 'bg-gray-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── BODY (scrollable) ── */}
        <div style={{ flex: '1 1 0', overflowY: 'auto', minHeight: 0 }} className="px-6 py-4">
          {step === 0 && <ImportStep1Upload onParsed={handleParsed} />}
          {step === 1 && (
            <ImportStep2Mapping
              headers={parsed?.headers || []}
              mapping={mapping}
              confidence={confidence}
              koachFields={koachFields}
              onMappingChange={handleMappingChange}
              aiLoading={aiLoading}
            />
          )}
          {step === 2 && (
            <ImportStep3Review
              headers={parsed?.headers || []}
              rows={parsed?.rows || []}
              mapping={mapping}
              existingEmails={existingEmails}
            />
          )}
          {step === 3 && result && (
            <ImportStep4Complete
              imported={result.imported}
              skipped={result.skipped}
              flagged={result.flagged}
              errorLog={result.error_log || []}
              onDone={() => handleClose(false)}
            />
          )}
        </div>

        {/* ── FOOTER (fixed) ── */}
        {step < 3 && (
          <div style={{ flexShrink: 0 }} className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              {step === 1 && !aiLoading && (
                <p className="text-xs text-gray-400">{parsed?.rows?.length || 0} rows · {parsed?.headers?.length || 0} columns</p>
              )}
              {step === 2 && (
                <p className="text-xs text-gray-400">{parsed?.rows?.length || 0} clients ready to import</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step === 1 && !aiLoading && (
                <Button onClick={handleMappingConfirm} size="sm">
                  Continue to Review →
                </Button>
              )}
              {step === 2 && (
                <Button
                  onClick={handleConfirmImport}
                  disabled={committing}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {committing ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Importing…</>
                  ) : (
                    '✓ Confirm Import'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}