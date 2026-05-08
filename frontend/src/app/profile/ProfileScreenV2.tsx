import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Award,
  Briefcase,
  Check,
  Circle,
  Compass,
  GraduationCap,
  Heart,
  Languages,
  Loader2,
  Map as MapIcon,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  Trash2,
  UserRound,
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
  ProfileRoadmapMilestone,
  ProfileSnapshot,
  ProfileTrainingInput,
  WorkModePreference,
} from '../../../../shared/profile';

// ── Types ───────────────────────────────────────────────────────────────────────

type CareerGoalsForm = {
  dreamRole: string;
  targetSeniority: string;
  targetIndustries: string;
  expectedSalaryMin: string;
  expectedSalaryMax: string;
  minimumFitScore: number;
};

type WorkSetupForm = {
  workModePreferences: WorkModePreference[];
  employmentTypePreferences: EmploymentTypePreference[];
  contractPreferences: ContractTypePreference[];
  preferredHoursPerWeek: string;
  preferredWorkRatio: string;
};

type DreamJobDraft = { targetRole?: unknown; targetSeniority?: unknown; targetIndustries?: unknown };

// ── Styling constants ──────────────────────────────────────────────────────────

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

// Curated list of work values shown as selectable chips. Users can add free-form
// ones on top.
const WORK_VALUE_OPTIONS: string[] = [
  'Remote-first',
  'Flexible hours',
  'Work-life balance',
  'Mentorship',
  'Learning & growth',
  'Ethical product',
  'Impact-driven',
  'Stable pace',
  'Fast-paced',
  'Autonomy',
  'Collaboration',
  'Transparent comms',
  'Diversity & inclusion',
  'Career advancement',
  'Competitive pay',
  'Equity / ownership',
  'Cutting-edge tech',
  'Open source',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function splitCsv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
function joinStrings(value: unknown): string {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').join(', ')
    : '';
}
function nullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function strategy(profile: ProfileSnapshot | null) {
  return profile?.careerGoals?.strategy ?? {};
}
function dreamJobOf(profile: ProfileSnapshot | null): DreamJobDraft {
  const raw = strategy(profile).dreamJob;
  return raw && typeof raw === 'object' ? (raw as DreamJobDraft) : {};
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ── Reusable UI atoms ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15">
        <Icon className="h-5 w-5 text-indigo-200" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
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

function SaveButton({
  isSaving,
  onClick,
  children,
}: {
  isSaving: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {children}
    </button>
  );
}

function ToggleGroup<T extends string>({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  values: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  selected
                    ? values.filter((item) => item !== option.value)
                    : [...values, option.value],
                )
              }
              className={
                selected
                  ? 'rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-indigo-100'
                  : 'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10'
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Top cluster: Profile summary + Readiness Moves + Growth Path roadmap ───────

function ProfileHero({
  profile,
  completion,
}: {
  profile: ProfileSnapshot | null;
  completion: number;
}) {
  const target = profile?.careerGoals?.targetJobTitle?.trim();
  const seniority = profile?.careerGoals?.targetSeniority?.trim();
  const headline = profile?.personalInfo.headline?.trim();
  const name = profile?.personalInfo.fullName?.trim() || 'Your profile';

  return (
    <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/60 to-emerald-950/30 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Profile</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{name}</h1>
          {headline && <p className="mt-1 text-sm text-slate-300">{headline}</p>}
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            {target
              ? `Aiming for ${seniority ? `${seniority} ` : ''}${target}`
              : 'Set a target role in Career Goals to unlock a tailored roadmap.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
              Profile Completeness
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{completion}%</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReadinessMovesCard({ profile }: { profile: ProfileSnapshot | null }) {
  const [open, setOpen] = useState<string | null>(null);
  const cards = [
    {
      id: 'career',
      title: 'Career Goals',
      icon: Target,
      status: profile?.careerGoals?.targetJobTitle ? 'Ready' : 'Needs Input',
      body: 'Set Dream Role, Expected Salary and Minimum Fit Score before Jobs starts ranking opportunities.',
    },
    {
      id: 'evidence',
      title: 'Profile Evidence',
      icon: Briefcase,
      status: profile?.experiences?.length ? 'In Progress' : 'Needs Input',
      body: 'Add Work Experience, Education and Training / Courses so documents and applications use real evidence.',
    },
    {
      id: 'skills',
      title: 'Skills',
      icon: Sparkles,
      status: profile?.skills?.length ? 'Ready' : 'Needs Input',
      body: 'Keep Profile Skills clean. Skill Lab handles verification, salary impact and growth recommendations.',
    },
    {
      id: 'preferences',
      title: 'Work Preferences',
      icon: Heart,
      status: profile?.careerGoals?.preferredWorkSetup?.workModePreferences?.length
        ? 'Ready'
        : 'Needs Input',
      body: 'Set Work Mode, Employment Type, Contract Type and Preferred Hours to keep matching relevant.',
    },
  ];
  return (
    <div className={`${cardCls} h-full`}>
      <SectionHeader
        icon={Compass}
        title="Profile Readiness Moves"
        description="Four stages that keep matching, documents and applications accurate."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const expanded = open === card.id;
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setOpen(expanded ? null : card.id)}
              aria-expanded={expanded}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-indigo-400/40 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-4 w-4 text-indigo-200" />
                </div>
                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                  {card.status}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{card.title}</h3>
              {expanded && (
                <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-slate-300">
                  {card.body}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function milestoneIcon(index: number): ComponentType<{ className?: string }> {
  // First 1-2 milestones usually skills / courses, middle ones trainings, last an application step.
  if (index === 0) return Sparkles;
  if (index === 1) return GraduationCap;
  if (index === 2) return Award;
  if (index === 3) return Briefcase;
  return Target;
}

function GrowthPathRoadmap({
  profile,
  isGenerating,
  onGenerate,
}: {
  profile: ProfileSnapshot | null;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const milestones = (strategy(profile).roadmap ?? []) as ProfileRoadmapMilestone[];
  const dreamTarget = profile?.careerGoals?.targetJobTitle?.trim() || 'your dream role';

  return (
    <div className={`${cardCls} h-full`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-emerald-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Growth Path
            </p>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-white">Roadmap to {dreamTarget}</h2>
          <p className="mt-1 text-xs text-slate-400">
            AI-built milestones — courses, trainings and intermediate roles toward your target.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {milestones.length ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-xs text-slate-400">
          No roadmap yet. Click <strong className="text-slate-200">Generate</strong> and we'll build
          one from your CV, skills and education toward your dream role.
        </div>
      ) : (
        <ol className="space-y-3">
          {milestones.map((milestone, index) => {
            const Icon = milestoneIcon(index);
            const done = milestone.status === 'done';
            return (
              <li
                key={milestone.id}
                className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div className="relative flex flex-col items-center">
                  <div
                    className={
                      done
                        ? 'flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-200'
                        : 'flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200'
                    }
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-white/10" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{milestone.title}</p>
                  {milestone.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-400">{milestone.description}</p>
                  )}
                  {milestone.requiredSkills && milestone.requiredSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {milestone.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {milestone.evidenceTarget && (
                    <p className="mt-2 text-[11px] italic text-slate-500">
                      Evidence: {milestone.evidenceTarget}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function TopCluster({
  profile,
  completion,
  isGenerating,
  onGenerate,
}: {
  profile: ProfileSnapshot | null;
  completion: number;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className="space-y-4">
      <ProfileHero profile={profile} completion={completion} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ReadinessMovesCard profile={profile} />
        <GrowthPathRoadmap profile={profile} isGenerating={isGenerating} onGenerate={onGenerate} />
      </div>
      <SupportingMaterialsDisclaimer compact collapsible />
    </section>
  );
}

// ── Work values picker (left/right column split) ───────────────────────────────

function WorkValuesPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [custom, setCustom] = useState('');
  const selectedSet = new Set(selected.map((v) => v.toLowerCase()));

  const toggle = (value: string) => {
    const lower = value.toLowerCase();
    if (selectedSet.has(lower)) {
      onChange(selected.filter((v) => v.toLowerCase() !== lower));
    } else {
      onChange([...selected, value]);
    }
  };
  const addCustom = () => {
    const next = custom.trim();
    if (!next) return;
    if (selectedSet.has(next.toLowerCase())) {
      setCustom('');
      return;
    }
    onChange([...selected, next]);
    setCustom('');
  };

  const allOptions = Array.from(
    new Set([
      ...WORK_VALUE_OPTIONS,
      ...selected.filter((value) => !WORK_VALUE_OPTIONS.some((opt) => opt.toLowerCase() === value.toLowerCase())),
    ]),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allOptions.map((value) => {
          const active = selectedSet.has(value.toLowerCase());
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={
                active
                  ? 'rounded-full border border-indigo-400/50 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-100'
                  : 'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10'
              }
            >
              {active && <Check className="mr-1 inline h-3 w-3" />}
              {value}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own value (e.g. Mission-driven)"
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-slate-500">{selected.length} value{selected.length === 1 ? '' : 's'} selected</p>
      )}
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function ProfileScreenV2() {
  const { user, isLoaded } = useUser();
  const store = useProfileStore();
  const { profile, isLoadingProfile, isSaving, error } = store;
  const loadProfile = useProfileStore((s) => s.loadProfile);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '', email: '', phone: '', location: '', headline: '', summary: '', linkedinUrl: '', cvUrl: '',
  });
  const [career, setCareer] = useState<CareerGoalsForm>({
    dreamRole: '', targetSeniority: '', targetIndustries: '', expectedSalaryMin: '', expectedSalaryMax: '', minimumFitScore: 75,
  });
  const [workValues, setWorkValues] = useState<string[]>([]);
  const [workSetup, setWorkSetup] = useState<WorkSetupForm>({
    workModePreferences: [], employmentTypePreferences: [], contractPreferences: [], preferredHoursPerWeek: '', preferredWorkRatio: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState<ProfileExperienceInput[]>([]);
  const [educations, setEducations] = useState<ProfileEducationInput[]>([]);
  const [trainings, setTrainings] = useState<ProfileTrainingInput[]>([]);
  const [languages, setLanguages] = useState<ProfileLanguageInput[]>([]);
  const [hobbies, setHobbies] = useState<ProfileHobbyInput[]>([]);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  useEffect(() => {
    if (isLoaded && user?.id) void loadProfile();
  }, [isLoaded, user?.id, loadProfile]);

  useEffect(() => {
    if (!profile) return;
    const dream = dreamJobOf(profile);
    const setup = profile.careerGoals?.preferredWorkSetup;
    setPersonalInfo(profile.personalInfo);
    setCareer({
      dreamRole: profile.careerGoals?.targetJobTitle ?? text(dream.targetRole),
      targetSeniority: profile.careerGoals?.targetSeniority ?? text(dream.targetSeniority),
      targetIndustries: joinStrings(strategy(profile).targetIndustries ?? dream.targetIndustries),
      expectedSalaryMin: profile.careerGoals?.targetSalaryMin?.toString() ?? '',
      expectedSalaryMax: profile.careerGoals?.targetSalaryMax?.toString() ?? '',
      minimumFitScore: profile.careerGoals?.autoApplyMinScore ?? 75,
    });
    setWorkValues(profile.careerGoals?.workValues ?? []);
    setWorkSetup({
      workModePreferences: setup?.workModePreferences ?? [],
      employmentTypePreferences: setup?.employmentTypePreferences ?? [],
      contractPreferences: setup?.contractPreferences ?? [],
      preferredHoursPerWeek: setup?.preferredHoursPerWeek?.toString() ?? '',
      preferredWorkRatio: setup?.preferredWorkRatio?.toString() ?? '',
    });
    setSkills(profile.skills ?? []);
    setExperiences((profile.experiences ?? []).map(({ employerName, jobTitle, startDate, endDate, description, achievements }) => ({
      employerName, jobTitle, startDate, endDate, description, achievements: achievements ?? [],
    })));
    setEducations((profile.educations ?? []).map(({ schoolName, degree, fieldOfStudy, startDate, endDate }) => ({
      schoolName, degree, fieldOfStudy, startDate, endDate,
    })));
    setTrainings((profile.trainings ?? []).map(({ title, providerName, issuedAt, expiresAt, credentialUrl }) => ({
      title, providerName, issuedAt, expiresAt, credentialUrl,
    })));
    setLanguages((profile.languages ?? []).map(({ name, proficiency, certificate }) => ({
      name, proficiency, certificate: certificate ?? null,
    })));
    setHobbies((profile.hobbies ?? []).map(({ name, description }) => ({
      name, description: description ?? null,
    })));
  }, [profile]);

  const completion = useMemo(() => {
    const checks = [
      personalInfo.fullName,
      personalInfo.email,
      personalInfo.summary,
      skills.length,
      experiences.length,
      career.dreamRole,
      workSetup.workModePreferences.length,
      languages.length,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [
    career.dreamRole,
    experiences.length,
    languages.length,
    personalInfo.email,
    personalInfo.fullName,
    personalInfo.summary,
    skills.length,
    workSetup.workModePreferences.length,
  ]);

  const hasSavedProfile = Boolean(profile?.personalInfo.fullName?.trim() || profile?.personalInfo.email?.trim());

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
  if (error && !profile) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <h1 className="text-xl font-semibold text-red-100">Could Not Load Profile</h1>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <button
          type="button"
          onClick={() => void store.loadProfile()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold text-white">Profile Is Empty</h1>
        <p className="mt-2 text-sm text-slate-400">Your profile record is not available yet.</p>
      </div>
    );
  }

  const saveCareer = async () => {
    const targetIndustries = splitCsv(career.targetIndustries);
    await store.saveCareerGoals({
      targetJobTitle: career.dreamRole.trim() || null,
      targetSeniority: career.targetSeniority.trim() || null,
      targetSalaryMin: nullableNumber(career.expectedSalaryMin),
      targetSalaryMax: nullableNumber(career.expectedSalaryMax),
      workValues,
      autoApplyMinScore: career.minimumFitScore,
      strategy: {
        ...strategy(profile),
        targetIndustries,
        dreamJob: {
          ...dreamJobOf(profile),
          targetRole: career.dreamRole.trim() || null,
          targetSeniority: career.targetSeniority.trim() || null,
          targetIndustries,
        },
      },
    });
  };
  const saveWorkSetup = async () =>
    store.saveWorkSetup({
      workModePreferences: workSetup.workModePreferences,
      employmentTypePreferences: workSetup.employmentTypePreferences,
      contractPreferences: workSetup.contractPreferences,
      preferredHoursPerWeek: nullableNumber(workSetup.preferredHoursPerWeek),
      preferredWorkRatio: nullableNumber(workSetup.preferredWorkRatio),
    });
  const addSkill = () => {
    const next = newSkill.trim();
    if (!next || skills.includes(next)) return;
    setSkills([...skills, next]);
    setNewSkill('');
  };
  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
      await store.generateAiRoadmap({
        targetRole: career.dreamRole.trim() || null,
        targetSeniority: career.targetSeniority.trim() || null,
      });
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top cluster: profile summary + readiness + AI growth path */}
      <TopCluster
        profile={profile}
        completion={completion}
        isGenerating={isGeneratingRoadmap || isSaving}
        onGenerate={() => void handleGenerateRoadmap()}
      />

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={store.dismissError}
            className="text-red-200 hover:text-white"
            aria-label="Dismiss Error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Row 1 — LEFT: personal/contact | RIGHT: professional profile + work values */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className={cardCls}>
          <SectionHeader
            icon={UserRound}
            title="Personal Information"
            description="Basic identity and contact details used across documents, jobs and applications."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name">
              <input
                className={inputCls}
                value={personalInfo.fullName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <input
                className={inputCls}
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="LinkedIn URL">
                <input
                  className={inputCls}
                  value={personalInfo.linkedinUrl}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, linkedinUrl: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <div className="mt-5">
            <SaveButton
              isSaving={isSaving}
              onClick={() => void store.savePersonalInfo(personalInfo)}
            >
              Save Personal Information
            </SaveButton>
          </div>
        </div>

        <div className={cardCls}>
          <SectionHeader
            icon={Sparkles}
            title="Professional Profile & Values"
            description="Your headline, summary and the work values you look for. Pick what matters; add your own."
          />
          <div className="space-y-4">
            <Field label="Headline">
              <input
                className={inputCls}
                value={personalInfo.headline}
                onChange={(e) => setPersonalInfo({ ...personalInfo, headline: e.target.value })}
                placeholder="Senior Product Manager turning data into decisions"
              />
            </Field>
            <Field label="Professional Summary">
              <textarea
                className={areaCls}
                value={personalInfo.summary}
                onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
              />
            </Field>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Work Values</p>
              <WorkValuesPicker selected={workValues} onChange={setWorkValues} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <SaveButton
              isSaving={isSaving}
              onClick={() => void store.savePersonalInfo(personalInfo)}
            >
              Save Headline & Summary
            </SaveButton>
            <SaveButton isSaving={isSaving} onClick={() => void saveCareer()}>
              Save Work Values
            </SaveButton>
          </div>
        </div>
      </section>

      {/* The rest of the profile appears only once basic identity is saved */}
      {!hasSavedProfile ? (
        <section className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
          Save your personal information to unlock Career Goals, Work Preferences, Experience,
          Education and more.
        </section>
      ) : (
        <>
          {/* Row 2 — Career Goals | Work Preferences */}
          <section className="grid gap-6 xl:grid-cols-2">
            <div className={cardCls}>
              <SectionHeader icon={Target} title="Career Goals" />
              <div className="space-y-4">
                <Field label="Dream Role">
                  <input
                    className={inputCls}
                    value={career.dreamRole}
                    onChange={(e) => setCareer({ ...career, dreamRole: e.target.value })}
                    placeholder="Product Manager"
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Target Seniority">
                    <input
                      className={inputCls}
                      value={career.targetSeniority}
                      onChange={(e) => setCareer({ ...career, targetSeniority: e.target.value })}
                      placeholder="Senior"
                    />
                  </Field>
                  <Field label="Target Industries">
                    <input
                      className={inputCls}
                      value={career.targetIndustries}
                      onChange={(e) => setCareer({ ...career, targetIndustries: e.target.value })}
                      placeholder="SaaS, Fintech"
                    />
                  </Field>
                  <Field label="Expected Salary Minimum">
                    <input
                      className={inputCls}
                      type="number"
                      value={career.expectedSalaryMin}
                      onChange={(e) => setCareer({ ...career, expectedSalaryMin: e.target.value })}
                    />
                  </Field>
                  <Field label="Expected Salary Target">
                    <input
                      className={inputCls}
                      type="number"
                      value={career.expectedSalaryMax}
                      onChange={(e) => setCareer({ ...career, expectedSalaryMax: e.target.value })}
                    />
                  </Field>
                </div>
                <div>
                  <label
                    htmlFor="minimum-fit-score"
                    className="flex items-center justify-between text-xs font-medium text-slate-400"
                  >
                    <span>Minimum Fit Score</span>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-indigo-100">
                      {career.minimumFitScore}%
                    </span>
                  </label>
                  <input
                    id="minimum-fit-score"
                    className="mt-3 w-full accent-indigo-500"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={career.minimumFitScore}
                    onChange={(e) => setCareer({ ...career, minimumFitScore: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="mt-5">
                <SaveButton isSaving={isSaving} onClick={() => void saveCareer()}>
                  Save Career Goals
                </SaveButton>
              </div>
            </div>

            <div className={cardCls}>
              <SectionHeader
                icon={Heart}
                title="Work Preferences"
                description="Work Mode, Employment Type, Contract Type and preferred working time."
              />
              <div className="space-y-5">
                <ToggleGroup
                  title="Work Mode"
                  options={workModes}
                  values={workSetup.workModePreferences}
                  onChange={(workModePreferences) => setWorkSetup({ ...workSetup, workModePreferences })}
                />
                <ToggleGroup
                  title="Employment Type"
                  options={employmentTypes}
                  values={workSetup.employmentTypePreferences}
                  onChange={(employmentTypePreferences) =>
                    setWorkSetup({ ...workSetup, employmentTypePreferences })
                  }
                />
                <ToggleGroup
                  title="Contract Type"
                  options={contractTypes}
                  values={workSetup.contractPreferences}
                  onChange={(contractPreferences) => setWorkSetup({ ...workSetup, contractPreferences })}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Preferred Hours">
                    <input
                      className={inputCls}
                      type="number"
                      min={1}
                      max={80}
                      value={workSetup.preferredHoursPerWeek}
                      onChange={(e) =>
                        setWorkSetup({ ...workSetup, preferredHoursPerWeek: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Preferred Work Ratio">
                    <input
                      className={inputCls}
                      type="number"
                      min={1}
                      max={100}
                      value={workSetup.preferredWorkRatio}
                      onChange={(e) =>
                        setWorkSetup({ ...workSetup, preferredWorkRatio: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-5">
                <SaveButton isSaving={isSaving} onClick={() => void saveWorkSetup()}>
                  Save Work Preferences
                </SaveButton>
              </div>
            </div>
          </section>

          {/* Row 3 — Work Experience (full width, already 2-col internal grid) */}
          <section className={cardCls}>
            <SectionHeader
              icon={Briefcase}
              title="Work Experience"
              description="Editable work history evidence for documents, applications and matching."
            />
            <div className="space-y-3">
              {experiences.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2"
                >
                  <Field label="Company / Employer">
                    <input
                      className={inputCls}
                      value={item.employerName}
                      onChange={(e) =>
                        setExperiences(
                          experiences.map((row, i) =>
                            i === index ? { ...row, employerName: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Job Title">
                    <input
                      className={inputCls}
                      value={item.jobTitle}
                      onChange={(e) =>
                        setExperiences(
                          experiences.map((row, i) =>
                            i === index ? { ...row, jobTitle: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Start Date">
                    <input
                      className={inputCls}
                      value={item.startDate}
                      onChange={(e) =>
                        setExperiences(
                          experiences.map((row, i) =>
                            i === index ? { ...row, startDate: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="End Date">
                    <input
                      className={inputCls}
                      value={item.endDate ?? ''}
                      onChange={(e) =>
                        setExperiences(
                          experiences.map((row, i) =>
                            i === index ? { ...row, endDate: e.target.value || null } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Description">
                      <textarea
                        className={areaCls}
                        value={item.description}
                        onChange={(e) =>
                          setExperiences(
                            experiences.map((row, i) =>
                              i === index ? { ...row, description: e.target.value } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Achievements / Outcomes (one per line)">
                      <textarea
                        className={areaCls}
                        value={(item.achievements ?? []).join('\n')}
                        onChange={(e) =>
                          setExperiences(
                            experiences.map((row, i) =>
                              i === index
                                ? {
                                  ...row,
                                  achievements: e.target.value
                                    .split('\n')
                                    .map((line) => line.trim())
                                    .filter(Boolean),
                                }
                                : row,
                            ),
                          )
                        }
                        placeholder={'Increased conversion by 18%\nReduced reporting time by 6 hours per week'}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExperiences(experiences.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-2 text-sm text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Experience
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setExperiences([
                    ...experiences,
                    {
                      employerName: '',
                      jobTitle: '',
                      startDate: '',
                      endDate: null,
                      description: '',
                      achievements: [],
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
                Add Experience
              </button>
              <SaveButton
                isSaving={isSaving}
                onClick={() => void store.replaceExperiences(experiences)}
              >
                Save Work Experience
              </SaveButton>
            </div>
          </section>

          {/* Row 4 — Education | Trainings / Courses */}
          <section className="grid gap-6 xl:grid-cols-2">
            <div className={cardCls}>
              <SectionHeader icon={GraduationCap} title="Education" />
              {educations.map((item, index) => (
                <div
                  key={index}
                  className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <Field label="School Name">
                    <input
                      className={inputCls}
                      value={item.schoolName}
                      onChange={(e) =>
                        setEducations(
                          educations.map((row, i) =>
                            i === index ? { ...row, schoolName: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Degree">
                    <input
                      className={inputCls}
                      value={item.degree}
                      onChange={(e) =>
                        setEducations(
                          educations.map((row, i) =>
                            i === index ? { ...row, degree: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Field Of Study">
                    <input
                      className={inputCls}
                      value={item.fieldOfStudy}
                      onChange={(e) =>
                        setEducations(
                          educations.map((row, i) =>
                            i === index ? { ...row, fieldOfStudy: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Start Date">
                      <input
                        className={inputCls}
                        value={item.startDate}
                        onChange={(e) =>
                          setEducations(
                            educations.map((row, i) =>
                              i === index ? { ...row, startDate: e.target.value } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="End Date">
                      <input
                        className={inputCls}
                        value={item.endDate ?? ''}
                        onChange={(e) =>
                          setEducations(
                            educations.map((row, i) =>
                              i === index ? { ...row, endDate: e.target.value || null } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEducations(educations.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-2 text-sm text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Education
                  </button>
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEducations([
                      ...educations,
                      { schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: null },
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Education
                </button>
                <SaveButton
                  isSaving={isSaving}
                  onClick={() => void store.replaceEducations(educations)}
                >
                  Save Education
                </SaveButton>
              </div>
            </div>

            <div className={cardCls}>
              <SectionHeader icon={Award} title="Training / Courses" />
              {trainings.map((item, index) => (
                <div
                  key={index}
                  className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <Field label="Title">
                    <input
                      className={inputCls}
                      value={item.title}
                      onChange={(e) =>
                        setTrainings(
                          trainings.map((row, i) =>
                            i === index ? { ...row, title: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Provider Name">
                    <input
                      className={inputCls}
                      value={item.providerName}
                      onChange={(e) =>
                        setTrainings(
                          trainings.map((row, i) =>
                            i === index ? { ...row, providerName: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Issued At">
                      <input
                        className={inputCls}
                        value={item.issuedAt}
                        onChange={(e) =>
                          setTrainings(
                            trainings.map((row, i) =>
                              i === index ? { ...row, issuedAt: e.target.value } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="Expires At">
                      <input
                        className={inputCls}
                        value={item.expiresAt ?? ''}
                        onChange={(e) =>
                          setTrainings(
                            trainings.map((row, i) =>
                              i === index ? { ...row, expiresAt: e.target.value || null } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Credential URL">
                    <input
                      className={inputCls}
                      value={item.credentialUrl}
                      onChange={(e) =>
                        setTrainings(
                          trainings.map((row, i) =>
                            i === index ? { ...row, credentialUrl: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => setTrainings(trainings.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-2 text-sm text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Training / Course
                  </button>
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setTrainings([
                      ...trainings,
                      { title: '', providerName: '', issuedAt: '', expiresAt: null, credentialUrl: '' },
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Training / Course
                </button>
                <SaveButton
                  isSaving={isSaving}
                  onClick={() => void store.replaceTrainings(trainings)}
                >
                  Save Training / Courses
                </SaveButton>
              </div>
            </div>
          </section>

          {/* Row 5 — Languages | Hobbies */}
          <section className="grid gap-6 xl:grid-cols-2">
            <div className={cardCls}>
              <SectionHeader icon={Languages} title="Languages" />
              {languages.map((item, index) => (
                <div
                  key={index}
                  className="mb-3 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2"
                >
                  <Field label="Language">
                    <input
                      className={inputCls}
                      value={item.name}
                      onChange={(e) =>
                        setLanguages(
                          languages.map((row, i) =>
                            i === index ? { ...row, name: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Proficiency">
                    <input
                      className={inputCls}
                      value={item.proficiency}
                      onChange={(e) =>
                        setLanguages(
                          languages.map((row, i) =>
                            i === index ? { ...row, proficiency: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Certificate">
                      <input
                        className={inputCls}
                        value={item.certificate ?? ''}
                        onChange={(e) =>
                          setLanguages(
                            languages.map((row, i) =>
                              i === index ? { ...row, certificate: e.target.value || null } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLanguages(languages.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-2 text-sm text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Language
                  </button>
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setLanguages([...languages, { name: '', proficiency: '', certificate: null }])
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Language
                </button>
                <SaveButton
                  isSaving={isSaving}
                  onClick={() => void store.replaceLanguages(languages)}
                >
                  Save Languages
                </SaveButton>
              </div>
            </div>

            <div className={cardCls}>
              <SectionHeader icon={Heart} title="Hobbies" />
              {hobbies.map((item, index) => (
                <div
                  key={index}
                  className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <Field label="Hobby">
                    <input
                      className={inputCls}
                      value={item.name}
                      onChange={(e) =>
                        setHobbies(
                          hobbies.map((row, i) =>
                            i === index ? { ...row, name: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      className={areaCls}
                      value={item.description ?? ''}
                      onChange={(e) =>
                        setHobbies(
                          hobbies.map((row, i) =>
                            i === index ? { ...row, description: e.target.value || null } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => setHobbies(hobbies.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-2 text-sm text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Hobby
                  </button>
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setHobbies([...hobbies, { name: '', description: null }])}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Hobby
                </button>
                <SaveButton isSaving={isSaving} onClick={() => void store.replaceHobbies(hobbies)}>
                  Save Hobbies
                </SaveButton>
              </div>
            </div>
          </section>

          {/* Row 6 — Skills (full width, extracted from CV) */}
          <section className={cardCls}>
            <SectionHeader
              icon={Sparkles}
              title="Skills"
              description="Extracted from your CV and editable. Verification, salary impact and course links live in Skill Lab."
            />
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No skills yet. Upload a CV in Document Intake or add them below.
                </p>
              ) : (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-indigo-100"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((item) => item !== skill))}
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className={inputCls}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSkill();
                }}
                placeholder="Add a skill"
              />
              <button
                type="button"
                onClick={addSkill}
                className="rounded-xl border border-white/10 bg-white/5 px-3 text-slate-200 hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">
              <SaveButton isSaving={isSaving} onClick={() => void store.saveSkills(skills)}>
                Save Skills
              </SaveButton>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
