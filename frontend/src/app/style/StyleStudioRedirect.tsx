import { Link } from 'react-router-dom';
import { Palette, Upload } from 'lucide-react';
import StyleStudio from './StyleStudio';

/**
 * Standalone Style Studio screen.
 *
 * CV and document upload belong to Document Intake only.
 * This screen works from existing Profile / Document Intake data and must not redirect
 * back into the old Document Lab tab model.
 */
export default function StyleStudioRedirect() {
  return (
    <div className="space-y-8 p-6">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Style Studio Screen</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
                <Palette className="h-5 w-5 text-violet-200" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Style Studio</h1>
            </div>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Analyse tone, rewrite sections, generate role-specific versions and export PDFs from existing Profile and Document Intake data. Uploads are intentionally not available here. One intake point. Fewer portals into confusion.
            </p>
          </div>
          <Link
            to="/documents/upload"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <Upload className="h-4 w-4" />
            Open Document Intake
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <StyleStudio variant="embedded" />
      </section>
    </div>
  );
}
