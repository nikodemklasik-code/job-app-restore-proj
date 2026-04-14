import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardFormState {
  // Kto jesteś
  fullName: string;
  currentJobTitle: string;
  currentSalary: string;
  workValues: string;
  // Zgody
  linkedinConsent: boolean;
  facebookConsent: boolean;
  instagramConsent: boolean;
  // Dokąd zmierzasz
  targetJobTitle: string;
  targetSalary: string;
  autoApplyThreshold: number;
}

const STORAGE_KEY = 'mvh-profile';

const CARD_CLASS =
  'rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const LABEL_CLASS = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

const INPUT_CLASS =
  'mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40';

function loadFromStorage(): Partial<DashboardFormState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Partial<DashboardFormState>;
  } catch {
    // ignore
  }
  return {};
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [savedBadge, setSavedBadge] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stored = loadFromStorage();

  const [form, setForm] = useState<DashboardFormState>({
    fullName: stored.fullName ?? user?.fullName ?? '',
    currentJobTitle: stored.currentJobTitle ?? '',
    currentSalary: stored.currentSalary ?? '',
    workValues: stored.workValues ?? '',
    linkedinConsent: stored.linkedinConsent ?? false,
    facebookConsent: stored.facebookConsent ?? false,
    instagramConsent: stored.instagramConsent ?? false,
    targetJobTitle: stored.targetJobTitle ?? '',
    targetSalary: stored.targetSalary ?? '',
    autoApplyThreshold: stored.autoApplyThreshold ?? 75,
  });

  // Debounced autosave to localStorage
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2000);
    }, 800);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form]);

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const set = <K extends keyof DashboardFormState>(key: K, value: DashboardFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profil &amp; Cele</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Uzupełnij swoje dane i cele zawodowe, aby AI mogło lepiej dopasowywać oferty pracy.
          </p>
        </div>
        {savedBadge && (
          <span className="animate-fade-out rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            Zapisano
          </span>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ─── LEFT COLUMN — Kto jesteś ─── */}
        <div className="space-y-6">
          {/* Karta: Dane kandydata */}
          <div className={CARD_CLASS}>
            <h2 className="mb-5 text-base font-semibold text-slate-800 dark:text-white">
              Dane kandydata
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS} htmlFor="fullName">
                  Imię i nazwisko
                </label>
                <input
                  id="fullName"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="np. Anna Kowalska"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="currentJobTitle">
                  Obecne stanowisko{' '}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(opcjonalne)</span>
                </label>
                <input
                  id="currentJobTitle"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="np. Frontend Developer"
                  value={form.currentJobTitle}
                  onChange={(e) => set('currentJobTitle', e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="currentSalary">
                  Obecne wynagrodzenie{' '}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(opcjonalne)</span>
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400 dark:text-slate-500">
                    £
                  </span>
                  <input
                    id="currentSalary"
                    type="number"
                    min={0}
                    className={`${INPUT_CLASS} mt-0 pl-7`}
                    placeholder="0"
                    value={form.currentSalary}
                    onChange={(e) => set('currentSalary', e.target.value)}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 dark:text-slate-500">
                    / rok
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Karta: Twoje wartości zawodowe */}
          <div className={CARD_CLASS}>
            <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-white">
              Twoje wartości zawodowe
            </h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Co jest dla Ciebie ważne w pracy?
            </p>
            <textarea
              id="workValues"
              rows={3}
              className={`${INPUT_CLASS} mt-0 resize-none`}
              placeholder="np. work-life balance, remote, rozwój techniczny, stabilność..."
              value={form.workValues}
              onChange={(e) => set('workValues', e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">wpisuj po przecinku</p>
          </div>

          {/* Karta: Zgody — skanowanie profili */}
          <div className={CARD_CLASS}>
            <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-white">
              Zgody — skanowanie profili
            </h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Zaznacz zgody aby AI lepiej rozumiało Twoje potrzeby:
            </p>

            <div className="space-y-4">
              {/* LinkedIn */}
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-indigo-600"
                  checked={form.linkedinConsent}
                  onChange={(e) => set('linkedinConsent', e.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">LinkedIn</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Analiza Twojej sieci kontaktów i historii pracy
                  </p>
                </div>
              </label>

              {/* Facebook */}
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-indigo-600"
                  checked={form.facebookConsent}
                  onChange={(e) => set('facebookConsent', e.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">Facebook</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Analiza zainteresowań i aktywności zawodowych
                  </p>
                </div>
              </label>

              {/* Instagram */}
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-indigo-600"
                  checked={form.instagramConsent}
                  onChange={(e) => set('instagramConsent', e.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">Instagram</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Analiza Twojej marki osobistej
                  </p>
                </div>
              </label>
            </div>

            <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
              Dane są przetwarzane lokalnie i nie są udostępniane osobom trzecim.
            </p>
          </div>
        </div>

        {/* ─── RIGHT COLUMN — Dokąd zmierzasz ─── */}
        <div className="space-y-6">
          {/* Karta: Cel kariery */}
          <div className={CARD_CLASS}>
            <h2 className="mb-5 text-base font-semibold text-slate-800 dark:text-white">
              Cel kariery
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS} htmlFor="targetJobTitle">
                  Docelowe stanowisko
                </label>
                <input
                  id="targetJobTitle"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="np. Senior React Developer"
                  value={form.targetJobTitle}
                  onChange={(e) => set('targetJobTitle', e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="targetSalary">
                  Docelowe wynagrodzenie
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400 dark:text-slate-500">
                    £
                  </span>
                  <input
                    id="targetSalary"
                    type="number"
                    min={0}
                    className={`${INPUT_CLASS} mt-0 pl-7`}
                    placeholder="0"
                    value={form.targetSalary}
                    onChange={(e) => set('targetSalary', e.target.value)}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 dark:text-slate-500">
                    / rok
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Karta: Automatyczne aplikowanie */}
          <div className={CARD_CLASS}>
            <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-white">
              Automatyczne aplikowanie
            </h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Minimalny % dopasowania CV do oferty przy którym AI wysyła aplikację automatycznie:
            </p>

            <div className="flex items-center gap-4">
              <input
                id="autoApplyThreshold"
                type="range"
                min={50}
                max={100}
                step={5}
                value={form.autoApplyThreshold}
                onChange={(e) => set('autoApplyThreshold', Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 dark:bg-slate-700"
              />
              <span className="w-14 shrink-0 text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {form.autoApplyThreshold}%
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>50%</span>
              <span>100%</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Oferty poniżej progu wymagają Twojej ręcznej akceptacji
            </p>
          </div>

          {/* Karta: Mapa drogowa */}
          <div className={CARD_CLASS}>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <MapIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                  Mapa drogowa
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Uzupełni się automatycznie po zeskanowaniu CV i dokumentów.
                </p>
                <Link
                  to="/documents"
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Wgraj dokumenty &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
