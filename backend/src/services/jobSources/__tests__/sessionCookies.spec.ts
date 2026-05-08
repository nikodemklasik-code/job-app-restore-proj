import { afterEach, describe, expect, it } from 'vitest';
import {
  isProviderLoggedOutHtml,
  normalizeCookieHeader,
  parseCookieNames,
  validateProviderCookieHeader,
} from '../sessionCookies.js';
import { decryptSessionCookies, encryptSessionCookies, isEncryptedCookieValue } from '../sessionCookieCrypto.js';

describe('external provider session cookie handling', () => {
  afterEach(() => {
    delete process.env.JOB_SESSION_COOKIE_ENCRYPTION_KEY;
  });
  it('normalizes pasted Cookie header lines and strips non-cookie headers', () => {
    const normalized = normalizeCookieHeader('Cookie: li_at=abc; JSESSIONID=ajax:123\nUser-Agent: Chrome');

    expect(normalized).toBe('li_at=abc; JSESSIONID=ajax:123');
    expect([...parseCookieNames(normalized)]).toEqual(['li_at', 'jsessionid']);
  });

  it('rejects obvious Google-only cookies before storing provider sessions', () => {
    const validation = validateProviderCookieHeader('glassdoor', 'SID=google; HSID=google; SAPISID=google');

    expect(validation.ok).toBe(false);
    expect(validation.reason).toContain('Google account cookies');
  });

  it('requires the LinkedIn li_at authentication cookie', () => {
    const validation = validateProviderCookieHeader('linkedin', 'JSESSIONID=ajax:123; bcookie=browser');

    expect(validation.ok).toBe(false);
    expect(validation.reason).toContain('li_at');
  });

  it('accepts a LinkedIn provider cookie header with li_at', () => {
    const validation = validateProviderCookieHeader('linkedin', 'li_at=session-token; JSESSIONID=ajax:123');

    expect(validation.ok).toBe(true);
    expect(validation.cookies).toContain('li_at=session-token');
  });

  it('encrypts stored Cookie headers and decrypts legacy plaintext safely', () => {
    process.env.JOB_SESSION_COOKIE_ENCRYPTION_KEY = 'test-secret-for-cookie-encryption';
    const encrypted = encryptSessionCookies('li_at=session-token; JSESSIONID=ajax:123');

    expect(isEncryptedCookieValue(encrypted)).toBe(true);
    expect(encrypted).not.toContain('session-token');
    expect(decryptSessionCookies(encrypted)).toBe('li_at=session-token; JSESSIONID=ajax:123');
    expect(decryptSessionCookies('plain=value')).toBe('plain=value');
  });

  it('detects provider login walls instead of treating public job pages as a valid session', () => {
    expect(isProviderLoggedOutHtml('indeed', '<form id="signin-form">Sign in to Indeed</form>')).toBe(true);
    expect(isProviderLoggedOutHtml('gumtree', '<a href="https://www.gumtree.com/login">Log in to Gumtree</a>')).toBe(true);
    expect(isProviderLoggedOutHtml('glassdoor', '<a href="/profile/login.htm">Sign in to Glassdoor</a>')).toBe(true);
    expect(isProviderLoggedOutHtml('linkedin', '<input name="session_key" /><button>Sign in to LinkedIn</button>')).toBe(true);
  });
});
