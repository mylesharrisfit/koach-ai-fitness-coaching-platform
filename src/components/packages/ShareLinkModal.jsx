import React, { useState } from 'react';
import { X, Copy, ExternalLink, Check } from 'lucide-react';

export default function ShareLinkModal({ pkg, onClose }) {
  const [copied, setCopied] = useState(false);
  const slug = pkg.slug || pkg.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'package';
  const url = `${window.location.origin}/packages/${slug}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1010, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'rgb(var(--card))', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgb(var(--muted))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'rgb(var(--foreground))', margin: 0 }}>Share Package</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgb(var(--muted))', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="rgb(var(--muted-foreground))" />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Preview */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgb(var(--muted))', marginBottom: 20 }}>
            <div style={{ height: 80, background: `linear-gradient(135deg, ${pkg.color_theme || 'rgb(var(--primary))'}, ${pkg.color_theme || 'rgb(var(--ai))'}99)`, position: 'relative' }}>
              {pkg.image_url && <img src={pkg.image_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />}
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(var(--foreground))' }}>{pkg.name}</div>
              <div style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))', marginTop: 2 }}>{pkg.description}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'rgb(var(--foreground))', marginTop: 6 }}>
                ${pkg.price}{pkg.billing_type !== 'one_time' ? `/${pkg.billing_type === 'monthly' ? 'mo' : pkg.billing_type === 'quarterly' ? 'qtr' : 'yr'}` : ''}
              </div>
            </div>
          </div>

          {/* URL */}
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
            Package Link
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgb(var(--background))', border: '1.5px solid rgb(var(--border))', fontSize: 13, color: 'rgb(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {url}
            </div>
            <button onClick={copy}
              style={{ padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: copied ? 'rgb(var(--success))' : 'rgb(var(--accent))', color: copied ? 'rgb(var(--success))' : 'rgb(var(--primary))', border: `1.5px solid ${copied ? 'rgb(var(--success))' : 'rgb(var(--accent))'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'all 0.2s' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <a href={url} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', color: 'rgb(var(--card))', textDecoration: 'none' }}>
              <ExternalLink size={14} /> Preview Landing Page
            </a>
          </div>

          <p style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))', textAlign: 'center', marginTop: 12 }}>
            Share this link on social media, your website, or send directly to potential clients.
          </p>
        </div>
      </div>
    </div>
  );
}