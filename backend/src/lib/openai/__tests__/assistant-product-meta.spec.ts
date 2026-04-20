import { describe, it, expect } from 'vitest';
import { buildAssistantAiProductMeta } from '../assistant-product-meta.js';

describe('buildAssistantAiProductMeta', () => {
  it('maps known modes to labels', () => {
    const m = buildAssistantAiProductMeta('cv');
    expect(m.interactionModeLabel).toContain('CV');
    expect(m.usesPremiumTier).toBe(false);
    expect(m.estimatedCredits.min).toBeGreaterThan(0);
  });

  it('falls back to general for unknown mode', () => {
    const m = buildAssistantAiProductMeta('unknown-mode');
    expect(m.interactionModeLabel).toContain('General');
  });

  it('honours legalSourceRestricted flag', () => {
    expect(buildAssistantAiProductMeta('general').legalSourceRestricted).toBe(false);
    expect(buildAssistantAiProductMeta('general', { legalSourceRestricted: true }).legalSourceRestricted).toBe(true);
  });
});
