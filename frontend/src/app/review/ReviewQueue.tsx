<<<<<<< HEAD
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  XCircle,
  CheckCircle2,
  Briefcase,
  TrendingUp,
  Users,
  Award,
=======
import { useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { useFileUpload } from '@/lib/useFileUpload';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  FlaskConical,
  Sparkles,
>>>>>>> live-hardening
  X,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

<<<<<<< HEAD
type ApplicationStatus = 'Sent' | 'Interview' | 'Rejected' | 'Offer';

interface Application {
  id: string;
  company: string;
  jobTitle: string;
  status: ApplicationStatus;
  dateSent: string;
}

// ─── mock data (replace with api.applications.list when endpoint exists) ──────

const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    company: 'Acme Corp',
    jobTitle: 'Senior Frontend Developer',
    status: 'Interview',
    dateSent: '2026-04-10',
  },
  {
    id: '2',
    company: 'Globex Inc',
    jobTitle: 'Full Stack Engineer',
    status: 'Rejected',
    dateSent: '2026-04-05',
  },
  {
    id: '3',
    company: 'Initech Solutions',
    jobTitle: 'React Developer',
    status: 'Sent',
    dateSent: '2026-04-13',
  },
];

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const configs: Record<ApplicationStatus, { icon: React.ReactNode; classes: string }> = {
    Sent: {
      icon: <Send className="h-3 w-3" />,
      classes: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    },
    Interview: {
      icon: <Users className="h-3 w-3" />,
      classes: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    },
    Rejected: {
      icon: <XCircle className="h-3 w-3" />,
      classes: 'bg-red-500/15 border-red-500/30 text-red-400',
    },
    Offer: {
      icon: <Award className="h-3 w-3" />,
      classes: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
  };
  const { icon, classes } = configs[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {icon}
      {status}
=======
interface ParsedResult {
  skills: string[];
  fullName?: string;
  summary?: string;
}

// ─── tiny reusable chip ───────────────────────────────────────────────────────

function SkillChip({
  label,
  variant = 'default',
  onRemove,
}: {
  label: string;
  variant?: 'default' | 'gap' | 'profile' | 'overlap';
  onRemove?: () => void;
}) {
  const base = 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors';
  const colours: Record<string, string> = {
    default: 'bg-white/5 border border-white/10 text-white',
    gap: 'bg-amber-500/15 border border-amber-500/30 text-amber-300',
    profile: 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300',
    overlap: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300',
  };
  return (
    <span className={`${base} ${colours[variant]}`}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100">
          <X className="h-3 w-3" />
        </button>
      )}
>>>>>>> live-hardening
    </span>
  );
}

<<<<<<< HEAD
// ─── stats row ────────────────────────────────────────────────────────────────

function StatsRow({ applications }: { applications: Application[] }) {
  const total = applications.length;
  const interviews = applications.filter((a) => a.status === 'Interview' || a.status === 'Offer').length;
  const offers = applications.filter((a) => a.status === 'Offer').length;
  const responseRate = total === 0 ? 0 : Math.round((interviews / total) * 100);

  const stats = [
    { label: 'Total Sent', value: total.toString(), icon: <Send className="h-5 w-5 text-blue-400" /> },
    { label: 'Response Rate', value: `${responseRate}%`, icon: <TrendingUp className="h-5 w-5 text-indigo-400" /> },
    { label: 'Interviews', value: interviews.toString(), icon: <Users className="h-5 w-5 text-indigo-400" /> },
    { label: 'Offers', value: offers.toString(), icon: <Award className="h-5 w-5 text-emerald-400" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
            {stat.icon}
          </div>
          <span className="text-2xl font-bold text-white">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ask AI modal ─────────────────────────────────────────────────────────────

function AskAIModal({
  application,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState(
    `Why was my application for ${application.jobTitle} at ${application.company} rejected?`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Ask AI About Rejection</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {application.company} — {application.jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask AI why you were rejected..."
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            onClick={onClose}
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── application card ─────────────────────────────────────────────────────────

function ApplicationCard({
  application,
  onAskAI,
}: {
  application: Application;
  onAskAI: (app: Application) => void;
}) {
  const formattedDate = new Date(application.dateSent).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <Briefcase className="h-5 w-5 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{application.company}</p>
          <p className="truncate text-sm text-slate-400">{application.jobTitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden text-xs text-slate-500 sm:block">{formattedDate}</span>
        <StatusBadge status={application.status} />
        {application.status === 'Rejected' && (
          <button
            onClick={() => onAskAI(application)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            Ask AI why
          </button>
        )}
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] py-16 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-4">
        <Briefcase className="h-7 w-7 text-slate-500" />
      </div>
      <p className="font-medium text-slate-300">No applications yet.</p>
      <p className="mt-1 text-sm text-slate-500">Start applying from Job Listings.</p>
      <Link
        to="/jobs"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        Browse Jobs
      </Link>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ReviewQueue() {
  const [askAITarget, setAskAITarget] = useState<Application | null>(null);

  // When api.applications.list is available, replace MOCK_APPLICATIONS with the query result
  const applications = MOCK_APPLICATIONS;
=======
// ─── main component ───────────────────────────────────────────────────────────

export default function SkillsLab() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDragging, fileToBase64, dragHandlers } = useFileUpload();

  // local state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [removedGap, setRemovedGap] = useState<Set<string>>(new Set());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // tRPC
  const profileQuery = api.profile.getProfile.useQuery(
    undefined,
    { enabled: Boolean(userId) },
  );

  const uploadMutation = api.cv.upload.useMutation({
    onSuccess: (data) => {
      const skills = (data.parsed?.skills ?? []) as string[];
      setParsed({
        skills,
        fullName: data.parsed?.fullName as string | undefined,
        summary: data.parsed?.summary as string | undefined,
      });
      setUploadError(null);
      setRemovedGap(new Set());
      setSaveSuccess(false);
    },
    onError: (err) => {
      setUploadError(err.message);
    },
  });

  const saveSkillsMutation = api.profile.saveSkills.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      void profileQuery.refetch();
    },
  });

  // ── derived ────────────────────────────────────────────────────────────────

  const profileSkills: string[] = profileQuery.data?.skills ?? [];
  const extractedSkills: string[] = parsed?.skills ?? [];

  const profileSet = new Set(profileSkills.map((s) => s.toLowerCase()));
  const extractedSet = new Set(extractedSkills.map((s) => s.toLowerCase()));

  // skills in document but NOT in profile
  const gapSkills = extractedSkills.filter(
    (s) => !profileSet.has(s.toLowerCase()) && !removedGap.has(s),
  );
  // skills in both
  const overlapSkills = extractedSkills.filter((s) => profileSet.has(s.toLowerCase()));

  // ── handlers ───────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!userId) return;
    setSelectedFile(file);
    setParsed(null);
    setSaveSuccess(false);
    setUploadError(null);
    try {
      const base64 = await fileToBase64(file);
      await uploadMutation.mutateAsync({ userId, filename: file.name, base64 });
    } catch {
      // handled in onError
    }
  }

  function handleAddAllMissing() {
    if (!userId) return;
    const merged = Array.from(new Set([...profileSkills, ...gapSkills]));
    saveSkillsMutation.mutate({ skills: merged });
  }

  function handleAddSingle(skill: string) {
    if (!userId) return;
    const merged = Array.from(new Set([...profileSkills, skill]));
    saveSkillsMutation.mutate({ skills: merged });
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (!isLoaded) return null;
  if (!userId) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        Sign in to use Skills Lab
      </div>
    );
  }
>>>>>>> live-hardening

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
<<<<<<< HEAD
          <CheckCircle2 className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Applications Review</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Track your applications and understand what's working.
=======
          <FlaskConical className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Skills Lab</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Upload a document to extract skills, compare against your profile, and close the gap.
>>>>>>> live-hardening
          </p>
        </div>
      </div>

<<<<<<< HEAD
      {/* stats */}
      <StatsRow applications={applications} />

      {/* cards list */}
      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onAskAI={setAskAITarget}
            />
          ))}
        </div>
      )}

      {/* modal */}
      {askAITarget && (
        <AskAIModal
          application={askAITarget}
          onClose={() => setAskAITarget(null)}
        />
=======
      {/* upload zone */}
      <div
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer
          ${isDragging
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
          }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => dragHandlers.onDragOver(e)}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={(e) => dragHandlers.onDrop(e, (f) => void handleFile(f))}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />

        {uploadMutation.isPending ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm text-slate-400">Parsing {selectedFile?.name}…</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <Upload className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-white">
                {selectedFile ? selectedFile.name : 'Drop a file or click to browse'}
              </p>
              <p className="mt-1 text-xs text-slate-500">PDF, DOCX, TXT — any CV, job spec, or skills list</p>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* results grid */}
      {parsed && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* extracted */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-white">Extracted from document</h2>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                {extractedSkills.length} skills
              </span>
            </div>

            {extractedSkills.length === 0 ? (
              <p className="text-sm text-slate-500">No skills detected in this document.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {overlapSkills.map((s) => (
                  <SkillChip key={s} label={s} variant="overlap" />
                ))}
                {gapSkills.map((s) => (
                  <SkillChip
                    key={s}
                    label={s}
                    variant="gap"
                    onRemove={() => setRemovedGap((prev) => new Set([...prev, s]))}
                  />
                ))}
                {[...removedGap]
                  .filter((s) => extractedSet.has(s.toLowerCase()))
                  .map((s) => (
                    <SkillChip key={s} label={s} variant="default" />
                  ))}
              </div>
            )}

            {extractedSkills.length > 0 && (
              <div className="mt-4 flex gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> already in profile
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> missing from profile
                </span>
              </div>
            )}
          </div>

          {/* profile skills */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-white">Your current profile skills</h2>
              </div>
              {profileQuery.isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
              ) : (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                  {profileSkills.length} skills
                </span>
              )}
            </div>

            {profileSkills.length === 0 ? (
              <p className="text-sm text-slate-500">
                Your profile has no skills yet. Upload a document and add them below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileSkills.map((s) => (
                  <SkillChip
                    key={s}
                    label={s}
                    variant={extractedSet.has(s.toLowerCase()) ? 'overlap' : 'profile'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* gap analysis action bar */}
      {parsed && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">Skill gap analysis</h2>
              {gapSkills.length === 0 ? (
                <p className="mt-0.5 text-sm text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Your profile already covers all extracted skills.
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-slate-400">
                  <span className="font-semibold text-amber-400">{gapSkills.length}</span> skill
                  {gapSkills.length !== 1 ? 's are' : ' is'} missing from your profile.
                </p>
              )}
            </div>

            {gapSkills.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleAddAllMissing}
                  disabled={saveSkillsMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saveSkillsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add all {gapSkills.length} missing skills
                </button>
              </div>
            )}
          </div>

          {/* per-skill add buttons */}
          {gapSkills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {gapSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleAddSingle(skill)}
                  disabled={saveSkillsMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  {skill}
                </button>
              ))}
            </div>
          )}

          {saveSuccess && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Profile skills updated successfully.
            </div>
          )}
        </div>
      )}

      {/* empty state before upload */}
      {!parsed && !uploadMutation.isPending && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
          <FlaskConical className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-500">
            Upload a CV, job description, or any document to extract skills and see how they compare
            to your profile.
          </p>
        </div>
>>>>>>> live-hardening
      )}
    </div>
  );
}
