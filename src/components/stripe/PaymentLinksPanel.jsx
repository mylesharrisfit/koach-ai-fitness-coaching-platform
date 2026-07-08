import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createPaymentLink } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Link, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] text-white text-xs font-semibold hover:bg-[#1F2A44] transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

export default function PaymentLinksPanel() {
  const [form, setForm] = useState({ name: '', amount: '', description: '' });
  const [generatedLink, setGeneratedLink] = useState(null);

  const mutation = useMutation({
    mutationFn: () => createPaymentLink(form.name, parseFloat(form.amount), form.description),
    onSuccess: (data) => {
      if (data?.url) {
        setGeneratedLink(data.url);
        toast.success('Payment link created!');
      } else {
        toast.error(data?.error || 'Failed to create link');
      }
    },
    onError: () => toast.error('Failed to create payment link'),
  });

  const isValid = form.name.trim() && parseFloat(form.amount) > 0;

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
          <Link className="w-3.5 h-3.5 text-[#635BFF]" />
        </div>
        <h3 className="text-sm font-bold text-[#111827]">Create Payment Link</h3>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Product / Service Name *</Label>
          <Input
            className="mt-1"
            placeholder="e.g. 1:1 Coaching Session"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs">Amount (USD) *</Label>
          <Input
            className="mt-1"
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea
            className="mt-1 resize-none"
            rows={2}
            placeholder="Optional description for the payment page..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <Button
          className="w-full bg-[#635BFF] hover:bg-[#5850EA]"
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
        >
          {mutation.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Link className="w-3.5 h-3.5 mr-2" /> Generate Link</>
          )}
        </Button>

        {generatedLink && (
          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5">Payment Link Ready</p>
            <div className="flex items-center gap-2">
              <a
                href={generatedLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#635BFF] truncate flex-1 font-mono hover:underline"
              >
                {generatedLink}
              </a>
              <CopyButton text={generatedLink} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}