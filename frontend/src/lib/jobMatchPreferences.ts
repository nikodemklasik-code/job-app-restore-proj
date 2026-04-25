/** Browser-local minimum fit % for Jobs discovery list.
 *
 * Jobs/Search is the only place that should edit this value.
 * Profile may display the current value as read-only context, but must not
 * expose a second slider. Two sliders with different values is how humans
 * accidentally invent product entropy and then call it personalisation.
 */
export const MIN_JOB_FIT_LOCAL_KEY = 'mvh.minJobFitPercent';

export function readMinJobFitPercent(): number {
  if (typeof window === 'undefined') return 50;
  const v = Number.parseInt(window.localStorage.getItem(MIN_JOB_FIT_LOCAL_KEY) ?? '50', 10);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
}

function isProfilePath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/profile');
}

function applyProfileReadOnlyMinimumFitDisplay(): void {
  if (typeof document === 'undefined' || !isProfilePath()) return;

  const slider = document.querySelector<HTMLInputElement>('input#min-job-fit[type="range"]');
  if (!slider || slider.dataset.profileReadonly === 'true') return;

  slider.dataset.profileReadonly = 'true';
  slider.disabled = true;
  slider.setAttribute('aria-readonly', 'true');
  slider.classList.add('hidden');

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

installProfileMinimumFitReadOnlyGuard();
