import { useRef, useState } from 'react';
import {
  Upload, FileText, Trash2, Loader2, CheckCircle2,
  FlaskConical, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';

const ACCEPT = '.pdf,.docx,.doc,.txt,.jpg,.jpeg,.png';

interface UploadedDoc {
  id: string;
  originalFilename: string;
  documentType: string;
  createdAt: string;
}

// ── CV Score Panel ─────────────────────────────────────────────────────────

interface ScoreResult {
  score: number;
  suggestions: string[];
  tone: Record<string, number>;
}

function CvScorePanel({ docs, userId }: { docs: UploadedDoc[]; userId: string }) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [result, setResult] = useState<ScoreResult | null>(null);

  const cvDocs = docs.filter((d) => d.documentType === 'cv' || d.originalFilename.toLowerCase().includes('cv') || d.originalFilename.toLowerCase().includes('resume'));
  const allDocs = cvDocs.length > 0 ? cvDocs : docs;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTextQuery = (api as any).documents.getText.useQuery(
    { id: selectedId },
    { enabled: false },
  );

  const analyzeMutation = api.style.analyzeDocument.useMutation({
    onSuccess: (data) => setResult(data as ScoreResult),
  });

  async function handleScore() {
    if (!selectedId || !userId) return;
    const res = await getTextQuery.refetch();
    const text = (res.data as { text?: string } | undefined)?.text ?? '';
    if (!text) return;
    analyzeMutation.mutate({ userId, text, documentType: 'cv' });
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-10 text-center">
        <FlaskConical className="h-10 w-10 text-slate-700" />
        <p className="text-sm font-medium text-slate-500">Upload a document to get your CV score</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select document to score
          </label>
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
          >
            <option value="" disabled className="bg-slate-900">— pick a document —</option>
            {allDocs.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900">{d.originalFilename}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => void handleScore()}
          disabled={!selectedId || analyzeMutation.isPending || getTextQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {(analyzeMutation.isPending || getTextQuery.isFetching) ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Scoring…</>
          ) : (
            <><FlaskConical className="h-4 w-4" /> Score CV</>
          )}
        </button>
      </div>

      {analyzeMutation.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Scoring failed — try again
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
              <span className="text-2xl font-black text-indigo-300">{result.score}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">CV Score</p>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all"
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {result.score >= 80 ? 'Strong CV — ready to apply' : result.score >= 60 ? 'Good — a few improvements needed' : 'Needs work — follow recommendations below'}
              </p>
            </div>
          </div>

          {/* Tone breakdown */}
          {Object.keys(result.tone).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tone Analysis</p>
              <div className="space-y-1.5">
                {Object.entries(result.tone).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-24 text-xs capitalize text-slate-400">{key}</span>
                    <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${val}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-slate-500">{val}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Recommendations</p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DocumentLab() {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const listQuery = api.documents.list.useQuery(undefined, { staleTime: 30_000 });
  const docs: UploadedDoc[] = (listQuery.data as UploadedDoc[] | undefined) ?? [];

  const utils = api.useUtils();

  const deleteMutation = api.documents.delete.useMutation({
    onSuccess: () => { void utils.documents.list.invalidate(); },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const text = await file.text().catch(() => '');
        await (api as unknown as { documents: { upload: { mutate: (args: unknown) => Promise<unknown> } } })
          .documents.upload.mutate({
            filename: file.name,
            documentType: 'other',
            extractedText: btoa(unescape(encodeURIComponent(text))),
          });
      }
      void utils.documents.list.invalidate();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Lab</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload your CV, cover letters, certificates — AI scores them and feeds them into your interview, coaching and negotiation sessions.
        </p>
      </div>

      {/* ── Upload zone ──────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-14 text-center transition-colors
          ${dragging
            ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30'
            : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-600'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {uploading
          ? <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          : <Upload className={`h-8 w-8 ${dragging ? 'text-indigo-500' : 'text-slate-400'}`} />
        }
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {uploading ? 'Processing…' : 'Drop files here or click to browse'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            PDF, DOCX, TXT, JPG, PNG — CV, cover letter, certificates, diplomas, anything
          </p>
        </div>
      </div>

      {/* ── Uploaded documents ───────────────────────────────────────── */}
      {docs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Uploaded documents</h2>
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{doc.originalFilename}</p>
                  <p className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Processed" />
                <button
                  onClick={() => deleteMutation.mutate({ id: doc.id })}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CV Score ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-indigo-400" />
          <h2 className="font-semibold text-white">CV Score</h2>
        </div>
        <CvScorePanel docs={docs} userId={userId} />
      </div>

    </div>
  );
}
