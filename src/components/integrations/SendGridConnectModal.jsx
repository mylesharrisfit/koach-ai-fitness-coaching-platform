import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ExternalLink, Mail, Loader2, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendEmail, getEmailStats, isSendGridEnabled } from '@/lib/sendgrid';
import { useAuth } from '@/lib/AuthContext';

export default function SendGridConnectModal({ open, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(false);

  const { data: settingsList = [] } = useQuery({
    queryKey: ['coach-settings'],
    queryFn: () => base44.entities.CoachSettings.list(),
  });
  const settings = settingsList[0];
  const isConnected = !!settings?.sendgrid_connected;

  const { data: statsData } = useQuery({
    queryKey: ['sendgrid-stats'],
    queryFn: getEmailStats,
    enabled: isConnected && isSendGridEnabled(),
    staleTime: 10 * 60 * 1000,
  });

  const stats = (() => {
    if (!statsData || !Array.isArray(statsData)) return null;
    const totals = statsData.reduce((acc, day) => {
      const s = day.stats?.[0]?.metrics || {};
      return {
        delivered: (acc.delivered || 0) + (s.delivered || 0),
        opens: (acc.opens || 0) + (s.opens || 0),
        clicks: (acc.clicks || 0) + (s.clicks || 0),
        unsubscribes: (acc.unsubscribes || 0) + (s.unsubscribes || 0),
      };
    }, {});
    return totals;
  })();

  const openRate = stats?.delivered > 0 ? Math.round((stats.opens / stats.delivered) * 100) : 0;
  const clickRate = stats?.delivered > 0 ? Math.round((stats.clicks / stats.delivered) * 100) : 0;

  const saveMutation = useMutation({
    mutationFn: (data) =>
      settings?.id
        ? base44.entities.CoachSettings.update(settings.id, data)
        : base44.entities.CoachSettings.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coach-settings'] }),
  });

  const handleTest = async () => {
    if (!isSendGridEnabled()) {
      return toast.error('VITE_SENDGRID_API_KEY not set in secrets');
    }
    if (!import.meta.env.VITE_SENDGRID_FROM_EMAIL) {
      return toast.error('VITE_SENDGRID_FROM_EMAIL not set in secrets');
    }
    setTesting(true);
    try {
      const result = await sendEmail({
        to: user?.email,
        toName: user?.full_name || 'Coach',
        subject: 'SendGrid Test — KOACH AI ✅',
        html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;"><div style="background:#111827;border-radius:12px;padding:32px;text-align:center;"><h1 style="color:white;font-size:24px;margin:0;">✅ SendGrid Connected!</h1><p style="color:rgba(255,255,255,0.6);margin:8px 0 0;">KOACH AI can now send emails to your clients.</p></div></div>`,
      });
      if (result?.success || result?.errors === undefined) {
        setTestOk(true);
        toast.success('Test email sent! Check your inbox.');
      } else {
        toast.error(result?.errors?.[0]?.message || 'Test failed');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      sendgrid_connected: true,
      sendgrid_from_email: import.meta.env.VITE_SENDGRID_FROM_EMAIL || '',
      sendgrid_from_name: import.meta.env.VITE_SENDGRID_FROM_NAME || 'KOACH AI',
      sendgrid_auto_welcome: true,
    });
    toast.success('SendGrid connected!');
  };

  const handleDisconnect = async () => {
    await saveMutation.mutateAsync({ sendgrid_connected: false });
    toast.success('SendGrid disconnected');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A82E2]/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-[#1A82E2]" />
            </div>
            Connect SendGrid
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Connected</p>
                  {settings?.sendgrid_from_email && (
                    <p className="text-xs text-emerald-600">From: {settings.sendgrid_from_email}</p>
                  )}
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Delivered', value: stats.delivered ?? 0 },
                    { label: 'Open Rate', value: `${openRate}%` },
                    { label: 'Click Rate', value: `${clickRate}%` },
                  ].map(s => (
                    <div key={s.label} className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-center">
                      <p className="text-lg font-bold text-[#111827]">{s.value}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <a href="https://app.sendgrid.com" target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-1.5 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> SendGrid Dashboard
                  </Button>
                </a>
                <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:border-red-200 text-xs"
                  onClick={handleDisconnect} disabled={saveMutation.isPending}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#EEF7FF] border border-[#1A82E2]/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#1A82E2] mb-2">Setup Instructions</p>
                <ol className="text-xs text-[#374151] space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Create a free account at <a href="https://sendgrid.com" target="_blank" className="text-[#1A82E2] underline font-medium">sendgrid.com</a></li>
                  <li>Verify your sender email address</li>
                  <li>Create an API key with <strong>Mail Send</strong> permission</li>
                  <li>Add to Base44 Secrets: <code className="bg-white border border-[#E5E7EB] px-1 rounded font-mono text-[10px]">VITE_SENDGRID_API_KEY</code>, <code className="bg-white border border-[#E5E7EB] px-1 rounded font-mono text-[10px]">VITE_SENDGRID_FROM_EMAIL</code>, <code className="bg-white border border-[#E5E7EB] px-1 rounded font-mono text-[10px]">VITE_SENDGRID_FROM_NAME</code></li>
                </ol>
                <a href="https://app.sendgrid.com/settings/api_keys" target="_blank"
                  className="flex items-center gap-1 text-xs text-[#1A82E2] font-semibold mt-2.5 hover:underline">
                  Open API Keys <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {testOk && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700">Test email sent successfully!</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1 bg-[#1A82E2] hover:bg-[#1568C0]" onClick={handleTest} disabled={testing}>
                  {testing ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Sending test...</> : 'Test Connection'}
                </Button>
                {testOk && (
                  <Button className="flex-1 bg-[#111827] hover:bg-[#1F2A44]" onClick={handleSave}
                    disabled={saveMutation.isPending}>
                    Save & Connect
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}