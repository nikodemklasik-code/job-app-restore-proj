import { useRef, useState } from 'react';
import { Upload, FileText, Trash2, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

const ACCEPT = '.pdf,.docx,.doc,.txt,.jpg,.jpeg,.png';

interface UploadedDoc {
  id: string;
  originalFilename: string;
  documentType: string;
  createdAt: string;
}

export default function DocumentLab() {
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Lab</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload any document — AI extracts the content and uses it across your profile, interview prep, and coaching sessions.
        </p>
      </div>

      {/* Single upload zone */}
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

      {/* CV Score widget */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Current CV score</p>
          <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-400">68<span className="text-lg font-normal">/100</span></p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Upload your CV to get a real score</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Potential after optimisation</p>
          <p className="mt-2 text-4xl font-bold text-indigo-600 dark:text-indigo-400">91<span className="text-lg font-normal">/100</span></p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">AI rewrites, keywords, ATS fixes</p>
        </div>
      </div>

      {/* Uploaded documents */}
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

      {/* Session memory note */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Uploaded documents are available across <strong className="text-slate-700 dark:text-slate-200">Interview</strong>, <strong className="text-slate-700 dark:text-slate-200">Coach</strong>, and <strong className="text-slate-700 dark:text-slate-200">Negotiation</strong> — AI reads them automatically each session. Content is encrypted at rest.
        </p>
      </div>
    </div>
  );
}
