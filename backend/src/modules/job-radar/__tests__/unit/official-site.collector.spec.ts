import { describe, it, expect, vi, afterEach } from 'vitest';
import { OfficialSiteCollector } from '../../infrastructure/collectors/official-site.collector.js';

describe('OfficialSiteCollector', () => {
  const collector = new OfficialSiteCollector();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns blocked for 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        headers: { get: () => null },
      }),
    );

    const result = await collector.collect({
      scanId: 's1',
      sourceUrl: 'https://example.com/job',
      timeoutMs: 5000,
    });

    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') {
      expect(result.blockReason).toContain('403');
    }
  });

  it('returns done for 200 with body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: 'https://example.com/job',
        text: async () => '<html><title>T</title><body>hi</body></html>',
        headers: { get: () => 'text/html' },
      }),
    );

    const result = await collector.collect({
      scanId: 's1',
      sourceUrl: 'https://example.com/job',
      timeoutMs: 5000,
    });

    expect(result.status).toBe('done');
    if (result.status === 'done') {
      expect(result.rawContent.length).toBeGreaterThan(0);
    }
  });
});
