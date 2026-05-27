import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Copy, Eye, Trash2, Plus, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function AffiliateLinksSection({ profile }) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLink, setNewLink] = useState({ link_name: '', utm_source: '', utm_campaign: '' });

  const { data: links = [] } = useQuery({
    queryKey: ['affiliate-links', profile.coach_id],
    queryFn: () => base44.entities.AffiliateLink.filter({ coach_id: profile.coach_id }, '-created_at'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AffiliateLink.create({
      coach_id: profile.coach_id,
      affiliate_code: profile.affiliate_code,
      utm_medium: 'affiliate',
      ...data,
      full_url: `${profile.affiliate_url}&utm_source=${data.utm_source || 'direct'}&utm_campaign=${data.utm_campaign || 'default'}`,
    }),
    onSuccess: () => {
      toast.success('Link created');
      setNewLink({ link_name: '', utm_source: '', utm_campaign: '' });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ['affiliate-links', profile.coach_id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AffiliateLink.delete(id),
    onSuccess: () => {
      toast.success('Link deleted');
      queryClient.invalidateQueries({ queryKey: ['affiliate-links', profile.coach_id] });
    },
  });

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Default link */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-3">Your Affiliate Link</h3>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <code className="flex-1 text-sm text-slate-600 font-mono truncate">{profile.affiliate_url}</code>
          <button onClick={() => handleCopy(profile.affiliate_url)}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <Copy className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Custom links */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Custom Tracking Links</h3>
          <button onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600">
            <Plus className="w-4 h-4" /> Create Link
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newLink);
          }} className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <input
              type="text"
              placeholder="Link name (e.g., Instagram Bio)"
              value={newLink.link_name}
              onChange={(e) => setNewLink({ ...newLink, link_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="text"
              placeholder="UTM source (e.g., instagram)"
              value={newLink.utm_source}
              onChange={(e) => setNewLink({ ...newLink, utm_source: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="UTM campaign (optional)"
              value={newLink.utm_campaign}
              onChange={(e) => setNewLink({ ...newLink, utm_campaign: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600">
                Create
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-900 text-sm font-bold hover:bg-slate-300">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Links table */}
        {links.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-3 font-bold text-slate-900">Name</th>
                  <th className="text-right py-3 px-3 font-bold text-slate-900">Clicks</th>
                  <th className="text-right py-3 px-3 font-bold text-slate-900">Signups</th>
                  <th className="text-right py-3 px-3 font-bold text-slate-900">Earnings</th>
                  <th className="text-center py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{link.link_name}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{link.clicks}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{link.signups}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">${link.earnings.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleCopy(link.full_url)} className="text-blue-600 hover:text-blue-700" title="Copy">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(link.id)} className="text-red-600 hover:text-red-700" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No custom links yet. Create one to start tracking!</p>
        )}
      </div>
    </div>
  );
}