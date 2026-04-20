import { createHash } from 'node:crypto';
import type { StartScanDto } from '../../api/job-radar.dto.js';

/**
 * Deterministic pseudo–employer id for grouping scans and employer history.
 * Not a government registry id — stable hash from employer name, URL host, or saved-job id.
 */
export function deriveStableEmployerIdFromScanPayload(payload: StartScanDto): string | null {
  const name = payload.employerName?.trim();
  if (name) {
    return `emp_${createHash('sha256').update(name.toLowerCase()).digest('hex').slice(0, 32)}`;
  }
  const url = payload.sourceUrl?.trim();
  if (url) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return `emp_${createHash('sha256').update(`host:${host}`).digest('hex').slice(0, 32)}`;
    } catch {
      /* ignore invalid URL */
    }
  }
  const saved = payload.savedJobId?.trim();
  if (saved) {
    return `emp_${createHash('sha256').update(`saved:${saved.toLowerCase()}`).digest('hex').slice(0, 32)}`;
  }
  return null;
}
