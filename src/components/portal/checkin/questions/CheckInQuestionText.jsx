import React from 'react';

export default function CheckInQuestionText({ value, onChange, multiline = true, placeholder = '' }) {
  const MAX = 1000;
  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={`Share your ${placeholder.toLowerCase() || 'thoughts'}...`}
          rows={6}
          maxLength={MAX}
          className="w-full px-4 py-4 rounded-2xl text-white text-sm leading-relaxed resize-none focus:outline-none placeholder-white/20"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px' }}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-4 rounded-2xl text-white text-sm focus:outline-none placeholder-white/20"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px' }}
        />
      )}
      <p className="text-right text-white/20 text-[10px]">{(value || '').length}/{MAX}</p>
      <p className="text-white/20 text-xs text-center mt-2">Tap outside to dismiss keyboard</p>
    </div>
  );
}