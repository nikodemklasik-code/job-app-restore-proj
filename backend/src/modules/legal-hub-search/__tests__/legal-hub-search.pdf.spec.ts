import { describe, expect, it } from 'vitest';
import { renderLegalSearchPdfBuffer } from '../legal-hub-search.pdf.js';

describe('renderLegalSearchPdfBuffer', () => {
  it('returns a non-empty PDF buffer', async () => {
    const buf = await renderLegalSearchPdfBuffer({
      query: 'holiday pay',
      hits: [
        {
          title: 'Holiday entitlement',
          url: 'https://www.gov.uk/holiday-entitlement-rights',
          tier: 'core',
          snippet: 'Test snippet',
          score: 5,
        },
      ],
      scopeLabel: 'Test scope',
      generatedAtIso: new Date().toISOString(),
    });
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
