import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { testStripeConnection } from '@/lib/stripe';

export default function StripeConnectModal({ open, onClose }) {
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testStripeConnection();
      if (result?.ok) {
        setConnected(true);
        setAccountInfo(result);
        toast.success(`Connected to Stripe${result.email ? ` as ${result.email}` : ''}!`);
      } else {
        toast.error('Could not connect — check your STRIPE_SECRET_KEY secret');
      }
    } catch {
      toast.error('Connection failed — make sure STRIPE_SECRET_KEY is set in your secrets');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#635BFF]" />
            </div>
            Stripe Integration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {connected && accountInfo ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Connected</p>
                {accountInfo.email && <p className="text-xs text-emerald-600">{accountInfo.email}</p>}
                {accountInfo.display_name && <p className="text-xs text-emerald-600">{accountInfo.display_name}</p>}
              </div>
            </div>
          ) : null}

          {/* Setup instructions */}
          <div className="bg-[#F5F4FF] border border-[#635BFF]/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-[#635BFF] mb-2">Setup Instructions</p>
            <ol className="text-xs text-[#374151] space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="text-[#635BFF] underline font-medium">dashboard.stripe.com/apikeys</a></li>
              <li>Copy your <strong>Secret key</strong> (sk_live_... or sk_test_...)</li>
              <li>In Base44 → Settings → Secrets, add <strong>STRIPE_SECRET_KEY</strong></li>
              <li>Click "Test Connection" below to verify</li>
            </ol>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              className="flex items-center gap-1 text-xs text-[#635BFF] font-semibold mt-2.5 hover:underline"
            >
              Open Stripe Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
            <p className="text-xs font-semibold text-[#374151] mb-1">Secret already set?</p>
            <p className="text-xs text-[#6B7280]">
              If you've already added <code className="font-mono bg-white border border-[#E5E7EB] px-1 rounded text-[10px]">STRIPE_SECRET_KEY</code> to your secrets, click Test Connection below.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-[#635BFF] hover:bg-[#5850EA]"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Testing...</>
              ) : (
                'Test Connection'
              )}
            </Button>
            <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Stripe
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}