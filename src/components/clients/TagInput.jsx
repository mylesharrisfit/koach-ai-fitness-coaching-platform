import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function TagInput({ tags = [], onChange }) {
  const [inputVal, setInputVal] = useState('');

  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInputVal('');
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 min-h-[40px] border border-input rounded-xl bg-background focus-within:ring-2 focus-within:ring-ring/30 cursor-text" onClick={() => document.getElementById('tag-input-field')?.focus()}>
      {tags.map(tag => (
        <Badge key={tag} variant="secondary" className="text-xs h-6 gap-1 px-2">
          #{tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
            <X className="w-2.5 h-2.5" />
          </button>
        </Badge>
      ))}
      <input
        id="tag-input-field"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputVal && addTag(inputVal)}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter...' : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}