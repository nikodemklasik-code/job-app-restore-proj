import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import {
  Save, Plus, X, Download, Loader2,
  Pencil, Trash2, Briefcase, GraduationCap, Award,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import { MIN_JOB_FIT_LOCAL_KEY } from '@/lib/jobMatchPreferences';
import type {
  ProfileExperienceInput,
  ProfileEducationInput,
  ProfileTrainingInput,
} from '../../../../shared/profile';

// ── Types ──────────────────────────────────────────────────────────────────────

type ExpForm = ProfileExperienceInput & { id?: string };
type EduForm = ProfileEducationInput & { id?: string };
type TrainForm = ProfileTrainingInput & { id?: string };

const emptyExp = (): ExpForm => ({ employerName: '', jobTitle: '', startDate: '', endDate: null, description: '' });
const emptyEdu = (): EduForm => ({ schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: null });
const emptyTrain = (): TrainForm => ({ title: '', providerName: '', issuedAt: '', expiresAt: null, credentialUrl: '' });

/** Same width for Work Experience / Education / Trainings add actions (aligned rhythm). */
const PROFILE_SECTION_ADD_BTN =
  'inline-flex h-9 w-[12.25rem] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 transition hover:bg-white/10';

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const {
    profile, isLoadingProfile, isSaving, error,
    loadProfile, savePersonalInfo, saveSkills,
    replaceExperiences, replaceEducations, replaceTrainings,
    dismissError,
  } = useProfileStore();

  const [newSkill, setNewSkill] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', location: '', headline: '', summary: '', linkedinUrl: '', cvUrl: '' });

  // ── Experience state ──────────────────────────────────────────────────────
  const [expEditingIdx, setExpEditingIdx] = useState<number | null>(null);
  const [expForm, setExpForm] = useState<ExpForm>(emptyExp());
  const [expIsAdding, setExpIsAdding] = useState(false);

  // ── Education state ───────────────────────────────────────────────────────
  const [eduEditingIdx, setEduEditingIdx] = useState<number | null>(null);
  const [eduForm, setEduForm] = useState<EduForm>(emptyEdu());
  const [eduIsAdding, setEduIsAdding] = useState(false);

  // ── Training state ────────────────────────────────────────────────────────
  const [trainEditingIdx, setTrainEditingIdx] = useState<number | null>(null);
  const [trainForm, setTrainForm] = useState<TrainForm>(emptyTrain());
  const [trainIsAdding, setTrainIsAdding] = useState(false);

  const [minJobFitPercent, setMinJobFitPercent] = useState(() => {
    if (typeof window === 'undefined') return 50;
    const v = Number.parseInt(window.localStorage.getItem(MIN_JOB_FIT_LOCAL_KEY) ?? '50', 10);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
  });

  useEffect(() => {
    window.localStorage.setItem(MIN_JOB_FIT_LOCAL_KEY, String(minJobFitPercent));
    window.dispatchEvent(new Event('mvh-min-fit-changed'));
  }, [minJobFitPercent]);

  const WORK_VALUES_LS = 'mvh.profileWorkValues';
  const [workValuesNote, setWorkValuesNote] = useState(() =>
    typeof window === 'undefined' ? '' : window.localStorage.getItem(WORK_VALUES_LS) ?? '',
  );
  useEffect(() => {
    window.localStorage.setItem(WORK_VALUES_LS, workValuesNote);
  }, [workValuesNote]);

  const skillsAndCourses = useMemo(() => {
    const skills = profile?.skills ?? [];
    const trainings = profile?.trainings ?? [];

    return skills.slice(0, 6).map((skill, idx) => {
      const token = skill.toLowerCase();
      const linked = trainings.filter((training) =>
        training.title.toLowerCase().includes(token)
        || training.providerName.toLowerCase().includes(token),
      );
      const fallback = linked.length === 0 && trainings[idx] ? [trainings[idx]] : linked;
      const relatedSkills = skills.filter((item) => item !== skill).slice(0, 3);

      return { skill, relatedSkills, linkedCourses: fallback };
    });
  }, [profile?.skills, profile?.trainings]);

  const downloadCvMutation = api.applications.downloadCvPdf.useMutation({
    onSuccess: (data) => {
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
    void loadProfile();
  }, [isLoaded, userId, loadProfile]);

  useEffect(() => {
    if (profile?.personalInfo) {
      setForm({
        fullName: profile.personalInfo.fullName,
        email: profile.personalInfo.email,
        phone: profile.personalInfo.phone,
        location: profile.personalInfo.location ?? '',
        headline: profile.personalInfo.headline ?? '',
        summary: profile.personalInfo.summary,
        linkedinUrl: profile.personalInfo.linkedinUrl ?? '',
        cvUrl: profile.personalInfo.cvUrl ?? '',
      });
    }
  }, [profile]);

  // ── Personal info handlers ────────────────────────────────────────────────

  const handleSaveInfo = async () => {
    await savePersonalInfo(form);
  };

  // ── Skills handlers ───────────────────────────────────────────────────────

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    const updated = [...(profile?.skills ?? []), newSkill.trim()];
    await saveSkills(updated);
    setNewSkill('');
  };

  const handleRemoveSkill = async (skill: string) => {
    const updated = (profile?.skills ?? []).filter((s) => s !== skill);
    await saveSkills(updated);
  };

  // ── Experience handlers ───────────────────────────────────────────────────

  const handleSaveExp = async () => {
    if (!expForm.employerName.trim() || !expForm.jobTitle.trim()) return;
    const current = (profile?.experiences ?? []).map<ProfileExperienceInput>((e) => ({
      employerName: e.employerName,
      jobTitle: e.jobTitle,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
    }));
    let updated: ProfileExperienceInput[];
    if (expIsAdding) {
      updated = [...current, { employerName: expForm.employerName, jobTitle: expForm.jobTitle, startDate: expForm.startDate, endDate: expForm.endDate, description: expForm.description }];
    } else if (expEditingIdx !== null) {
      updated = current.map((item, i) =>
        i === expEditingIdx
          ? { employerName: expForm.employerName, jobTitle: expForm.jobTitle, startDate: expForm.startDate, endDate: expForm.endDate, description: expForm.description }
          : item,
      );
    } else {
      return;
    }
    await replaceExperiences(updated);
    setExpIsAdding(false);
    setExpEditingIdx(null);
    setExpForm(emptyExp());
  };

  const handleDeleteExp = async (idx: number) => {
    const updated = (profile?.experiences ?? [])
      .filter((_, i) => i !== idx)
      .map<ProfileExperienceInput>((e) => ({
        employerName: e.employerName,
        jobTitle: e.jobTitle,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
      }));
    await replaceExperiences(updated);
  };

  const handleEditExp = (idx: number) => {
    const item = profile?.experiences?.[idx];
    if (!item) return;
    setExpForm({ id: item.id, employerName: item.employerName, jobTitle: item.jobTitle, startDate: item.startDate, endDate: item.endDate, description: item.description });
    setExpEditingIdx(idx);
    setExpIsAdding(false);
  };

  const handleCancelExp = () => { setExpIsAdding(false); setExpEditingIdx(null); setExpForm(emptyExp()); };

  // ── Education handlers ────────────────────────────────────────────────────

  const handleSaveEdu = async () => {
    if (!eduForm.schoolName.trim() || !eduForm.degree.trim()) return;
    const current = (profile?.educations ?? []).map<ProfileEducationInput>((e) => ({
      schoolName: e.schoolName,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      startDate: e.startDate,
      endDate: e.endDate,
    }));
    let updated: ProfileEducationInput[];
    if (eduIsAdding) {
      updated = [...current, { schoolName: eduForm.schoolName, degree: eduForm.degree, fieldOfStudy: eduForm.fieldOfStudy, startDate: eduForm.startDate, endDate: eduForm.endDate }];
    } else if (eduEditingIdx !== null) {
      updated = current.map((item, i) =>
        i === eduEditingIdx
          ? { schoolName: eduForm.schoolName, degree: eduForm.degree, fieldOfStudy: eduForm.fieldOfStudy, startDate: eduForm.startDate, endDate: eduForm.endDate }
          : item,
      );
    } else {
      return;
    }
    await replaceEducations(updated);
    setEduIsAdding(false);
    setEduEditingIdx(null);
    setEduForm(emptyEdu());
  };

  const handleDeleteEdu = async (idx: number) => {
    const updated = (profile?.educations ?? [])
      .filter((_, i) => i !== idx)
      .map<ProfileEducationInput>((e) => ({
        schoolName: e.schoolName,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
        startDate: e.startDate,
        endDate: e.endDate,
      }));
    await replaceEducations(updated);
  };

  const handleEditEdu = (idx: number) => {
    const item = profile?.educations?.[idx];
    if (!item) return;
    setEduForm({ id: item.id, schoolName: item.schoolName, degree: item.degree, fieldOfStudy: item.fieldOfStudy, startDate: item.startDate, endDate: item.endDate });
    setEduEditingIdx(idx);
    setEduIsAdding(false);
  };

  const handleCancelEdu = () => { setEduIsAdding(false); setEduEditingIdx(null); setEduForm(emptyEdu()); };

  // ── Training handlers ─────────────────────────────────────────────────────

  const handleSaveTrain = async () => {
    if (!trainForm.title.trim() || !trainForm.providerName.trim()) return;
    const current = (profile?.trainings ?? []).map<ProfileTrainingInput>((t) => ({
      title: t.title,
      providerName: t.providerName,
      issuedAt: t.issuedAt,
      expiresAt: t.expiresAt,
      credentialUrl: t.credentialUrl,
    }));
    let updated: ProfileTrainingInput[];
    if (trainIsAdding) {
      updated = [...current, { title: trainForm.title, providerName: trainForm.providerName, issuedAt: trainForm.issuedAt, expiresAt: trainForm.expiresAt, credentialUrl: trainForm.credentialUrl }];
    } else if (trainEditingIdx !== null) {
      updated = current.map((item, i) =>
        i === trainEditingIdx
          ? { title: trainForm.title, providerName: trainForm.providerName, issuedAt: trainForm.issuedAt, expiresAt: trainForm.expiresAt, credentialUrl: trainForm.credentialUrl }
          : item,
      );
    } else {
      return;
    }
    await replaceTrainings(updated);
    setTrainIsAdding(false);
    setTrainEditingIdx(null);
    setTrainForm(emptyTrain());
  };

  const handleDeleteTrain = async (idx: number) => {
    const updated = (profile?.trainings ?? [])
      .filter((_, i) => i !== idx)
      .map<ProfileTrainingInput>((t) => ({
        title: t.title,
        providerName: t.providerName,
        issuedAt: t.issuedAt,
        expiresAt: t.expiresAt,
        credentialUrl: t.credentialUrl,
      }));
    await replaceTrainings(updated);
  };

  const handleEditTrain = (idx: number) => {
    const item = profile?.trainings?.[idx];
    if (!item) return;
    setTrainForm({ id: item.id, title: item.title, providerName: item.providerName, issuedAt: item.issuedAt, expiresAt: item.expiresAt, credentialUrl: item.credentialUrl });
    setTrainEditingIdx(idx);
    setTrainIsAdding(false);
  };

  const handleCancelTrain = () => { setTrainIsAdding(false); setTrainEditingIdx(null); setTrainForm(emptyTrain()); };

  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600';
  const saveBtnCls = 'flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60';
  const cancelBtnCls = 'rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-slate-400">Edit your profile details here. Document intake/upload/import/parsing happens in Document Hub — not on this page.</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={dismissError} className="ml-4 text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Growth first: plan vs roadmap + disclaimer */}
      <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-900/40 to-emerald-950/30 p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">Growth Plan and Roadmap</h2>
            <p className="mt-1 text-sm text-slate-400">
              <strong className="text-slate-200">Growth Plan</strong> is what to work on next (near-term, actionable).{' '}
              <strong className="text-slate-200">Roadmap</strong> is the longer arc: ordered milestones from your current baseline toward a target role — not the same as day-to-day tasks.
            </p>
          </div>
          <SupportingMaterialsDisclaimer compact collapsible className="shrink-0 lg:max-w-sm" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Growth plan</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs text-slate-300">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <p className="text-[10px] uppercase text-slate-500">Target role</p>
                <p className="mt-0.5 font-medium text-white">
                  {profile?.experiences?.[0]?.jobTitle ? `Toward ${profile.experiences[0].jobTitle}` : 'Add experience to anchor'}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <p className="text-[10px] uppercase text-slate-500">Skills to verify</p>
                <p className="mt-0.5">{(profile?.skills ?? []).slice(0, 3).join(', ') || 'Add skills in Profile'}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <p className="text-[10px] uppercase text-slate-500">Next step</p>
                <p className="mt-0.5">Quantify outcomes in your top roles, then refresh profile materials in Document Hub.</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs font-semibold tracking-wide text-emerald-300">Roadmap</p>
            <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
              <li>Strengthen profile evidence (experience + skills).</li>
              <li>Align your application materials with target role keywords.</li>
              <li>Practice interviews and negotiation scenarios.</li>
              <li>Track offers and salary positioning over time.</li>
            </ol>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="min-job-fit" className="text-sm font-medium text-white">
            Jobs: minimum fit score ({minJobFitPercent}%)
          </label>
          <span className="text-xs text-slate-500">Applies on Jobs discovery in this browser</span>
        </div>
        <input
          id="min-job-fit"
          type="range"
          min={0}
          max={100}
          step={5}
          value={minJobFitPercent}
          onChange={(e) => setMinJobFitPercent(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <p className="text-[11px] text-slate-500">
          Listings below this fit score stay hidden so you only see stronger matches. Raise or lower anytime.
        </p>
      </div>

      {/* Personal Information — contact column + summary column */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="font-semibold text-white">Personal Information</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-xs text-slate-400">Full name</label>
              <input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Alex Morgan" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs text-slate-400">Email</label>
              <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@example.com" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-xs text-slate-400">Phone</label>
              <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+44 7700 000000" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="block text-xs text-slate-400">Location</label>
              <input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="London, UK" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label htmlFor="headline" className="block text-xs text-slate-400">Headline</label>
              <input id="headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Senior Frontend Engineer" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label htmlFor="linkedinUrl" className="block text-xs text-slate-400">LinkedIn URL</label>
              <input id="linkedinUrl" type="url" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/yourname" className={inputCls} />
            </div>
          </div>
          <div className="space-y-2 flex flex-col min-h-[12rem]">
            <label htmlFor="summary" className="block text-xs text-slate-400">Professional summary</label>
            <textarea id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Senior frontend engineer with 8 years of experience..." rows={8} className={`${inputCls} resize-y flex-1 min-h-[10rem]`} />
          </div>
        </div>
        <button onClick={() => void handleSaveInfo()} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Skills + work values (two columns on large screens) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="font-semibold text-white">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {(profile?.skills ?? []).map((skill) => (
              <span key={skill} className="flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-medium text-indigo-300">
                {skill}
                <button onClick={() => void handleRemoveSkill(skill)} aria-label={`Remove skill: ${skill}`} className="hover:text-indigo-100"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <label htmlFor="skill-input" className="sr-only">Add a skill</label>
            <input
              id="skill-input"
              placeholder="Add a skill…"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAddSkill(); }}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button onClick={() => void handleAddSkill()} aria-label="Add skill" className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-400 transition hover:bg-white/10">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <h2 className="font-semibold text-white">Work values</h2>
          <p className="text-xs text-slate-500">
            What matters beyond title and pay (e.g. remote, learning budget, inclusion, pace). Saved on this device for now; profile sync can follow.
          </p>
          <textarea
            value={workValuesNote}
            onChange={(e) => setWorkValuesNote(e.target.value)}
            placeholder="e.g. Remote-first, no on-call weekends, mentorship, ethical product…"
            rows={8}
            className={inputCls}
          />
        </div>
      </div>

      {/* Work Experience */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
              <Briefcase className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="font-semibold text-white">Work Experience</h2>
          </div>
          {!expIsAdding && expEditingIdx === null && (
            <button
              type="button"
              onClick={() => { setExpIsAdding(true); setExpForm(emptyExp()); }}
              className={PROFILE_SECTION_ADD_BTN}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden /> Add Experience
            </button>
          )}
        </div>

        <div className="space-y-3">
          {(profile?.experiences ?? []).map((exp, idx) => (
            <div key={exp.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              {expEditingIdx === idx ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1"><label htmlFor={`exp-employer-edit-${idx}`} className="block text-xs text-slate-400">Company / Employer</label><input id={`exp-employer-edit-${idx}`} value={expForm.employerName} onChange={(e) => setExpForm({ ...expForm, employerName: e.target.value })} placeholder="Acme Ltd" className={inputCls} /></div>
                    <div className="space-y-1"><label htmlFor={`exp-title-edit-${idx}`} className="block text-xs text-slate-400">Job Title</label><input id={`exp-title-edit-${idx}`} value={expForm.jobTitle} onChange={(e) => setExpForm({ ...expForm, jobTitle: e.target.value })} placeholder="Senior Engineer" className={inputCls} /></div>
                    <div className="space-y-1"><label htmlFor={`exp-start-edit-${idx}`} className="block text-xs text-slate-400">Start Date</label><input id={`exp-start-edit-${idx}`} value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} placeholder="2021-03" className={inputCls} /></div>
                    <div className="space-y-1"><label htmlFor={`exp-end-edit-${idx}`} className="block text-xs text-slate-400">End Date <span className="text-slate-600">(blank = current)</span></label><input id={`exp-end-edit-${idx}`} value={expForm.endDate ?? ''} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value || null })} placeholder="Present" className={inputCls} /></div>
                  </div>
                  <div className="space-y-1"><label htmlFor={`exp-desc-edit-${idx}`} className="block text-xs text-slate-400">Description</label><textarea id={`exp-desc-edit-${idx}`} value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Key responsibilities..." rows={3} className={`${inputCls} resize-none`} /></div>
                  <div className="flex gap-2">
                    <button onClick={() => void handleSaveExp()} disabled={isSaving} className={saveBtnCls}>{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save</button>
                    <button onClick={handleCancelExp} className={cancelBtnCls}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{exp.jobTitle}</p>
                    <p className="text-sm text-slate-400">{exp.employerName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ' — Present'}</p>
                    {exp.description && <p className="mt-2 text-sm text-slate-300 line-clamp-2">{exp.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => handleEditExp(idx)} aria-label="Edit experience entry" title="Edit" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    <button onClick={() => void handleDeleteExp(idx)} disabled={isSaving} aria-label="Delete experience entry" title="Delete" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {expIsAdding && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
            <p className="text-xs font-medium text-indigo-400">New Experience</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1"><label htmlFor="exp-employer-new" className="block text-xs text-slate-400">Company / Employer</label><input id="exp-employer-new" value={expForm.employerName} onChange={(e) => setExpForm({ ...expForm, employerName: e.target.value })} placeholder="Acme Ltd" className={inputCls} /></div>
              <div className="space-y-1"><label htmlFor="exp-title-new" className="block text-xs text-slate-400">Job Title</label><input id="exp-title-new" value={expForm.jobTitle} onChange={(e) => setExpForm({ ...expForm, jobTitle: e.target.value })} placeholder="Senior Engineer" className={inputCls} /></div>
              <div className="space-y-1"><label htmlFor="exp-start-new" className="block text-xs text-slate-400">Start Date</label><input id="exp-start-new" value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} placeholder="2021-03" className={inputCls} /></div>
              <div className="space-y-1"><label htmlFor="exp-end-new" className="block text-xs text-slate-400">End Date <span className="text-slate-600">(blank = current)</span></label><input id="exp-end-new" value={expForm.endDate ?? ''} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value || null })} placeholder="Present" className={inputCls} /></div>
            </div>
            <div className="space-y-1"><label htmlFor="exp-desc-new" className="block text-xs text-slate-400">Description</label><textarea id="exp-desc-new" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Key responsibilities..." rows={3} className={`${inputCls} resize-none`} /></div>
            <div className="flex gap-2">
              <button onClick={() => void handleSaveExp()} disabled={isSaving} className={saveBtnCls}>{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save</button>
              <button onClick={handleCancelExp} className={cancelBtnCls}>Cancel</button>
            </div>
          </div>
        )}
        {(profile?.experiences ?? []).length === 0 && !expIsAdding && <p className="text-sm text-slate-500">No experience added yet. Click "Add Experience" to get started.</p>}
      </div>

      {/* Education */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="font-semibold text-white">Education</h2>
          </div>
          {!eduIsAdding && eduEditingIdx === null && (
            <button
              type="button"
              onClick={() => { setEduIsAdding(true); setEduForm(emptyEdu()); }}
              className={PROFILE_SECTION_ADD_BTN}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden /> Add Education
            </button>
          )}
        </div>

        <div className="space-y-3">
          {(profile?.educations ?? []).map((edu, idx) => (
            <div key={edu.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              {eduEditingIdx === idx ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1"><label htmlFor={`edu-school-edit-${idx}`} className="block text-xs text-slate-400">School / Institution</label><input id={`edu-school-edit-${idx}`} value={eduForm.schoolName} onChange={(e) => setEduForm({ ...eduForm, schoolName: e.target.value })} placeholder="University of Manchester" className={inputCls} /></div>
                    <div className="space-y-1"><label htmlFor={`edu-degree-edit-${idx}`} className="block text-xs text-slate-400">Degree</label><input id={`edu-degree-edit-${idx}`} value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} placeholder="BSc" className={inputCls} /></div>
                    <div className="space-y-1"><label htmlFor={`edu-field-edit-${idx}`} className="block text-xs text-slate-400">Field of Study</label><input id={`edu-field-edit-${idx}`} value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} placeholder="Computer Science" className={inputCls} /></div>
                    <div />
                    <div className="space-y-1"><label htmlFor={`edu-start-edit-${idx}`} className="block text-xs text-slate-400">Start Date</label><input id={`edu-start-edit-${idx}`} value={eduForm.startDate} onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })} placeholder="2018-09" className={inputCls} /></div>
                    <div className="space-y-1"><label htmlFor={`edu-end-edit-${idx}`} className="block text-xs text-slate-400">End Date</label><input id={`edu-end-edit-${idx}`} value={eduForm.endDate ?? ''} onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value || null })} placeholder="2021-06" className={inputCls} /></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void handleSaveEdu()} disabled={isSaving} className={saveBtnCls}>{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save</button>
                    <button onClick={handleCancelEdu} className={cancelBtnCls}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}</p>
                    <p className="text-sm text-slate-400">{edu.schoolName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => handleEditEdu(idx)} aria-label="Edit education entry" title="Edit" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    <button onClick={() => void handleDeleteEdu(idx)} disabled={isSaving} aria-label="Delete education entry" title="Delete" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {eduIsAdding && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
            <p className="text-xs font-medium text-indigo-400">New Education</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1"><label htmlFor="edu-school-new" className="block text-xs text-slate-400">School / Institution</label><input id="edu-school-new" value={eduForm.schoolName} onChange={(e) => setEduForm({ ...eduForm, schoolName: e.target.value })} placeholder="University of Manchester" className={inputCls} /></div>
              <div className="space-y-1"><label htmlFor="edu-degree-new" className="block text-xs text-slate-400">Degree</label><input id="edu-degree-new" value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} placeholder="BSc" className={inputCls} /></div>
              <div className="space-y-1"><label htmlFor="edu-field-new" className="block text-xs text-slate-400">Field of Study</label><input id="edu-field-new" value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} placeholder="Computer Science" className={inputCls} /></div>
              <div />
              <div className="space-y-1"><label htmlFor="edu-start-new" className="block text-xs text-slate-400">Start Date</label><input id="edu-start-new" value={eduForm.startDate} onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })} placeholder="2018-09" className={inputCls} /></div>
              <div className="space-y-1"><label htmlFor="edu-end-new" className="block text-xs text-slate-400">End Date</label><input id="edu-end-new" value={eduForm.endDate ?? ''} onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value || null })} placeholder="2021-06" className={inputCls} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void handleSaveEdu()} disabled={isSaving} className={saveBtnCls}>{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save</button>
              <button onClick={handleCancelEdu} className={cancelBtnCls}>Cancel</button>
            </div>
          </div>
        )}
        {(profile?.educations ?? []).length === 0 && !eduIsAdding && <p className="text-sm text-slate-500">No education added yet. Click "Add Education" to get started.</p>}
      </div>

      {/* Trainings & Certifications */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Award className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="font-semibold text-white">Trainings &amp; Certifications</h2>
          </div>
          {!trainIsAdding && trainEditingIdx === null && (
            <button
              type="button"
              onClick={() => { setTrainIsAdding(true); setTrainForm(emptyTrain()); }}
              className={PROFILE_SECTION_ADD_BTN}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden /> Add Training
            </button>
          )}
        </div>

        <div className="space-y-3">
          {(profile?.trainings ?? []).map((train, idx) => (
            <div key={train.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              {trainEditingIdx === idx ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1"><label className="block text-xs text-slate-400">Title</label><input value={trainForm.title} onChange={(e) => setTrainForm({ ...trainForm, title: e.target.value })} placeholder="AWS Solutions Architect" className={inputCls} /></div>
                    <div className="space-y-1"><label className="block text-xs text-slate-400">Provider</label><input value={trainForm.providerName} onChange={(e) => setTrainForm({ ...trainForm, providerName: e.target.value })} placeholder="Amazon Web Services" className={inputCls} /></div>
                    <div className="space-y-1"><label className="block text-xs text-slate-400">Issued At</label><input value={trainForm.issuedAt} onChange={(e) => setTrainForm({ ...trainForm, issuedAt: e.target.value })} placeholder="2023-05" className={inputCls} /></div>
                    <div className="space-y-1"><label className="block text-xs text-slate-400">Expires At (optional)</label><input value={trainForm.expiresAt ?? ''} onChange={(e) => setTrainForm({ ...trainForm, expiresAt: e.target.value || null })} placeholder="2026-05" className={inputCls} /></div>
                    <div className="space-y-1 md:col-span-2"><label className="block text-xs text-slate-400">Credential URL (optional)</label><input value={trainForm.credentialUrl} onChange={(e) => setTrainForm({ ...trainForm, credentialUrl: e.target.value })} placeholder="https://..." className={inputCls} /></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void handleSaveTrain()} disabled={isSaving} className={saveBtnCls}>{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save</button>
                    <button onClick={handleCancelTrain} className={cancelBtnCls}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{train.title}</p>
                    <p className="text-sm text-slate-400">{train.providerName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Issued: {train.issuedAt}{train.expiresAt ? ` · Expires: ${train.expiresAt}` : ''}</p>
                    {train.credentialUrl && <a href={train.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-indigo-400 hover:underline truncate block">View credential</a>}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => handleEditTrain(idx)} aria-label="Edit certification entry" title="Edit" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    <button onClick={() => void handleDeleteTrain(idx)} disabled={isSaving} aria-label="Delete certification entry" title="Delete" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {trainIsAdding && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
            <p className="text-xs font-medium text-indigo-400">New Training / Certification</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1"><label className="block text-xs text-slate-400">Title</label><input value={trainForm.title} onChange={(e) => setTrainForm({ ...trainForm, title: e.target.value })} placeholder="AWS Solutions Architect" className={inputCls} /></div>
              <div className="space-y-1"><label className="block text-xs text-slate-400">Provider</label><input value={trainForm.providerName} onChange={(e) => setTrainForm({ ...trainForm, providerName: e.target.value })} placeholder="Amazon Web Services" className={inputCls} /></div>
              <div className="space-y-1"><label className="block text-xs text-slate-400">Issued At</label><input value={trainForm.issuedAt} onChange={(e) => setTrainForm({ ...trainForm, issuedAt: e.target.value })} placeholder="2023-05" className={inputCls} /></div>
              <div className="space-y-1"><label className="block text-xs text-slate-400">Expires At (optional)</label><input value={trainForm.expiresAt ?? ''} onChange={(e) => setTrainForm({ ...trainForm, expiresAt: e.target.value || null })} placeholder="2026-05" className={inputCls} /></div>
              <div className="space-y-1 md:col-span-2"><label className="block text-xs text-slate-400">Credential URL (optional)</label><input value={trainForm.credentialUrl} onChange={(e) => setTrainForm({ ...trainForm, credentialUrl: e.target.value })} placeholder="https://..." className={inputCls} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void handleSaveTrain()} disabled={isSaving} className={saveBtnCls}>{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save</button>
              <button onClick={handleCancelTrain} className={cancelBtnCls}>Cancel</button>
            </div>
          </div>
        )}
        {(profile?.trainings ?? []).length === 0 && !trainIsAdding && <p className="text-sm text-slate-500">No trainings added yet. Click "Add Training" to get started.</p>}
      </div>

      <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-6 space-y-4">
        <h2 className="font-semibold text-white">Skills And Courses Link</h2>
        <p className="text-sm text-slate-400">
          This section connects your core skills with trainings and certificates as visible learning evidence.
        </p>

        {skillsAndCourses.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add skills and trainings first to generate course-evidence links.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {skillsAndCourses.map((entry) => (
              <article key={entry.skill} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-white">{entry.skill}</p>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Related Skills</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {entry.relatedSkills.join(', ') || 'Add complementary skills to strengthen this area.'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Courses Supporting This Skill</p>
                  {entry.linkedCourses.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">No matching course yet.</p>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {entry.linkedCourses.map((course) => (
                        <p key={`${entry.skill}-${course.id}`} className="text-xs text-slate-300">
                          {course.title} <span className="text-slate-500">({course.providerName})</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">This Course Strengthens</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Applied delivery quality and confidence for <span className="text-white">{entry.skill}</span>.
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Learning Evidence</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {entry.linkedCourses.some((course) => Boolean(course.credentialUrl))
                      ? 'Credential URL present and can be externally verified.'
                      : 'Add a credential URL or project outcome to improve evidence quality.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-amber-300">Still Needs Practice</p>
                    <p className="mt-1 text-xs text-amber-100">Use this skill in one documented case or interview response this week.</p>
                  </div>
                  <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-rose-300">Still Needs Verification</p>
                    <p className="mt-1 text-xs text-rose-100">Add metrics and outcomes in Experience to verify this skill claim.</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
        <p className="text-slate-400">
          <span className="text-slate-200">Application materials and documents</span> — upload and parse in{' '}
          <Link to="/documents" className="font-medium text-indigo-400 hover:text-indigo-300">
            Document Hub
          </Link>
          , not on this page.
        </p>
        {userId && (
          <button
            type="button"
            onClick={() => downloadCvMutation.mutate({ userId })}
            disabled={downloadCvMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {downloadCvMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download profile PDF
          </button>
        )}
      </div>
      {downloadCvMutation.isError && <p className="text-sm text-red-400">Profile PDF download failed. Please try again.</p>}
    </div>
  );
}
