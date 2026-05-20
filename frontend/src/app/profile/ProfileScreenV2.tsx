import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Heart,
  Languages,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  Waypoints,
  X,
} from 'lucide-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
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

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const areaCls = `${inputCls} min-h-24 resize-y`;
const cardCls = 'rounded-2xl border border-white/10 bg-white/5 p-6';

const workModes: Array<{ value: WorkModePreference; label: string }> = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-Site' },
];
const employmentTypes: Array<{ value: EmploymentTypePreference; label: string }> = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'occasional', label: 'Occasional' },
];
const contractTypes: Array<{ value: ContractTypePreference; label: string }> = [
  { value: 'employment_contract', label: 'Employment Contract' },
  { value: 'b2b', label: 'B2B' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'fixed_term', label: 'Fixed-Term' },
  { value: 'contract', label: 'Contract' },
];
const workValueOptions = [
  'Remote-first',
  'Flexible hours',
  'Work-life balance',
  'Mentorship',
  'Learning & growth',
  'Impact-driven',
  'Autonomy',
  'Collaboration',
  'Transparent comms',
  'Career advancement',
  'Competitive pay',
  'Cutting-edge tech',
];

function nullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitCsv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function SectionHeader({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-200">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function SaveButton({ onClick, disabled, isSaving, children }: { onClick: () => void; disabled?: boolean; isSaving: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSaving}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {children}
    </button>
  );
}

function ChipToggleGroup<T extends string>({ options, values, onChange }: { options: Array<{ value: T; label: string }>; values: T[]; onChange: (next: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(active ? values.filter((item) => item !== option.value) : [...values, option.value])}
            className={active
              ? 'rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-indigo-100'
              : 'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10'}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ProfileScreenV2() {
  const { user, isLoaded } = useUser();
  const store = useProfileStore();
  const { profile, isLoadingProfile, isSaving, error } = store;
  const loadProfile = useProfileStore((state) => state.loadProfile);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    linkedinUrl: '',
    cvUrl: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');
  const [experiences, setExperiences] = useState<ProfileExperienceInput[]>([]);
  const [educations, setEducations] = useState<ProfileEducationInput[]>([]);
  const [trainings, setTrainings] = useState<ProfileTrainingInput[]>([]);
  const [languages, setLanguages] = useState<ProfileLanguageInput[]>([]);
  const [hobbies, setHobbies] = useState<ProfileHobbyInput[]>([]);
  const [workValues, setWorkValues] = useState<string[]>([]);
  const [customWorkValue, setCustomWorkValue] = useState('');
  const [careerGoalDraft, setCareerGoalDraft] = useState({
    dreamRole: '',
    targetSeniority: '',
    targetIndustries: '',
    targetSalaryMin: '',
    targetSalaryMax: '',
    autoApplyMinScore: 75,
  });
  const [workSetup, setWorkSetup] = useState({
    workModePreferences: [] as WorkModePreference[],
    employmentTypePreferences: [] as EmploymentTypePreference[],
    contractPreferences: [] as ContractTypePreference[],
    preferredHoursPerWeek: '',
    preferredWorkRatio: '',
  });
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  useEffect(() => {
    if (isLoaded && user?.id) void loadProfile();
  }, [isLoaded, user?.id, loadProfile]);

  useEffect(() => {
    if (!profile) return;
    setPersonalInfo(profile.personalInfo);
    setSkills(profile.skills ?? []);
    setExperiences((profile.experiences ?? []).map((item) => ({
      employerName: item.employerName,
      jobTitle: item.jobTitle,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      achievements: item.achievements ?? [],
    })));
    setEducations((profile.educations ?? []).map((item) => ({
      schoolName: item.schoolName,
      degree: item.degree,
      fieldOfStudy: item.fieldOfStudy,
      startDate: item.startDate,
      endDate: item.endDate,
    })));
    setTrainings((profile.trainings ?? []).map((item) => ({
      title: item.title,
      providerName: item.providerName,
      issuedAt: item.issuedAt,
      expiresAt: item.expiresAt,
      credentialUrl: item.credentialUrl,
    })));
    setLanguages((profile.languages ?? []).map((item) => ({
      name: item.name,
      proficiency: item.proficiency,
      certificate: item.certificate ?? null,
    })));
    setHobbies((profile.hobbies ?? []).map((item) => ({
      name: item.name,
      description: item.description ?? null,
    })));
    setWorkValues(profile.careerGoals?.workValues ?? []);
    setCareerGoalDraft({
      dreamRole: profile.careerGoals?.targetJobTitle ?? '',
      targetSeniority: profile.careerGoals?.targetSeniority ?? '',
      targetIndustries: Array.isArray(profile.careerGoals?.strategy?.targetIndustries)
        ? profile.careerGoals?.strategy?.targetIndustries.join(', ')
        : '',
      targetSalaryMin: profile.careerGoals?.targetSalaryMin?.toString() ?? '',
      targetSalaryMax: profile.careerGoals?.targetSalaryMax?.toString() ?? '',
      autoApplyMinScore: profile.careerGoals?.autoApplyMinScore ?? 75,
    });
    setWorkSetup({
      workModePreferences: profile.careerGoals?.preferredWorkSetup?.workModePreferences ?? [],
      employmentTypePreferences: profile.careerGoals?.preferredWorkSetup?.employmentTypePreferences ?? [],
      contractPreferences: profile.careerGoals?.preferredWorkSetup?.contractPreferences ?? [],
      preferredHoursPerWeek: profile.careerGoals?.preferredWorkSetup?.preferredHoursPerWeek?.toString() ?? '',
      preferredWorkRatio: profile.careerGoals?.preferredWorkSetup?.preferredWorkRatio?.toString() ?? '',
    });
  }, [profile]);

  const completion = useMemo(() => {
    const checkpoints = [
      personalInfo.fullName,
      personalInfo.email,
      personalInfo.summary,
      personalInfo.location,
      skills.length > 0,
      experiences.length > 0,
      educations.length > 0,
      careerGoalDraft.dreamRole,
      workSetup.workModePreferences.length > 0,
    ];
    return Math.round((checkpoints.filter(Boolean).length / checkpoints.length) * 100);
  }, [personalInfo, skills.length, experiences.length, educations.length, careerGoalDraft.dreamRole, workSetup.workModePreferences.length]);

  if (isLoaded && !user?.id) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        <h1 className="text-xl font-semibold">Profile Unavailable</h1>
        <p className="mt-2 text-sm text-amber-200">Sign in to manage your profile.</p>
      </div>
    );
  }

  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
        Could not load profile.
      </div>
    );
  }

  const addSkill = () => {
    const next = skillDraft.trim();
    if (!next) return;
    if (skills.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setSkillDraft('');
      return;
    }
    setSkills([...skills, next]);
    setSkillDraft('');
  };

  const addWorkValue = () => {
    const next = customWorkValue.trim();
    if (!next) return;
    if (workValues.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setCustomWorkValue('');
      return;
    }
    setWorkValues([...workValues, next]);
    setCustomWorkValue('');
  };

  const saveCareerGoals = async () => {
    await store.saveCareerGoals({
      targetJobTitle: careerGoalDraft.dreamRole.trim() || null,
      targetSeniority: careerGoalDraft.targetSeniority.trim() || null,
      targetSalaryMin: nullableNumber(careerGoalDraft.targetSalaryMin),
      targetSalaryMax: nullableNumber(careerGoalDraft.targetSalaryMax),
      workValues,
      autoApplyMinScore: careerGoalDraft.autoApplyMinScore,
      strategy: {
        ...(profile.careerGoals?.strategy ?? {}),
        targetIndustries: splitCsv(careerGoalDraft.targetIndustries),
        dreamJob: {
          ...(typeof profile.careerGoals?.strategy?.dreamJob === 'object' && profile.careerGoals?.strategy?.dreamJob ? profile.careerGoals.strategy.dreamJob : {}),
          targetRole: careerGoalDraft.dreamRole.trim() || null,
          targetSeniority: careerGoalDraft.targetSeniority.trim() || null,
          targetIndustries: splitCsv(careerGoalDraft.targetIndustries),
        },
      },
    });
  };

  const saveWorkSetup = async () => {
    await store.saveWorkSetup({
      workModePreferences: workSetup.workModePreferences,
      employmentTypePreferences: workSetup.employmentTypePreferences,
      contractPreferences: workSetup.contractPreferences,
      preferredHoursPerWeek: nullableNumber(workSetup.preferredHoursPerWeek),
      preferredWorkRatio: nullableNumber(workSetup.preferredWorkRatio),
    });
  };

  const generateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
      await store.generateAiRoadmap({
        targetRole: careerGoalDraft.dreamRole.trim() || null,
        targetSeniority: careerGoalDraft.targetSeniority.trim() || null,
      });
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/60 to-emerald-950/30 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Profile Source Of Truth</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{personalInfo.fullName || 'Your profile'}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              This profile feeds Documents, Jobs, Applications and downstream CV generation. Import from Document Lab first, then correct anything the parser missed instead of letting the app hallucinate your career history like an overconfident intern.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Completeness</p>
              <p className="mt-1 text-2xl font-bold text-white">{completion}%</p>
            </div>
            <Link to="/documents/intake" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
              Open Document Intake
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
          <button type="button" onClick={store.dismissError} className="text-red-200 hover:text-white" aria-label="Dismiss error">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardCls}>
          <SectionHeader
            icon={<UserRound className="h-5 w-5" />}
            title="Personal Information"
            description="Directly used in generated documents and applications."
            action={<SaveButton isSaving={isSaving} onClick={() => void store.savePersonalInfo(personalInfo)}>Save</SaveButton>}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name"><input className={inputCls} value={personalInfo.fullName} onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} /></Field>
            <Field label="Email"><input className={inputCls} type="email" value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputCls} value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} /></Field>
            <Field label="Location"><input className={inputCls} value={personalInfo.location} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Headline"><input className={inputCls} value={personalInfo.headline} onChange={(e) => setPersonalInfo({ ...personalInfo, headline: e.target.value })} /></Field></div>
            <div className="md:col-span-2"><Field label="LinkedIn URL"><input className={inputCls} value={personalInfo.linkedinUrl} onChange={(e) => setPersonalInfo({ ...personalInfo, linkedinUrl: e.target.value })} /></Field></div>
            <div className="md:col-span-2"><Field label="Professional Summary"><textarea className={areaCls} rows={5} value={personalInfo.summary} onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })} /></Field></div>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader
            icon={<Target className="h-5 w-5" />}
            title="Career Goals"
            description="Drives Jobs ranking, Job Radar fit, and Auto Apply thresholds."
            action={<div className="flex gap-2"><SaveButton isSaving={isSaving} onClick={() => void saveCareerGoals()}>Save</SaveButton><SaveButton isSaving={isGeneratingRoadmap || isSaving} onClick={() => void generateRoadmap()}>{isGeneratingRoadmap ? 'Generating…' : 'Generate Roadmap'}</SaveButton></div>}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Dream Role"><input className={inputCls} value={careerGoalDraft.dreamRole} onChange={(e) => setCareerGoalDraft({ ...careerGoalDraft, dreamRole: e.target.value })} /></Field>
            <Field label="Target Seniority"><input className={inputCls} value={careerGoalDraft.targetSeniority} onChange={(e) => setCareerGoalDraft({ ...careerGoalDraft, targetSeniority: e.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Target Industries (comma separated)"><input className={inputCls} value={careerGoalDraft.targetIndustries} onChange={(e) => setCareerGoalDraft({ ...careerGoalDraft, targetIndustries: e.target.value })} /></Field></div>
            <Field label="Target Salary Min"><input className={inputCls} value={careerGoalDraft.targetSalaryMin} onChange={(e) => setCareerGoalDraft({ ...careerGoalDraft, targetSalaryMin: e.target.value })} /></Field>
            <Field label="Target Salary Max"><input className={inputCls} value={careerGoalDraft.targetSalaryMax} onChange={(e) => setCareerGoalDraft({ ...careerGoalDraft, targetSalaryMax: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field label={`Auto Apply Minimum Fit Score: ${careerGoalDraft.autoApplyMinScore}`}>
                <input type="range" min={50} max={100} value={careerGoalDraft.autoApplyMinScore} onChange={(e) => setCareerGoalDraft({ ...careerGoalDraft, autoApplyMinScore: Number(e.target.value) })} className="w-full" />
              </Field>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardCls}>
          <SectionHeader
            icon={<Sparkles className="h-5 w-5" />}
            title="Skills"
            description="Keep this aligned to imported CV evidence."
            action={<SaveButton isSaving={isSaving} onClick={() => void store.saveSkills(skills)}>Save</SaveButton>}
          />
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
                {skill}
                <button type="button" onClick={() => setSkills(skills.filter((item) => item !== skill))} className="text-slate-500 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input className={inputCls} value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Add a skill" />
            <button type="button" onClick={addSkill} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader
            icon={<Heart className="h-5 w-5" />}
            title="Work Values"
            description="Used by Jobs and Job Radar to filter out bad-fit roles."
            action={<SaveButton isSaving={isSaving} onClick={() => void saveCareerGoals()}>Save</SaveButton>}
          />
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set([...workValueOptions, ...workValues])).map((value) => {
              const active = workValues.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWorkValues(active ? workValues.filter((item) => item !== value) : [...workValues, value])}
                  className={active
                    ? 'rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-100'
                    : 'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10'}
                >
                  {value}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <input className={inputCls} value={customWorkValue} onChange={(e) => setCustomWorkValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWorkValue(); } }} placeholder="Add a custom work value" />
            <button type="button" onClick={addWorkValue} className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <SectionHeader
          icon={<Waypoints className="h-5 w-5" />}
          title="Preferred Work Setup"
          description="This becomes matching logic, not just decoration."
          action={<SaveButton isSaving={isSaving} onClick={() => void saveWorkSetup()}>Save</SaveButton>}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Work Mode</p>
            <ChipToggleGroup options={workModes} values={workSetup.workModePreferences} onChange={(next) => setWorkSetup({ ...workSetup, workModePreferences: next })} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Employment Type</p>
            <ChipToggleGroup options={employmentTypes} values={workSetup.employmentTypePreferences} onChange={(next) => setWorkSetup({ ...workSetup, employmentTypePreferences: next })} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Contract Type</p>
            <ChipToggleGroup options={contractTypes} values={workSetup.contractPreferences} onChange={(next) => setWorkSetup({ ...workSetup, contractPreferences: next })} />
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Preferred Hours Per Week"><input className={inputCls} value={workSetup.preferredHoursPerWeek} onChange={(e) => setWorkSetup({ ...workSetup, preferredHoursPerWeek: e.target.value })} /></Field>
          <Field label="Preferred Work Ratio (%)"><input className={inputCls} value={workSetup.preferredWorkRatio} onChange={(e) => setWorkSetup({ ...workSetup, preferredWorkRatio: e.target.value })} /></Field>
        </div>
      </section>

      <section className={cardCls}>
        <SectionHeader
          icon={<Briefcase className="h-5 w-5" />}
          title="Work Experience"
          description="This should mirror imported CV evidence as closely as possible."
          action={<div className="flex gap-2"><button type="button" onClick={() => setExperiences([...experiences, { employerName: '', jobTitle: '', startDate: '', endDate: null, description: '', achievements: [] }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /> Add</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceExperiences(experiences)}>Save</SaveButton></div>}
        />
        <div className="space-y-4">
          {experiences.map((experience, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex justify-end"><button type="button" onClick={() => setExperiences(experiences.filter((_, itemIndex) => itemIndex !== index))} className="text-slate-500 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Employer"><input className={inputCls} value={experience.employerName} onChange={(e) => setExperiences(experiences.map((item, itemIndex) => itemIndex === index ? { ...item, employerName: e.target.value } : item))} /></Field>
                <Field label="Job Title"><input className={inputCls} value={experience.jobTitle} onChange={(e) => setExperiences(experiences.map((item, itemIndex) => itemIndex === index ? { ...item, jobTitle: e.target.value } : item))} /></Field>
                <Field label="Start Date"><input className={inputCls} value={experience.startDate} onChange={(e) => setExperiences(experiences.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: e.target.value } : item))} /></Field>
                <Field label="End Date"><input className={inputCls} value={experience.endDate ?? ''} onChange={(e) => setExperiences(experiences.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: e.target.value || null } : item))} placeholder="Present or blank" /></Field>
                <div className="md:col-span-2"><Field label="Description"><textarea className={areaCls} rows={4} value={experience.description} onChange={(e) => setExperiences(experiences.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} /></Field></div>
                <div className="md:col-span-2"><Field label="Achievements (one per line)"><textarea className={areaCls} rows={4} value={(experience.achievements ?? []).join('\n')} onChange={(e) => setExperiences(experiences.map((item, itemIndex) => itemIndex === index ? { ...item, achievements: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) } : item))} /></Field></div>
              </div>
            </div>
          ))}
          {experiences.length === 0 ? <p className="text-sm text-slate-500">No experience entries yet. Import from Document Lab or add manually.</p> : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardCls}>
          <SectionHeader
            icon={<GraduationCap className="h-5 w-5" />}
            title="Education"
            action={<div className="flex gap-2"><button type="button" onClick={() => setEducations([...educations, { schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /> Add</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceEducations(educations)}>Save</SaveButton></div>}
          />
          <div className="space-y-4">
            {educations.map((education, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex justify-end"><button type="button" onClick={() => setEducations(educations.filter((_, itemIndex) => itemIndex !== index))} className="text-slate-500 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="School"><input className={inputCls} value={education.schoolName} onChange={(e) => setEducations(educations.map((item, itemIndex) => itemIndex === index ? { ...item, schoolName: e.target.value } : item))} /></Field>
                  <Field label="Degree"><input className={inputCls} value={education.degree} onChange={(e) => setEducations(educations.map((item, itemIndex) => itemIndex === index ? { ...item, degree: e.target.value } : item))} /></Field>
                  <Field label="Field Of Study"><input className={inputCls} value={education.fieldOfStudy} onChange={(e) => setEducations(educations.map((item, itemIndex) => itemIndex === index ? { ...item, fieldOfStudy: e.target.value } : item))} /></Field>
                  <Field label="Start Date"><input className={inputCls} value={education.startDate} onChange={(e) => setEducations(educations.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: e.target.value } : item))} /></Field>
                  <div className="md:col-span-2"><Field label="End Date"><input className={inputCls} value={education.endDate ?? ''} onChange={(e) => setEducations(educations.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: e.target.value || null } : item))} /></Field></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader
            icon={<Award className="h-5 w-5" />}
            title="Trainings / Courses"
            action={<div className="flex gap-2"><button type="button" onClick={() => setTrainings([...trainings, { title: '', providerName: '', issuedAt: '', expiresAt: null, credentialUrl: '' }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /> Add</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceTrainings(trainings)}>Save</SaveButton></div>}
          />
          <div className="space-y-4">
            {trainings.map((training, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex justify-end"><button type="button" onClick={() => setTrainings(trainings.filter((_, itemIndex) => itemIndex !== index))} className="text-slate-500 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Title"><input className={inputCls} value={training.title} onChange={(e) => setTrainings(trainings.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} /></Field>
                  <Field label="Provider"><input className={inputCls} value={training.providerName} onChange={(e) => setTrainings(trainings.map((item, itemIndex) => itemIndex === index ? { ...item, providerName: e.target.value } : item))} /></Field>
                  <Field label="Issued At"><input className={inputCls} value={training.issuedAt} onChange={(e) => setTrainings(trainings.map((item, itemIndex) => itemIndex === index ? { ...item, issuedAt: e.target.value } : item))} /></Field>
                  <Field label="Expires At"><input className={inputCls} value={training.expiresAt ?? ''} onChange={(e) => setTrainings(trainings.map((item, itemIndex) => itemIndex === index ? { ...item, expiresAt: e.target.value || null } : item))} /></Field>
                  <div className="md:col-span-2"><Field label="Credential URL"><input className={inputCls} value={training.credentialUrl} onChange={(e) => setTrainings(trainings.map((item, itemIndex) => itemIndex === index ? { ...item, credentialUrl: e.target.value } : item))} /></Field></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardCls}>
          <SectionHeader
            icon={<Languages className="h-5 w-5" />}
            title="Languages"
            action={<div className="flex gap-2"><button type="button" onClick={() => setLanguages([...languages, { name: '', proficiency: '', certificate: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /> Add</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceLanguages(languages)}>Save</SaveButton></div>}
          />
          <div className="space-y-4">
            {languages.map((language, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex justify-end"><button type="button" onClick={() => setLanguages(languages.filter((_, itemIndex) => itemIndex !== index))} className="text-slate-500 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Language"><input className={inputCls} value={language.name} onChange={(e) => setLanguages(languages.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} /></Field>
                  <Field label="Proficiency"><input className={inputCls} value={language.proficiency} onChange={(e) => setLanguages(languages.map((item, itemIndex) => itemIndex === index ? { ...item, proficiency: e.target.value } : item))} /></Field>
                  <div className="md:col-span-2"><Field label="Certificate"><input className={inputCls} value={language.certificate ?? ''} onChange={(e) => setLanguages(languages.map((item, itemIndex) => itemIndex === index ? { ...item, certificate: e.target.value || null } : item))} /></Field></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader
            icon={<BookOpen className="h-5 w-5" />}
            title="Hobbies / Interests"
            action={<div className="flex gap-2"><button type="button" onClick={() => setHobbies([...hobbies, { name: '', description: null }])} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"><Plus className="h-4 w-4" /> Add</button><SaveButton isSaving={isSaving} onClick={() => void store.replaceHobbies(hobbies)}>Save</SaveButton></div>}
          />
          <div className="space-y-4">
            {hobbies.map((hobby, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex justify-end"><button type="button" onClick={() => setHobbies(hobbies.filter((_, itemIndex) => itemIndex !== index))} className="text-slate-500 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>
                <div className="space-y-4">
                  <Field label="Name"><input className={inputCls} value={hobby.name} onChange={(e) => setHobbies(hobbies.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} /></Field>
                  <Field label="Description"><textarea className={areaCls} rows={4} value={hobby.description ?? ''} onChange={(e) => setHobbies(hobbies.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value || null } : item))} /></Field>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SupportingMaterialsDisclaimer />
    </div>
  );
}
