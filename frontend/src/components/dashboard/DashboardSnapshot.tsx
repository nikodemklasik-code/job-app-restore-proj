import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  LayoutGrid,
  Newspaper,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import type { DashboardApplicationStatus, DashboardSnapshot as DashboardSnapshotDto } from '@/types/dashboard';

function formatDate(date: string | null): string {
  if (!date) return 'Not recorded yet';
  return new Date(date).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function firstName(fullName: string | null): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function titleCaseStatus(status: string): string {
  return status
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function newsroomIcon(type: DashboardSnapshotDto['newsroom'][number]['type']) {
  if (type === 'job') return Briefcase;
  if (type === 'employer') return Building2;
  return ClipboardList;
}

function newsroomTone(type: DashboardSnapshotDto['newsroom'][number]['type']): string {
  if (type === 'job') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  if (type === 'employer') return 'border-sky-500/20 bg-sky-500/10 text-sky-200';
  return 'border-violet-500/20 bg-violet-500/10 text-violet-200';
}

function Newsroom({ items }: { items: DashboardSnapshotDto['newsroom'] }) {
  const visibleItems = items && items.length > 0
    ? items
    : [
      {
        id: 'empty-newsroom',
        type: 'recruitment' as const,
        title: 'No live updates yet',
        description: 'New roles, employer intelligence, and recruitment-process changes will appear here as soon as they are detected.',
        href: '/jobs',
        occurredAt: new Date().toISOString(),
        ctaLabel: 'Search jobs',
      },
    ];

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-indigo-300" />
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Workspace Status Newsroom</p>
          </div>
          <p className="mt-1 text-sm text-slate-300">Live feed of new jobs, employer intelligence, and recruitment-process changes only — action tiles live below.</p>
        </div>
        <Link to="/jobs" className="text-xs font-semibold text-indigo-300 transition hover:text-indigo-200">
          Refresh opportunities →
        </Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {visibleItems.map((item) => {
          const Icon = newsroomIcon(item.type);
          return (
            <Link
              key={item.id}
              to={item.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-indigo-500/40 hover:bg-indigo-500/10"
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-xl border p-2 ${newsroomTone(item.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    <span className="shrink-0 text-[11px] text-slate-500">{relativeTime(item.occurredAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.description}</p>
                  <p className="mt-3 text-xs font-semibold text-indigo-300 transition group-hover:translate-x-1">
                    {item.ctaLabel} →
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardSnapshotDto['applications']['recent'][number]['status'] }) {
  const statusClasses: Record<typeof status, string> = {
    draft: 'bg-slate-500/20 text-slate-200',
    saved: 'bg-sky-500/20 text-sky-200',
    applied: 'bg-amber-500/20 text-amber-100',
    interview: 'bg-violet-500/20 text-violet-100',
    offer: 'bg-emerald-500/20 text-emerald-100',
    rejected: 'bg-rose-500/20 text-rose-100',
    archived: 'bg-slate-600/30 text-slate-300',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {titleCaseStatus(status)}
    </span>
  );
}


type CareerProfileEvidence = {
  skills: string[];
  experiences: unknown[];
  educations: unknown[];
  trainings: unknown[];
  languages: unknown[];
  workValues: string[];
  targetRole: string | null;
  targetSeniority: string | null;
};

const EMPTY_CAREER_EVIDENCE: CareerProfileEvidence = {
  skills: [],
  experiences: [],
  educations: [],
  trainings: [],
  languages: [],
  workValues: [],
  targetRole: null,
  targetSeniority: null,
};

function getCareerEvidence(profileData: unknown, dashboardProfile: DashboardSnapshotDto['profile']): CareerProfileEvidence {
  const source = profileData && typeof profileData === 'object' ? profileData as Record<string, unknown> : {};
  const careerGoals = source.careerGoals && typeof source.careerGoals === 'object' ? source.careerGoals as Record<string, unknown> : {};
  const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
  const stringArray = (value: unknown): string[] => asArray(value).filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  return {
    skills: stringArray(source.skills),
    experiences: asArray(source.experiences),
    educations: asArray(source.educations),
    trainings: asArray(source.trainings),
    languages: asArray(source.languages),
    workValues: stringArray(careerGoals.workValues),
    targetRole: typeof careerGoals.targetJobTitle === 'string' && careerGoals.targetJobTitle.trim() ? careerGoals.targetJobTitle : dashboardProfile.targetRole,
    targetSeniority: typeof careerGoals.targetSeniority === 'string' && careerGoals.targetSeniority.trim() ? careerGoals.targetSeniority : null,
  };
}

function estimateAnnualValue(evidence: CareerProfileEvidence, profileCompleteness: number): number {
  const base = 28_000;
  const experiencePremium = Math.min(evidence.experiences.length, 8) * 3_000;
  const educationPremium = Math.min(evidence.educations.length, 4) * 1_500;
  const skillPremium = Math.min(evidence.skills.length, 24) * 900;
  const languagePremium = Math.min(evidence.languages.length, 5) * 1_000;
  const trainingPremium = Math.min(evidence.trainings.length, 8) * 750;
  const goalPremium = evidence.targetRole ? 2_000 : 0;
  const profilePremium = Math.round(profileCompleteness * 120);
  return Math.round((base + experiencePremium + educationPremium + skillPremium + languagePremium + trainingPremium + goalPremium + profilePremium) / 1_000) * 1_000;
}

function evidenceReadiness(evidence: CareerProfileEvidence, profileCompleteness: number): number {
  const raw =
    Math.min(evidence.experiences.length, 5) * 8
    + Math.min(evidence.educations.length, 3) * 6
    + Math.min(evidence.skills.length, 18) * 2
    + Math.min(evidence.languages.length, 4) * 3
    + Math.min(evidence.trainings.length, 6) * 3
    + (evidence.targetRole ? 8 : 0)
    + (evidence.targetSeniority ? 6 : 0)
    + Math.min(evidence.workValues.length, 5) * 2;
  return Math.min(100, Math.max(0, Math.round((raw * 0.72) + (profileCompleteness * 0.28))));
}

function missingEvidenceItems(evidence: CareerProfileEvidence, dashboardGaps: string[]): string[] {
  const items = new Set<string>();
  if (!evidence.targetRole) items.add('Target Role');
  if (!evidence.targetSeniority || dashboardGaps.includes('seniority')) items.add('Seniority');
  if (evidence.workValues.length === 0 || dashboardGaps.includes('workValues')) items.add('Work Values');
  if (evidence.experiences.length === 0) items.add('Work Experience');
  if (evidence.skills.length < 5) items.add('Role Skills');
  if (evidence.educations.length === 0) items.add('Education');
  if (evidence.trainings.length === 0) items.add('Certificates / Courses');
  return Array.from(items);
}

function FlipCard(props: {
  tone: 'amber' | 'indigo' | 'teal';
  icon: ReactNode;
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  frontNote: string;
  backTitle: string;
  backItems: Array<{ label: string; value: string; note: string }>;
  backFooter: ReactNode;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const toneClasses = {
    amber: 'border-amber-500/30 from-amber-500/10 hover:border-amber-500/50 text-amber-300 bg-amber-500/20',
    indigo: 'border-indigo-500/30 from-indigo-500/10 hover:border-indigo-500/50 text-indigo-300 bg-indigo-500/20',
    teal: 'border-teal-500/30 from-teal-500/10 hover:border-teal-500/50 text-teal-300 bg-teal-500/20',
  }[props.tone];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setIsFlipped((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setIsFlipped((current) => !current);
        }
      }}
      className={`mvh-card-glow min-h-[300px] cursor-pointer rounded-2xl border bg-gradient-to-br to-slate-900/40 p-6 text-left transition ${toneClasses}`}
      aria-pressed={isFlipped}
    >
      {!isFlipped ? (
        <div className="flex h-full flex-col">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClasses.split(' ').slice(-1)[0]}`}>
              {props.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-white">{props.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{props.subtitle}</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-4xl font-bold text-white">{props.metric}<sup className="ml-1 text-sm text-slate-400">*</sup></p>
            <p className="mt-1 text-xs text-slate-500">{props.metricLabel}</p>
          </div>
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-slate-300">{props.frontNote}</p>
          <p className="mt-auto pt-4 text-xs font-semibold text-slate-400">Click to see how this estimate was built →</p>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{props.backTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">Component-based estimate from profile, CV, skills and target-role signals.</p>
            </div>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-300">Back</span>
          </div>
          <div className="mt-4 space-y-2">
            {props.backItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                  <span className="text-xs font-bold text-white">{item.value}</span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4 text-xs leading-5 text-slate-400">{props.backFooter}</div>
        </div>
      )}
    </div>
  );
}


function CareerIntelligenceSection({ profile }: { profile: DashboardSnapshotDto['profile'] }) {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const coreSignalsQuery = api.skillLab.coreSignals.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const profileQuery = api.profile.getProfile.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const evidence = profileQuery.data ? getCareerEvidence(profileQuery.data, profile) : EMPTY_CAREER_EVIDENCE;
  const signals = coreSignalsQuery.data;
  const estimatedValue = estimateAnnualValue(evidence, profile.completeness);
  const skillsMatch = evidenceReadiness(evidence, profile.completeness);
  const gapPercent = Math.max(0, 100 - skillsMatch);
  const gaps = missingEvidenceItems(evidence, profile.missingCriticalFields);
  const benchmarkLabel = evidence.targetRole
    ? `${evidence.targetRole}${evidence.targetSeniority ? ` · ${evidence.targetSeniority}` : ''}`
    : 'target dream job';

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Career Intelligence</h2>
          <p className="mt-1 text-sm text-slate-400">
            Reversible cards: click a card to see evidence, assumptions and legal-safe estimate notes.
          </p>
        </div>
        <Link to="/skills" className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200">
          View Skills Lab →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FlipCard
          tone="amber"
          icon={<span className="text-2xl font-bold text-amber-300">£</span>}
          title="CV Market Value"
          subtitle="Estimated annual CV value in the UK market"
          metric={`£${estimatedValue.toLocaleString('en-GB')}`}
          metricLabel="estimated annual gross salary"
          frontNote={signals?.salaryImpact.rationale ?? 'Uses profile completeness, experience, education, skills, languages, certificates, courses and CV evidence as available.'}
          backTitle="How CV Market Value is estimated"
          backItems={[
            { label: 'Experience', value: `${evidence.experiences.length} entries`, note: 'Work history and recency increase the seniority and salary-confidence signal.' },
            { label: 'Education', value: `${evidence.educations.length} entries`, note: 'Degrees and fields of study are counted as formal evidence.' },
            { label: 'Skills', value: `${evidence.skills.length} skills`, note: 'Role-relevant hard, tool, domain and soft skills increase market strength.' },
            { label: 'Languages', value: `${evidence.languages.length} languages`, note: 'Language coverage and certificates add extra employability evidence.' },
            { label: 'Certificates / Courses', value: `${evidence.trainings.length} entries`, note: 'Training, courses and credentials strengthen current-market credibility.' },
            { label: 'Market signals', value: signals?.salaryImpact.tier ?? 'Pending', note: signals?.cvValueSignals[0] ?? 'Skills Lab signals are used when available.' },
          ]}
          backFooter={<>* Estimated gross annual amount in GBP. This is an indicative planning range, not a job offer, salary promise, financial advice, or guaranteed outcome.</>}
        />

        <FlipCard
          tone="indigo"
          icon={<Sparkles className="h-6 w-6 text-indigo-300" />}
          title="Skills Market Value"
          subtitle="Match to your dream job target"
          metric={`${skillsMatch}%`}
          metricLabel={`estimated match to ${benchmarkLabel}`}
          frontNote="Compares known profile skills, experience, education, languages and training against the dream-role benchmark stored in Profile and Skills Lab."
          backTitle="Why this match is not higher or lower"
          backItems={[
            { label: 'Experience evidence', value: `${Math.min(40, evidence.experiences.length * 8)}%`, note: 'Work experience and seniority signals from Profile and CV.' },
            { label: 'Skills coverage', value: `${Math.min(36, evidence.skills.length * 2)}%`, note: 'Declared skills, certifications, courses and training evidence.' },
            { label: 'Education / languages', value: `${Math.min(18, (evidence.educations.length * 6) + (evidence.languages.length * 3))}%`, note: 'Education, language and certificate evidence that supports similar role requirements.' },
            { label: 'Goal alignment', value: `${(evidence.targetRole ? 8 : 0) + (evidence.targetSeniority ? 6 : 0)}%`, note: 'Dream role and target seniority from Profile goals.' },
          ]}
          backFooter={<>* Estimated against several comparable target-role requirements where available. It is an indicative fit score, not an employer decision.</>}
        />

        <FlipCard
          tone="teal"
          icon={<TrendingUp className="h-6 w-6 text-teal-300" />}
          title="Skills Gap Analysis"
          subtitle="Missing evidence for your target role"
          metric={`${gapPercent}%`}
          metricLabel="estimated gap to close"
          frontNote={gaps.length > 0 ? `Top missing signal: ${gaps[0]}` : 'No critical gaps detected in the tracked profile signals.'}
          backTitle="What is missing and where to improve it"
          backItems={(gaps.length > 0 ? gaps : ['No critical gaps']).map((field) => {
            if (field === 'No critical gaps') return { label: field, value: 'OK', note: 'Tracked Profile and Skills Lab evidence is present.' };
            const copy = gapCopy(field === 'Seniority' ? 'seniority' : field === 'Work Values' ? 'workValues' : field);
            return { label: copy.title, value: 'Missing', note: copy.description };
          })}
          backFooter={<><Link to="/skills" onClick={(event) => event.stopPropagation()} className="font-semibold text-teal-300 hover:text-teal-200">Open Skills Lab</Link> to raise missing skills. * Gap is an estimate based on profile/CV evidence and comparable role requirements.</>}
        />
      </div>
    </section>
  );
}

function WorkspaceTiles({ applications, practice }: Pick<DashboardSnapshotDto, 'applications' | 'practice'>) {
  const tiles = [
    { title: 'Profile', value: 'Open', subtitle: 'Identity, goals, seniority and work values', href: '/profile', icon: User, tone: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200' },
    { title: 'Components', value: 'CV', subtitle: 'Documents, CV components and profile evidence', href: '/documents', icon: FileText, tone: 'border-sky-500/30 bg-sky-500/10 text-sky-200' },
    { title: 'Applications', value: String(applications.total), subtitle: `${applications.byStatus.applied} applied · ${applications.byStatus.interview} interviews`, href: '/applications', icon: ClipboardList, tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
    { title: 'Interview Practice', value: String(practice.totalSessions), subtitle: practice.averageScore === null ? 'No scored sessions yet' : `Average score ${practice.averageScore}`, href: '/interview', icon: Sparkles, tone: 'border-violet-500/30 bg-violet-500/10 text-violet-200' },
    { title: 'Job Track', value: String(applications.byStatus.saved + applications.byStatus.applied), subtitle: 'Saved + applied positions', href: '/jobs/saved', icon: Briefcase, tone: 'border-amber-500/30 bg-amber-500/10 text-amber-200' },
    { title: 'Skills Matrix', value: 'Open', subtitle: 'Evidence-based skill scoring and gap analysis', href: '/skills', icon: TrendingUp, tone: 'border-teal-500/30 bg-teal-500/10 text-teal-200' },
    { title: 'Job Radar', value: 'Scan', subtitle: 'Employer trust signals and risk detection', href: '/job-radar', icon: Search, tone: 'border-rose-500/30 bg-rose-500/10 text-rose-200' },
    { title: 'Settings', value: '⚙️', subtitle: 'Account, notifications and preferences', href: '/settings', icon: Settings, tone: 'border-slate-500/30 bg-slate-500/10 text-slate-200' },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link key={tile.title} to={tile.href} className={`mvh-card-glow rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:bg-white/10 ${tile.tone}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{tile.title}</p>
                <p className="mt-2 text-2xl font-bold text-white">{tile.value}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-300">{tile.subtitle}</p>
          </Link>
        );
      })}
    </section>
  );
}

function PipelineStatus({ byStatus }: { byStatus: Record<DashboardApplicationStatus, number> }) {
  const colors: Record<DashboardApplicationStatus, string> = {
    draft: 'bg-slate-500',
    saved: 'bg-sky-500',
    applied: 'bg-amber-500',
    interview: 'bg-violet-500',
    offer: 'bg-emerald-500',
    rejected: 'bg-rose-500',
    archived: 'bg-slate-700',
  };
  const maxCount = Math.max(1, ...Object.values(byStatus));

  return (
    <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold text-white">Application Status</h2>
      <p className="mt-1 text-xs text-slate-500">Colour shows where your current pipeline is concentrated.</p>
      <div className="mt-4 space-y-3">
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className="rounded-xl bg-black/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{titleCaseStatus(status)}</span>
              <span className="text-sm font-semibold text-white">{count}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${colors[status as DashboardApplicationStatus]}`} style={{ width: `${Math.max(6, (count / maxCount) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function gapCopy(field: string): { title: string; description: string; href: string; cta: string } {
  const copy: Record<string, { title: string; description: string; href: string; cta: string }> = {
    seniority: {
      title: 'Seniority',
      description: 'Seniority means the target level you want to be assessed against, for example Junior, Mid, Senior, Lead or Manager. Complete it in Profile goals.',
      href: '/profile',
      cta: 'Complete Profile',
    },
    workValues: {
      title: 'Work Values',
      description: 'Work Values describe what matters to you at work, such as flexibility, stability, salary growth, autonomy or mission. Add them in Profile goals.',
      href: '/profile',
      cta: 'Add Work Values',
    },
    'Target Role': {
      title: 'Target Role',
      description: 'Target Role is the dream job benchmark used to compare your CV, skills and applications. Complete it in Career Goals on Profile.',
      href: '/profile',
      cta: 'Set Target Role',
    },
    'Work Experience': {
      title: 'Work Experience',
      description: 'Work Experience supplies the evidence used to estimate seniority, salary confidence and role fit. Add roles in Profile Evidence.',
      href: '/profile',
      cta: 'Add Experience',
    },
    'Role Skills': {
      title: 'Role Skills',
      description: 'Role Skills are compared with similar target-role requirements. Add missing skills in Profile, then strengthen them in Skills Lab.',
      href: '/skills',
      cta: 'Open Skills Lab',
    },
    Education: {
      title: 'Education',
      description: 'Education improves the evidence base for CV value and target-role matching. Add schools, degrees or relevant study in Profile.',
      href: '/profile',
      cta: 'Add Education',
    },
    'Certificates / Courses': {
      title: 'Certificates / Courses',
      description: 'Certificates and courses prove current capability and help close skills gaps for the target role. Add them in Profile Evidence or Skills Lab.',
      href: '/skills',
      cta: 'Open Skills Lab',
    },
  };

  return copy[field] ?? {
    title: titleCaseStatus(field),
    description: 'This profile signal is missing and should be completed in Profile or Documents so career intelligence can explain recommendations more accurately.',
    href: field === 'documents' ? '/documents' : '/profile',
    cta: field === 'documents' ? 'Open Documents' : 'Open Profile',
  };
}

export function DashboardSnapshot({ snapshot }: { snapshot: DashboardSnapshotDto }) {
  const { profile, applications, practice, nextAction, activity = {
    lastLoginAt: null,
    lastJobSearchAt: null,
    lastJobSearchLabel: null,
    lastMarketResearchAt: null,
  }, newsroom = [] } = snapshot;
  const displayName = firstName(profile.fullName);
  return (
    <div className="space-y-8">
      <section className="mvh-card-glow rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-indigo-500/[0.08] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">WELCOME BACK</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {displayName ? `Welcome back, ${displayName}` : 'Welcome back'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Newsroom shows live career updates. Workspace tiles, applications and intelligence actions are outside the newsroom.
            </p>
          </div>
          <Link
            to={nextAction.href}
            className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            {nextAction.label}
          </Link>
        </div>
        <Newsroom items={newsroom} />
      </section>

      <WorkspaceTiles applications={applications} practice={practice} />

      <CareerIntelligenceSection profile={profile} />

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Application</h2>
            <Link to="/applications" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
              View All
            </Link>
          </div>

          {applications.recent.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
              No applications yet. Start from Jobs and build your pipeline.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/10">
                  {applications.recent.map((application) => (
                    <tr key={application.id} className="transition hover:bg-indigo-500/10">
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        <Link to={`/applications?applicationId=${encodeURIComponent(application.id)}`} className="hover:text-indigo-300">
                          {application.companyName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <Link to={`/applications?applicationId=${encodeURIComponent(application.id)}`} className="hover:text-indigo-300">
                          {application.roleTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <StatusBadge status={application.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        <Link to={`/applications?applicationId=${encodeURIComponent(application.id)}`} className="hover:text-indigo-300">
                          {new Date(application.updatedAt).toLocaleDateString('en-GB')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <PipelineStatus byStatus={applications.byStatus} />

          <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Profile Gaps</h2>
            {!profile.missingCriticalFields || profile.missingCriticalFields.length === 0 ? (
              <p className="mt-4 text-sm text-emerald-300">All tracked profile signals are present.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {profile.missingCriticalFields.map((field) => {
                  const copy = gapCopy(field);
                  return (
                    <li key={field} className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                        <div>
                          <p className="text-sm font-semibold text-amber-100">{copy.title}</p>
                          <p className="mt-1 text-xs leading-5 text-amber-100/80">{copy.description}</p>
                          <Link to={copy.href} className="mt-2 inline-flex text-xs font-semibold text-amber-200 hover:text-amber-100">
                            {copy.cta} →
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">History Activity</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3 rounded-xl bg-black/20 px-3 py-3">
                <User className="mt-0.5 h-4 w-4 text-indigo-300" />
                <div>
                  <span className="block text-slate-500">Last login session</span>
                  <span className="mt-1 block font-medium text-white">{formatDate(activity.lastLoginAt)}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-black/20 px-3 py-3">
                <Search className="mt-0.5 h-4 w-4 text-emerald-300" />
                <div>
                  <span className="block text-slate-500">Last job search</span>
                  <span className="mt-1 block font-medium text-white">{formatDate(activity.lastJobSearchAt)}</span>
                  {activity.lastJobSearchLabel ? <span className="mt-1 block text-xs text-slate-500">{activity.lastJobSearchLabel}</span> : null}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-black/20 px-3 py-3">
                <LayoutGrid className="mt-0.5 h-4 w-4 text-sky-300" />
                <div>
                  <span className="block text-slate-500">Last labour-market research</span>
                  <span className="mt-1 block font-medium text-white">{formatDate(activity.lastMarketResearchAt)}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-black/20 px-3 py-3">
                <Target className="mt-0.5 h-4 w-4 text-violet-300" />
                <div>
                  <span className="block text-slate-500">Last interview practice</span>
                  <span className="mt-1 block font-medium text-white">{formatDate(practice.lastCompletedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
