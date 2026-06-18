import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Link2, Check, Copy, Users, ChevronRight, X, Sparkles
} from 'lucide-react';
import { hasFeature } from '@/lib/subscription';
import { getMyTeamId } from '@/lib/teamUtils';
import AIOnboardingModal from '@/components/clients/ai-onboarding/AIOnboardingModal';
import AIOnboardingOverviewModal from '@/components/clients/ai-onboarding/AIOnboardingOverviewModal';

export default function OnboardingManager() {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showAIPicker, setShowAIPicker] = useState(false);
  const [aiClient, setAiClient] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const canAIOnboard = hasFeature(user, 'ai_onboarding');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
    enabled: canAIOnboard,
  });

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const onboardingUrl = `https://koachai.net/client-onboarding${user?.email ? `?coach=${encodeURIComponent(user.email)}` : ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(onboardingUrl);
    setCopied(true);
    toast.success('Intake link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div className="bg-[#111827] rounded-xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Client Onboarding</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Send your intake link to prospective clients</p>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#fff', color: '#111827' }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Intake Link'}
        </button>
      </div>

      {/* ── AI Onboarding Premium Card ── */}
      <button
        onClick={() => setShowOverview(true)}
        className="w-full text-left rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] relative"
        style={{ background: 'linear-gradient(135deg, #0E1525 0%, #1a2744 60%, #1e1a3a 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }} />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }} />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-1.5"
                  style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}>
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#A78BFA' }}>Pro &amp; Elite</span>
                </div>
                <p className="text-base font-bold text-white leading-tight">AI Onboarding</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Generate a tailored program + meal plan for any client using AI — you review and approve before anything saves.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {['Training Program', 'Meal Plan', 'Goal-Matched', 'Review & Approve'].map(tag => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {canAIOnboard ? (
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Click to get started →</span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: 'rgba(167,139,250,0.8)' }}>Upgrade to Pro or Elite to unlock →</span>
          )}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: canAIOnboard ? '#10B981' : '#7C3AED' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: canAIOnboard ? '#10B981' : 'rgba(167,139,250,0.7)' }}>
              {canAIOnboard ? 'Available' : 'Pro+'}
            </span>
          </div>
        </div>
      </button>

      {showOverview && (
        <AIOnboardingOverviewModal
          canUse={canAIOnboard}
          onClose={() => setShowOverview(false)}
          onGetStarted={() => { setShowOverview(false); setShowAIPicker(true); }}
          onUpgrade={() => { setShowOverview(false); window.location.href = '/subscription'; }}
        />
      )}

      {/* Client picker panel */}
      {canAIOnboard && showAIPicker && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #0E1525, #1a2744)' }}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4" style={{ color: '#A78BFA' }} />
              <p className="text-sm font-bold text-white">AI Onboarding — Select a Client</p>
            </div>
            <button onClick={() => { setShowAIPicker(false); setAiClient(null); setClientSearch(''); }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Search Client</p>
              <input
                autoFocus
                type="text"
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setAiClient(null); }}
                placeholder="Search clients by name or email…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
              {clientSearch && !aiClient && (
                <div className="mt-1 border border-gray-100 rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-3">No clients found</p>
                  ) : filteredClients.slice(0, 8).map(c => (
                    <button key={c.id}
                      onClick={() => { setAiClient(c); setClientSearch(c.name); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: '#EFF6FF', color: '#2563EB' }}>
                          {c.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {aiClient && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: '#2563EB', color: '#fff' }}>
                    {aiClient.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">{aiClient.name}</p>
                    <p className="text-[10px] text-blue-500">
                      {[aiClient.goal?.replace(/_/g, ' '), aiClient.current_weight && `${aiClient.current_weight} lbs`, aiClient.height].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setAiClient(null); setClientSearch(''); }} className="text-blue-300 hover:text-blue-600 text-xs">✕</button>
              </div>
            )}
            <button
              onClick={() => aiClient && setShowAIModal(true)}
              disabled={!aiClient}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: aiClient ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : '#94A3B8' }}>
              <Sparkles className="w-4 h-4" />
              {aiClient ? `Generate AI Plan for ${aiClient.name}` : 'Select a client to continue'}
            </button>
            <p className="text-center text-[10px] text-gray-400">Nothing is saved until you review and approve</p>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">How it works</p>
        <div className="space-y-2">
          {[
            { n: '1', text: 'Copy your unique intake link below.' },
            { n: '2', text: 'Send it to a prospective client via text, email, or DM.' },
            { n: '3', text: 'Client completes the premium guided onboarding (no account needed yet).' },
            { n: '4', text: 'You\'ll receive an email notification with their details to follow up.' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.n}
              </span>
              <p className="text-xs text-blue-800 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Intake link card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Your Private Intake Link</p>
            <p className="text-xs text-gray-400">Only share with prospective clients — do not post publicly</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <p className="text-xs text-gray-600 flex-1 truncate font-mono">{onboardingUrl}</p>
          <button onClick={copyLink} className="text-blue-500 hover:text-blue-700 flex-shrink-0 p-1">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <Button className="w-full gap-2" onClick={copyLink} variant={copied ? 'secondary' : 'default'}>
          {copied
            ? <><Check className="w-4 h-4" /> Link Copied!</>
            : <><Link2 className="w-4 h-4" /> Copy Intake Link</>}
        </Button>
      </div>

      {/* AI Onboarding Modal */}
      {showAIModal && aiClient && (
        <AIOnboardingModal
          client={aiClient}
          onClose={() => setShowAIModal(false)}
          onSaved={() => {
            setShowAIModal(false);
            setShowAIPicker(false);
            setAiClient(null);
            setClientSearch('');
          }}
        />
      )}
    </div>
  );
}