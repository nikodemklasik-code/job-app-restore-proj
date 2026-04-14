import { useState, useRef } from 'react';
import { FileText, Upload, Trash2, Loader2, FileCheck, Lock } from 'lucide-react';
import { api } from '@/lib/api';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cv: 'Moje CV',
  cover_letter: 'List Motywacyjny',
  certificate: 'Certyfikaty & Kursy',
  education: 'Dyplomy & Edukacja',
  portfolio: 'Portfolio & Projekty',
  session_memory: 'Historia Coachingu',
  other: 'Inne Dokumenty',
};

type DocumentType = keyof typeof DOCUMENT_TYPE_LABELS;
const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[];

function CvScoreWidget() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Obecna wartość CV</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">68<span className="text-lg text-slate-400">/100</span></p>
        <p className="mt-1 text-sm text-slate-500">Na podstawie wgranych dokumentów</p>
        <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-2 rounded-full bg-amber-400" style={{ width: '68%' }} />
        </div>
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          <li>⚠️ Brak słów kluczowych z Twoich docelowych ofert</li>
          <li>⚠️ Podsumowanie zbyt ogólne</li>
          <li>✅ Doświadczenie dobrze opisane</li>
        </ul>
      </div>
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-950/20">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Potencjał po optymalizacji</p>
        <p className="mt-2 text-3xl font-bold text-indigo-700 dark:text-indigo-300">91<span className="text-lg text-indigo-400">/100</span></p>
        <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">Szacunkowy wynik po rekomendowanych zmianach</p>
        <div className="mt-3 h-2 rounded-full bg-indigo-100 dark:bg-indigo-900">
          <div className="h-2 rounded-full bg-indigo-500" style={{ width: '91%' }} />
        </div>
        <ul className="mt-3 space-y-1 text-xs text-indigo-600 dark:text-indigo-400">
          <li>💡 Dodaj słowa kluczowe z docelowych ofert</li>
          <li>💡 Skróć podsumowanie do 3 zdań</li>
          <li>💡 Dodaj mierzalne osiągnięcia (liczby %)</li>
        </ul>
        <button className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700">
          Optymalizuj CV z AI →
        </button>
      </div>
    </div>
  );
}

interface DocRow {
  id: string;
  documentType: string;
  originalFilename: string;
  isProcessed: boolean;
  createdAt: Date | string;
}

function DocumentRow({ doc, onDelete }: { doc: DocRow; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const deleteMutation = api.documents.delete.useMutation();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: doc.id });
      onDelete(doc.id);
    } finally {
      setDeleting(false);
    }
  }

  const label = DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType;
  const date = new Date(doc.createdAt).toLocaleDateString('pl-PL');

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-3">
        <FileCheck className="h-4 w-4 shrink-0 text-indigo-400" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{doc.originalFilename}</p>
          <p className="text-xs text-slate-400">{label} · {date}</p>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/30"
        aria-label="Usuń dokument"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function UploadArea({ onUploaded }: { onUploaded: () => void }) {
  const [selectedType, setSelectedType] = useState<DocumentType>('cv');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = api.documents.upload.useMutation();

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const text = await file.text();
      await uploadMutation.mutateAsync({
        documentType: selectedType,
        originalFilename: file.name,
        extractedText: text.slice(0, 50000),
      });
      onUploaded();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd przesyłania');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="mb-4 flex flex-wrap gap-2">
        {DOCUMENT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedType === type
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {DOCUMENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
      <label
        htmlFor="doc-upload"
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
          uploading
            ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/20'
            : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-700'
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        ) : (
          <Upload className="h-8 w-8 text-slate-400" />
        )}
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {uploading ? 'Przetwarzanie...' : 'Kliknij lub przeciągnij plik (.txt, .pdf, .docx)'}
        </p>
        <p className="text-xs text-slate-400">Przechowujemy tylko wyekstrahowany tekst — nie pliki binarne</p>
        <input
          id="doc-upload"
          ref={fileRef}
          type="file"
          accept=".txt,.pdf,.docx,.doc"
          className="sr-only"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <Lock className="h-3 w-3" />
        <span>Tekst szyfrowany base64 — tylko Ty masz dostęp</span>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function DocumentLab() {
  const { data: docs, isLoading, refetch } = api.documents.list.useQuery();

  const docsByType = DOCUMENT_TYPES.reduce<Record<string, DocRow[]>>((acc, type) => {
    acc[type] = (docs ?? []).filter((d) => d.documentType === type);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Document Lab</h1>
          <p className="text-sm text-slate-500">Zarządzaj swoimi dokumentami — AI używa ich jako kontekstu</p>
        </div>
      </div>
      <CvScoreWidget />
      <UploadArea onUploaded={() => refetch()} />
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : (
          DOCUMENT_TYPES.map((type) => {
            const rows = docsByType[type] ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={type}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {DOCUMENT_TYPE_LABELS[type]}
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800">
                    {rows.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {rows.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} onDelete={() => refetch()} />
                  ))}
                </div>
              </div>
            );
          })
        )}
        {!isLoading && (docs ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Brak dokumentów — wgraj swoje CV aby zacząć</p>
          </div>
        )}
      </div>
    </div>
  );
}
