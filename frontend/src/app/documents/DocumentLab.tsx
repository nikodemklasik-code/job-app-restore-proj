import { useRef, useState } from 'react';
import {
  Upload, FileText, Trash2, Loader2, CheckCircle2,
  FlaskConical, ChevronRight, AlertCircle, Users,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { markJobsSearchPendingAfterCv } from '@/lib/jobsAfterCvSync';

/** Runtime may expose `documents` router before it is merged into shared `AppRouter` types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiExt = api as any;

const ACCEPT = '.pdf,.docx,.doc,.txt,.jpg,.jpeg,.png';

function guessMime(file: File): string {
  const n = file.name.toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.doc')) return 'application/msword';
  if (n.endsWith('.txt')) return 'text/plain';
  return file.type || 'application/octet-stream';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const parts = dataUrl.split(',');
      resolve(parts[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

interface UploadedDoc {
  id: string;
  originalFilename: string;
  documentType: string;
  createdAt: string;
}

type DocumentLabType =
  | 'cv'
  | 'cover_letter'
  | 'references'
  | 'certificate'
  | 'education'
  | 'portfolio'
  | 'other';

const DOCUMENT_TYPE_OPTIONS: { value: DocumentLabType; label: string }[] = [
  { value: 'cv', label: 'CV / résumé' },
  { value: 'cover_letter', label: 'Cover letter' },
  { value: 'references', label: 'References (employer / character)' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'education', label: 'Education / diploma' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'other', label: 'Other' },
];

type StyleAnalyzeDocType = 'cv' | 'cover_letter' | 'skills' | 'references';

function styleAnalyzeTypeForDoc(doc: UploadedDoc | undefined): StyleAnalyzeDocType {
  const t = doc?.documentType;
  if (t === 'cover_letter' || t === 'references') return t;
  if (t === 'skills') return 'skills';
  return 'cv';
}

// ── CV Score Panel ─────────────────────────────────────────────────────────

interface ScoreResult {
  score: number;
  suggestions: string[];
  tone: Record<string, number>;
}

const LATEST_CV_OPTION = '__cv_latest__';

function CvScorePanel({
  docs,
  userId,
  latestCv,
}: {
  docs: UploadedDoc[];
  userId: string;
  latestCv: { parsedText: string; originalFilename: string } | null;
}) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [result, setResult] = useState<ScoreResult | null>(null);

  const cvDocs = docs.filter((d) => d.documentType === 'cv' || d.originalFilename.toLowerCase().includes('cv') || d.originalFilename.toLowerCase().includes('resume'));
  const allDocs = cvDocs.length > 0 ? cvDocs : docs;

  const getTextQuery = api.documents.getText.useQuery(
    { id: selectedId },
    { enabled: false },
  );

  const analyzeMutation = api.style.analyzeDocument.useMutation({
    onSuccess: (data) => setResult(data as ScoreResult),
  });

  async function handleScore() {
    if (!selectedId || !userId) return;

    if (selectedId === LATEST_CV_OPTION && latestCv?.parsedText) {
      analyzeMutation.mutate({
        userId,
        text: latestCv.parsedText.slice(0, 50_000),
        documentType: 'cv',
      });
      return;
    }

    const res = await getTextQuery.refetch();
    const text = res.data?.text ?? '';
    if (!text) return;
    const selectedDoc = allDocs.find((d) => d.id === selectedId);
    const documentType = styleAnalyzeTypeForDoc(selectedDoc);
    analyzeMutation.mutate({ userId, text, documentType });
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
            {latestCv?.parsedText ? (
              <option value={LATEST_CV_OPTION} className="bg-slate-900">
                Latest CV (parsed): {latestCv.originalFilename}
              </option>
            ) : null}
            {allDocs.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900">
                [{d.documentType.replace(/_/g, ' ')}] {d.originalFilename}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => void handleScore()}
          disabled={
            !selectedId ||
            analyzeMutation.isPending ||
            (selectedId !== LATEST_CV_OPTION && getTextQuery.isFetching)
          }
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {(analyzeMutation.isPending || getTextQuery.isFetching) ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Scoring…</>
          ) : (
            <><FlaskConical className="h-4 w-4" /> Score document</>
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [primaryDocType, setPrimaryDocType] = useState<DocumentLabType>('cv');
  const [referenceText, setReferenceText] = useState('');
  const [referenceSaveState, setReferenceSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const listQuery = apiExt.documents.list.useQuery(undefined, { staleTime: 30_000 });
  const docs: UploadedDoc[] = (listQuery.data as UploadedDoc[] | undefined) ?? [];

  const latestCvQuery = api.cv.getLatest.useQuery({ userId }, { enabled: !!userId });
  const latestCvForScore =
    latestCvQuery.data?.parsedText && String(latestCvQuery.data.parsedText).trim().length > 0
      ? {
          parsedText: String(latestCvQuery.data.parsedText),
          originalFilename: String(latestCvQuery.data.originalFilename ?? 'CV'),
        }
      : null;

  const utils = api.useUtils();

  const deleteMutation = apiExt.documents.delete.useMutation({
    onSuccess: () => {
      void (utils as { documents?: { list: { invalidate: () => Promise<void> } } }).documents?.list.invalidate();
    },
  });

  const cvUploadMutation = api.cv.upload.useMutation();
  const documentsUploadMutation = api.documents.upload.useMutation();

  const handleSaveReferenceText = async () => {
    const text = referenceText.trim();
    if (!text || !userId) return;
    setReferenceSaveState('saving');
    setUploadError(null);
    try {
      await documentsUploadMutation.mutateAsync({
        documentType: 'references',
        originalFilename: `references-text-${new Date().toISOString().slice(0, 10)}.txt`,
        extractedText: text.slice(0, 50_000),
      });
      setReferenceText('');
      setReferenceSaveState('saved');
      void utils.documents.list.invalidate();
      setTimeout(() => setReferenceSaveState('idle'), 2500);
    } catch (e) {
      setReferenceSaveState('error');
      setUploadError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !userId) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of Array.from(files)) {
        const mime = guessMime(file);
        const lower = file.name.toLowerCase();
        const looksCv = lower.includes('cv') || lower.includes('resume') || lower.includes('curriculum');
        const looksReference =
          lower.includes('reference') || lower.includes('referee') || lower.includes('recommendation');

        if (mime === 'text/plain' || lower.endsWith('.txt')) {
          const text = await file.text();
          let docType: DocumentLabType = primaryDocType;
          if (primaryDocType === 'cv' && looksReference) docType = 'references';
          else if (primaryDocType === 'cv' && looksCv) docType = 'cv';
          await documentsUploadMutation.mutateAsync({
            documentType: docType,
            originalFilename: file.name,
            extractedText: text.slice(0, 50_000),
          });
          continue;
        }

        if (/\.(pdf|docx?)$/i.test(file.name)) {
          if (primaryDocType === 'cv') {
            const base64 = await fileToBase64(file);
            await cvUploadMutation.mutateAsync({
              userId,
              filename: file.name,
              base64,
              mimeType: mime,
            });
            await utils.profile.getProfile.invalidate();
            markJobsSearchPendingAfterCv();
          } else {
            await documentsUploadMutation.mutateAsync({
              documentType: primaryDocType,
              originalFilename: file.name,
              extractedText:
                looksReference || primaryDocType === 'references'
                  ? `[Binary file uploaded: ${file.name}. Full text was not extracted in Document Lab. Paste the reference text in the "Reference text" field below, or upload a .txt copy for search and AI scoring.]`
                  : `[Binary file uploaded: ${file.name}. Text was not extracted for this document type in Document Lab. Upload a .txt version if you need extracted text for tools.]`,
            });
          }
          continue;
        }

        await documentsUploadMutation.mutateAsync({
          documentType: looksReference ? 'references' : primaryDocType === 'cv' ? 'other' : primaryDocType,
          originalFilename: file.name,
          extractedText:
            '[File stored without text extraction — for scoring, upload PDF/DOCX or TXT. Images are kept for your records only.]',
        });
      }
      void utils.documents.list.invalidate();
      void utils.cv.getLatest.invalidate({ userId });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
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
          <strong className="font-medium text-slate-600 dark:text-slate-300">PDF, DOC, DOCX</strong> for a <strong className="font-medium text-slate-600 dark:text-slate-300">CV</strong> are parsed on the server and saved to your CV library.
          For other types (cover letter, <strong className="font-medium text-slate-600 dark:text-slate-300">references</strong>, certificates), choose the type below — binary files are kept with a short note unless you add text.
          Plain <strong className="font-medium text-slate-600 dark:text-slate-300">.txt</strong> uploads store full extracted text. Use{' '}
          <Link to="/profile" className="text-indigo-600 hover:underline dark:text-indigo-400">Profile → Import from CV</Link> to push parsed CV fields into your profile.
          The score panel uses <strong className="font-medium text-slate-600 dark:text-slate-300">Style → analyse document</strong> (OpenAI when configured).
        </p>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* ── Document type + references field ─────────────────────────── */}
      <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/80 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="doc-lab-type" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Primary type for this upload
          </label>
          <select
            id="doc-lab-type"
            value={primaryDocType}
            onChange={(e) => setPrimaryDocType(e.target.value as DocumentLabType)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          >
            {DOCUMENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PDF/DOCX is sent to the CV parser only when type is <strong className="text-slate-600 dark:text-slate-300">CV / résumé</strong>. For references as PDF, add the text in the field on the right (or upload a .txt file).
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="doc-lab-refs" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Reference text (optional)
          </label>
          <textarea
            id="doc-lab-refs"
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            rows={5}
            maxLength={50_000}
            placeholder="Paste employer or character reference wording, referee contact details you are happy to store here, or bullet points you want reuse in applications…"
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!referenceText.trim() || !userId || referenceSaveState === 'saving'}
              onClick={() => void handleSaveReferenceText()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {referenceSaveState === 'saving' ? 'Saving…' : 'Save as references'}
            </button>
            {referenceSaveState === 'saved' && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved to your documents</span>
            )}
            {referenceSaveState === 'error' && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Save failed</span>
            )}
          </div>
        </div>
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
            PDF, DOCX, TXT, JPG, PNG — match the selected type above (CV uses the parser; references and others are stored with notes when needed)
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
                  <p className="text-xs text-slate-400">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {doc.documentType.replace(/_/g, ' ')}
                    </span>
                    {' · '}
                    {new Date(doc.createdAt).toLocaleDateString('en-GB')}
                  </p>
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
        <CvScorePanel docs={docs} userId={userId} latestCv={latestCvForScore} />
      </div>

    </div>
  );
}
