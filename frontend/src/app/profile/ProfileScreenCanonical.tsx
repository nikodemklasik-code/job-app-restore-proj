import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Award, Briefcase, GraduationCap, Heart, Languages, Loader2, Plus, Save, Sparkles, Target, Trash2, UserRound, X } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import type {
  ContractTypePreference,
  EmploymentTypePreference,
  PersonalInfo,
  ProfileEducationInput,
  ProfileExperienceInput,
  ProfileHobbyInput,
  ProfileLanguageInput,
  ProfileTrainingInput,
  WorkModePreference,
} from '../../../../shared/profile';

const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const areaCls = `${inputCls} min-h-24 resize-y`;
const cardCls = 'rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6';

type CareerForm = {
  dreamRole: string;
  targetSeniority: string;
  targetIndustries: string;
  expectedSalaryMin: string;
  expectedSalaryMax: string;
  workValues: string;
  minimumFitScore: number;
};

type WorkSetupForm = {
  workModePreferences: WorkModePreference[];
  employmentTypePreferences: EmploymentTypePreference[];
  contractPreferences: ContractTypePreference[];
  preferredHoursPerWeek: string;
  preferredWorkRatio: string;
};

const workModes: Array<{ value: WorkModePreference; label: string }> = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const employmentTypes: Array<{ value: EmploymentTypePreference; label: string }> = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'occasional', label: 'Occasional' },
];

const contractTypes: Array<{ value: ContractTypePreference; label: string }> = [
  { value: 'employment_contract', label: 'Employment contract' },
  { value: 'b2b', label: 'B2B' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'fixed_term', label: 'Fixed-term' },
  { value: 'contract', label: 'Contract' },
];

function nullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitCsv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function joinStrings(value: unknown): string {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join(', ') : '';
}

function strategyOf(profile: ReturnType<typeof useProfileStore.getState>['profile']) {
  return profile?.careerGoals?.strategy ?? {};
}

function dreamJobOf(profile: ReturnType<typeof useProfileStore.getState>['profile']) {
  const raw = strategyOf(profile).dreamJob;
  return raw && typeof raw === 'object' ? (raw as { targetRole?: unknown; targetSeniority?: unknown; targetIndustries?: unknown }) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: typeof UserRound; title: string; description?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15">
        <Icon className="h-5 w-5 text-indigo-200" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
    </div>
  );
}

function SaveButton({ isSaving, onClick, children }: { isSaving: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {children}
    </button>
  );
}

function ToggleGroup<T extends string>({ title, options, values, onChange }: { title: string; options: Array<{ value: T; label: string }>; values: T[]; onChange: (next: T[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button key={option.value} type="button" onClick={() => onChange(selected ? values.filter((item) => item !== option.value) : [...values, option.value])} className={selected ? 'rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-indigo-100' : 'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10'}>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyInline({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-slate-400">{label}</div>;
}

export default function ProfileScreenCanonical() {
  const { user, isLoaded } = useUser();
  const store = useProfileStore();
  const { profile, isLoadingProfile, isSaving, error } = store;

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({ fullName: '', email: '', phone: '', location: '', headline: '', summary: '', linkedinUrl: '', cvUrl: '' });
  const [career, setCareer] = useState<CareerForm>({ dreamRole: '', targetSeniority: '', targetIndustries: '', expectedSalaryMin: '', expectedSalaryMax: '', workValues: '', minimumFitScore: 75 });
  const [workSetup, setWorkSetup] = useState<WorkSetupForm>({ workModePreferences: [], employmentTypePreferences: [], contractPreferences: [], preferredHoursPerWeek: '', preferredWorkRatio: '' });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState<ProfileExperienceInput[]>([]);
  const [educations, setEducations] = useState<ProfileEducationInput[]>([]);
  const [trainings, setTrainings] = useState<ProfileTrainingInput[]>([]);
  const [languages, setLanguages] = useState<ProfileLanguageInput[]>([]);
  const [hobbies, setHobbies] = useState<ProfileHobbyInput[]>([]);

  useEffect(() => {
    if (isLoaded && user?.id) void store.loadProfile();
  }, [isLoaded, store.loadProfile, user?.id]);

  useEffect(() => {
    if (!profile) return;
    const dream = dreamJobOf(profile);
    const setup = profile.careerGoals?.preferredWorkSetup;
    setPersonalInfo(profile.personalInfo);
    setCareer({
      dreamRole: profile.careerGoals?.targetJobTitle ?? text(dream.targetRole),
      targetSeniority: profile.careerGoals?.targetSeniority ?? text(dream.targetSeniority),
      targetIndustries: joinStrings(strategyOf(profile).targetIndustries ?? dream.targetIndustries),
      expectedSalaryMin: profile.careerGoals?.targetSalaryMin?.toString() ?? '',
      expectedSalaryMax: profile.careerGoals?.targetSalaryMax?.toString() ?? '',
      workValues: (profile.careerGoals?.workValues ?? []).join(', '),
      minimumFitScore: profile.careerGoals?.autoApplyMinScore ?? 75,
    });
    setWorkSetup({
      workModePreferences: setup?.workModePreferences ?? [],
      employmentTypePreferences: setup?.employmentTypePreferences ?? [],
      contractPreferences: setup?.contractPreferences ?? [],
      preferredHoursPerWeek: setup?.preferredHoursPerWeek?.toString() ?? '',
      preferredWorkRatio: setup?.preferredWorkRatio?.toString() ?? '',
    });
    setSkills(profile.skills ?? []);
    setExperiences((profile.experiences ?? []).map(({ employerName, jobTitle, startDate, endDate, description }) => ({ employerName, jobTitle, startDate, endDate, description })));
    setEducations((profile.educations ?? []).map(({ schoolName, degree, fieldOfStudy, startDate, endDate }) => ({ schoolName, degree, fieldOfStudy, startDate, endDate })));
    setTrainings((profile.trainings ?? []).map(({ title, providerName, issuedAt, expiresAt, credentialUrl }) => ({ title, providerName, issuedAt, expiresAt, credentialUrl })));
    setLanguages((profile.languages ?? []).map(({ name, proficiency, certificate }) => ({ name, proficiency, certificate: certificate ?? null })));
    setHobbies((profile.hobbies ?? []).map(({ name, description }) => ({ name, description: description ?? null })));
  }, [profile]);

  const completion = useMemo(() => {
    const checks = [personalInfo.fullName, personalInfo.email, personalInfo.summary, skills.length, experiences.length, career.dreamRole, workSetup.workModePreferences.length, languages.length];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [career.dreamRole, experiences.length, languages.length, personalInfo.email, personalInfo.fullName, personalInfo.summary, skills.length, workSetup.workModePreferences.length]);

  const addSkill = () => {
    const next = newSkill.trim();
    if (!next || skills.includes(next)) return;
    setSkills([...skills, next]);
    setNewSkill('');
  };

  const saveCareer = async () => {
    const targetIndustries = splitCsv(career.targetIndustries);
    await store.saveCareerGoals({
      targetJobTitle: career.dreamRole.trim() || null,
      targetSeniority: career.targetSeniority.trim() || null,
      targetSalaryMin: nullableNumber(career.expectedSalaryMin),
      targetSalaryMax: nullableNumber(career.expectedSalaryMax),
      workValues: splitCsv(career.workValues),
      autoApplyMinScore: career.minimumFitScore,
      strategy: {
        ...strategyOf(profile),
        targetIndustries,
        dreamJob: { ...dreamJobOf(profile), targetRole: career.dreamRole.trim() || null, targetSeniority: career.targetSeniority.trim() || null, targetIndustries },
      },
    });
  };

  if (isLoaded && !user?.id) {
    return <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100"><h1 className="text-xl font-semibold">Profile unavailable</h1><p className="mt-2 text-sm text-amber-200">Sign in to manage your profile.</p></div>;
  }

  if (!isLoaded || isLoadingProfile) {
    return <div className="flex h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-400" /></div>;
  }

  if (error && !profile) {
    return <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6"><h1 className="text-xl font-semibold text-red-100">Could not load Profile</h1><p className="mt-2 text-sm text-red-200">{error}</p><button type="button" onClick={() => void store.loadProfile()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Retry</button></div>;
  }

  if (!profile) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-6"><h1 className="text-xl font-semibold text-white">Profile is empty</h1><p className="mt-2 text-sm text-slate-400">Your profile record is not available yet.</p></div>;
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-white/[0.04] to-slate-950 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">Identity core</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Profile</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Real backend-backed profile data used by jobs, documents, applications, practice and AI context. No mock profile state.</p>
          </div>
          <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">Profile completeness</p>
            <p className="mt-1 text-3xl font-bold text-white">{completion}%</p>
          </div>
        </div>
      </header>

      {error ? <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4"><p className="text-sm text-red-200">{error}</p><button type="button" onClick={store.dismissError} className="text-red-200 hover:text-white" aria-label="Dismiss error"><X className="h-4 w-4" /></button></div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Target role</p><p className="mt-1 text-sm font-semibold text-white">{career.dreamRole || 'Not set'}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Work evidence</p><p className="mt-1 text-sm font-semibold text-white">{experiences.length} experience item(s)</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Skills</p><p className="mt-1 text-sm font-semibold text-white">{skills.length} declared</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Languages</p><p className="mt-1 text-sm font-semibold text-white">{languages.length} listed</p></div>
      </section>

      <section className={cardCls}>
        <SectionTitle icon={UserRound} title="Personal information" description="Basic identity and professional summary used across the product." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Full name"><input className={inputCls} value={personalInfo.fullName} onChange={(event) => setPersonalInfo({ ...personalInfo, fullName: event.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} type="email" value={personalInfo.email} onChange={(event) => setPersonalInfo({ ...personalInfo, email: event.target.value })} /></Field>
          <Field label="Phone"><input className={inputCls} value={personalInfo.phone} onChange={(event) => setPersonalInfo({ ...personalInfo, phone: event.target.value })} /></Field>
          <Field label="Location"><input className={inputCls} value={personalInfo.location} onChange={(event) => setPersonalInfo({ ...personalInfo, location: event.target.value })} /></Field>
          <Field label="Headline"><input className={inputCls} value={personalInfo.headline} onChange={(event) => setPersonalInfo({ ...personalInfo, headline: event.target.value })} /></Field>
          <Field label="LinkedIn URL"><input className={inputCls} value={personalInfo.linkedinUrl} onChange={(event) => setPersonalInfo({ ...personalInfo, linkedinUrl: event.target.value })} /></Field>
          <div className="lg:col-span-2"><Field label="Professional summary"><textarea className={areaCls} value={personalInfo.summary} onChange={(event) => setPersonalInfo({ ...personalInfo, summary: event.target.value })} /></Field></div>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void store.savePersonalInfo(personalInfo)}>Save personal information</SaveButton></div>
      </section>

      <section className={cardCls}>
        <SectionTitle icon={Target} title="Career goals" description="Dream role, salary range, values and fit threshold." />
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Dream role"><input className={inputCls} value={career.dreamRole} onChange={(event) => setCareer({ ...career, dreamRole: event.target.value })} /></Field>
          <Field label="Target seniority"><input className={inputCls} value={career.targetSeniority} onChange={(event) => setCareer({ ...career, targetSeniority: event.target.value })} /></Field>
          <Field label="Target industries"><input className={inputCls} value={career.targetIndustries} onChange={(event) => setCareer({ ...career, targetIndustries: event.target.value })} /></Field>
          <Field label="Expected salary minimum"><input className={inputCls} type="number" value={career.expectedSalaryMin} onChange={(event) => setCareer({ ...career, expectedSalaryMin: event.target.value })} /></Field>
          <Field label="Expected salary target"><input className={inputCls} type="number" value={career.expectedSalaryMax} onChange={(event) => setCareer({ ...career, expectedSalaryMax: event.target.value })} /></Field>
          <div><label htmlFor="fit-score" className="flex items-center justify-between text-xs font-medium text-slate-400"><span>Minimum fit score</span><span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-indigo-100">{career.minimumFitScore}%</span></label><input id="fit-score" className="mt-3 w-full accent-indigo-500" type="range" min={0} max={100} step={5} value={career.minimumFitScore} onChange={(event) => setCareer({ ...career, minimumFitScore: Number(event.target.value) })} /></div>
          <div className="lg:col-span-3"><Field label="Work values"><textarea className={areaCls} value={career.workValues} onChange={(event) => setCareer({ ...career, workValues: event.target.value })} /></Field></div>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void saveCareer()}>Save career goals</SaveButton></div>
      </section>

      <section className={cardCls}>
        <SectionTitle icon={Heart} title="Work preferences" description="Work mode, employment type, contract type and preferred working time." />
        <div className="space-y-5">
          <ToggleGroup title="Work mode" options={workModes} values={workSetup.workModePreferences} onChange={(workModePreferences) => setWorkSetup({ ...workSetup, workModePreferences })} />
          <ToggleGroup title="Employment type" options={employmentTypes} values={workSetup.employmentTypePreferences} onChange={(employmentTypePreferences) => setWorkSetup({ ...workSetup, employmentTypePreferences })} />
          <ToggleGroup title="Contract type" options={contractTypes} values={workSetup.contractPreferences} onChange={(contractPreferences) => setWorkSetup({ ...workSetup, contractPreferences })} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Preferred hours per week"><input className={inputCls} type="number" value={workSetup.preferredHoursPerWeek} onChange={(event) => setWorkSetup({ ...workSetup, preferredHoursPerWeek: event.target.value })} /></Field>
            <Field label="Preferred work ratio"><input className={inputCls} type="number" value={workSetup.preferredWorkRatio} onChange={(event) => setWorkSetup({ ...workSetup, preferredWorkRatio: event.target.value })} /></Field>
          </div>
        </div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void store.saveWorkSetup({ workModePreferences: workSetup.workModePreferences, employmentTypePreferences: workSetup.employmentTypePreferences, contractPreferences: workSetup.contractPreferences, preferredHoursPerWeek: nullableNumber(workSetup.preferredHoursPerWeek), preferredWorkRatio: nullableNumber(workSetup.preferredWorkRatio) })}>Save work preferences</SaveButton></div>
      </section>

      <section className={cardCls}>
        <SectionTitle icon={Sparkles} title="Skills" description="Declared profile skills. Verification and course pathing stay in Skill Lab." />
        {skills.length ? <div className="flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-indigo-100">{skill}<button type="button" onClick={() => setSkills(skills.filter((item) => item !== skill))} aria-label={`Remove ${skill}`}><X className="h-3 w-3" /></button></span>)}</div> : <EmptyInline label="No skills added yet." />}
        <div className="mt-4 flex gap-2"><input className={inputCls} value={newSkill} onChange={(event) => setNewSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addSkill(); }} /><button type="button" onClick={addSkill} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button></div>
        <div className="mt-5"><SaveButton isSaving={isSaving} onClick={() => void store.saveSkills(skills)}>Save skills</SaveButton></div>
      </section>

      <section className={cardCls}>
        <SectionTitle icon={Briefcase} title="Work experience" description="Real work history evidence used by CV, jobs and applications." />
        <div className="space-y-3">{experiences.length ? experiences.map((item, index) => <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2"><Field label="Company / employer"><input className={inputCls} value={item.employerName} onChange={(event) => setExperiences(experiences.map((row, rowIndex) => rowIndex === index ? { ...row, employerName: event.target.value } : row))} /></Field><Field label="Job title"><input className={inputCls} value={item.jobTitle} onChange={(event) => setExperiences(experiences.map((row, rowIndex) => rowIndex === index ? { ...row, jobTitle: event.target.value } : row))} /></Field><Field label="Start date"><input className={inputCls} value={item.startDate} onChange={(event) => setExperiences(experiences.map((row, rowIndex) => rowIndex === index ? { ...row, startDate: event.target.value } : row))} /></Field><Field label="End date"><input className={inputCls} value={item.endDate ?? ''} onChange={(event) => setExperiences(experiences.map((row, rowIndex) => rowIndex === index ? { ...row, endDate: event.target.value || null } : row))} /></Field><div className="md:col-span-2"><Field label="Description"><textarea className={areaCls} value={item.description} onChange={(event) => setExperiences(experiences.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row))} /></Field></div><button type="button" onClick={() => setExperiences(experiences.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove experience</button></div>) : <EmptyInline label="No work experience added yet." />}</div>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setExperiences([...experiences, { employerName: '', jobTitle: '', startDate: '', endDate: null, description: '' }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add experience</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceExperiences(experiences)}>Save work experience</SaveButton></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardCls}><SectionTitle icon={GraduationCap} title="Education" />{educations.length ? educations.map((item, index) => <div key={index} className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"><Field label="School name"><input className={inputCls} value={item.schoolName} onChange={(event) => setEducations(educations.map((row, rowIndex) => rowIndex === index ? { ...row, schoolName: event.target.value } : row))} /></Field><Field label="Degree"><input className={inputCls} value={item.degree} onChange={(event) => setEducations(educations.map((row, rowIndex) => rowIndex === index ? { ...row, degree: event.target.value } : row))} /></Field><Field label="Field of study"><input className={inputCls} value={item.fieldOfStudy} onChange={(event) => setEducations(educations.map((row, rowIndex) => rowIndex === index ? { ...row, fieldOfStudy: event.target.value } : row))} /></Field><button type="button" onClick={() => setEducations(educations.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove education</button></div>) : <EmptyInline label="No education added yet." />}<div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setEducations([...educations, { schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add education</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceEducations(educations)}>Save education</SaveButton></div></div>
        <div className={cardCls}><SectionTitle icon={Award} title="Training / courses" />{trainings.length ? trainings.map((item, index) => <div key={index} className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"><Field label="Title"><input className={inputCls} value={item.title} onChange={(event) => setTrainings(trainings.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row))} /></Field><Field label="Provider"><input className={inputCls} value={item.providerName} onChange={(event) => setTrainings(trainings.map((row, rowIndex) => rowIndex === index ? { ...row, providerName: event.target.value } : row))} /></Field><Field label="Credential URL"><input className={inputCls} value={item.credentialUrl} onChange={(event) => setTrainings(trainings.map((row, rowIndex) => rowIndex === index ? { ...row, credentialUrl: event.target.value } : row))} /></Field><button type="button" onClick={() => setTrainings(trainings.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove training</button></div>) : <EmptyInline label="No training or courses added yet." />}<div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setTrainings([...trainings, { title: '', providerName: '', issuedAt: '', expiresAt: null, credentialUrl: '' }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add training</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceTrainings(trainings)}>Save training</SaveButton></div></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardCls}><SectionTitle icon={Languages} title="Languages" />{languages.length ? languages.map((item, index) => <div key={index} className="mb-3 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2"><Field label="Language"><input className={inputCls} value={item.name} onChange={(event) => setLanguages(languages.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} /></Field><Field label="Proficiency"><input className={inputCls} value={item.proficiency} onChange={(event) => setLanguages(languages.map((row, rowIndex) => rowIndex === index ? { ...row, proficiency: event.target.value } : row))} /></Field><div className="md:col-span-2"><Field label="Certificate"><input className={inputCls} value={item.certificate ?? ''} onChange={(event) => setLanguages(languages.map((row, rowIndex) => rowIndex === index ? { ...row, certificate: event.target.value || null } : row))} /></Field></div><button type="button" onClick={() => setLanguages(languages.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove language</button></div>) : <EmptyInline label="No languages added yet." />}<div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setLanguages([...languages, { name: '', proficiency: '', certificate: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add language</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceLanguages(languages)}>Save languages</SaveButton></div></div>
        <div className={cardCls}><SectionTitle icon={Heart} title="Hobbies" />{hobbies.length ? hobbies.map((item, index) => <div key={index} className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"><Field label="Name"><input className={inputCls} value={item.name} onChange={(event) => setHobbies(hobbies.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} /></Field><Field label="Description"><textarea className={areaCls} value={item.description ?? ''} onChange={(event) => setHobbies(hobbies.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value || null } : row))} /></Field><button type="button" onClick={() => setHobbies(hobbies.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex items-center gap-2 text-sm text-rose-200"><Trash2 className="h-4 w-4" />Remove hobby</button></div>) : <EmptyInline label="No hobbies added yet." />}<div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setHobbies([...hobbies, { name: '', description: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"><Plus className="h-4 w-4" />Add hobby</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceHobbies(hobbies)}>Save hobbies</SaveButton></div></div>
      </section>
    </div>
  );
}
