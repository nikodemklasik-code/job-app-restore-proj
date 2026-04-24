import { Link } from 'react-router-dom';
import { FileText, FolderOpen, Loader2, Palette, Upload, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

type UploadedDoc = {
  id: string;
  originalFilename: string;
  documentType: string;
  createdAt: string;
};

// Runtime may expose the documents router before generated AppRouter types catch up.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiExt = api as any;

function formatDocumentType(type: string) {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown Date' : date.toLocaleDateString('en-GB');
}

export default function ProfileDocumentsScreen() {
  const listQuery = apiExt.documents.list.useQuery(undefined, { staleTime: 30_000 });
  const docs: UploadedDoc[] = (listQuery.data as UploadedDoc[] | undefined) ?? [];
  const latestDocs = docs.slice(0, 6);
  const cvCount = docs.filter((doc) => doc.documentType === 'cv').length;
  const otherCount = Math.max(0, docs.length - cvCount);

  return (
    <div className="space-y-8 p-6">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Profile Documents Screen</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Profile Documents</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Manage the document layer that supports your Profile, Style Studio, Jobs and Applications. Uploads live in Document Intake. Styling and generation live in Style Studio. This hub does not pretend to be both, because apparently restraint is now a product feature.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-[24rem]">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">All</p>
              <p className="mt-1 text-2xl font-bold text-white">{docs.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">CVs</p>
              <p className="mt-1 text-2xl font-bold text-white">{cvCount}</p>
            </div>
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Other</p>
              <p className="mt-1 text-2xl font-bold text-white">{otherCount}</p>
            </div>
          </div>
        </div>
      </header>

      {listQuery.isError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" />
          Could not load documents. Try again after refreshing the page.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Link
          to="/documents/upload"
          className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-indigo-400/40 hover:bg-white/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15">
              <Upload className="h-6 w-6 text-indigo-200" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-indigo-200" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">Document Intake</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Upload CVs and supporting documents. CV parsing, import to Profile and document scoring start here.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">CV Upload</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Profile Import</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Document Library</span>
          </div>
        </Link>

        <Link
          to="/documents/style-studio"
          className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-violet-400/40 hover:bg-white/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15">
              <Palette className="h-6 w-6 text-violet-200" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-violet-200" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">Style Studio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Analyse tone, rewrite documents and generate role-specific versions from your existing document/profile data.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Rewrite</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Generate</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">No CV Intake</span>
          </div>
        </Link>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-300" />
              <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">Latest uploaded documents from Document Intake.</p>
          </div>
          <Link to="/documents/upload" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            <Upload className="h-4 w-4" />
            Open Document Intake
          </Link>
        </div>

        {listQuery.isLoading ? (
          <div className="flex h-28 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-300" />
          </div>
        ) : latestDocs.length > 0 ? (
          <div className="space-y-3">
            {latestDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <FileText className="h-5 w-5 text-indigo-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{doc.originalFilename}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDocumentType(doc.documentType)} · {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-label="Processed" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-white">No Documents Yet</h3>
            <p className="mt-1 text-sm text-slate-500">Start with Document Intake so the rest of the app has something better than wishful thinking to work with.</p>
          </div>
        )}
      </section>
    </div>
  );
}
