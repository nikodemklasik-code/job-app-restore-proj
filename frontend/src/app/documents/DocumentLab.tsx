import { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  FlaskConical,
  ChevronRight,
  AlertCircle,
  Users,
  Import,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { markJobsSearchPendingAfterCv } from '@/lib/jobsAfterCvSync';

// Runtime may expose `documents` router before it is merged into shared `AppRouter` types.
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

interface ImportPreviewField {
  key: string;
  label: string;
  currentValue: string;
  parsedValue: string;
  parsedHasValue: boolean;
  currentHasValue: boolean;
  isDifferent: boolean;
  willOverwrite: boolean;
  willFillEmpty: boolean;
}

interface ImportPreviewSection {
  currentCount: number;
  parsedCount: number;
  willReplace: boolean;
}

interface ImportPreview {
  cvUploadId: string;
  originalFilename: string;
  createdAt: string;
  criticalFields: ImportPreviewField[];
  sections: {
    skills: ImportPreviewSection;
    experiences: ImportPreviewSection;
    educations: ImportPreviewSection;
    trainings: ImportPreviewSection;
  };
  warnings: string[];
}

type DocumentIntakeType =
  | 'cv'
  | 'cover_letter'
  | 'references'
  | 'certificate'
  | 'education'
  | 'portfolio'
  | 'other';

const DOCUMENT_TYPE_OPTIONS: { value: DocumentIntakeType; label: string }[] = [
  { value: 'cv', label: 'CV / Résumé' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'references', label: 'References' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'education', label: 'Education / Diploma' },
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

function formatDocType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPreviewValue(value: string): string {
  return value.trim() ? value : '—';
}

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

  const cvDocs = docs.filter((doc) => {
    const filename = doc.originalFilename.toLowerCase();
    return doc.documentType === 'cv' || filename.includes('cv') || filename.includes('resume');
  });
  const allDocs = cvDocs.length > 0 ? cvDocs : docs;

  const getTextQuery = api.documents.getText.useQuery({ id: selectedId }, { enabled: false });
  const analyzeMutation = api.style.analyzeDocument.useMutation({
    onSuccess: (data) => setResult(data as ScoreResult),
  });

  async function handleScore() {
    if (!selectedId || !userId) return;

    if (selectedId === LATEST_CV_OPTION && latestCv?.parsedText) {
      analyzeMutation.mutate({ text: latestCv.parsedText.slice(0, 50_000), documentType: 'cv' });
      return;
    }

    const res = await getTextQuery.refetch();
    const text = res.data?.text ?? '';
    if (!text) return;
    const selectedDoc = allDocs.find((doc) => doc.id === selectedId);
    analyzeMutation.mutate({ text, documentType: styleAnalyzeTypeForDoc(selectedDoc) });
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-10 text-center">
        <FlaskConical className="h-10 w-10 text-slate-700" />
        <p className="text-sm font-medium text-slate-500">Upload a document to get your CV score.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select Document To Score</label>
          <select
            value={selectedId}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setResult(null);
            }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
          >
            <option value="" disabled className="bg-slate-900">Pick A Document</option>
            {latestCv?.parsedText ? (
              <option value={LATEST_CV_OPTION} className="bg-slate-900">
                Latest Parsed CV: {latestCv.originalFilename}
              </option>
            ) : null}
            {allDocs.map((doc) => (
              <option key={doc.id} value={doc.id} className="bg-slate-900">
                [{formatDocType(doc.documentType)}] {doc.originalFilename}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void handleScore()}
          disabled={!selectedId || analyzeMutation.isPending || (selectedId !== LATEST_CV_OPTION && getTextQuery.isFetching)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzeMutation.isPending || getTextQuery.isFetching ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Scoring…</>
          ) : (
            <><FlaskConical className="h-4 w-4" /> Score Document</>
          )}
        </button>
      </div>

      {analyzeMutation.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Scoring failed. Try again.
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
              <span className="text-2xl font-black text-indigo-300">{result.score}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">CV Score</p>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${result.score}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {result.score >= 80 ? 'Strong CV readiness.' : result.score >= 60 ? 'Good base with room to strengthen.' : 'Needs more evidence and clearer structure.'}
              </p>
            </div>
          </div>

          {Object.keys(result.tone).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tone Analysis</p>
              <div className="space-y-1.5">
                {Object.entries(result.tone).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-24 text-xs capitalize text-slate-400">{key}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${value}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-slate-500">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Recommendations</p>
              <ul className="space-y-1.5">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    {suggestion}
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

export default function DocumentLab() {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [primaryDocType, setPrimaryDocType] = useState<DocumentIntakeType>('cv');
  const [referenceText, setReferenceText] = useState('');
  const [referenceSaveState, setReferenceSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const listQuery = apiExt.documents.list.useQuery(undefined, { staleTime: 30_000 });
  const docs: UploadedDoc[] = (listQuery.data as UploadedDoc[] | undefined) ?? [];
  const latestCvQuery = api.cv.getLatest.useQuery({ userId }, { enabled: !!userId });
  const latestCvForScore = latestCvQuery.data?.parsedText && String(latestCvQuery.data.parsedText).trim().length > 0
    ? {
      parsedText: String(latestCvQuery.data.parsedText),
      originalFilename: String(latestCvQuery.data.originalFilename ?? 'CV'),
    }
    : null;
  const importPreviewQuery = apiExt.cv.previewImportToProfile.useQuery(
    latestCvQuery.data?.id ? { userId, cvUploadId: latestCvQuery.data.id } : undefined,
    {
      enabled: !!userId && !!latestCvQuery.data?.id,
      staleTime: 15_000,
    },
  );
  const importPreview = (importPreviewQuery.data as ImportPreview | undefined) ?? null;

  const utils = api.useUtils();

  const deleteMutation = apiExt.documents.delete.useMutation({
    onSuccess: () => {
      void (utils as { documents?: { list: { invalidate: () => Promise<void> } } }).documents?.list.invalidate();
    },
  });

  const cvUploadMutation = api.cv.upload.useMutation();
  const documentsUploadMutation = api.documents.upload.useMutation();
  const importToProfileMutation = api.cv.importToProfile.useMutation({
    onSuccess: () => {
      setImportNotice('Profile updated from reviewed CV import.');
      void utils.profile.getProfile.invalidate();
      void utils.cv.getLatest.invalidate({ userId });
      void importPreviewQuery.refetch();
    },
    onError: (err) => {
      setImportNotice(null);
      setUploadError(err.message || 'Import to Profile failed.');
    },
  });

  async function handleSaveReferenceText() {
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
    } catch (error) {
      setReferenceSaveState('error');
      setUploadError(error instanceof Error ? error.message : 'Save failed.');
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !userId) return;
    setUploading(true);
    setUploadError(null);
    setImportNotice(null);
    try {
      for (const file of Array.from(files)) {
        const mime = guessMime(file);
        const lower = file.name.toLowerCase();
        const looksCv = lower.includes('cv') || lower.includes('resume') || lower.includes('curriculum');
        const looksReference = lower.includes('reference') || lower.includes('referee') || lower.includes('recommendation');

        if (mime === 'text/plain' || lower.endsWith('.txt')) {
          const text = await file.text();
          let docType: DocumentIntakeType = primaryDocType;
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
            await cvUploadMutation.mutateAsync({ userId, filename: file.name, base64, mimeType: mime });
            setImportNotice('CV uploaded and parsed. Review the import preview below before applying changes to Profile.');
            await utils.profile.getProfile.invalidate();
            markJobsSearchPendingAfterCv();
          } else {
            await documentsUploadMutation.mutateAsync({
              documentType: primaryDocType,
              originalFilename: file.name,
              extractedText:
                looksReference || primaryDocType === 'references'
                  ? `[Binary file uploaded: ${file.name}. Full text was not extracted in Document Intake. Paste reference text below, or upload a .txt copy for search and scoring.]`
                  : `[Binary file uploaded: ${file.name}. Text was not extracted for this document type in Document Intake. Upload a .txt version if extracted text is needed.]`,
            });
          }
          continue;
        }

        await documentsUploadMutation.mutateAsync({
          documentType: looksReference ? 'references' : primaryDocType === 'cv' ? 'other' : primaryDocType,
          originalFilename: file.name,
          extractedText: '[File stored without text extraction. Upload PDF, DOCX or TXT when extracted text is required.]',
        });
      }
      void utils.documents.list.invalidate();
      void utils.cv.getLatest.invalidate({ userId });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8 p-6">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Document Intake Screen</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Document Intake</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Upload CVs and supporting documents here. CV parsing and Profile import live only on this screen. Import is now explicit and review-gated, because silently overwriting user data is a terrible hobby even by startup standards.
            </p>
          </div>
          <Link to="/documents" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
            Back To Profile Documents
          </Link>
        </div>
      </header>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}
      {importNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {importNotice}
        </div>
      )}

      <section className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-5 lg:grid-cols-2">
        <div className="space-y-2">
          <p id="doc-intake-type" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Type For This Upload</p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="doc-intake-type">
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPrimaryDocType(option.value)}
                className={primaryDocType === option.value
                  ? 'rounded-full border border-indigo-400 bg-indigo-500/20 px-3 py-1.5 text-left text-sm font-semibold text-indigo-100'
                  : 'rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-left text-sm font-medium text-slate-300 hover:border-indigo-300'}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            PDF/DOCX is sent to the CV parser only when type is <strong className="text-slate-300">CV / Résumé</strong>. Other document types are stored with extracted text when available.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="doc-intake-refs" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Reference Text Optional
          </label>
          <textarea
            id="doc-intake-refs"
            value={referenceText}
            onChange={(event) => setReferenceText(event.target.value)}
            rows={5}
            maxLength={50_000}
            placeholder="Paste employer or character reference text you want to store for later reuse."
            className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!referenceText.trim() || !userId || referenceSaveState === 'saving'}
              onClick={() => void handleSaveReferenceText()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {referenceSaveState === 'saving' ? 'Saving…' : 'Save As References'}
            </button>
            {referenceSaveState === 'saved' && <span className="text-xs font-medium text-emerald-400">Saved to your documents.</span>}
            {referenceSaveState === 'error' && <span className="text-xs font-medium text-red-400">Save failed.</span>}
          </div>
        </div>
      </section>

      <section
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void handleFiles(event.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={dragging
          ? 'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-500/10 p-14 text-center transition-colors'
          : 'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-14 text-center transition-colors hover:border-indigo-400/50 hover:bg-white/10'}
      >
        <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(event) => void handleFiles(event.target.files)} />
        {uploading ? <Loader2 className="h-8 w-8 animate-spin text-indigo-400" /> : <Upload className="h-8 w-8 text-slate-400" />}
        <div>
          <p className="font-medium text-slate-200">{uploading ? 'Processing…' : 'Drop Files Here Or Click To Browse'}</p>
          <p className="mt-1 text-sm text-slate-500">PDF, DOCX, DOC, TXT, JPG, PNG. CV files use the parser only when the selected type is CV / Résumé.</p>
        </div>
      </section>

      {latestCvQuery.data && (
        <section className="space-y-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Latest Parsed CV</p>
              <p className="text-xs text-slate-400">{latestCvQuery.data.originalFilename} is ready. Review what will change before importing it into Profile.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setImportNotice(null);
                importToProfileMutation.mutate({ userId, cvUploadId: latestCvQuery.data!.id });
              }}
              disabled={!userId || importToProfileMutation.isPending || importPreviewQuery.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importToProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
              {importToProfileMutation.isPending ? 'Importing…' : 'Apply CV To Profile'}
            </button>
          </div>

          {importPreviewQuery.isLoading ? (
            <div className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
            </div>
          ) : importPreview ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Skills', value: importPreview.sections.skills },
                  { label: 'Experience', value: importPreview.sections.experiences },
                  { label: 'Education', value: importPreview.sections.educations },
                  { label: 'Trainings', value: importPreview.sections.trainings },
                ].map((section) => (
                  <div key={section.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{section.label}</p>
                    <p className="mt-1 text-sm text-white">Current: {section.value.currentCount}</p>
                    <p className="text-sm text-indigo-200">Parsed: {section.value.parsedCount}</p>
                    <p className={`mt-2 text-xs font-medium ${section.value.willReplace ? 'text-amber-300' : 'text-slate-500'}`}>
                      {section.value.willReplace ? 'Will replace current section' : 'No structured update detected'}
                    </p>
                  </div>
                ))}
              </div>

              {importPreview.warnings.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Import Warnings</p>
                  <ul className="space-y-1.5">
                    {importPreview.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-100">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Critical Field Review</p>
                <div className="space-y-3">
                  {importPreview.criticalFields.map((field) => (
                    <div key={field.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{field.label}</p>
                        <span className={field.willOverwrite
                          ? 'rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200'
                          : field.willFillEmpty
                            ? 'rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200'
                            : 'rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-slate-400'}
                        >
                          {field.willOverwrite ? 'Overwrite' : field.willFillEmpty ? 'Fill Empty' : field.isDifferent ? 'Parsed Diff' : 'No Change'}
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Current profile</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">{formatPreviewValue(field.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Parsed from CV</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-indigo-100">{formatPreviewValue(field.parsedValue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-slate-500">
              Import preview is not available for this CV yet.
            </div>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-300" />
          <h2 className="text-lg font-semibold text-white">Uploaded Documents</h2>
        </div>
        {listQuery.isLoading ? (
          <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-300" /></div>
        ) : docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-indigo-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">{doc.originalFilename}</p>
                    <p className="text-xs text-slate-500">{formatDocType(doc.documentType)} · {new Date(doc.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Processed" />
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate({ id: doc.id })}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-white">No Documents Yet</h3>
            <p className="mt-1 text-sm text-slate-500">Upload a CV or supporting document to start the document pipeline.</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-indigo-300" />
          <h2 className="text-lg font-semibold text-white">CV Score</h2>
        </div>
        <CvScorePanel docs={docs} userId={userId} latestCv={latestCvForScore} />
      </section>
    </div>
  );
}
