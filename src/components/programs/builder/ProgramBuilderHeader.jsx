import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Eye, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  const [charCount, setCharCount] = useState(title.length);

  useEffect(() => {
    setCharCount(title.length);
  }, [title]);

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-[#E7EAF3] flex items-center gap-4 px-4 sm:px-6 py-4 shadow-sm">
      {/* Back button */}
      <button
        onClick={() => navigate('/programs')}
        className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#1F2A44] transition-colors flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Programs</span>
      </button>

      <span className="text-[#D1D5DB] hidden sm:inline">/</span>

      {/* Program name input */}
      <div className="flex-1 min-w-0">
        <Input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Program name..."
          className="border-0 bg-transparent font-bold text-xl h-auto p-0 focus-visible:ring-0 placeholder:text-[#D1D5DB]"
        />
        <p className="text-xs text-[#9CA3AF] mt-0.5">{charCount} characters</p>
      </div>

      {/* Template toggle + Save info */}
      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F6F7FB]">
          <input
            type="checkbox"
            checked={isTemplate}
            onChange={e => onTemplateChange(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label className="text-xs text-[#6B7280] font-medium cursor-pointer">
            Save as Template
          </label>
        </div>

        {/* Saved timestamp */}
        {lastSaved && (
          <div className="text-xs text-[#9CA3AF] hidden sm:block">
            Saved {lastSaved}
          </div>
        )}

        {/* Action buttons */}
        {canAssign && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAssign}
            className="gap-1.5 border-[#E7EAF3] text-xs h-9 hidden sm:flex"
          >
            <Users className="w-3.5 h-3.5" />
            Assign
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          className="gap-1.5 border-[#E7EAF3] text-xs h-9 hidden sm:flex"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="gap-1.5 h-9 text-xs bg-gradient-to-r from-primary to-blue-600 hover:opacity-90"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}