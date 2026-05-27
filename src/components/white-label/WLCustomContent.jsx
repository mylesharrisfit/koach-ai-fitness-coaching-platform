import React from 'react';
import { Plus, X } from 'lucide-react';
import { WLSection, WLRow, WLInput, WLDivider, WLToggle } from './WLHelpers';

export default function WLCustomContent({ s, set, locked, enterpriseLocked }) {
  const pages = s.custom_pages || [];

  const addPage = () => {
    if (pages.length >= 3) return;
    set('custom_pages', [...pages, { id: Date.now().toString(), title: '', slug: '', content: '' }]);
  };
  const updatePage = (id, field, val) => set('custom_pages', pages.map(p => p.id === id ? { ...p, [field]: val } : p));
  const removePage = (id) => set('custom_pages', pages.filter(p => p.id !== id));

  return (
    <WLSection title="Custom Content" emoji="📄"
      description="Add your own terms, policies, and custom pages" locked={locked}>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terms & Policies</p>
      <WLRow label="Terms of Service" hint="Replaces KOACH AI's default terms">
        <div className="space-y-2">
          <WLInput value={s.terms_url} onChange={v => set('terms_url', v)} placeholder="https://yourdomain.com/terms" />
          <textarea value={s.terms_text || ''} onChange={e => set('terms_text', e.target.value)}
            placeholder="Or paste your terms text here..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 resize-none" />
        </div>
        <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ You are responsible for your own terms and privacy policy</p>
      </WLRow>

      <WLRow label="Privacy Policy" hint="Replaces KOACH AI's default privacy policy">
        <div className="space-y-2">
          <WLInput value={s.privacy_url} onChange={v => set('privacy_url', v)} placeholder="https://yourdomain.com/privacy" />
          <textarea value={s.privacy_text || ''} onChange={e => set('privacy_text', e.target.value)}
            placeholder="Or paste your privacy policy here..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 resize-none" />
        </div>
      </WLRow>

      <WLDivider />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Pages</p>
          <p className="text-xs text-slate-400 mt-0.5">Add up to 3 custom pages to your portal {enterpriseLocked && '· Enterprise only'}</p>
        </div>
        {enterpriseLocked && <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Enterprise</span>}
      </div>

      {!enterpriseLocked && (
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">Custom Page</p>
                <button onClick={() => removePage(page.id)} className="text-slate-400 hover:text-red-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <WLInput value={page.title} onChange={v => updatePage(page.id, 'title', v)} placeholder="Page title (e.g. My Coaching Philosophy)" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono flex-shrink-0">portal.app/</span>
                <WLInput value={page.slug} onChange={v => updatePage(page.id, 'slug', v)} placeholder="page-slug" />
              </div>
              <textarea value={page.content} onChange={e => updatePage(page.id, 'content', e.target.value)}
                placeholder="Page content..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 resize-none" />
            </div>
          ))}
          {pages.length < 3 && (
            <button onClick={addPage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4" /> Add Custom Page ({pages.length}/3)
            </button>
          )}
        </div>
      )}

      <WLDivider />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Onboarding Customization</p>
      <WLRow label="Welcome video" hint="Shown to new clients on first login">
        <WLInput value={s.welcome_video_url} onChange={v => set('welcome_video_url', v)} placeholder="https://youtube.com/..." />
      </WLRow>
      <WLRow label="Onboarding headline">
        <WLInput value={s.onboarding_headline} onChange={v => set('onboarding_headline', v)}
          placeholder={`Welcome to ${s.business_name || 'Your Coaching App'}!`} />
      </WLRow>
      <WLRow label="Onboarding subtitle">
        <WLInput value={s.onboarding_subtitle} onChange={v => set('onboarding_subtitle', v)}
          placeholder="Let's set up your profile and get you started on your transformation journey" />
      </WLRow>
    </WLSection>
  );
}