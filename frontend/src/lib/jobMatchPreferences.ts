/** Browser-local minimum fit % for Jobs discovery list.
 *
 * Jobs/Search is the only place that should edit this value.
 * Profile may display the current value as read-only context, but must not
 * expose a second slider or write to the preference. Two sliders with different
 * values is how humans accidentally invent product entropy and then call it
 * personalisation.
 */
export const MIN_JOB_FIT_LOCAL_KEY = 'mvh.minJobFitPercent';

const DEFAULT_MIN_JOB_FIT_PERCENT = 0;

export function normaliseMinJobFitPercent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : DEFAULT_MIN_JOB_FIT_PERCENT;
}

export function readMinJobFitPercent(): number {
  if (typeof window === 'undefined') return DEFAULT_MIN_JOB_FIT_PERCENT;
  const v = Number.parseInt(window.localStorage.getItem(MIN_JOB_FIT_LOCAL_KEY) ?? String(DEFAULT_MIN_JOB_FIT_PERCENT), 10);
  return normaliseMinJobFitPercent(v);
}

/**
 * Server/backend owns fitScore. Frontend only decides whether a ready listing is
 * visible for the user's current Jobs threshold. Missing/invalid scores should
 * not hide real provider listings.
 */
export function shouldShowJobForMinimumFit(fitScore: number | null | undefined, minFitPercent = readMinJobFitPercent()): boolean {
  const score = typeof fitScore === 'number' && Number.isFinite(fitScore) ? fitScore : 0;
  return normaliseMinJobFitPercent(score) >= normaliseMinJobFitPercent(minFitPercent);
}

function isProfilePath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/profile');
}

function installProfileWriteGuard(): void {
  if (typeof window === 'undefined') return;
  const storage = window.localStorage;
  const originalSetItem = storage.setItem.bind(storage);

  storage.setItem = (key: string, value: string): void => {
    if (key === MIN_JOB_FIT_LOCAL_KEY && isProfilePath()) {
      // Profile still imports older code paths that try to write the threshold
      // from local component state. Ignore those writes so Jobs/Search stays the
      // single control surface. Delightfully ugly, but less ugly than two knobs.
      return;
    }
    originalSetItem(key, value);
  };
}

function applyProfileReadOnlyMinimumFitDisplay(): void {
  if (typeof document === 'undefined' || !isProfilePath()) return;

  const slider = document.querySelector<HTMLInputElement>('input#min-job-fit[type="range"]');
  if (!slider || slider.dataset.profileReadonly === 'true') return;

  const currentValue = readMinJobFitPercent();
  slider.dataset.profileReadonly = 'true';
  slider.disabled = true;
  slider.setAttribute('aria-readonly', 'true');
  slider.classList.add('hidden');

  const label = document.querySelector<HTMLLabelElement>('label[for="min-job-fit"]');
  if (label) {
    label.textContent = `Jobs: minimum fit score (${currentValue}%)`;
  }

  const container = slider.closest('div.rounded-xl');
  if (!container) return;

  const description = Array.from(container.querySelectorAll('p'))
    .find((node) => node.textContent?.includes('Listings below this fit score'));
  if (description) {
    description.textContent = 'This is the current Jobs discovery threshold. Change it on the Jobs search screen so there is one source of truth.';
  }

  const hint = Array.from(container.querySelectorAll('span'))
    .find((node) => node.textContent?.includes('Applies on Jobs discovery'));
  if (hint) {
    hint.textContent = 'Read-only here. Edit in Jobs search.';
  }

  if (!container.querySelector('[data-profile-min-fit-link="true"]')) {
    const link = document.createElement('a');
    link.href = '/jobs';
    link.dataset.profileMinFitLink = 'true';
    link.className = 'inline-flex rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-white/10';
    link.textContent = 'Open Jobs search to change';
    container.appendChild(link);
  }
}

function installProfileMinimumFitReadOnlyGuard(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const run = () => applyProfileReadOnlyMinimumFitDisplay();
  run();
  window.addEventListener('mvh-min-fit-changed', run);
  window.addEventListener('popstate', run);

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

installProfileWriteGuard();
installProfileMinimumFitReadOnlyGuard();
