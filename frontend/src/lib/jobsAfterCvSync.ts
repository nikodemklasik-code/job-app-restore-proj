/**
 * When the user uploads or imports a CV, Jobs Discovery should reset its search,
 * wait for the refreshed profile, then run a profile-derived query again.
 * The session marker stays until the Jobs flow finishes (supports React Strict Mode
 * remounts and same-tab updates via `multivohub:cv-sync-jobs`).
 */
const SESSION_KEY = 'multivohub:jobsAfterCvSync';
const SYNC_EVENT = 'multivohub:cv-sync-jobs';

export function markJobsSearchPendingAfterCv(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* private mode / quota */
  }
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function hasPendingCvJobsSearchMarker(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPendingCvJobsSearchMarker(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
