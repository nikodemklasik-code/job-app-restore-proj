import { describe, expect, it } from 'vitest';
import { getLegalSearchScopeSummary, searchLegalHubSources } from '../legal-hub-search.service.js';

describe('searchLegalHubSources', () => {
  it('returns empty for short query', () => {
    expect(searchLegalHubSources('', 5)).toEqual([]);
    expect(searchLegalHubSources('a', 5)).toEqual([]);
  });

  it('matches holiday / redundancy topics', () => {
    const h = searchLegalHubSources('statutory holiday pay', 10);
    expect(h.length).toBeGreaterThan(0);
    expect(h.some((x) => x.url.includes('holiday-entitlement'))).toBe(true);
    const r = searchLegalHubSources('redundancy consultation', 10);
    expect(r.some((x) => x.url.includes('redundant'))).toBe(true);
  });
});

describe('getLegalSearchScopeSummary', () => {
  it('counts catalogue tiers', () => {
    const s = getLegalSearchScopeSummary();
    expect(s.coreSourceCount).toBeGreaterThan(0);
    expect(s.scopeLabel).toContain('core');
    expect(s.vectorRetrievalMode === 'none' || s.vectorRetrievalMode === 'configured').toBe(true);
  });
});
