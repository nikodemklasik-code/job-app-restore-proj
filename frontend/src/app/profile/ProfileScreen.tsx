import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import type {
  PersonalInfo,
  ProfileEducationInput,
  ProfileExperienceInput,
  ProfileFieldProvenance,
  ProfileFieldProvenanceTag,
  ProfileSnapshot,
  ProfileTrainingInput,
} from '../../../../shared/profile';

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const textAreaClass = `${inputClass} min-h-24 resize-y`;
const cardClass = 'rounded-2xl border border-white/10 bg-white/5 p-6';

type PersonalKey = keyof PersonalInfo;

const PROVENANCE_LABELS: Record<ProfileFieldProvenanceTag, string> = {
  user_confirmed: 'user confirmed',
  imported_from_cv: 'imported from CV',
  ai_suggested: 'AI suggested',
  unknown: 'unknown',
};

const PROVENANCE_CLASSES: Record<ProfileFieldProvenanceTag, string> = {
  user_confirmed: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
  imported_from_cv: 'border-indigo-400/40 bg-indigo-500/10 text-indigo-100',
  ai_suggested: 'border-purple-400/40 bg-purple-500/10 text-purple-100',
  unknown: 'border-white/10 bg-black/20 text-slate-400',
};

function strategyProvenance(profile: ProfileSnapshot | null): Record<string, ProfileFieldProvenance> {
  const raw = profile?.careerGoals?.strategy?.profileProvenance;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, ProfileFieldProvenance>;
  return {};
}

function provenanceFor(profile: ProfileSnapshot | null, key: string, fallback?: ProfileFieldProvenance): ProfileFieldProvenance {
  const imported = strategyProvenance(profile)[key];
  if (imported?.source) return imported;
  return fallback ?? { source: 'unknown', updatedAt: null, note: 'No provenance recorded' };
}

function ProvenanceBadge({ value }: { value?: ProfileFieldProvenance }) {
  const source = value?.source ?? 'unknown';
  return (
    <span
      title={value?.note ?? PROVENANCE_LABELS[source]}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PROVENANCE_CLASSES[source]}`}
    >
      <CheckCircle2 className="h-3 w-3" />
      {PROVENANCE_LABELS[source]}
    </span>
  );
}

function SectionHeader(props: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string; badge?: React.ReactNode }) {
  const Icon = props.icon;
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15">
          <Icon className="h-5 w-5 text-indigo-200" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{props.title}</h2>
          {props.description ? <p className="mt-1 text-sm text-slate-400">{props.description}</p> : null}
        </div>
      </div>
      {props.badge}
    </div>
  );
}

function Field(props: { label: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
        {props.label}
        {props.badge}
      </span>
      {props.children}
    </label>
  );
}

function SaveButton(props: { children: React.ReactNode; isSaving: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.isSaving}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {props.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {props.children}
    </button>
  );
}

function emptyPersonalInfo(): PersonalInfo {
  return { fullName: '', email: '', phone: '', location: '', headline: '', summary: '', linkedinUrl: '', cvUrl: '' };
}

function completionScore(profile: ProfileSnapshot | null): number {
  if (!profile) return 0;
  const checks = [
    Boolean(profile.personalInfo.fullName),
    Boolean(profile.personalInfo.email),
    Boolean(profile.personalInfo.summary),
    profile.skills.length > 0,
    profile.experiences.length > 0,
    profile.educations.length > 0,
    profile.trainings.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function ProfileScreen() {
  const { user, isLoaded } = useUser();
  const {
    profile,
    isLoadingProfile,
    isSaving,
    error,
    dismissError,
    loadProfile,
    savePersonalInfo,
    saveSkills,
    replaceExperiences,
    replaceEducations,
    replaceTrainings,
  } = useProfileStore();

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => emptyPersonalInfo());
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState<ProfileExperienceInput[]>([]);
  const [educations, setEducations] = useState<ProfileEducationInput[]>([]);
  const [trainings, setTrainings] = useState<ProfileTrainingInput[]>([]);

  useEffect(() => {
    if (isLoaded && user?.id) void loadProfile();
  }, [isLoaded, user?.id, loadProfile]);

  useEffect(() => {
    if (!profile) return;
    setPersonalInfo(profile.personalInfo);
    setSkills(profile.skills ?? []);
    setExperiences((profile.experiences ?? []).map(({ employerName, jobTitle, startDate, endDate, description, achievements }) => ({ employerName, jobTitle, startDate, endDate, description, achievements: achievements ?? [] })));
    setEducations((profile.educations ?? []).map(({ schoolName, degree, fieldOfStudy, startDate, endDate }) => ({ schoolName, degree, fieldOfStudy, startDate, endDate })));
    setTrainings((profile.trainings ?? []).map(({ title, providerName, issuedAt, expiresAt, credentialUrl }) => ({ title, providerName, issuedAt, expiresAt, credentialUrl })));
  }, [profile]);

  const completion = useMemo(() => completionScore(profile), [profile]);

  if (isLoaded && !user?.id) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        <h1 className="text-xl font-semibold">Profile unavailable</h1>
        <p className="mt-2 text-sm text-amber-200">Sign in to manage your approved profile.</p>
      </div>
    );
  }

  if (!isLoaded || isLoadingProfile) {
    return <div className="flex h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-400" /></div>;
  }

  if (error && !profile) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <h1 className="text-xl font-semibold text-red-100">Could not load Profile</h1>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <button type="button" onClick={() => void loadProfile()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Retry</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold text-white">Profile is empty</h1>
        <p className="mt-2 text-sm text-slate-400">Your approved profile record is not available yet.</p>
      </div>
    );
  }

  const personalBadge = (key: PersonalKey) => (
    <ProvenanceBadge value={provenanceFor(profile, `personalInfo.${key}`, profile.provenance.personalInfo[key])} />
  );

  const addSkill = () => {
    const next = newSkill.trim();
    if (!next || skills.includes(next)) return;
    setSkills([...skills, next]);
    setNewSkill('');
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Approved Profile</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Profile</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              This is the only approved source of truth. CV parser output appears here only after explicit review in Document Hub, because silent overwrite belongs in the museum of bad product decisions.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Profile completeness</p>
            <p className="mt-1 text-2xl font-bold text-white">{completion}%</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
          <button type="button" onClick={dismissError} className="text-red-200 hover:text-white" aria-label="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      ) : null}

      <section className={cardClass}>
        <SectionHeader icon={UserRound} title="Personal information" description="Approved identity and summary used by downstream modules." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Full Name" badge={personalBadge('fullName')}><input className={inputClass} value={personalInfo.fullName} onChange={(event) => setPersonalInfo({ ...personalInfo, fullName: event.target.value })} /></Field>
          <Field label="Email" badge={personalBadge('email')}><input className={inputClass} type="email" value={personalInfo.email} onChange={(event) => setPersonalInfo({ ...personalInfo, email: event.target.value })} /></Field>
          <Field label="Phone" badge={personalBadge('phone')}><input className={inputClass} value={personalInfo.phone} onChange={(event) => setPersonalInfo({ ...personalInfo, phone: event.target.value })} /></Field>
          <Field label="Location" badge={personalBadge('location')}><input className={inputClass} value={personalInfo.location} onChange={(event) => setPersonalInfo({ ...personalInfo, location: event.target.value })} /></Field>
          <Field label="Headline" badge={personalBadge('headline')}><input className={inputClass} value={personalInfo.headline} onChange={(event) => setPersonalInfo({ ...personalInfo, headline: event.target.value })} /></Field>
          <Field label="LinkedIn URL" badge={personalBadge('linkedinUrl')}><input className={inputClass} value={personalInfo.linkedinUrl} onChange={(event) => setPersonalInfo({ ...personalInfo, linkedinUrl: event.target.value })} /></Field>
          <div className="lg:col-span-2"><Field label="Professional Summary" badge={personalBadge('summary')}><textarea className={textAreaClass} value={personalInfo.summary} onChange={(event) => setPersonalInfo({ ...personalInfo, summary: event.target.value })} /></Field></div>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void savePersonalInfo(personalInfo)}>Save personal information</SaveButton></div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Sparkles} title="Skills" description="Approved skills only. Imported parser output must pass Document Hub review first." badge={<ProvenanceBadge value={provenanceFor(profile, 'skills', profile.provenance.skills[0])} />} />
        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? skills.map((skill, index) => (
            <span key={`${skill}:${index}`} className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-indigo-100">
              {skill}
              <button type="button" onClick={() => setSkills(skills.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${skill}`}><X className="h-3 w-3" /></button>
            </span>
          )) : <p className="text-sm text-slate-500">No approved skills yet.</p>}
        </div>
        <div className="mt-4 flex gap-2">
          <input className={inputClass} value={newSkill} onChange={(event) => setNewSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addSkill(); }} placeholder="Add a skill" />
          <button type="button" onClick={addSkill} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void saveSkills(skills)}>Save skills</SaveButton></div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Briefcase} title="Work experience" description="Approved work history evidence." badge={<ProvenanceBadge value={provenanceFor(profile, 'experiences', profile.experiences[0] ? profile.provenance.experiences[profile.experiences[0].id]?.record : undefined)} />} />
        <div className="space-y-3">
          {experiences.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2">
              <Field label="Company / Employer"><input className={inputClass} value={item.employerName} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, employerName: event.target.value } : row))} /></Field>
              <Field label="Job Title"><input className={inputClass} value={item.jobTitle} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, jobTitle: event.target.value } : row))} /></Field>
              <Field label="Start Date"><input className={inputClass} value={item.startDate} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, startDate: event.target.value } : row))} /></Field>
              <Field label="End Date"><input className={inputClass} value={item.endDate ?? ''} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, endDate: event.target.value || null } : row))} /></Field>
              <div className="md:col-span-2"><Field label="Description"><textarea className={textAreaClass} value={item.description} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} /></Field></div>
              <button type="button" onClick={() => setExperiences(experiences.filter((_, i) => i !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove experience</button>
            </div>
          ))}
          {experiences.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No approved experience yet.</p> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => setExperiences([...experiences, { employerName: '', jobTitle: '', startDate: '', endDate: null, description: '', achievements: [] }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add experience</button>
          <SaveButton isSaving={isSaving} onClick={() => void replaceExperiences(experiences)}>Save work experience</SaveButton>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardClass}>
          <SectionHeader icon={GraduationCap} title="Education" badge={<ProvenanceBadge value={provenanceFor(profile, 'educations', profile.educations[0] ? profile.provenance.educations[profile.educations[0].id]?.record : undefined)} />} />
          <div className="space-y-3">
            {educations.map((item, index) => (
              <div key={index} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <Field label="School Name"><input className={inputClass} value={item.schoolName} onChange={(event) => setEducations(educations.map((row, i) => i === index ? { ...row, schoolName: event.target.value } : row))} /></Field>
                <Field label="Degree"><input className={inputClass} value={item.degree} onChange={(event) => setEducations(educations.map((row, i) => i === index ? { ...row, degree: event.target.value } : row))} /></Field>
                <Field label="Field Of Study"><input className={inputClass} value={item.fieldOfStudy} onChange={(event) => setEducations(educations.map((row, i) => i === index ? { ...row, fieldOfStudy: event.target.value } : row))} /></Field>
                <button type="button" onClick={() => setEducations(educations.filter((_, i) => i !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove education</button>
              </div>
            ))}
            {educations.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No approved education yet.</p> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setEducations([...educations, { schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add education</button>
            <SaveButton isSaving={isSaving} onClick={() => void replaceEducations(educations)}>Save education</SaveButton>
          </div>
        </div>

        <div className={cardClass}>
          <SectionHeader icon={Award} title="Training / Courses" badge={<ProvenanceBadge value={provenanceFor(profile, 'trainings', profile.trainings[0] ? profile.provenance.trainings[profile.trainings[0].id]?.record : undefined)} />} />
          <div className="space-y-3">
            {trainings.map((item, index) => (
              <div key={index} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <Field label="Title"><input className={inputClass} value={item.title} onChange={(event) => setTrainings(trainings.map((row, i) => i === index ? { ...row, title: event.target.value } : row))} /></Field>
                <Field label="Provider Name"><input className={inputClass} value={item.providerName} onChange={(event) => setTrainings(trainings.map((row, i) => i === index ? { ...row, providerName: event.target.value } : row))} /></Field>
                <Field label="Credential URL"><input className={inputClass} value={item.credentialUrl} onChange={(event) => setTrainings(trainings.map((row, i) => i === index ? { ...row, credentialUrl: event.target.value } : row))} /></Field>
                <button type="button" onClick={() => setTrainings(trainings.filter((_, i) => i !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove training</button>
              </div>
            ))}
            {trainings.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No approved training yet.</p> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setTrainings([...trainings, { title: '', providerName: '', issuedAt: '', expiresAt: null, credentialUrl: '' }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add training</button>
            <SaveButton isSaving={isSaving} onClick={() => void replaceTrainings(trainings)}>Save training / courses</SaveButton>
          </div>
        </div>
      </section>
    </div>
  );
}
