import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProgramBuilderHeader({
  title,
  onTitleChange,
  isTemplate,
  onTemplateChange,
  onSave,
  onPreview,
  onAssign,
  isSaving,
  canAssign,
  lastSaved
}) {
  const navigate = useNavigate();

  return (
    <div
      className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3 flex-shrink-0"
      style={{ background: 'rgb(var(--sidebar))', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Back */}
      <button
        onClick={() => navigate('/programs')}
        className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Programs</span>
      </button>

      <span className="text-white/20 hidden sm:inline">/</span>

      {/* Title input */}
      <div className="flex-1 min-w-0">
        <Input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Program name..."
          className="border-0 bg-transparent text-white font-semibold text-lg h-auto p-0 focus-visible:ring-0 placeholder:text-white/30"
          style={{ fontSize: 17 }}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Template checkbox */}
        <label className="hidden sm:flex items-center gap-1.5 cursor-pointer mr-1">
          <input
            type="checkbox"
            checked={isTemplate}
            onChange={e => onTemplateChange(e.target.checked)}
            className="w-3.5 h-3.5 cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-white/50">Template</span>
        </label>

        {lastSaved && (
          <span className="text-xs text-white/30 hidden sm:block">Saved {lastSaved}</span>
        )}

        {canAssign && (
          <button
            onClick={onAssign}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: '0.5px solid rgba(255,255,255,0.2)' }}
          >
            <Users className="w-3.5 h-3.5" /> Assign
          </button>
        )}

        <button
          onClick={onPreview}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '0.5px solid rgba(255,255,255,0.2)' }}
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="h-8 text-xs font-semibold px-4 gap-1.5"
          style={{ background: 'rgb(var(--primary))', color: 'rgb(var(--card))', border: 'none' }}
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save Program'}
        </Button>
      </div>
    </div>
  );
}