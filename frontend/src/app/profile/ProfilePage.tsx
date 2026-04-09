import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Save, Plus, X, Upload, Download, Loader2, FileText, User, Pencil, Trash2, Briefcase, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';

// ── Types ──────────────────────────────────────────────────────────────────────

type ExperienceItem = {
  id?: string;
  employerName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  description: string;
};

type EducationItem = {
  id?: string;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
};

const emptyExp = (): ExperienceItem => ({ employerName: '', jobTitle: '', startDate: '', endDate: '', description: '' });
const emptyEdu = (): EducationItem => ({ schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { profile, isLoadingProfile, isSaving, loadProfile, savePersonalInfo, saveSkills } = useProfileStore();
  const [newSkill, setNewSkill] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', summary: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Experience state ──────────────────────────────────────────────────────
  const [expEditingIdx, setExpEditingIdx] = useState<number | null>(null);
  const [expForm, setExpForm] = useState<ExperienceItem>(emptyExp());
  const [expIsAdding, setExpIsAdding] = useState(false);

  const { data: experienceData, refetch: refetchExp } = api.profile.getExperience.useQuery(
    { userId: userId ?? '' },
    { enabled: !!userId },
  );
  const saveExperienceMutation = api.profile.saveExperience.useMutation({
    onSuccess: () => void refetchExp(),
  });

  // ── Education state ───────────────────────────────────────────────────────
  const [eduEditingIdx, setEduEditingIdx] = useState<number | null>(null);
  const [eduForm, setEduForm] = useState<EducationItem>(emptyEdu());
  const [eduIsAdding, setEduIsAdding] = useState(false);

  const { data: educationData, refetch: refetchEdu } = api.profile.getEducation.useQuery(
    { userId: userId ?? '' },
    { enabled: !!userId },
  );
  const saveEducationMutation = api.profile.saveEducation.useMutation({
    onSuccess: () => void refetchEdu(),
  });

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

  // ── Experience handlers ───────────────────────────────────────────────────

  const handleSaveExp = () => {
    if (!userId || !expForm.employerName.trim() || !expForm.jobTitle.trim()) return;
    const current: ExperienceItem[] = (experienceData ?? []).map((e) => ({
      id: e.id,
      employerName: e.employerName,
      jobTitle: e.jobTitle,
      startDate: e.startDate ?? '',
      endDate: e.endDate ?? '',
      description: e.description ?? '',
    }));
    let updated: ExperienceItem[];
    if (expIsAdding) {
      updated = [...current, expForm];
    } else if (expEditingIdx !== null) {
      updated = current.map((item, i) => (i === expEditingIdx ? expForm : item));
    } else {
      return;
    }
    saveExperienceMutation.mutate({ userId, items: updated });
    setExpIsAdding(false);
    setExpEditingIdx(null);
    setExpForm(emptyExp());
  };

  const handleDeleteExp = (idx: number) => {
    if (!userId) return;
    const current: ExperienceItem[] = (experienceData ?? []).map((e) => ({
      id: e.id,
      employerName: e.employerName,
      jobTitle: e.jobTitle,
      startDate: e.startDate ?? '',
      endDate: e.endDate ?? '',
      description: e.description ?? '',
    }));
    saveExperienceMutation.mutate({ userId, items: current.filter((_, i) => i !== idx) });
  };

  const handleEditExp = (idx: number) => {
    const item = experienceData?.[idx];
    if (!item) return;
    setExpForm({
      id: item.id,
      employerName: item.employerName,
      jobTitle: item.jobTitle,
      startDate: item.startDate ?? '',
      endDate: item.endDate ?? '',
      description: item.description ?? '',
    });
    setExpEditingIdx(idx);
    setExpIsAdding(false);
  };

  const handleCancelExp = () => {
    setExpIsAdding(false);
    setExpEditingIdx(null);
    setExpForm(emptyExp());
  };

  // ── Education handlers ────────────────────────────────────────────────────

  const handleSaveEdu = () => {
    if (!userId || !eduForm.schoolName.trim() || !eduForm.degree.trim()) return;
    const current: EducationItem[] = (educationData ?? []).map((e) => ({
      id: e.id,
      schoolName: e.schoolName,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy ?? '',
      startDate: e.startDate ?? '',
      endDate: e.endDate ?? '',
    }));
    let updated: EducationItem[];
    if (eduIsAdding) {
      updated = [...current, eduForm];
    } else if (eduEditingIdx !== null) {
      updated = current.map((item, i) => (i === eduEditingIdx ? eduForm : item));
    } else {
      return;
    }
    saveEducationMutation.mutate({ userId, items: updated });
    setEduIsAdding(false);
    setEduEditingIdx(null);
    setEduForm(emptyEdu());
  };

  const handleDeleteEdu = (idx: number) => {
    if (!userId) return;
    const current: EducationItem[] = (educationData ?? []).map((e) => ({
      id: e.id,
      schoolName: e.schoolName,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy ?? '',
      startDate: e.startDate ?? '',
      endDate: e.endDate ?? '',
    }));
    saveEducationMutation.mutate({ userId, items: current.filter((_, i) => i !== idx) });
  };

  const handleEditEdu = (idx: number) => {
    const item = educationData?.[idx];
    if (!item) return;
    setEduForm({
      id: item.id,
      schoolName: item.schoolName,
      degree: item.degree,
      fieldOfStudy: item.fieldOfStudy ?? '',
      startDate: item.startDate ?? '',
      endDate: item.endDate ?? '',
    });
    setEduEditingIdx(idx);
    setEduIsAdding(false);
  };

  const handleCancelEdu = () => {
    setEduIsAdding(false);
    setEduEditingIdx(null);
    setEduForm(emptyEdu());
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

      {/* Work Experience */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
              <Briefcase className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="font-semibold text-white">Work Experience</h2>
          </div>
          {!expIsAdding && expEditingIdx === null && (
            <button
              onClick={() => { setExpIsAdding(true); setExpForm(emptyExp()); }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Add Experience
            </button>
          )}
        </div>

        {/* Existing experience cards */}
        <div className="space-y-3">
          {(experienceData ?? []).map((exp, idx) => (
            <div key={exp.id ?? idx} className="rounded-xl border border-white/10 bg-white/5 p-4">
              {expEditingIdx === idx ? (
                /* Inline edit form */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">Company / Employer</label>
                      <input
                        value={expForm.employerName}
                        onChange={(e) => setExpForm({ ...expForm, employerName: e.target.value })}
                        placeholder="Acme Ltd"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">Job Title</label>
                      <input
                        value={expForm.jobTitle}
                        onChange={(e) => setExpForm({ ...expForm, jobTitle: e.target.value })}
                        placeholder="Senior Engineer"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">Start Date</label>
                      <input
                        value={expForm.startDate}
                        onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                        placeholder="2021-03"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">End Date (leave blank if current)</label>
                      <input
                        value={expForm.endDate}
                        onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                        placeholder="Present"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Description</label>
                    <textarea
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                      placeholder="Key responsibilities and achievements..."
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveExp}
                      disabled={saveExperienceMutation.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saveExperienceMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </button>
                    <button onClick={handleCancelExp} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Read-only card */
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{exp.jobTitle}</p>
                    <p className="text-sm text-slate-400">{exp.employerName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ' — Present'}
                    </p>
                    {exp.description && (
                      <p className="mt-2 text-sm text-slate-300 line-clamp-2">{exp.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleEditExp(idx)}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExp(idx)}
                      disabled={saveExperienceMutation.isPending}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new experience inline form */}
        {expIsAdding && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
            <p className="text-xs font-medium text-indigo-400">New Experience</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Company / Employer</label>
                <input
                  value={expForm.employerName}
                  onChange={(e) => setExpForm({ ...expForm, employerName: e.target.value })}
                  placeholder="Acme Ltd"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Job Title</label>
                <input
                  value={expForm.jobTitle}
                  onChange={(e) => setExpForm({ ...expForm, jobTitle: e.target.value })}
                  placeholder="Senior Engineer"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Start Date</label>
                <input
                  value={expForm.startDate}
                  onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                  placeholder="2021-03"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">End Date (leave blank if current)</label>
                <input
                  value={expForm.endDate}
                  onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                  placeholder="Present"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-slate-400">Description</label>
              <textarea
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                placeholder="Key responsibilities and achievements..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveExp}
                disabled={saveExperienceMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saveExperienceMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save
              </button>
              <button onClick={handleCancelExp} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {(experienceData ?? []).length === 0 && !expIsAdding && (
          <p className="text-sm text-slate-500">No experience added yet. Click "Add Experience" to get started.</p>
        )}
      </div>

      {/* Education */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="font-semibold text-white">Education</h2>
          </div>
          {!eduIsAdding && eduEditingIdx === null && (
            <button
              onClick={() => { setEduIsAdding(true); setEduForm(emptyEdu()); }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Add Education
            </button>
          )}
        </div>

        {/* Existing education cards */}
        <div className="space-y-3">
          {(educationData ?? []).map((edu, idx) => (
            <div key={edu.id ?? idx} className="rounded-xl border border-white/10 bg-white/5 p-4">
              {eduEditingIdx === idx ? (
                /* Inline edit form */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">School / Institution</label>
                      <input
                        value={eduForm.schoolName}
                        onChange={(e) => setEduForm({ ...eduForm, schoolName: e.target.value })}
                        placeholder="University of Manchester"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">Degree</label>
                      <input
                        value={eduForm.degree}
                        onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                        placeholder="BSc"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">Field of Study</label>
                      <input
                        value={eduForm.fieldOfStudy}
                        onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                        placeholder="Computer Science"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-1" />
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">Start Date</label>
                      <input
                        value={eduForm.startDate}
                        onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                        placeholder="2018-09"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-400">End Date</label>
                      <input
                        value={eduForm.endDate}
                        onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                        placeholder="2021-06"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdu}
                      disabled={saveEducationMutation.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saveEducationMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </button>
                    <button onClick={handleCancelEdu} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Read-only card */
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}</p>
                    <p className="text-sm text-slate-400">{edu.schoolName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleEditEdu(idx)}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEdu(idx)}
                      disabled={saveEducationMutation.isPending}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new education inline form */}
        {eduIsAdding && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
            <p className="text-xs font-medium text-emerald-400">New Education</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">School / Institution</label>
                <input
                  value={eduForm.schoolName}
                  onChange={(e) => setEduForm({ ...eduForm, schoolName: e.target.value })}
                  placeholder="University of Manchester"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Degree</label>
                <input
                  value={eduForm.degree}
                  onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                  placeholder="BSc"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Field of Study</label>
                <input
                  value={eduForm.fieldOfStudy}
                  onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                  placeholder="Computer Science"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1 md:col-span-1" />
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Start Date</label>
                <input
                  value={eduForm.startDate}
                  onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                  placeholder="2018-09"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">End Date</label>
                <input
                  value={eduForm.endDate}
                  onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                  placeholder="2021-06"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdu}
                disabled={saveEducationMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saveEducationMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save
              </button>
              <button onClick={handleCancelEdu} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {(educationData ?? []).length === 0 && !eduIsAdding && (
          <p className="text-sm text-slate-500">No education added yet. Click "Add Education" to get started.</p>
        )}
      </div>
    </div>
  );
}
