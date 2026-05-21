import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Heart,
  Languages,
  Loader2,
  Plus,
  Radar,
  Route,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import type {
  ContractTypePreference,
  EmploymentTypePreference,
  PersonalInfo,
  PreferredWorkSetup,
  ProfileEducationInput,
  ProfileExperienceInput,
  ProfileFieldProvenance,
  ProfileFieldProvenanceTag,
  ProfileHobbyInput,
  ProfileLanguageInput,
  ProfileSnapshot,
  ProfileTrainingInput,
  WorkModePreference,
} from '../../../../shared/profile';

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60';
const textAreaClass = `${inputClass} min-h-24 resize-y`;
const cardClass = 'rounded-2xl border border-white/10 bg-white/5 p-6';
const subtleCardClass = 'rounded-2xl border border-white/10 bg-black/20 p-4';

type PersonalKey = keyof PersonalInfo;

type CareerForm = {
  currentJobTitle: string;
  currentSalary: string;
  targetJobTitle: string;
  targetSalary: string;
  targetSalaryMin: string;
  targetSalaryMax: string;
  targetSeniority: string;
  autoApplyMinScore: number;
};

const EMPTY_WORK_SETUP: PreferredWorkSetup = {
  workModePreferences: [],
  employmentTypePreferences: [],
  contractPreferences: [],
  preferredHoursPerWeek: null,
  preferredWorkRatio: null,
};

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

const WORK_MODE_LABELS: Record<WorkModePreference, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' };
const EMPLOYMENT_TYPE_LABELS: Record<EmploymentTypePreference, string> = { full_time: 'Full Time', part_time: 'Part Time', temporary: 'Temporary', occasional: 'Occasional' };
const CONTRACT_TYPE_LABELS: Record<ContractTypePreference, string> = { employment_contract: 'Employment Contract', b2b: 'B2B', self_employed: 'Self Employed', fixed_term: 'Fixed Term', contract: 'Contract' };

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
    <span title={value?.note ?? PROVENANCE_LABELS[source]} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PROVENANCE_CLASSES[source]}`}>
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

function Field(props: { label: string; badge?: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
        {props.label}
        {props.badge}
      </span>
      {props.children}
      {props.hint ? <span className="block text-[11px] text-slate-500">{props.hint}</span> : null}
    </label>
  );
}

function SaveButton(props: { children: React.ReactNode; isSaving: boolean; onClick: () => void; variant?: 'primary' | 'secondary' }) {
  const cls = props.variant === 'secondary'
    ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60'
    : 'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60';
  return (
    <button type="button" onClick={props.onClick} disabled={props.isSaving} className={cls}>
      {props.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {props.children}
    </button>
  );
}

function TogglePill<T extends string>(props: { value: T; selected: boolean; label: string; onToggle: (value: T) => void }) {
  return (
    <button
      type="button"
      onClick={() => props.onToggle(props.value)}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${props.selected ? 'border-indigo-300/60 bg-indigo-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
    >
      {props.label}
    </button>
  );
}

function emptyPersonalInfo(): PersonalInfo {
  return { fullName: '', email: '', phone: '', location: '', headline: '', summary: '', linkedinUrl: '', cvUrl: '' };
}

function emptyCareerForm(): CareerForm {
  return { currentJobTitle: '', currentSalary: '', targetJobTitle: '', targetSalary: '', targetSalaryMin: '', targetSalaryMax: '', targetSeniority: '', autoApplyMinScore: 75 };
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
    Boolean(profile.careerGoals?.targetJobTitle),
    Boolean(profile.careerGoals?.targetSeniority),
    (profile.careerGoals?.workValues ?? []).length > 0,
    Boolean(profile.careerGoals?.targetSalaryMin || profile.careerGoals?.targetSalaryMax || profile.careerGoals?.targetSalary),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function numberOrNull(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
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
    saveCareerGoals,
    saveWorkSetup,
    replaceLanguages,
    replaceHobbies,
    generateAiRoadmap,
  } = useProfileStore();

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => emptyPersonalInfo());
  const [careerForm, setCareerForm] = useState<CareerForm>(() => emptyCareerForm());
  const [workSetup, setWorkSetup] = useState<PreferredWorkSetup>(EMPTY_WORK_SETUP);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [workValues, setWorkValues] = useState<string[]>([]);
  const [newWorkValue, setNewWorkValue] = useState('');
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [newIndustry, setNewIndustry] = useState('');
  const [blockedAreas, setBlockedAreas] = useState<string[]>([]);
  const [newBlockedArea, setNewBlockedArea] = useState('');
  const [growthPlan, setGrowthPlan] = useState<string[]>([]);
  const [newGrowthItem, setNewGrowthItem] = useState('');
  const [experiences, setExperiences] = useState<ProfileExperienceInput[]>([]);
  const [educations, setEducations] = useState<ProfileEducationInput[]>([]);
  const [trainings, setTrainings] = useState<ProfileTrainingInput[]>([]);
  const [languages, setLanguages] = useState<ProfileLanguageInput[]>([]);
  const [hobbies, setHobbies] = useState<ProfileHobbyInput[]>([]);

  useEffect(() => {
    if (isLoaded && user?.id) void loadProfile();
  }, [isLoaded, user?.id, loadProfile]);

  useEffect(() => {
    if (!profile) return;
    const career = profile.careerGoals;
    const strategy = career?.strategy ?? {};
    setPersonalInfo(profile.personalInfo);
    setCareerForm({
      currentJobTitle: career?.currentJobTitle ?? '',
      currentSalary: career?.currentSalary == null ? '' : String(career.currentSalary),
      targetJobTitle: career?.targetJobTitle ?? '',
      targetSalary: career?.targetSalary == null ? '' : String(career.targetSalary),
      targetSalaryMin: career?.targetSalaryMin == null ? '' : String(career.targetSalaryMin),
      targetSalaryMax: career?.targetSalaryMax == null ? '' : String(career.targetSalaryMax),
      targetSeniority: career?.targetSeniority ?? '',
      autoApplyMinScore: career?.autoApplyMinScore ?? 75,
    });
    setWorkSetup(career?.preferredWorkSetup ?? EMPTY_WORK_SETUP);
    setSkills(profile.skills ?? []);
    setWorkValues(career?.workValues ?? []);
    setTargetIndustries(toList(strategy.targetIndustries));
    setBlockedAreas(toList(strategy.blockedAreas));
    setGrowthPlan(toList(strategy.growthPlan));
    setExperiences((profile.experiences ?? []).map(({ employerName, jobTitle, startDate, endDate, description, achievements }) => ({ employerName, jobTitle, startDate, endDate, description, achievements: achievements ?? [] })));
    setEducations((profile.educations ?? []).map(({ schoolName, degree, fieldOfStudy, startDate, endDate }) => ({ schoolName, degree, fieldOfStudy, startDate, endDate })));
    setTrainings((profile.trainings ?? []).map(({ title, providerName, issuedAt, expiresAt, credentialUrl }) => ({ title, providerName, issuedAt, expiresAt, credentialUrl })));
    setLanguages((profile.languages ?? []).map(({ name, proficiency, certificate }) => ({ name, proficiency, certificate: certificate ?? null })));
    setHobbies((profile.hobbies ?? []).map(({ name, description }) => ({ name, description: description ?? null })));
  }, [profile]);

  const completion = useMemo(() => completionScore(profile), [profile]);
  const roadmap = Array.isArray(profile?.careerGoals?.strategy?.roadmap) ? profile.careerGoals.strategy.roadmap : [];
  const highImpactImprovements = toList(profile?.careerGoals?.strategy?.highImpactImprovements);

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
        <button type="button" onClick={() => void loadProfile()} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Retry</button>
      </div>
    );
  }

  const personalBadge = (key: PersonalKey) => <ProvenanceBadge value={provenanceFor(profile, `personalInfo.${key}`, profile.provenance.personalInfo[key])} />;

  const addStringItem = (value: string, current: string[], setter: (next: string[]) => void, clear: () => void) => {
    const next = value.trim();
    if (!next || current.includes(next)) return;
    setter([...current, next]);
    clear();
  };

  const saveCareerDirection = () => saveCareerGoals({
    currentJobTitle: careerForm.currentJobTitle.trim() || null,
    currentSalary: numberOrNull(careerForm.currentSalary),
    targetJobTitle: careerForm.targetJobTitle.trim() || null,
    targetSalary: numberOrNull(careerForm.targetSalary),
    targetSalaryMin: numberOrNull(careerForm.targetSalaryMin),
    targetSalaryMax: numberOrNull(careerForm.targetSalaryMax),
    targetSeniority: careerForm.targetSeniority.trim() || null,
    workValues,
    autoApplyMinScore: careerForm.autoApplyMinScore,
    strategy: { targetIndustries },
  });

  const saveStrategyActions = () => saveCareerGoals({ strategy: { growthPlan, blockedAreas } });

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-900 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-200">Approved Profile Source Of Truth</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Profile</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              This screen controls matching, radar decisions, applications, auto-apply rules and document generation. Parser output appears here only after explicit review.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Completeness</p>
              <p className="mt-1 text-2xl font-bold text-white">{completion}%</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Target Role</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{profile.careerGoals?.targetJobTitle || 'Not Set'}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Auto-Apply</p>
              <p className="mt-1 text-sm font-semibold text-white">Min Score {profile.careerGoals?.autoApplyMinScore ?? 75}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/documents" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"><Sparkles className="h-4 w-4" />Review CV Import</Link>
          <Link to="/job-radar" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"><Radar className="h-4 w-4" />Open Job Radar</Link>
          <SaveButton isSaving={isSaving} onClick={() => void saveCareerDirection()}>Save Career Direction</SaveButton>
        </div>
      </header>

      {error ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
          <button type="button" onClick={dismissError} className="text-red-200 hover:text-white" aria-label="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      ) : null}

      <section className={cardClass}>
        <SectionHeader icon={Target} title="Career Direction" description="Target role, salary range, seniority, industries and auto-apply threshold used by Jobs, Radar and Applications." />
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Current Job Title"><input className={inputClass} value={careerForm.currentJobTitle} onChange={(event) => setCareerForm({ ...careerForm, currentJobTitle: event.target.value })} /></Field>
          <Field label="Target Job Title"><input className={inputClass} value={careerForm.targetJobTitle} onChange={(event) => setCareerForm({ ...careerForm, targetJobTitle: event.target.value })} /></Field>
          <Field label="Target Seniority"><input className={inputClass} value={careerForm.targetSeniority} onChange={(event) => setCareerForm({ ...careerForm, targetSeniority: event.target.value })} placeholder="Junior, Mid, Senior, Lead…" /></Field>
          <Field label="Current Salary"><input className={inputClass} inputMode="numeric" value={careerForm.currentSalary} onChange={(event) => setCareerForm({ ...careerForm, currentSalary: event.target.value })} /></Field>
          <Field label="Target Salary"><input className={inputClass} inputMode="numeric" value={careerForm.targetSalary} onChange={(event) => setCareerForm({ ...careerForm, targetSalary: event.target.value })} /></Field>
          <Field label="Auto-Apply Threshold" hint="Used as minimum score for automation decisions."><input className={inputClass} type="number" min={0} max={100} value={careerForm.autoApplyMinScore} onChange={(event) => setCareerForm({ ...careerForm, autoApplyMinScore: Number(event.target.value) })} /></Field>
          <Field label="Target Salary Min"><input className={inputClass} inputMode="numeric" value={careerForm.targetSalaryMin} onChange={(event) => setCareerForm({ ...careerForm, targetSalaryMin: event.target.value })} /></Field>
          <Field label="Target Salary Max"><input className={inputClass} inputMode="numeric" value={careerForm.targetSalaryMax} onChange={(event) => setCareerForm({ ...careerForm, targetSalaryMax: event.target.value })} /></Field>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className={subtleCardClass}>
            <h3 className="text-sm font-semibold text-white">Work Values</h3>
            <div className="mt-3 flex flex-wrap gap-2">{workValues.length ? workValues.map((value) => <span key={value} className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">{value}<button type="button" onClick={() => setWorkValues(workValues.filter((item) => item !== value))}><X className="h-3 w-3" /></button></span>) : <p className="text-sm text-slate-500">No work values yet.</p>}</div>
            <div className="mt-3 flex gap-2"><input className={inputClass} value={newWorkValue} onChange={(event) => setNewWorkValue(event.target.value)} placeholder="Autonomy, stability, impact…" /><button type="button" onClick={() => addStringItem(newWorkValue, workValues, setWorkValues, () => setNewWorkValue(''))} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button></div>
          </div>
          <div className={subtleCardClass}>
            <h3 className="text-sm font-semibold text-white">Target Industries</h3>
            <div className="mt-3 flex flex-wrap gap-2">{targetIndustries.length ? targetIndustries.map((value) => <span key={value} className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-100">{value}<button type="button" onClick={() => setTargetIndustries(targetIndustries.filter((item) => item !== value))}><X className="h-3 w-3" /></button></span>) : <p className="text-sm text-slate-500">No target industries yet.</p>}</div>
            <div className="mt-3 flex gap-2"><input className={inputClass} value={newIndustry} onChange={(event) => setNewIndustry(event.target.value)} placeholder="Healthcare, SaaS, hospitality…" /><button type="button" onClick={() => addStringItem(newIndustry, targetIndustries, setTargetIndustries, () => setNewIndustry(''))} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button></div>
          </div>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void saveCareerDirection()}>Save Career Direction</SaveButton></div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={SlidersHorizontal} title="Work Setup" description="Controls preferred remote/hybrid/onsite setup, employment type, contract type and working pattern." />
        <div className="grid gap-5 lg:grid-cols-3">
          <div><p className="mb-2 text-xs font-medium text-slate-400">Work Mode</p><div className="flex flex-wrap gap-2">{(Object.keys(WORK_MODE_LABELS) as WorkModePreference[]).map((value) => <TogglePill key={value} value={value} label={WORK_MODE_LABELS[value]} selected={workSetup.workModePreferences.includes(value)} onToggle={(v) => setWorkSetup({ ...workSetup, workModePreferences: toggleArrayValue(workSetup.workModePreferences, v) })} />)}</div></div>
          <div><p className="mb-2 text-xs font-medium text-slate-400">Employment Type</p><div className="flex flex-wrap gap-2">{(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentTypePreference[]).map((value) => <TogglePill key={value} value={value} label={EMPLOYMENT_TYPE_LABELS[value]} selected={workSetup.employmentTypePreferences.includes(value)} onToggle={(v) => setWorkSetup({ ...workSetup, employmentTypePreferences: toggleArrayValue(workSetup.employmentTypePreferences, v) })} />)}</div></div>
          <div><p className="mb-2 text-xs font-medium text-slate-400">Contract Type</p><div className="flex flex-wrap gap-2">{(Object.keys(CONTRACT_TYPE_LABELS) as ContractTypePreference[]).map((value) => <TogglePill key={value} value={value} label={CONTRACT_TYPE_LABELS[value]} selected={workSetup.contractPreferences.includes(value)} onToggle={(v) => setWorkSetup({ ...workSetup, contractPreferences: toggleArrayValue(workSetup.contractPreferences, v) })} />)}</div></div>
          <Field label="Preferred Hours / Week"><input className={inputClass} type="number" min={1} max={80} value={workSetup.preferredHoursPerWeek ?? ''} onChange={(event) => setWorkSetup({ ...workSetup, preferredHoursPerWeek: event.target.value ? Number(event.target.value) : null })} /></Field>
          <Field label="Preferred Remote Ratio %"><input className={inputClass} type="number" min={1} max={100} value={workSetup.preferredWorkRatio ?? ''} onChange={(event) => setWorkSetup({ ...workSetup, preferredWorkRatio: event.target.value ? Number(event.target.value) : null })} /></Field>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void saveWorkSetup(workSetup)}>Save Work Setup</SaveButton></div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={UserRound} title="Personal Information" description="Approved identity and summary used by downstream modules." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Full Name" badge={personalBadge('fullName')}><input className={inputClass} value={personalInfo.fullName} onChange={(event) => setPersonalInfo({ ...personalInfo, fullName: event.target.value })} /></Field>
          <Field label="Email" badge={personalBadge('email')} hint="Email is synced from account identity."><input className={inputClass} type="email" value={personalInfo.email} disabled readOnly /></Field>
          <Field label="Phone" badge={personalBadge('phone')}><input className={inputClass} value={personalInfo.phone} onChange={(event) => setPersonalInfo({ ...personalInfo, phone: event.target.value })} /></Field>
          <Field label="Location" badge={personalBadge('location')}><input className={inputClass} value={personalInfo.location} onChange={(event) => setPersonalInfo({ ...personalInfo, location: event.target.value })} /></Field>
          <Field label="Headline" badge={personalBadge('headline')}><input className={inputClass} value={personalInfo.headline} onChange={(event) => setPersonalInfo({ ...personalInfo, headline: event.target.value })} /></Field>
          <Field label="LinkedIn URL" badge={personalBadge('linkedinUrl')}><input className={inputClass} value={personalInfo.linkedinUrl} onChange={(event) => setPersonalInfo({ ...personalInfo, linkedinUrl: event.target.value })} /></Field>
          <div className="lg:col-span-2"><Field label="Professional Summary" badge={personalBadge('summary')}><textarea className={textAreaClass} value={personalInfo.summary} onChange={(event) => setPersonalInfo({ ...personalInfo, summary: event.target.value })} /></Field></div>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void savePersonalInfo(personalInfo)}>Save Personal Information</SaveButton></div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Route} title="Growth Plan And Roadmap" description="Action layer used by Skill Lab, Coach and Job Radar. No silent AI writes: save only deliberate changes." />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className={subtleCardClass}>
            <h3 className="text-sm font-semibold text-white">Growth Plan</h3>
            <div className="mt-3 space-y-2">{growthPlan.length ? growthPlan.map((item) => <div key={item} className="flex items-start justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200"><span>{item}</span><button type="button" onClick={() => setGrowthPlan(growthPlan.filter((row) => row !== item))}><X className="h-4 w-4" /></button></div>) : <p className="text-sm text-slate-500">No growth actions yet.</p>}</div>
            <div className="mt-3 flex gap-2"><input className={inputClass} value={newGrowthItem} onChange={(event) => setNewGrowthItem(event.target.value)} placeholder="Add growth action" /><button type="button" onClick={() => addStringItem(newGrowthItem, growthPlan, setGrowthPlan, () => setNewGrowthItem(''))} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button></div>
          </div>
          <div className={subtleCardClass}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldAlert className="h-4 w-4 text-amber-300" />Blocked Areas</h3>
            <div className="mt-3 flex flex-wrap gap-2">{blockedAreas.length ? blockedAreas.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100">{item}<button type="button" onClick={() => setBlockedAreas(blockedAreas.filter((row) => row !== item))}><X className="h-3 w-3" /></button></span>) : <p className="text-sm text-slate-500">No blocked areas yet.</p>}</div>
            <div className="mt-3 flex gap-2"><input className={inputClass} value={newBlockedArea} onChange={(event) => setNewBlockedArea(event.target.value)} placeholder="Low salary, night shifts…" /><button type="button" onClick={() => addStringItem(newBlockedArea, blockedAreas, setBlockedAreas, () => setNewBlockedArea(''))} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button></div>
          </div>
          <div className={subtleCardClass}>
            <h3 className="text-sm font-semibold text-white">Roadmap</h3>
            <div className="mt-3 space-y-2">{roadmap.length ? roadmap.slice(0, 5).map((item, index) => <div key={`${item.title}:${index}`} className="rounded-xl bg-white/5 px-3 py-2"><p className="text-sm font-medium text-white">{item.title}</p>{item.description ? <p className="mt-1 text-xs text-slate-400">{item.description}</p> : null}</div>) : <p className="text-sm text-slate-500">No roadmap yet. Generate or save growth actions first.</p>}</div>
            {highImpactImprovements.length ? <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">{highImpactImprovements.slice(0, 3).join(' · ')}</div> : null}
            <button type="button" onClick={() => void generateAiRoadmap({ targetRole: careerForm.targetJobTitle, targetSeniority: careerForm.targetSeniority })} disabled={isSaving} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"><Sparkles className="h-4 w-4" />Refresh Roadmap</button>
          </div>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void saveStrategyActions()}>Save Growth Plan And Blocked Areas</SaveButton></div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Sparkles} title="Skills" description="Approved skills only. Imported parser output must pass Document Hub review first." badge={<ProvenanceBadge value={provenanceFor(profile, 'skills', profile.provenance.skills[0])} />} />
        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? skills.map((skill, index) => (
            <span key={`${skill}:${index}`} className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-indigo-100">{skill}<button type="button" onClick={() => setSkills(skills.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${skill}`}><X className="h-3 w-3" /></button></span>
          )) : <p className="text-sm text-slate-500">No approved skills yet.</p>}
        </div>
        <div className="mt-4 flex gap-2"><input className={inputClass} value={newSkill} onChange={(event) => setNewSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addStringItem(newSkill, skills, setSkills, () => setNewSkill('')); }} placeholder="Add a skill" /><button type="button" onClick={() => addStringItem(newSkill, skills, setSkills, () => setNewSkill(''))} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button></div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void saveSkills(skills)}>Save Skills</SaveButton></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardClass}>
          <SectionHeader icon={Languages} title="Languages" description="Used by matching and CV value signals." />
          <div className="space-y-3">
            {languages.map((item, index) => <div key={index} className={subtleCardClass}><div className="grid gap-3 md:grid-cols-3"><Field label="Language"><input className={inputClass} value={item.name} onChange={(event) => setLanguages(languages.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} /></Field><Field label="Proficiency"><input className={inputClass} value={item.proficiency} onChange={(event) => setLanguages(languages.map((row, i) => i === index ? { ...row, proficiency: event.target.value } : row))} /></Field><Field label="Certificate"><input className={inputClass} value={item.certificate ?? ''} onChange={(event) => setLanguages(languages.map((row, i) => i === index ? { ...row, certificate: event.target.value || null } : row))} /></Field></div><button type="button" onClick={() => setLanguages(languages.filter((_, i) => i !== index))} className="mt-3 inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove language</button></div>)}
            {languages.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No languages yet.</p> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setLanguages([...languages, { name: '', proficiency: '', certificate: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add Language</button><SaveButton isSaving={isSaving} onClick={() => void replaceLanguages(languages)}>Save Languages</SaveButton></div>
        </div>
        <div className={cardClass}>
          <SectionHeader icon={Heart} title="Hobbies And Differentiators" description="Optional signals for personality, interests and culture fit." />
          <div className="space-y-3">
            {hobbies.map((item, index) => <div key={index} className={subtleCardClass}><Field label="Name"><input className={inputClass} value={item.name} onChange={(event) => setHobbies(hobbies.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} /></Field><div className="mt-3"><Field label="Description"><textarea className={textAreaClass} value={item.description ?? ''} onChange={(event) => setHobbies(hobbies.map((row, i) => i === index ? { ...row, description: event.target.value || null } : row))} /></Field></div><button type="button" onClick={() => setHobbies(hobbies.filter((_, i) => i !== index))} className="mt-3 inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove hobby</button></div>)}
            {hobbies.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No hobbies yet.</p> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setHobbies([...hobbies, { name: '', description: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add Hobby</button><SaveButton isSaving={isSaving} onClick={() => void replaceHobbies(hobbies)}>Save Hobbies</SaveButton></div>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Briefcase} title="Work Experience" description="Approved work history evidence." badge={<ProvenanceBadge value={provenanceFor(profile, 'experiences', profile.experiences[0] ? profile.provenance.experiences[profile.experiences[0].id]?.record : undefined)} />} />
        <div className="space-y-3">
          {experiences.map((item, index) => <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2"><Field label="Company / Employer"><input className={inputClass} value={item.employerName} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, employerName: event.target.value } : row))} /></Field><Field label="Job Title"><input className={inputClass} value={item.jobTitle} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, jobTitle: event.target.value } : row))} /></Field><Field label="Start Date"><input className={inputClass} value={item.startDate} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, startDate: event.target.value } : row))} /></Field><Field label="End Date"><input className={inputClass} value={item.endDate ?? ''} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, endDate: event.target.value || null } : row))} /></Field><div className="md:col-span-2"><Field label="Description"><textarea className={textAreaClass} value={item.description} onChange={(event) => setExperiences(experiences.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} /></Field></div><button type="button" onClick={() => setExperiences(experiences.filter((_, i) => i !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove experience</button></div>)}
          {experiences.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No approved experience yet.</p> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setExperiences([...experiences, { employerName: '', jobTitle: '', startDate: '', endDate: null, description: '', achievements: [] }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add Experience</button><SaveButton isSaving={isSaving} onClick={() => void replaceExperiences(experiences)}>Save Work Experience</SaveButton></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardClass}>
          <SectionHeader icon={GraduationCap} title="Education" badge={<ProvenanceBadge value={provenanceFor(profile, 'educations', profile.educations[0] ? profile.provenance.educations[profile.educations[0].id]?.record : undefined)} />} />
          <div className="space-y-3">{educations.map((item, index) => <div key={index} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"><Field label="School Name"><input className={inputClass} value={item.schoolName} onChange={(event) => setEducations(educations.map((row, i) => i === index ? { ...row, schoolName: event.target.value } : row))} /></Field><Field label="Degree"><input className={inputClass} value={item.degree} onChange={(event) => setEducations(educations.map((row, i) => i === index ? { ...row, degree: event.target.value } : row))} /></Field><Field label="Field Of Study"><input className={inputClass} value={item.fieldOfStudy} onChange={(event) => setEducations(educations.map((row, i) => i === index ? { ...row, fieldOfStudy: event.target.value } : row))} /></Field><button type="button" onClick={() => setEducations(educations.filter((_, i) => i !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove education</button></div>)}{educations.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No approved education yet.</p> : null}</div>
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setEducations([...educations, { schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add Education</button><SaveButton isSaving={isSaving} onClick={() => void replaceEducations(educations)}>Save Education</SaveButton></div>
        </div>
        <div className={cardClass}>
          <SectionHeader icon={Award} title="Training / Courses" badge={<ProvenanceBadge value={provenanceFor(profile, 'trainings', profile.trainings[0] ? profile.provenance.trainings[profile.trainings[0].id]?.record : undefined)} />} />
          <div className="space-y-3">{trainings.map((item, index) => <div key={index} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"><Field label="Title"><input className={inputClass} value={item.title} onChange={(event) => setTrainings(trainings.map((row, i) => i === index ? { ...row, title: event.target.value } : row))} /></Field><Field label="Provider Name"><input className={inputClass} value={item.providerName} onChange={(event) => setTrainings(trainings.map((row, i) => i === index ? { ...row, providerName: event.target.value } : row))} /></Field><Field label="Credential URL"><input className={inputClass} value={item.credentialUrl} onChange={(event) => setTrainings(trainings.map((row, i) => i === index ? { ...row, credentialUrl: event.target.value } : row))} /></Field><button type="button" onClick={() => setTrainings(trainings.filter((_, i) => i !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove training</button></div>)}{trainings.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No approved training yet.</p> : null}</div>
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setTrainings([...trainings, { title: '', providerName: '', issuedAt: '', expiresAt: null, credentialUrl: '' }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add Training</button><SaveButton isSaving={isSaving} onClick={() => void replaceTrainings(trainings)}>Save Training / Courses</SaveButton></div>
        </div>
      </section>
    </div>
  );
}
