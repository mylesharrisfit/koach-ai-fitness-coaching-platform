import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';

export default function QRCodeGenerator({ coachId }) {
  const [selectedLink, setSelectedLink] = useState(null);
  const [fgColor, setFgColor] = useState('#2563EB');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [size, setSize] = useState('medium');

  const { data: links = [] } = useQuery({
    queryKey: ['marketing-links', coachId],
    queryFn: () => base44.entities.MarketingLink.filter({ coach_id: coachId }, '-created_at'),
    enabled: !!coachId,
  });

  const sizes = { small: '200px', medium: '400px', large: '800px' };

  // Demo QR code using QR API
  const generateQRUrl = (url) => {
    const size = sizes[size] || '400px';
    const sizeNum = parseInt(size);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${sizeNum}x${sizeNum}&data=${encodeURIComponent(url)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`;
  };

  const qrUrl = selectedLink ? generateQRUrl(selectedLink.full_url) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-black text-slate-900 mb-6">QR Code Generator</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Select Link</label>
            <select
              value={selectedLink?.id || ''}
              onChange={(e) => setSelectedLink(links.find(l => l.id === e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">Choose a link...</option>
              {links.map(link => (
                <option key={link.id} value={link.id}>{link.link_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Foreground Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer" />
              <span className="text-sm text-slate-600 font-mono">{fgColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Background Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer" />
              <span className="text-sm text-slate-600 font-mono">{bgColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Size</label>
            <div className="flex gap-2">
              {Object.keys(sizes).map(s => (
                <button key={s} onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    size === s
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-3">Use cases:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Business cards</li>
              <li>• Flyers & posters</li>
              <li>• Email signatures</li>
              <li>• Gym walls</li>
            </ul>
          </div>
        </div>

        {/* Preview & Download */}
        <div className="space-y-4">
          {qrUrl ? (
            <>
              <div className="flex items-center justify-center p-8 rounded-lg border border-slate-200" style={{ background: bgColor }}>
                <img src={qrUrl} alt="QR Code" className="max-w-full" style={{ width: sizes[size] }} />
              </div>
              <div className="flex gap-2">
                <a href={qrUrl} download="qr-code.png"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600">
                  <Download className="w-4 h-4" /> Download PNG
                </a>
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500">
              <p className="text-center">Select a link to generate QR code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}