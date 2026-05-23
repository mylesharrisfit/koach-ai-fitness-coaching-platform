import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { sendEmail, sendBulkEmail, isResendEnabled } from '@/lib/sendgrid';
import { templates, TEMPLATE_OPTIONS } from '@/lib/emailTemplates';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, BarChart2, Loader2, CheckCircle2, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendZapierEvent } from '@/lib/zapier';

export default function EmailCenter() {
  const { user } = useAuth();
  const [tab, setTab] = useState('compose');
  const [toMode, setToMode] = useState('single'); // single | all | status
  const [selectedClientId, setSelectedClientId] = useState('');
  const [statusTarget, setStatusTarget] = useState('active');
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [subject, setSubject] = useState('');
  const [customHtml, setCustomHtml] = useState('');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const stats = null; // Stats not available via Resend API in frontend

  const openRate = stats?.delivered > 0 ? Math.round((stats.opens / stats.delivered) * 100) : 0;
  const clickRate = stats?.delivered > 0 ? Math.round((stats.clicks / stats.delivered) * 100) : 0;

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const getPreviewHtml = () => {
    if (selectedTemplate === 'custom') return customHtml;
    const tplFn = templates[selectedTemplate];
    if (!tplFn) return '';
    const client = selectedClient || { name: 'Client Name', email: 'client@example.com' };
    const result = tplFn(client, user, 75);
    return result.html;
  };

  const getPreviewSubject = () => {
    if (selectedTemplate === 'custom') return subject;
    const tplFn = templates[selectedTemplate];
    if (!tplFn) return subject;
    const client = selectedClient || { name: 'Client Name', email: 'client@example.com' };
    return tplFn(client, user, 75).subject;
  };

  const handleSend = async () => {
    if (!isResendEnabled()) return toast.error('Resend not configured. Add VITE_RESEND_API_KEY to secrets.');
    setSending(true);
    try {
      const resolvedSubject = subject || getPreviewSubject();
      const resolvedHtml = getPreviewHtml();

      if (toMode === 'single') {
        if (!selectedClient) return toast.error('Select a client');
        const tpl = selectedTemplate !== 'custom' ? templates[selectedTemplate]?.(selectedClient, user, 75) : { subject: resolvedSubject, html: resolvedHtml };
        await sendEmail({ to: selectedClient.email, toName: selectedClient.name, ...tpl });
        sendZapierEvent('email.sent', { client_id: selectedClient.id, client_name: selectedClient.name, template: selectedTemplate });
        toast.success(`Email sent to ${selectedClient.name}!`);
      } else {
        const targetClients = toMode === 'all' ? clients : clients.filter(c => c.lifecycle_status === statusTarget);
        if (targetClients.length === 0) return toast.error('No clients match this selection');
        const recipients = targetClients.map(c => {
          const tpl = selectedTemplate !== 'custom' ? templates[selectedTemplate]?.(c, user, 75) : { subject: resolvedSubject, html: resolvedHtml };
          return { email: c.email, name: c.name, html: tpl?.html, subject: tpl?.subject };
        }).filter(r => r.email);
        // Send individually to use per-client templates
        for (const r of recipients) {
          await sendEmail({ to: r.email, toName: r.name, subject: r.subject || resolvedSubject, html: r.html || resolvedHtml });
        }
        toast.success(`Email sent to ${recipients.length} clients!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl p-5">
        <h1 className="text-xl font-semibold text-white">Email Center</h1>
        <p className="text-sm mt-0.5 text-white/50">Send automated and manual emails to clients via Resend</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Delivered (30d)', value: stats.delivered ?? 0, icon: Send },
            { label: 'Open Rate', value: `${openRate}%`, icon: Eye },
            { label: 'Click Rate', value: `${clickRate}%`, icon: BarChart2 },
            { label: 'Unsubscribes', value: stats.unsubscribes ?? 0, icon: Users },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4 h-4 text-[#6B7280]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#111827]">{s.value}</p>
                <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Compose */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Mail className="w-4 h-4" /> Compose Email
          </h2>

          {/* To */}
          <div>
            <Label className="text-xs mb-1 block">To</Label>
            <div className="flex gap-1.5 mb-2">
              {[
                { key: 'single', label: 'Single Client' },
                { key: 'all', label: 'All Clients' },
                { key: 'status', label: 'By Status' },
              ].map(m => (
                <button key={m.key} onClick={() => setToMode(m.key)}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                    toMode === m.key ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'
                  )}>
                  {m.label}
                </button>
              ))}
            </div>
            {toMode === 'single' && (
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.email).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {toMode === 'status' && (
              <Select value={statusTarget} onValueChange={setStatusTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['lead', 'active', 'at_risk', 'completed', 'alumni'].map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)} clients</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {toMode === 'all' && (
              <p className="text-xs text-[#6B7280] mt-1">{clients.filter(c => c.email).length} clients with email addresses</p>
            )}
          </div>

          {/* Template */}
          <div>
            <Label className="text-xs mb-1 block">Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_OPTIONS.map(t => (
                  <SelectItem key={t.key} value={t.key}>{t.emoji} {t.label}</SelectItem>
                ))}
                <SelectItem value="custom">✏️ Custom Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject (for custom) */}
          {selectedTemplate === 'custom' && (
            <>
              <div>
                <Label className="text-xs mb-1 block">Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
              </div>
              <div>
                <Label className="text-xs mb-1 block">HTML Body</Label>
                <Textarea value={customHtml} onChange={e => setCustomHtml(e.target.value)}
                  placeholder="<p>Your HTML content...</p>" rows={6} className="font-mono text-xs" />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="gap-1.5 text-xs" onClick={() => setPreview(v => !v)}>
              <Eye className="w-3.5 h-3.5" /> {preview ? 'Hide' : 'Preview'}
            </Button>
            <Button className="flex-1 bg-[#111827] hover:bg-[#1F2A44]" onClick={handleSend} disabled={sending}>
              {sending ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Sending...</> : <><Send className="w-3.5 h-3.5 mr-2" /> Send Email</>}
            </Button>
          </div>
        </div>

        {/* Templates list / Preview */}
        <div className="lg:col-span-2 space-y-4">
          {preview ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <p className="text-xs font-semibold text-[#374151]">Preview</p>
                <p className="text-xs text-[#6B7280] truncate mt-0.5">{getPreviewSubject()}</p>
              </div>
              <div className="p-2 max-h-[500px] overflow-y-auto">
                <iframe
                  srcDoc={getPreviewHtml()}
                  className="w-full min-h-[400px] border-0"
                  title="Email Preview"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Templates</h3>
              <div className="space-y-2">
                {TEMPLATE_OPTIONS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTemplate(t.key)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                      selectedTemplate === t.key
                        ? 'border-[#111827] bg-[#111827] text-white'
                        : 'border-[#E5E7EB] hover:border-[#111827] bg-white'
                    )}
                  >
                    <span className="text-lg leading-none mt-0.5">{t.emoji}</span>
                    <div>
                      <p className={cn('text-xs font-semibold', selectedTemplate === t.key ? 'text-white' : 'text-[#111827]')}>{t.label}</p>
                      <p className={cn('text-[11px] mt-0.5', selectedTemplate === t.key ? 'text-white/60' : 'text-[#9CA3AF]')}>{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}