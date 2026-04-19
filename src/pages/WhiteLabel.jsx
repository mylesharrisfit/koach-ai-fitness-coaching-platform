import React, { useState } from 'react';
import { Check, Smartphone, Palette, Globe, Zap, Star, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../components/shared/PageHeader';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'starter_brand',
    name: 'Brand Starter',
    price: 49,
    period: '/mo',
    description: 'Your logo & colors in the coach dashboard',
    highlight: false,
    features: [
      'Custom logo & brand colors',
      'Remove FitForge branding',
      'Custom email sender name',
      'Branded client reports',
    ],
  },
  {
    id: 'pro_brand',
    name: 'Pro White Label',
    price: 149,
    period: '/mo',
    description: 'Fully branded mobile app on iOS & Android',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Brand Starter',
      'Custom iOS & Android app',
      'Your app name & icon',
      'App Store & Play Store listing',
      'Custom domain (yourapp.com)',
      'Branded onboarding flow',
      'Push notifications from your brand',
    ],
  },
  {
    id: 'enterprise_brand',
    name: 'Enterprise',
    price: 399,
    period: '/mo',
    description: 'Full platform customization for large coaching businesses',
    highlight: false,
    features: [
      'Everything in Pro White Label',
      'Dedicated account manager',
      'Custom feature development',
      'Priority App Store reviews',
      'Multiple brand workspaces',
      'API access & webhooks',
      'White-glove onboarding',
    ],
  },
];

const PERKS = [
  { icon: Smartphone, title: 'Your App on App Stores', desc: 'Clients download YOUR app — not FitForge. Your brand, your relationship.' },
  { icon: Palette, title: 'Full Brand Control', desc: 'Logo, colors, fonts, email sender — every touchpoint matches your identity.' },
  { icon: Globe, title: 'Custom Domain', desc: 'Use yourcoachingapp.com instead of fitforge.com for a truly premium experience.' },
  { icon: Zap, title: 'Instant Setup', desc: 'Go live in days, not months. We handle the technical heavy lifting.' },
];

export default function WhiteLabel() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({ brand_name: '', app_name: '', primary_color: '#6366f1', website: '', email: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) { toast.error('Please select a plan first'); return; }
    if (!formData.brand_name || !formData.email) { toast.error('Please fill in your brand name and email'); return; }
    setSubmitted(true);
    toast.success('Application submitted! Our team will reach out within 24 hours.');
  };

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto text-center mt-20">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-3">Application Received!</h2>
        <p className="text-muted-foreground mb-2">We'll reach out to <strong>{formData.email}</strong> within 24 hours to get your branded app set up.</p>
        <p className="text-muted-foreground text-sm">Selected plan: <span className="text-primary font-semibold">{PLANS.find(p => p.id === selectedPlan)?.name}</span></p>
        <Button className="mt-8" onClick={() => setSubmitted(false)} variant="outline">Start Over</Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="White Label App"
        subtitle="Launch your own fully branded coaching app — your logo, your domain, your identity."
      />

      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PERKS.map((perk) => (
          <div key={perk.title} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <perk.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm font-heading">{perk.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{perk.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <h2 className="text-xl font-heading font-bold mb-6">Choose Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
              selectedPlan === plan.id
                ? 'border-primary bg-primary/5 shadow-glow-sm'
                : plan.highlight
                ? 'border-primary/30 bg-card'
                : 'border-border bg-card hover:border-primary/20'
            }`}
          >
            {plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3">
                <Star className="w-3 h-3 mr-1" />{plan.badge}
              </Badge>
            )}
            {selectedPlan === plan.id && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <p className="font-heading font-bold text-lg mb-1">{plan.name}</p>
            <p className="text-muted-foreground text-xs mb-4">{plan.description}</p>
            <div className="flex items-end gap-1 mb-5">
              <span className="text-3xl font-heading font-bold">${plan.price}</span>
              <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Application Form */}
      <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg">Brand Setup</h3>
            <p className="text-muted-foreground text-sm">Tell us about your brand and we'll get you set up</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Brand / Business Name *</Label>
            <Input
              value={formData.brand_name}
              onChange={e => setFormData({ ...formData, brand_name: e.target.value })}
              placeholder="e.g., Coach Mike Fitness"
            />
          </div>
          <div className="space-y-1.5">
            <Label>App Name</Label>
            <Input
              value={formData.app_name}
              onChange={e => setFormData({ ...formData, app_name: e.target.value })}
              placeholder="e.g., Mike's Training App"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@yourbrand.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Website (optional)</Label>
            <Input
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://yourbrand.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Primary Brand Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primary_color}
                onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-1"
              />
              <Input
                value={formData.primary_color}
                onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            {!selectedPlan && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Select a plan above to continue
              </p>
            )}
            {selectedPlan && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="text-primary font-semibold">{PLANS.find(p => p.id === selectedPlan)?.name}</span> — ${PLANS.find(p => p.id === selectedPlan)?.price}/mo
              </p>
            )}
            <Button type="submit" className="sm:ml-auto gap-2" disabled={!selectedPlan}>
              Submit Application <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}