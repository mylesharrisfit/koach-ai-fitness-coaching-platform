import React from 'react';
import { CheckCircle2, AlertTriangle, SkipForward, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ImportStep4Complete({ imported, skipped, flagged, errorLog = [], onDone }) {
  return (
    <div className="text-center space-y-6 py-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
      >
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </motion.div>

      <div>
        <h3 className="text-lg font-bold text-gray-900">Import complete!</h3>
        <p className="text-sm text-gray-500 mt-1">Your clients have been added to KOACH AI.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-600">{imported}</p>
          <p className="text-xs text-emerald-600 font-medium">Imported</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <SkipForward className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-600">{skipped}</p>
          <p className="text-xs text-amber-600 font-medium">Skipped</p>
          <p className="text-[10px] text-amber-400 mt-0.5">duplicates</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <Flag className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-500">{flagged}</p>
          <p className="text-xs text-red-500 font-medium">Flagged</p>
          <p className="text-[10px] text-red-400 mt-0.5">review manually</p>
        </div>
      </div>

      {errorLog.length > 0 && (
        <div className="text-left bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1 max-h-36 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-semibold text-gray-700">Issues to review</p>
          </div>
          {errorLog.map((e, i) => (
            <p key={i} className="text-xs text-gray-500 font-mono">{e}</p>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-1">
        {skipped > 0 && <p>Skipped clients already existed by email address.</p>}
        {flagged > 0 && <p>Flagged clients had errors — check your Clients list and edit manually.</p>}
      </div>

      <button
        onClick={onDone}
        className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
      >
        View Clients
      </button>
    </div>
  );
}