import crypto from 'node:crypto';
import type { NormalizedScanInput } from './input-normalizer.service.js';

export class FingerprintService {
  computeEntityFingerprint(input: NormalizedScanInput): string {
    const raw = [
      input.canonicalEmployerCandidate ?? '',
      input.normalizedRoleFamily ?? '',
      input.normalizedLocation ?? '',
      input.canonicalUrl ?? '',
    ].join('|');

    return this.sha256(raw);
  }

  computeSourceFingerprint(input: NormalizedScanInput): string | null {
    if (!input.canonicalUrl) return null;
    return this.sha256(input.canonicalUrl);
  }

  private sha256(value: string): string {
    return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
  }
}
