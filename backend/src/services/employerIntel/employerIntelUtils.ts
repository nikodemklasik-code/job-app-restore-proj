/**
 * Employer Intelligence — pure utility functions (no DB dependency).
 */

const COMPANY_SUFFIXES = /\b(ltd|limited|plc|inc|incorporated|corp|corporation|llc|llp|gmbh|ag|sa|pty|co)\b\.?/gi;

/**
 * Normalize employer name for matching.
 * Idempotent: normalize(normalize(x)) === normalize(x)
 */
export function normalizeEmployerName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(COMPANY_SUFFIXES, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
