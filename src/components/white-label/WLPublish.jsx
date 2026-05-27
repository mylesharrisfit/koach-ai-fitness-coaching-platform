import React from 'react';
import { Rocket, Save, RotateCcw, Eye, History } from 'lucide-react';
import { format } from 'date-fns';

export default function WLPublish({ s, onPublish, onSaveDraft, onRollback, onPreview, publishing, saving }) {
  const history = s.publish_history || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="text-base">🚀</span>
        <h2 className="font-bold text-slate-800 text-sm">Publish Settings</h2>
      </div>
      <div className="p-6 space-y-4">
        {s.is_published && s.published_at && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold text-emerald-700">
              Live since {format(new Date(s.published_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onPublish} disabled={publishing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 4px 16px rgba(37,99,235,0.25)' }}>
            {publishing
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Rocket className="w-4 h-4" />
            }
            Publish Changes
          </button>
          <button onClick={onSaveDraft} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-slate-700 border border-slate-200 text-sm hover:bg-slate-50 transition-colors disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
        </div>

        <button onClick={onPreview}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-blue-600 border border-blue-200 bg-blue-50 text-sm hover:bg-blue-100 transition-colors">
          <Eye className="w-4 h-4" /> Preview Before Publishing
        </button>

        {history.length > 0 && (
          <>
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-slate-500" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Version History</p>
              </div>
              <div className="space-y-2">
                {history.slice(0, 5).map((v, i) => (
                  <div key={v.version || i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Version {v.version}</p>
                      <p className="text-[10px] text-slate-400">{v.published_at ? format(new Date(v.published_at), 'MMM d, h:mm a') : 'Draft'}</p>
                    </div>
                    <button onClick={() => onRollback(v)}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}