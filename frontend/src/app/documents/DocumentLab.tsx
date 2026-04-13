import { Upload, FileText, Briefcase, GraduationCap, Award, FolderOpen } from 'lucide-react';

const DOCUMENT_SLOTS = [
  { id: 'cv', label: 'CV / Resume', icon: FileText, description: 'Twoje aktualne CV w formacie PDF, DOCX lub TXT', accept: '.pdf,.docx,.doc,.txt' },
  { id: 'cover-letter', label: 'List motywacyjny', icon: FileText, description: 'Cover letter do konkretnej aplikacji', accept: '.pdf,.docx,.doc,.txt' },
  { id: 'certificates', label: 'Certyfikaty', icon: Award, description: 'Certyfikaty zawodowe, ukończone kursy', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'education', label: 'Dokumenty edukacyjne', icon: GraduationCap, description: 'Dyplomy, suplementy, zaświadczenia', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, description: 'Próbki pracy, projekty, linki', accept: '.pdf,.zip,.jpg,.png' },
  { id: 'other', label: 'Inne dokumenty', icon: FolderOpen, description: 'Pozostałe dokumenty', accept: '*' },
];

// TODO: Implement full Document Lab
// - Upload documents → extract text via AI
// - Assign to profile fields (skills, experience, education)
// - CV import → auto-fill Dashboard/Profile section
// - Support for: CV, cover letters, certificates, diplomas, portfolio
// - Encrypted PDF memory for Coach/Interview/Negotiation sessions

export default function DocumentLab() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Lab</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Wgraj swoje dokumenty — AI wyekstrahuje z nich dane i uzupełni Twój profil.
        </p>
      </div>

      {/* Upload area */}
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <Upload className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Przeciągnij dokumenty tutaj lub{' '}
          <span className="cursor-pointer text-indigo-600 underline underline-offset-2 dark:text-indigo-400">
            wybierz pliki
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-400">PDF, DOCX, DOC, TXT, JPG, PNG — max 25 MB</p>
      </div>

      {/* Slots grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENT_SLOTS.map((slot) => (
          <div
            key={slot.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                <slot.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{slot.label}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{slot.description}</p>
            <button
              className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
            >
              <Upload className="h-3.5 w-3.5" />
              Wgraj plik
            </button>
          </div>
        ))}
      </div>

      {/* Encrypted memory note */}
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/20">
        <div className="mt-0.5 h-4 w-4 shrink-0 text-amber-600">🔐</div>
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-400">Pamięć sesji (Trener / Rozmowa / Negocjacje)</p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">
            Wgraj zaszyfrowany PDF z historią sesji — AI odczyta Twoje poprzednie wyniki
            i będzie kontynuować coaching. To opcja, nie wymóg.
          </p>
          <button className="mt-2 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300">
            Wgraj historię sesji
          </button>
        </div>
      </div>
    </div>
  );
}
