import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveExpressTrustProxy } from '../express-trust-proxy.js';

describe('resolveExpressTrustProxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is false in non-production when TRUST_PROXY is unset', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TRUST_PROXY', '');
    expect(resolveExpressTrustProxy()).toBe(false);
  });

  it('defaults to 1 hop in production when TRUST_PROXY is unset', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUST_PROXY', '');
    expect(resolveExpressTrustProxy()).toBe(1);
  });

  it('respects explicit TRUST_PROXY integer', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TRUST_PROXY', '2');
    expect(resolveExpressTrustProxy()).toBe(2);
  });

  it('maps false and 0 to disabled trust', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUST_PROXY', 'false');
    expect(resolveExpressTrustProxy()).toBe(false);
    vi.stubEnv('TRUST_PROXY', '0');
    expect(resolveExpressTrustProxy()).toBe(false);
  });

  it('treats non-numeric garbage as disabled trust', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUST_PROXY', 'yes');
    expect(resolveExpressTrustProxy()).toBe(false);
  });

  it('defaults to 1 hop when BEHIND_REVERSE_PROXY=1 even if NODE_ENV is not production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TRUST_PROXY', '');
    vi.stubEnv('BEHIND_REVERSE_PROXY', '1');
    expect(resolveExpressTrustProxy()).toBe(1);
  });

  it('explicit TRUST_PROXY=0 wins over BEHIND_REVERSE_PROXY', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TRUST_PROXY', '0');
    vi.stubEnv('BEHIND_REVERSE_PROXY', '1');
    expect(resolveExpressTrustProxy()).toBe(false);
  });
});
