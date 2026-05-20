import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Import,
  Loader2,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { markJobsSearchPendingAfterCv } from '@/lib/jobsAfterCvSync';

// Some routers exist at runtime before the generated AppRouter type catches up.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiExt = api as any;

const ACCEPT = '.pdf,.docx,.doc,.txt,.jpg,.jpeg,.png';
const PERSONAL_FIELD_KEYS = ['fullName', 'email', 'phone', 'headline', 'location', 'linkedinUrl', 'summary'] as const;
type PersonalFieldKey = typeof PERSONAL_FIELD_KEYS[number];
type SectionKey = 'skills' | 'experiences' | 'educations' | 'trainings';
const SECTION_KEYS: SectionKey[] = ['skills', 'experiences', 'educations', 'trainings'];

type DocumentIntakeType = 'cv' | 'cover_letter' | 'references' | 'certificate' | 'education' | 'portfolio' | 'other';

interface UploadedDoc {
  id: string;
  originalFilename: string;
  documentType: string;
  createdAt: string;
}

interface ImportPreviewField {
  key: PersonalFieldKey;
  label: string;
  currentValue: string;
  parsedValue: string;
  parsedHasValue: boolean;
  currentHasValue: boolean;
  isDifferent: boolean;
  willOverwrite: boolean;
  willFillEmpty: boolean;
  action?: 'overwrite' | 'fill_empty' | 'parsed_diff' | 'no_change';
}

interface DiffItem {
  id?: string;
  label?: string;
  [key: string]: unknown;
}

interface ImportPreviewSection {
  currentCount: number;
  parsedCount: number;
  willReplace: boolean;
  currentItems?: Array<string | DiffItem>;
  parsedItems?: Array<string | DiffItem>;
}

interface ImportPreview {
  cvUploadId: string;
  originalFilename: string;
  createdAt: string;
  criticalFields: ImportPreviewField[];
  sections: Record<SectionKey, ImportPreviewSection>;
  warnings: string[];
}

interface ReviewState {
  personal: Record<PersonalFieldKey, boolean>;
  sections: Record<SectionKey, boolean>;
}

const DOCUMENT_TYPE_OPTIONS: { value: DocumentIntakeType; label: string }[] = [
  { value: 'cv', label: 'CV / Résumé' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'references', label: 'References' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'education', label: 'Education / Diploma' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'other', label: 'Other' },
];

const SECTION_LABELS: Record<SectionKey, string> = {
  skills: 'Skills',
  experiences: 'Experience',
  educations: 'Education',
  trainings: 'Training / Courses',
};

function guessMime(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.doc')) return 'application/msword';
  if (name.endsWith('.txt')) return 'text/plain';
  return file.type || 'application/octet-stream';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? '').split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function formatDocType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPreviewValue(value: string): string {
  return value.trim() ? value : '—';
}

function itemLabel(item: string | DiffItem): string {
  if (typeof item === 'string') return item;
  if (typeof item.label === 'string' && item.label.trim()) return item.label;
  return Object.entries(item)
    .filter(([key, value]) => key !== 'id' && key !== 'label' && typeof value === 'string' && value.trim())
    .map(([, value]) => value as string)
    .slice(0, 3)
    .join(' · ') || 'Untitled item';
}

function sectionSummary(section: ImportPreviewSection): string {
  if (!section.willReplace) return 'No parser update detected';
  if (section.currentCount > 0) return 'Will replace this approved profile section if accepted';
  return 'Will add this profile section if accepted';
}

function makeInitialReview(preview: ImportPreview | null): ReviewState {
  const personal = Object.fromEntries(
    PERSONAL_FIELD_KEYS.map((key) => {
      const field = preview?.criticalFields.find((item) => item.key === key);
      return [key, Boolean(field?.parsedHasValue && field?.isDifferent)];
    }),
  ) as Record<PersonalFieldKey, boolean>;
  const sections = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, Boolean(preview?.sections[key]?.willReplace)]),
  ) as Record<SectionKey, boolean>;
  return { personal, sections };
}

function DiffColumn({ title, items, empty }: { title: string; items: Array<string | DiffItem>; empty: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.slice(0, 12).map((item, index) => (
            <li key={index} className="rounded-lg bg-white/[0.03] px-2 py-1.5 text-sm text-slate-200">
              {itemLabel(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}

function ReviewToggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={checked
        ? 'inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50'
        : 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50'}
      aria-pressed={checked}
    >
      {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {checked ? 'Approve' : 'Reject'}
    </button>
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
  const [review, setReview] = useState<ReviewState>(() => makeInitialReview(null));

  const utils = api.useUtils();
  const listQuery = apiExt.documents.list.useQuery(undefined, { staleTime: 30_000 });
  const docs: UploadedDoc[] = (listQuery.data as UploadedDoc[] | undefined) ?? [];
  const latestCvQuery = api.cv.getLatest.useQuery({ userId }, { enabled: Boolean(userId) });
  const importPreviewQuery = apiExt.cv.previewImportToProfile.useQuery(
    latestCvQuery.data?.id ? { userId, cvUploadId: latestCvQuery.data.id } : undefined,
    { enabled: Boolean(userId && latestCvQuery.data?.id), staleTime: 15_000 },
  );
  const importPreview = (importPreviewQuery.data as ImportPreview | undefined) ?? null;

  useEffect(() => {
    setReview(makeInitialReview(importPreview));
  }, [importPreview?.cvUploadId]);

  const selectedPersonalFields = useMemo(
    () => PERSONAL_FIELD_KEYS.filter((key) => review.personal[key]),
    [review.personal],
  );
  const selectedSections = useMemo(
    () => SECTION_KEYS.filter((key) => review.sections[key]),
    [review.sections],
  );
  const hasAnyApprovedChange = selectedPersonalFields.length > 0 || selectedSections.length > 0;

  const cvUploadMutation = api.cv.upload.useMutation();
  const documentsUploadMutation = apiExt.documents.upload.useMutation();
  const deleteMutation = apiExt.documents.delete.useMutation({
    onSuccess: () => void apiExt.documents.list.invalidate?.(),
  });
  const importToProfileMutation = apiExt.cv.importToProfile.useMutation({
    onSuccess: () => {
      setImportNotice('Approved changes were saved to Profile. Rejected parser output was ignored. A tiny victory for consent.');
      void utils.profile.getProfile.invalidate();
      void utils.cv.getLatest.invalidate({ userId });
      void importPreviewQuery.refetch();
    },
    onError: (err: Error) => {
      setImportNotice(null);
      setUploadError(err.message || 'Import to Profile failed.');
    },
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !userId) return;
    setUploading(true);
    setUploadError(null);
    setImportNotice(null);
    try {
      for (const file of Array.from(files)) {
        const mime = guessMime(file);
        const lower = file.name.toLowerCase();
        const looksReference = lower.includes('reference') || lower.includes('referee') || lower.includes('recommendation');

        if (mime === 'text/plain' || lower.endsWith('.txt')) {
          const text = await file.text();
          await documentsUploadMutation.mutateAsync({
            documentType: primaryDocType === 'cv' && looksReference ? 'references' : primaryDocType,
            originalFilename: file.name,
            extractedText: text.slice(0, 50_000),
          });
          continue;
        }

        if (/\.(pdf|docx?)$/i.test(file.name) && primaryDocType === 'cv') {
          const base64 = await fileToBase64(file);
          await cvUploadMutation.mutateAsync({ userId, filename: file.name, base64, mimeType: mime });
          setImportNotice('CV uploaded and parsed. Review every change below before approving profile updates.');
          markJobsSearchPendingAfterCv();
          continue;
        }

        await documentsUploadMutation.mutateAsync({
          documentType: primaryDocType,
          originalFilename: file.name,
          extractedText: `[File stored without profile import. Upload CV as PDF/DOC/DOCX with type CV / Résumé to parse it into the review flow.]`,
        });
      }
      void apiExt.documents.list.invalidate?.();
      void utils.cv.getLatest.invalidate({ userId });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function approveAll() {
    setReview({
      personal: Object.fromEntries(PERSONAL_FIELD_KEYS.map((key) => [key, true])) as Record<PersonalFieldKey, boolean>,
      sections: Object.fromEntries(SECTION_KEYS.map((key) => [key, Boolean(importPreview?.sections[key]?.willReplace)])) as Record<SectionKey, boolean>,
    });
  }

  function rejectAll() {
    setReview(makeInitialReview(null));
  }

  function applyReviewedImport() {
    if (!userId || !latestCvQuery.data?.id) return;
    if (!hasAnyApprovedChange) {
      setUploadError('Approve at least one parsed change before importing. Yes, the button needs a reason to exist.');
      return;
    }
    setUploadError(null);
    setImportNotice(null);
    importToProfileMutation.mutate({
      userId,
      cvUploadId: latestCvQuery.data.id,
      decisions: {
        reviewed: true,
        acceptedPersonalFields: selectedPersonalFields,
        acceptedSections: {
          skills: review.sections.skills,
          experiences: review.sections.experiences,
          educations: review.sections.educations,
          trainings: review.sections.trainings,
        },
      },
    });
  }

  return (
    <div className="space-y-8 p-6">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Document Intake / Document Hub</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Document Intake</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Upload documents here. CV data can update Profile only after this explicit review. Parser output is a suggestion, not a monarch.
            </p>
          </div>
          <Link to="/profile" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
            Open Approved Profile
          </Link>
        </div>
      </header>

      {uploadError ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      ) : null}
      {importNotice ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {importNotice}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p id="doc-intake-type" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Type For This Upload</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="doc-intake-type">
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
        <p className="mt-3 text-xs text-slate-500">
          PDF/DOC/DOCX is parsed into the review flow only when the selected type is CV / Résumé. Other files are stored as supporting documents.
        </p>
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
          <p className="font-medium text-slate-200">{uploading ? 'Processing…' : 'Drop files here or click to browse'}</p>
          <p className="mt-1 text-sm text-slate-500">PDF, DOCX, DOC, TXT, JPG, PNG.</p>
        </div>
      </section>

      {latestCvQuery.isLoading ? (
        <section className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
        </section>
      ) : latestCvQuery.data ? (
        <section className="space-y-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Latest parsed CV</p>
              <p className="text-xs text-slate-400">{latestCvQuery.data.originalFilename} · Review diff before Profile receives anything.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={approveAll} disabled={!importPreview} className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">Approve all detected</button>
              <button type="button" onClick={rejectAll} disabled={!importPreview} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Reject all</button>
              <button
                type="button"
                onClick={applyReviewedImport}
                disabled={!userId || !importPreview || importToProfileMutation.isPending || importPreviewQuery.isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importToProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
                Save approved changes
              </button>
            </div>
          </div>

          {importPreviewQuery.isLoading ? (
            <div className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
            </div>
          ) : importPreview ? (
            <div className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              {importPreview.warnings.length > 0 ? (
                <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Import warnings</p>
                  <ul className="space-y-1.5">
                    {importPreview.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-100">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Personal information diff</p>
                <div className="space-y-3">
                  {importPreview.criticalFields.map((field) => (
                    <div key={field.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{field.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {field.willOverwrite ? 'Parser value differs from approved profile.' : field.willFillEmpty ? 'Parser can fill an empty profile value.' : field.isDifferent ? 'Parser found a different value.' : 'No profile change detected.'}
                          </p>
                        </div>
                        <ReviewToggle
                          checked={review.personal[field.key]}
                          disabled={!field.parsedHasValue || !field.isDifferent}
                          onChange={(next) => setReview((prev) => ({ ...prev, personal: { ...prev.personal, [field.key]: next } }))}
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Approved profile</p>
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

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Structured section diff</p>
                <div className="space-y-4">
                  {SECTION_KEYS.map((sectionKey) => {
                    const section = importPreview.sections[sectionKey];
                    return (
                      <div key={sectionKey} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{SECTION_LABELS[sectionKey]}</p>
                            <p className="mt-0.5 text-xs text-slate-500">Current: {section.currentCount} · Parsed: {section.parsedCount} · {sectionSummary(section)}</p>
                          </div>
                          <ReviewToggle
                            checked={review.sections[sectionKey]}
                            disabled={!section.willReplace}
                            onChange={(next) => setReview((prev) => ({ ...prev, sections: { ...prev.sections, [sectionKey]: next } }))}
                          />
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <DiffColumn title="Approved profile" items={section.currentItems ?? []} empty="No approved items yet." />
                          <DiffColumn title="Parsed from CV" items={section.parsedItems ?? []} empty="Parser found nothing useful here." />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-slate-500">
              Import preview is not available for this CV yet.
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-600" />
          <h2 className="mt-3 text-sm font-semibold text-white">No parsed CV yet</h2>
          <p className="mt-1 text-sm text-slate-500">Upload a CV with type CV / Résumé to start the review flow.</p>
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-300" />
          <h2 className="text-lg font-semibold text-white">Uploaded documents</h2>
        </div>
        {listQuery.isLoading ? (
          <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-300" /></div>
        ) : docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-indigo-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{doc.originalFilename}</p>
                    <p className="text-xs text-slate-500">{formatDocType(doc.documentType)} · {new Date(doc.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate({ id: doc.id })}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-white">No documents yet</h3>
            <p className="mt-1 text-sm text-slate-500">Upload files above to build your document library.</p>
          </div>
        )}
      </section>
    </div>
  );
}
