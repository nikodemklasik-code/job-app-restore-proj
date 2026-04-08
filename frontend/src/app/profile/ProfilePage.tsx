import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Save, Plus, X, Upload, Download, Loader2, FileText, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { profile, isLoadingProfile, isSaving, loadProfile, savePersonalInfo, saveSkills } = useProfileStore();
  const [newSkill, setNewSkill] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', summary: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CV upload state
  const [uploadedCvId, setUploadedCvId] = useState<string | null>(null);
  const [parsedCv, setParsedCv] = useState<{
    fullName?: string;
    email?: string;
    skills?: string[];
    summary?: string;
  } | null>(null);

  const uploadCvMutation = api.cv.upload.useMutation({
    onSuccess: (data) => {
      setUploadedCvId(data.id);
      setParsedCv(data.parsed);
    },
  });

  const importToProfileMutation = api.cv.importToProfile.useMutation({
    onSuccess: () => {
      if (userId) void loadProfile(userId);
      setUploadedCvId(null);
      setParsedCv(null);
    },
  });

  const downloadCvMutation = api.applications.downloadCvPdf.useMutation({
    onSuccess: (data) => {
      // Trigger browser download
      const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv.pdf';
      a.click();
      URL.revokeObjectURL(url);
    },
  });

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadCvMutation.mutate({ userId, filename: file.name, base64 });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile &amp; CV</h1>
        <p className="mt-1 text-slate-400">Keep your professional profile up to date for best AI fit scores.</p>
      </div>

      {/* CV Upload Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
            <FileText className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Upload CV (PDF)</h2>
            <p className="text-xs text-slate-400">Upload your CV to auto-fill your profile</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
            id="cv-file-input"
          />
          <label
            htmlFor="cv-file-input"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            {uploadCvMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            ) : (
              <Upload className="h-4 w-4 text-indigo-400" />
            )}
            {uploadCvMutation.isPending ? 'Parsing...' : 'Choose PDF'}
          </label>

          {userId && (
            <button
              onClick={() => downloadCvMutation.mutate({ userId })}
              disabled={downloadCvMutation.isPending}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {downloadCvMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download CV as PDF
            </button>
          )}
        </div>

        {uploadCvMutation.isError && (
          <p className="text-sm text-red-400">
            {uploadCvMutation.error instanceof Error ? uploadCvMutation.error.message : 'Upload failed'}
          </p>
        )}

        {downloadCvMutation.isError && (
          <p className="text-sm text-red-400">
            {downloadCvMutation.error instanceof Error ? downloadCvMutation.error.message : 'Download failed'}
          </p>
        )}

        {/* Parsed CV Preview */}
        {parsedCv && uploadedCvId && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" />
              Parsed from your CV
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {parsedCv.fullName && (
                <div>
                  <span className="text-xs text-slate-500">Name</span>
                  <p className="text-white">{parsedCv.fullName}</p>
                </div>
              )}
              {parsedCv.email && (
                <div>
                  <span className="text-xs text-slate-500">Email</span>
                  <p className="text-white">{parsedCv.email}</p>
                </div>
              )}
            </div>
            {parsedCv.skills && parsedCv.skills.length > 0 && (
              <div>
                <span className="text-xs text-slate-500">Skills found ({parsedCv.skills.length})</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {parsedCv.skills.slice(0, 15).map((skill) => (
                    <span key={skill} className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-300">
                      {skill}
                    </span>
                  ))}
                  {parsedCv.skills.length > 15 && (
                    <span className="text-xs text-slate-500">+{parsedCv.skills.length - 15} more</span>
                  )}
                </div>
              </div>
            )}
            {parsedCv.summary && (
              <div>
                <span className="text-xs text-slate-500">Summary</span>
                <p className="mt-1 text-sm text-slate-300 line-clamp-3">{parsedCv.summary}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setUploadedCvId(null); setParsedCv(null); }}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5"
              >
                Discard
              </button>
              <button
                onClick={() => {
                  if (userId && uploadedCvId) {
                    importToProfileMutation.mutate({ userId, cvUploadId: uploadedCvId });
                  }
                }}
                disabled={importToProfileMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {importToProfileMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Import to Profile
              </button>
            </div>

            {importToProfileMutation.isError && (
              <p className="text-sm text-red-400">
                {importToProfileMutation.error instanceof Error ? importToProfileMutation.error.message : 'Import failed'}
              </p>
            )}
            {importToProfileMutation.isSuccess && (
              <p className="text-sm text-emerald-400">Profile updated from CV!</p>
            )}
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="font-semibold text-white">Personal Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-xs text-slate-400">Full Name</label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Alex Morgan"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs text-slate-400">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="alex@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-xs text-slate-400">Phone</label>
            <input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+44 7700 000000"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="summary" className="block text-xs text-slate-400">Professional Summary</label>
          <textarea
            id="summary"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Senior frontend engineer with 8 years of experience..."
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
          />
        </div>
        <button
          onClick={() => void handleSaveInfo()}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="font-semibold text-white">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(profile?.skills ?? []).map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-medium text-indigo-300"
            >
              {skill}
              <button onClick={() => void handleRemoveSkill(skill)} className="hover:text-indigo-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Add a skill..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAddSkill(); }}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            onClick={() => void handleAddSkill()}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-400 transition hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
