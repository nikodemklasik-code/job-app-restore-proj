import { describe, expect, it, vi } from 'vitest';
import { testExternalProviderSession } from '../externalSessionVerifier.js';

function response(status: number, html: string, location?: string): Response {
  return new Response(html, {
    status,
    headers: location ? { location } : undefined,
  });
}

describe('external provider session verification', () => {
  it('marks login redirects as expired', async () => {
    const fetchMock = vi.fn(async () => response(302, '', 'https://www.linkedin.com/login')) as unknown as typeof fetch;

    const result = await testExternalProviderSession('linkedin', 'li_at=session-token; JSESSIONID=ajax:123', fetchMock);

    expect(result.status).toBe('expired');
    expect(result.reason).toContain('redirected to login');
  });

  it('marks login wall HTML as expired', async () => {
    const fetchMock = vi.fn(async () => response(200, '<input name="session_key" /><button>Sign in to LinkedIn</button>')) as unknown as typeof fetch;

    const result = await testExternalProviderSession('linkedin', 'li_at=session-token; JSESSIONID=ajax:123', fetchMock);

    expect(result.status).toBe('expired');
    expect(result.reason).toContain('login page');
  });

  it('marks 403/429 provider responses as blocked without expiring valid cookie format', async () => {
    const fetch403 = vi.fn(async () => response(403, 'Access denied')) as unknown as typeof fetch;
    const fetch429 = vi.fn(async () => response(429, 'Too many requests')) as unknown as typeof fetch;

    await expect(testExternalProviderSession('glassdoor', 'gdid=abc; gdsid=session-token', fetch403)).resolves.toMatchObject({ status: 'blocked', httpStatus: 403 });
    await expect(testExternalProviderSession('linkedin', 'li_at=session-token; JSESSIONID=ajax:123', fetch429)).resolves.toMatchObject({ status: 'blocked', httpStatus: 429 });
  });

  it('keeps network failures as needs_refresh rather than expired', async () => {
    const fetchMock = vi.fn(async () => { throw new Error('ENOTFOUND'); }) as unknown as typeof fetch;

    const result = await testExternalProviderSession('gumtree', 'g_state=abc; gt_cookie=session-token', fetchMock);

    expect(result.status).toBe('needs_refresh');
    expect(result.reason).toContain('Could not reach Gumtree');
  });
});
