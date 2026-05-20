import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Palette,
  Sparkles,
} from 'lucide-react';

export type StyleStudioVariant = 'page' | 'embedded';

type GeneratedDocType = 'cv' | 'coverletter';

type JobFeedItem = {
  id: string;
  title: string;
  company: string;
  description?: string | null;
};

type GenerateMutation = {
  mutate: (input: {
    userId: string;
    type: GeneratedDocType;
    jobTitle: string;
    jobDescription?: string;
    company?: string;
    profileSummary?: string;
    skills?: string[];
    senderName?: string;
  }) => void;
  isPending: boolean;
};

type PdfMutation = {
  mutateAsync: (input: Record<string, unknown>) => Promise<{ base64: string }>;
  isPending?: boolean;
};

const apiAny = api as any;

function downloadBase64Pdf(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function initialsFilename(candidateName: string, suffix: 'CV' | 'CL') {
  const trimmed = candidateName.trim();
  if (!trimmed) return suffix === 'CV' ? 'CV.pdf' : 'CoverLetter.pdf';
  const parts = trimmed.split(/\s+/);
  const initials = parts[0]?.[0]?.toUpperCase() ?? '';
  const lastName = parts.slice(1).join(' ');
  return lastName ? `${initials}. ${lastName} ${suffix}.pdf` : `${trimmed} ${suffix}.pdf`;
}

export default function StyleStudio({ variant = 'page' }: { variant?: StyleStudioVariant }) {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;

  const [genType, setGenType] = useState<GeneratedDocType>('cv');
  const [genJobId, setGenJobId] = useState<string | null>(null);
  const [genJobTitle, setGenJobTitle] = useState('');
  const [genCompany, setGenCompany] = useState('');
  const [genJobDesc, setGenJobDesc] = useState('');
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [genPdfError, setGenPdfError] = useState<string | null>(null);

  const profileQuery = api.profile.getProfile.useQuery(undefined, { enabled: Boolean(userId) });
  const jobsFeedQuery = apiAny.jobs.getFeed.useQuery({ limit: 30 }, { enabled: Boolean(userId) });

  const generateFromJobMutation = apiAny.style.generateFromJob.useMutation({
    onSuccess: (data: { text: string }) => {
      setGenResult(data.text);
      setGenError(null);
    },
    onError: (error: Error) => {
      setGenResult('');
      setGenError(error.message || 'Generation failed.');
    },
  }) as GenerateMutation;

  const downloadCvMutation = apiAny.applications.downloadCvPdf.useMutation({
    onError: (error: Error) => setGenPdfError(error.message || 'PDF download failed.'),
  }) as PdfMutation;

  const downloadCoverLetterPdfMutation = apiAny.applications.downloadCoverLetterPdf?.useMutation?.({
    onError: (error: Error) => setGenPdfError(error.message || 'PDF download failed.'),
  }) as PdfMutation | undefined;

  const profile = profileQuery.data;
  const approvedPersonal = profile?.personalInfo;
  const approvedSkills = useMemo(() => (profile?.skills ?? []).filter((skill: string) => skill.trim()), [profile?.skills]);
  const approvedSummary = approvedPersonal?.summary?.trim() ?? '';
  const approvedName = approvedPersonal?.fullName?.trim() ?? user?.fullName ?? '';
  const hasApprovedProfileEvidence = Boolean(approvedName || approvedSummary || approvedSkills.length > 0 || profile?.experiences?.length || profile?.educations?.length || profile?.trainings?.length);

  if (!isLoaded) return null;
  if (!userId) {
    return <div className="flex items-center justify-center py-24 text-slate-500">Sign in to use Style Studio</div>;
  }

  function handleGenerate() {
    if (!userId) return;
    setGenResult(null);
    setGenError(null);
    setGenPdfError(null);
    generateFromJobMutation.mutate({
      userId,
      type: genType,
      jobTitle: genJobTitle.trim() || 'this role',
      jobDescription: genJobDesc.trim() || undefined,
      company: genCompany.trim() || undefined,
      profileSummary: approvedSummary || undefined,
      skills: approvedSkills,
      senderName: approvedName || undefined,
    });
  }

  async function handleDownloadGeneratedPdf() {
    if (!genResult || !userId) return;
    setGenPdfError(null);
    try {
      if (genType === 'cv') {
        const result = await downloadCvMutation.mutateAsync({ userId });
        downloadBase64Pdf(result.base64, initialsFilename(approvedName, 'CV'));
        return;
      }
      if (downloadCoverLetterPdfMutation) {
        const result = await downloadCoverLetterPdfMutation.mutateAsync({
          userId,
          text: genResult,
          company: genCompany,
          role: genJobTitle,
        });
        downloadBase64Pdf(result.base64, initialsFilename(approvedName, 'CL'));
      }
    } catch {
      // handled by mutation onError where available
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
          <Palette className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{variant === 'embedded' ? 'Build — style & generation' : 'Style Studio'}</h1>
          <p className="mt-0.5 max-w-3xl text-sm text-slate-400">
            Generate and export career text from your approved Profile only. Document upload and CV parsing live in Document Hub, where changes must be reviewed before becoming profile truth.
          </p>
        </div>
      </div>

      {profileQuery.isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
        </div>
      ) : profileQuery.error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {profileQuery.error.message || 'Could not load approved profile.'}
        </div>
      ) : null}

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-4 text-sm text-amber-100">
        <p className="font-semibold text-white">Approved Profile is the source of truth</p>
        <p className="mt-1 leading-6 text-amber-100/85">
          Style Studio no longer uses parser output as profile context. Upload a CV in Document Hub, review the diff, then approved data will appear here for generation. Civilisation inches forward.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/documents" className="inline-flex items-center rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20">
            Open Document Hub review →
          </Link>
          <Link to="/profile" className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10">
            Check approved Profile →
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">Approved profile context</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          {hasApprovedProfileEvidence ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{approvedName || 'Your Name'}</h3>
                  {approvedPersonal?.headline ? <p className="mt-1 text-sm text-indigo-200">{approvedPersonal.headline}</p> : null}
                  {approvedPersonal?.phone ? <p className="mt-0.5 text-sm text-slate-400">{approvedPersonal.phone}</p> : null}
                  {approvedPersonal?.location ? <p className="mt-0.5 text-sm text-slate-400">{approvedPersonal.location}</p> : null}
                  {approvedSummary ? <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate-300">{approvedSummary}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDownloadGeneratedPdf()}
                  disabled={!userId || downloadCvMutation.isPending || !hasApprovedProfileEvidence}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadCvMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download approved CV PDF
                </button>
              </div>

              {approvedSkills.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Approved skills</p>
                  <div className="flex flex-wrap gap-2">
                    {approvedSkills.map((skill: string) => <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">{skill}</span>)}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-3 text-sm font-semibold text-white">No approved profile evidence yet</h3>
              <p className="mt-1 text-sm text-slate-500">Approve CV import changes in Document Hub or fill Profile manually before generating tailored documents.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">Generate from job</h2>
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-slate-400">
            Pick a job or enter details manually. The generator receives approved profile summary, approved skills and approved sender name only.
          </p>

          <div className="flex gap-2">
            {(['cv', 'coverletter'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setGenType(type); setGenResult(null); setGenError(null); }}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${genType === type ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 bg-white/5 text-slate-400 hover:border-indigo-500/30'}`}
              >
                {type === 'cv' ? 'CV Summary' : 'Cover Letter'}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Job Title</label>
              <input type="text" value={genJobTitle} onChange={(event) => setGenJobTitle(event.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Company</label>
              <input type="text" value={genCompany} onChange={(event) => setGenCompany(event.target.value)} placeholder="e.g. Acme Corp" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50" />
            </div>
          </div>

          {Array.isArray(jobsFeedQuery.data) && jobsFeedQuery.data.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Or pick from your job feed</p>
              <div className="max-h-36 space-y-1.5 overflow-y-auto">
                {(jobsFeedQuery.data as JobFeedItem[]).map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => { setGenJobId(job.id); setGenJobTitle(job.title); setGenCompany(job.company); setGenJobDesc(job.description ?? ''); }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${genJobId === job.id ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:border-indigo-500/30'}`}
                  >
                    <span className="font-medium">{job.title}</span>
                    <span className="ml-2 text-xs text-slate-500">{job.company}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Job Description optional</label>
            <textarea rows={4} value={genJobDesc} onChange={(event) => setGenJobDesc(event.target.value)} placeholder="Paste the job description for better tailoring…" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50" />
          </div>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!genJobTitle.trim() || generateFromJobMutation.isPending || !hasApprovedProfileEvidence}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generateFromJobMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generateFromJobMutation.isPending ? 'Generating…' : `Generate ${genType === 'cv' ? 'CV Summary' : 'Cover Letter'}`}
          </button>

          {genError ? <p className="text-sm text-red-400">{genError}</p> : null}

          {genResult !== null ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-400" /><span className="text-sm font-semibold text-white">Generated {genType === 'cv' ? 'CV Summary' : 'Cover Letter'}</span></div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{genResult || 'Generation failed. Try again.'}</div>
              </div>
              {genResult ? (
                <button onClick={() => void handleDownloadGeneratedPdf()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              ) : null}
              {genPdfError ? <p className="text-sm text-red-400">{genPdfError}</p> : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
