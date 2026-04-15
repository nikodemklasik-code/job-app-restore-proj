import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, MapIcon, Lock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardFormState {
  fullName: string;
  currentJobTitle: string;
  currentSalary: string;
  workValues: string;
  // Social scanning toggles (separate from consent — controls whether AI actively scans)
  linkedinScan: boolean;
  facebookScan: boolean;
  instagramScan: boolean;
  // Where you're going
  linkedinConsent: boolean;
  facebookConsent: boolean;
  instagramConsent: boolean;
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
  } catch { /* ignore */ }
  return {};
}

// ─── Toggle switch component ──────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
        ${checked && !disabled ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200
          ${checked && !disabled ? 'translate-x-4' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ─── Social consent row ───────────────────────────────────────────────────────

interface SocialConsentRowProps {
  platform: string;
  description: string;
  consentGranted: boolean;
  scanEnabled: boolean;
  onToggle: (v: boolean) => void;
}

function SocialConsentRow({ platform, description, consentGranted, scanEnabled, onToggle }: SocialConsentRowProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${!consentGranted ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-800 dark:text-white">{platform}</span>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        {!consentGranted && (
          <Link
            to="/settings"
            className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:underline dark:text-indigo-400"
          >
            <Lock className="h-3 w-3" />
            Enable in Settings &rarr;
          </Link>
        )}
      </div>
      <ToggleSwitch checked={scanEnabled && consentGranted} onChange={onToggle} disabled={!consentGranted} />
    </div>
  );
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
    linkedinScan: stored.linkedinScan ?? false,
    facebookScan: stored.facebookScan ?? false,
    instagramScan: stored.instagramScan ?? false,
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
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile &amp; Goals</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Fill in your details and career goals so the AI can better match job opportunities for you.
          </p>
        </div>
        {savedBadge && (
          <span className="animate-fade-out rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            Saved
          </span>
        )}
      </div>

      {/* Row 1: Your Details + Career Goal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-6">
          {/* Card: Candidate Info */}
          <div className={CARD_CLASS}>
            <h2 className="mb-5 text-base font-semibold text-slate-800 dark:text-white">
              Candidate Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS} htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="e.g. Anna Smith"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="currentJobTitle">
                  Current role{' '}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
                </label>
                <input
                  id="currentJobTitle"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="e.g. Frontend Developer"
                  value={form.currentJobTitle}
                  onChange={(e) => set('currentJobTitle', e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="currentSalary">
                  Current salary{' '}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
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
                    / yr
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Work values */}
          <div className={CARD_CLASS}>
            <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-white">
              Work values
            </h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              What matters most to you at work?
            </p>
            <textarea
              id="workValues"
              rows={3}
              className={`${INPUT_CLASS} mt-0 resize-none`}
              placeholder="e.g. work-life balance, remote, technical growth, stability..."
              value={form.workValues}
              onChange={(e) => set('workValues', e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">separate with commas</p>
          </div>

          {/* Card: Social profile scanning */}
          <div className={CARD_CLASS}>
            <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-white">
              Social profile scanning
            </h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Allow AI to scan your social profiles for better matching:
            </p>

            <div className="space-y-5">
              <SocialConsentRow
                platform="LinkedIn"
                description="Analyse your network and work history"
                consentGranted={form.linkedinConsent}
                scanEnabled={form.linkedinScan}
                onToggle={(v) => set('linkedinScan', v)}
              />
              <SocialConsentRow
                platform="Facebook"
                description="Analyse your professional interests and activity"
                consentGranted={form.facebookConsent}
                scanEnabled={form.facebookScan}
                onToggle={(v) => set('facebookScan', v)}
              />
              <SocialConsentRow
                platform="Instagram"
                description="Analyse your personal brand"
                consentGranted={form.instagramConsent}
                scanEnabled={form.instagramScan}
                onToggle={(v) => set('instagramScan', v)}
              />
            </div>

            <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
              Data is processed locally and never shared with third parties.
            </p>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="space-y-6">
          {/* Card: Career goal */}
          <div className={CARD_CLASS}>
            <h2 className="mb-5 text-base font-semibold text-slate-800 dark:text-white">
              Career goal
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS} htmlFor="targetJobTitle">
                  Target role
                </label>
                <input
                  id="targetJobTitle"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="e.g. Senior React Developer"
                  value={form.targetJobTitle}
                  onChange={(e) => set('targetJobTitle', e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="targetSalary">
                  Target salary
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
                    / yr
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Auto-apply */}
          <div className={CARD_CLASS}>
            <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-white">
              Auto-apply
            </h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Minimum CV match score for AI to auto-apply:
            </p>
            <input
              type="range"
              min={50}
              max={100}
              value={form.autoApplyThreshold}
              onChange={(e) => set('autoApplyThreshold', Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="mt-2 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>50%</span>
              <span className="text-lg text-indigo-600 dark:text-indigo-400">
                {form.autoApplyThreshold}%
              </span>
              <span>100%</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Jobs below threshold require your manual approval
            </p>
          </div>

          {/* Card: Roadmap */}
          <div className={CARD_CLASS}>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <MapIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                  Roadmap
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Auto-fills after uploading your CV and documents.
                </p>
                <Link
                  to="/documents"
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Upload documents &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Social consents — full width */}
      <div className={CARD_CLASS}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Social Profile Analysis</h2>
          <Link
            to="/settings"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Manage all consents <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Allow AI to analyse your public profiles:
        </p>

        <div className="flex flex-wrap gap-6">
          {[
            { key: 'linkedinConsent' as const, label: 'LinkedIn' },
            { key: 'facebookConsent' as const, label: 'Facebook' },
            { key: 'instagramConsent' as const, label: 'Instagram' },
          ].map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded accent-indigo-600"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-800 dark:text-white">{label}</span>
            </label>
          ))}
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Full consent centre (email, auto-apply &amp; more) in{' '}
          <Link to="/settings" className="text-indigo-500 hover:underline">Settings → Privacy</Link>.
        </p>
      </div>
    </div>
  );
}
