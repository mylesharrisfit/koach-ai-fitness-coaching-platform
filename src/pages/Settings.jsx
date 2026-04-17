import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import PageHeader from '../components/shared/PageHeader';
import { User, Building, Globe } from 'lucide-react';

export default function Settings() {
  const [profile, setProfile] = useState({ business_name: '', bio: '', website: '', instagram: '', specializations: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user) {
        setProfile({
          business_name: user.business_name || '',
          bio: user.bio || '',
          website: user.website || '',
          instagram: user.instagram || '',
          specializations: user.specializations || '',
        });
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(profile);
    setSaving(false);
    toast.success('Settings saved');
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your coaching profile" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2"><Building className="w-5 h-5" /> Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input value={profile.business_name} onChange={e => setProfile({...profile, business_name: e.target.value})} placeholder="Your coaching brand" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} rows={3} placeholder="Tell clients about yourself..." />
            </div>
            <div>
              <Label>Specializations</Label>
              <Input value={profile.specializations} onChange={e => setProfile({...profile, specializations: e.target.value})} placeholder="e.g., Bodybuilding, Weight Loss, Athletic Performance" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2"><Globe className="w-5 h-5" /> Social & Web</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Website</Label>
              <Input value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} placeholder="https://..." />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={profile.instagram} onChange={e => setProfile({...profile, instagram: e.target.value})} placeholder="@yourhandle" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </div>
      </div>
    </div>
  );
}