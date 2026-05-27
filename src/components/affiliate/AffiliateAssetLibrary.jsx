import React, { useState } from 'react';
import { Download, Lock } from 'lucide-react';

const ASSETS_BY_TYPE = {
  banners: [
    { name: '1080x1080 Square', sizes: '1080×1080', formats: 'PNG, JPG' },
    { name: '1080x1920 Story', sizes: '1080×1920', formats: 'PNG, JPG' },
    { name: '1200x628 Facebook', sizes: '1200×628', formats: 'PNG, JPG' },
  ],
  videos: [
    { name: 'App Demo (15s)', duration: '15 seconds', format: 'MP4' },
    { name: 'Feature Highlight (30s)', duration: '30 seconds', format: 'MP4' },
    { name: 'Full Overview (60s)', duration: '60 seconds', format: 'MP4' },
  ],
  copy: [
    { name: 'Instagram Captions', count: '5 templates' },
    { name: 'Tweet Templates', count: '10 templates' },
    { name: 'Email Newsletter', count: '1 template' },
    { name: 'YouTube Descriptions', count: '1 template' },
    { name: 'LinkedIn Posts', count: '1 template' },
    { name: 'Blog Post Outline', count: '1 template' },
  ],
  talking_points: [
    { name: 'Key Features', desc: 'Top 10 features to highlight' },
    { name: 'Competitor Comparison', desc: 'Why KOACH AI wins' },
    { name: 'Objection Handling', desc: 'Common objections & responses' },
    { name: 'Pricing Talking Points', desc: 'Value vs cost' },
  ],
};

export default function AffiliateAssetLibrary({ tier }) {
  const isGoldPlus = ['gold', 'platinum'].includes(tier);

  const downloadAsset = (name) => {
    // Placeholder - in real app would download from CDN
    alert(`Downloading: ${name}`);
  };

  return (
    <div className="space-y-6">
      {/* Banners & Images */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">📸 Banners & Images</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASSETS_BY_TYPE.banners.map((asset, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
                <p className="text-xs text-slate-500 mt-1">{asset.sizes}</p>
              </div>
              <button onClick={() => downloadAsset(asset.name)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Videos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">🎬 Videos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASSETS_BY_TYPE.videos.map((asset, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
                <p className="text-xs text-slate-500 mt-1">{asset.duration}</p>
              </div>
              <button onClick={() => downloadAsset(asset.name)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600">
                <Download className="w-3 h-3" /> Download MP4
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Copy Templates */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">✍️ Copy Templates</h3>
        <div className="space-y-2">
          {ASSETS_BY_TYPE.copy.map((asset, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100">
              <div>
                <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
                <p className="text-xs text-slate-500 mt-1">{asset.count}</p>
              </div>
              <button onClick={() => downloadAsset(asset.name)}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600">
                View
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Talking Points */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">💡 Talking Points</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ASSETS_BY_TYPE.talking_points.map((asset, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
              <p className="text-xs text-slate-500">{asset.desc}</p>
              <button onClick={() => downloadAsset(asset.name)}
                className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600">
                View
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom asset requests (Gold+) */}
      {isGoldPlus && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <h3 className="font-bold text-amber-900 mb-4">🌟 Custom Asset Requests</h3>
          <p className="text-sm text-amber-800 mb-4">As a {tier} affiliate, you can request custom assets</p>
          <div className="space-y-2 mb-4">
            <p className="text-sm font-semibold text-amber-900">Available:</p>
            <ul className="text-sm text-amber-800 space-y-1 pl-4">
              <li>✓ Co-branded content with your logo</li>
              <li>✓ Custom landing page design</li>
              <li>✓ Personalized video assets</li>
            </ul>
          </div>
          <button className="w-full px-4 py-3 rounded-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            Request Custom Assets
          </button>
        </div>
      )}

      {/* Logo files */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">🎨 Logo Files</h3>
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <p className="font-bold text-slate-900">KOACH AI Logo</p>
            <p className="text-xs text-slate-500 mt-1">PNG, SVG, AI formats + usage guidelines</p>
          </div>
          <button onClick={() => downloadAsset('KOACH AI Logo')}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600">
            Download
          </button>
        </div>
      </div>
    </div>
  );
}