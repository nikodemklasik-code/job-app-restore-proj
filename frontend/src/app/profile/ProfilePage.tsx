import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Save, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfileStore } from '@/stores/profileStore';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { profile, isLoadingProfile, isSaving, loadProfile, savePersonalInfo, saveSkills } = useProfileStore();
  const [newSkill, setNewSkill] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', summary: '' });

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadProfile(userId);
  }, [isLoaded, userId, loadProfile]);

  useEffect(() => {
    if (profile?.personalInfo) {
      setForm({
        fullName: profile.personalInfo.fullName,
        email: profile.personalInfo.email,
        phone: profile.personalInfo.phone,
        summary: profile.personalInfo.summary,
      });
    }
  }, [profile]);

  const handleSaveInfo = async () => {
    if (!userId) return;
    await savePersonalInfo(userId, form);
  };

  const handleAddSkill = async () => {
    if (!userId || !newSkill.trim()) return;
    const skills = [...(profile?.skills ?? []), newSkill.trim()];
    await saveSkills(userId, skills);
    setNewSkill('');
  };

  const handleRemoveSkill = async (skill: string) => {
    if (!userId) return;
    const skills = (profile?.skills ?? []).filter((s) => s !== skill);
    await saveSkills(userId, skills);
  };

  if (!isLoaded || isLoadingProfile) {
    return <div className="flex h-48 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Profile &amp; CV</h1>
        <p className="mt-1 text-slate-500">Keep your professional profile up to date for best AI fit scores.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Alex Morgan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+44 7700 000000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary</Label>
            <textarea
              id="summary"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Senior frontend engineer with 8 years of experience..."
              rows={4}
              className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <Button onClick={() => void handleSaveInfo()} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(profile?.skills ?? []).map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                {skill}
                <button onClick={() => void handleRemoveSkill(skill)}>
                  <X className="h-3 w-3 hover:text-indigo-900 dark:hover:text-indigo-100" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAddSkill(); }}
            />
            <Button variant="outline" onClick={() => void handleAddSkill()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
