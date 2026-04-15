export type NormalizedScanInput = {
  canonicalEmployerCandidate: string | null;
  normalizedRoleFamily: string | null;
  normalizedLocation: string | null;
  canonicalUrl: string | null;
};

/** Normalizes employer, role family, location, and URL for fingerprinting (MVP). */
export class InputNormalizerService {
  normalize(input: Record<string, unknown>): NormalizedScanInput {
    const employer =
      typeof input.employerName === 'string' ? input.employerName.trim().toLowerCase() : null;

    const title = typeof input.jobTitle === 'string' ? input.jobTitle.trim() : null;

    const location = typeof input.location === 'string' ? input.location.trim() : null;

    const url = typeof input.sourceUrl === 'string' ? this.normalizeUrl(input.sourceUrl) : null;

    return {
      canonicalEmployerCandidate: employer,
      normalizedRoleFamily: this.normalizeRoleFamily(title),
      normalizedLocation: location,
      canonicalUrl: url,
    };
  }

  private normalizeUrl(raw: string): string {
    try {
      const url = new URL(raw);
      url.hash = '';
      return url.toString();
    } catch {
      return raw.trim();
    }
  }

  private normalizeRoleFamily(title: string | null): string | null {
    if (!title) return null;
    if (title.toLowerCase().includes('designer')) return 'Product Design';
    return title;
  }
}
