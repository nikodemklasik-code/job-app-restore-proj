import { useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { useFileUpload } from '@/lib/useFileUpload';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Palette,
  BarChart2,
  BookOpen,
  Import,
  FileBadge,
  Sparkles,
  Wand2,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

type DocCategory = 'cv' | 'coverletter' | 'skills';

interface UploadedDoc {
  id: string;
  category: DocCategory;
  filename: string;
  preview: string;       // first 300 chars of parsed text
  skills: string[];
  fullName?: string;
  summary?: string;
  rawText: string;
}

// ─── style analysis helpers (local fallback) ──────────────────────────────────

const TONE_KEYWORDS: Record<string, string[]> = {
  formal: ['therefore', 'furthermore', 'consequently', 'additionally', 'hereby', 'wherein', 'pursuant'],
  concise: ['delivered', 'improved', 'reduced', 'built', 'led', 'drove', 'cut', 'grew', 'launched'],
  technical: ['api', 'sdk', 'typescript', 'react', 'node', 'sql', 'aws', 'docker', 'ci/cd', 'architecture'],
  data_driven: ['%', 'increased', 'decreased', 'revenue', 'users', 'performance', 'metrics', 'kpi'],
  collaborative: ['team', 'cross-functional', 'stakeholder', 'collaborated', 'partnered', 'aligned'],
  leadership: ['managed', 'mentored', 'directed', 'oversaw', 'established', 'initiated', 'spearheaded'],
};

const ACTION_VERBS = [
  'achieved','built','created','delivered','developed','drove','established','grew',
  'implemented','improved','increased','initiated','launched','led','managed',
  'mentored','optimised','reduced','spearheaded','transformed',
];

function analyseTextLocal(text: string) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 4);

  // tone
  const tones: { label: string; score: number }[] = Object.entries(TONE_KEYWORDS).map(([label, kws]) => {
    const score = kws.filter((kw) => lower.includes(kw)).length;
    return { label: label.replace('_', ' '), score };
  }).filter((t) => t.score > 0).sort((a, b) => b.score - a.score);

  // action verbs
  const verbCounts: Record<string, number> = {};
  for (const verb of ACTION_VERBS) {
    const re = new RegExp(`\\b${verb}`, 'gi');
    const matches = text.match(re);
    if (matches && matches.length > 0) verbCounts[verb] = matches.length;
  }
  const topVerbs = Object.entries(verbCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return { wordCount: words.length, sentenceCount: sentences.length, tones: tones.slice(0, 5), topVerbs };
}

// ─── AI analysis result type ──────────────────────────────────────────────────

interface AiAnalysisResult {
  suggestions?: string[];
  score?: number;
  tone?: string;
  topVerbs?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleApi = (api as any).style as {
  analyzeDocument: { useMutation: () => { mutateAsync: (input: { userId: string; text: string; documentType: string }) => Promise<AiAnalysisResult>; isPending: boolean } };
  rewriteSection: { useMutation: () => { mutateAsync: (input: { userId: string; text: string; instruction: string; tone: string }) => Promise<{ rewritten: string }>; isPending: boolean } };
} | undefined;

// ─── upload slot ─────────────────────────────────────────────────────────────

function UploadSlot({
  category,
  label,
  icon: Icon,
  doc,
  loading,
  onFile,
  onRemove,
}: {
  category: DocCategory;
  label: string;
  icon: React.ElementType;
  doc: UploadedDoc | undefined;
  loading: boolean;
  onFile: (file: File, cat: DocCategory) => void;
  onRemove: (cat: DocCategory) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { isDragging, dragHandlers } = useFileUpload();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">{label}</h3>
      </div>

      {doc ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
              <span className="truncate text-sm text-white">{doc.filename}</span>
            </div>
            <button
              onClick={() => onRemove(category)}
              className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {doc.preview && (
            <p className="rounded-lg bg-black/20 p-3 text-xs leading-relaxed text-slate-400 line-clamp-3">
              {doc.preview}
            </p>
          )}
        </div>
      ) : (
        <div
          className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => dragHandlers.onDragOver(e)}
          onDragLeave={dragHandlers.onDragLeave}
          onDrop={(e) => dragHandlers.onDrop(e, (f) => onFile(f, category))}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f, category);
              e.target.value = '';
            }}
          />
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-slate-500" />
              <span className="text-xs text-slate-500">PDF, DOCX or TXT</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function StyleStudio() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { fileToBase64 } = useFileUpload();

  const [docs, setDocs] = useState<Partial<Record<DocCategory, UploadedDoc>>>({});
  const [loadingCat, setLoadingCat] = useState<Partial<Record<DocCategory, boolean>>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [rewrittenSummary, setRewrittenSummary] = useState<string | null>(null);
  const [rewrittenSkills, setRewrittenSkills] = useState<string | null>(null);
  const [isRewritingSummary, setIsRewritingSummary] = useState(false);
  const [isRewritingSkills, setIsRewritingSkills] = useState(false);

  // tRPC — style router (may not exist yet; access is guarded via styleApi)
  const analyzeDocMutation = styleApi?.analyzeDocument.useMutation();
  const rewriteMutation = styleApi?.rewriteSection.useMutation();

  // tRPC
  const profileQuery = api.profile.getProfile.useQuery(
    undefined,
    { enabled: Boolean(userId) },
  );

  const uploadMutation = api.cv.upload.useMutation();
  const importMutation = api.cv.importToProfile.useMutation({
    onSuccess: () => {
      setImportSuccess('Profile updated from CV.');
      void profileQuery.refetch();
    },
    onError: (err) => setUploadError(err.message),
  });
  const downloadCvMutation = api.applications.downloadCvPdf.useMutation({
    onError: (err) => setDownloadError(err.message),
  });

  // latest uploads list
  const latestQuery = api.cv.getLatest.useQuery(
    { userId: userId ?? '' },
    { enabled: Boolean(userId) },
  );

  // ── handlers ───────────────────────────────────────────────────────────────

  async function handleFile(file: File, category: DocCategory) {
    if (!userId) return;
    setLoadingCat((prev) => ({ ...prev, [category]: true }));
    setUploadError(null);
    try {
      const prefix = category === 'coverletter' ? 'coverletter_' : category === 'skills' ? 'skills_' : 'cv_';
      const base64 = await fileToBase64(file);
      const result = await uploadMutation.mutateAsync({
        userId,
        filename: `${prefix}${file.name}`,
        base64,
        mimeType: file.type || undefined,
      });
      const parsed = result.parsed;
      setDocs((prev) => ({
        ...prev,
        [category]: {
          id: result.id,
          category,
          filename: file.name,
          preview: (parsed.rawText ?? '').slice(0, 300),
          skills: (parsed.skills ?? []) as string[],
          fullName: parsed.fullName as string | undefined,
          summary: parsed.summary as string | undefined,
          rawText: parsed.rawText ?? '',
        } satisfies UploadedDoc,
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoadingCat((prev) => ({ ...prev, [category]: false }));
    }
  }

  async function handleAnalyse(rawText: string) {
    if (!userId || !analyzeDocMutation) return;
    setIsAnalysing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeDocMutation.mutateAsync({
        userId,
        text: rawText.slice(0, 5000),
        documentType: 'cv',
      });
      setAiAnalysis(result);
    } catch {
      // fallback — show nothing, local heuristic still renders
    } finally {
      setIsAnalysing(false);
    }
  }

  async function handleRewriteSummary(text: string) {
    if (!userId || !rewriteMutation) return;
    setIsRewritingSummary(true);
    try {
      const { rewritten } = await rewriteMutation.mutateAsync({
        userId,
        text,
        instruction: 'Make this more professional and impactful',
        tone: 'professional',
      });
      setRewrittenSummary(rewritten);
    } catch {
      // non-fatal
    } finally {
      setIsRewritingSummary(false);
    }
  }

  async function handleRewriteSkills(text: string) {
    if (!userId || !rewriteMutation) return;
    setIsRewritingSkills(true);
    try {
      const { rewritten } = await rewriteMutation.mutateAsync({
        userId,
        text,
        instruction: 'Make this skills description more professional and impactful',
        tone: 'professional',
      });
      setRewrittenSkills(rewritten);
    } catch {
      // non-fatal
    } finally {
      setIsRewritingSkills(false);
    }
  }

  function removeDoc(cat: DocCategory) {
    setDocs((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  }

  async function handleDownloadPdf() {
    if (!userId) return;
    setDownloadError(null);
    try {
      const result = await downloadCvMutation.mutateAsync({ userId });
      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CV.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // handled in onError
    }
  }

  // ── derived ────────────────────────────────────────────────────────────────

  const cvDoc = docs.cv;
  const localAnalysis = cvDoc?.rawText ? analyseTextLocal(cvDoc.rawText) : null;
  const profile = profileQuery.data;

  // ── render ─────────────────────────────────────────────────────────────────

  if (!isLoaded) return null;
  if (!userId) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        Sign in to use Style Studio
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <Palette className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Style Studio</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Upload your documents, analyse writing style, and build your profile.
          </p>
        </div>
      </div>

      {(uploadError || downloadError) && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError ?? downloadError}
        </div>
      )}

      {importSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {importSuccess}
        </div>
      )}

      {/* ── upload section ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Document Upload
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <UploadSlot
            category="cv"
            label="CV / Résumé"
            icon={FileText}
            doc={docs.cv}
            loading={Boolean(loadingCat.cv)}
            onFile={(f, c) => void handleFile(f, c)}
            onRemove={removeDoc}
          />
          <UploadSlot
            category="coverletter"
            label="Cover Letter"
            icon={BookOpen}
            doc={docs.coverletter}
            loading={Boolean(loadingCat.coverletter)}
            onFile={(f, c) => void handleFile(f, c)}
            onRemove={removeDoc}
          />
          <UploadSlot
            category="skills"
            label="Skills List"
            icon={FileBadge}
            doc={docs.skills}
            loading={Boolean(loadingCat.skills)}
            onFile={(f, c) => void handleFile(f, c)}
            onRemove={removeDoc}
          />
        </div>
      </section>

      {/* ── style analysis ── */}
      {cvDoc && localAnalysis && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Style Analysis — {cvDoc.filename}
            </h2>
            {analyzeDocMutation && (
              <button
                onClick={() => void handleAnalyse(cvDoc.rawText)}
                disabled={isAnalysing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
              >
                {isAnalysing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Analyse with AI
              </button>
            )}
          </div>

          {/* AI suggestions banner */}
          {aiAnalysis && (
            <div className="mb-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">AI Insights</span>
                {aiAnalysis.score !== undefined && (
                  <span className="ml-auto text-sm font-bold text-purple-300">{aiAnalysis.score}/100</span>
                )}
              </div>
              {aiAnalysis.tone && (
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Detected tone: </span>
                  <span className="capitalize">{aiAnalysis.tone}</span>
                </p>
              )}
              {aiAnalysis.topVerbs && aiAnalysis.topVerbs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysis.topVerbs.map((v) => (
                    <span key={v} className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">{v}</span>
                  ))}
                </div>
              )}
              {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400 mt-1.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* stats */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Document stats</span>
              </div>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-400">Word count</dt>
                  <dd className="text-sm font-semibold text-white">{localAnalysis.wordCount.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-400">Sentences</dt>
                  <dd className="text-sm font-semibold text-white">{localAnalysis.sentenceCount.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-400">Avg. sentence length</dt>
                  <dd className="text-sm font-semibold text-white">
                    {localAnalysis.sentenceCount > 0
                      ? Math.round(localAnalysis.wordCount / localAnalysis.sentenceCount)
                      : 0}{' '}
                    words
                  </dd>
                </div>
              </dl>
            </div>

            {/* tone */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Writing tone</span>
              </div>
              {localAnalysis.tones.length === 0 ? (
                <p className="text-sm text-slate-500">No strong tone signals detected.</p>
              ) : (
                <div className="space-y-2">
                  {localAnalysis.tones.map((t) => (
                    <div key={t.label} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs capitalize text-slate-400">{t.label}</span>
                      <div className="flex-1 rounded-full bg-white/5 h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{ width: `${Math.min(100, t.score * 20)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{t.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* action verbs */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Top action verbs</span>
              </div>
              {localAnalysis.topVerbs.length === 0 ? (
                <p className="text-sm text-slate-500">No action verbs found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {localAnalysis.topVerbs.map(([verb, count]) => (
                    <span
                      key={verb}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white"
                    >
                      {verb}
                      <span className="text-slate-500">×{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rewrite with AI — summary */}
          {rewriteMutation && cvDoc.summary && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">Summary</p>
                  <p className="mt-0.5 text-sm text-slate-400 line-clamp-2">{rewrittenSummary ?? cvDoc.summary}</p>
                </div>
                <button
                  onClick={() => void handleRewriteSummary(cvDoc.summary ?? '')}
                  disabled={isRewritingSummary}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
                >
                  {isRewritingSummary ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  Rewrite with AI
                </button>
              </div>
              {rewrittenSummary && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-sm text-slate-300">
                  {rewrittenSummary}
                </div>
              )}
            </div>
          )}

          {/* Rewrite with AI — skills */}
          {rewriteMutation && cvDoc.skills.length > 0 && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">Skills</p>
                  <p className="mt-0.5 text-sm text-slate-400 line-clamp-1">{cvDoc.skills.slice(0, 5).join(', ')}{cvDoc.skills.length > 5 ? '…' : ''}</p>
                </div>
                <button
                  onClick={() => void handleRewriteSkills(cvDoc.skills.join(', '))}
                  disabled={isRewritingSkills}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
                >
                  {isRewritingSkills ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  Rewrite with AI
                </button>
              </div>
              {rewrittenSkills && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-sm text-slate-300">
                  {rewrittenSkills}
                </div>
              )}
            </div>
          )}

          {/* import to profile */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
            <div>
              <p className="font-medium text-white">Import to Profile</p>
              <p className="text-sm text-slate-400 mt-0.5">
                Replace your profile name, summary and skills with data from this CV.
              </p>
            </div>
            <button
              onClick={() => {
                if (userId && cvDoc) {
                  setImportSuccess(null);
                  importMutation.mutate({ userId, cvUploadId: cvDoc.id });
                }
              }}
              disabled={importMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {importMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Import className="h-4 w-4" />
              )}
              Import to Profile
            </button>
          </div>
        </section>
      )}

      {/* ── cv preview ── */}
      {profile && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
            CV Preview
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {profile.personalInfo.fullName || 'Your Name'}
                </h3>
                {profile.personalInfo.phone && (
                  <p className="mt-0.5 text-sm text-slate-400">{profile.personalInfo.phone}</p>
                )}
                {profile.personalInfo.summary && (
                  <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate-300">
                    {profile.personalInfo.summary}
                  </p>
                )}
              </div>

              <button
                onClick={() => void handleDownloadPdf()}
                disabled={downloadCvMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 transition-colors shrink-0"
              >
                {downloadCvMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </button>
            </div>

            {profile.skills.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── document library ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Document Library
        </h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {latestQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : !latestQuery.data ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No documents uploaded yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    File
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 hidden sm:table-cell">
                    Uploaded
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="text-white truncate max-w-xs">
                        {latestQuery.data.originalFilename}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 hidden sm:table-cell">
                    {new Date(latestQuery.data.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => {
                        if (userId) {
                          setImportSuccess(null);
                          importMutation.mutate({ userId, cvUploadId: latestQuery.data!.id });
                        }
                      }}
                      disabled={importMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                      <Import className="h-3.5 w-3.5" />
                      Import
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
