import {
  PROVIDER_SESSION_CONFIG,
  buildProviderRequestHeaders,
  isProviderBlockedHtml,
  isProviderLoggedInHtml,
  isProviderLoggedOutHtml,
  isRemoteVerificationBlockedStatus,
  validateProviderCookieHeader,
  type ExternalSessionProvider,
} from './sessionCookies.js';

export type ExternalSessionHealthStatus = 'active' | 'needs_refresh' | 'blocked' | 'expired';

export interface ExternalSessionTestResult {
  ok: boolean;
  status: ExternalSessionHealthStatus;
  reason: string;
  httpStatus?: number;
}

export async function testExternalProviderSession(
  provider: ExternalSessionProvider,
  rawCookies: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ExternalSessionTestResult> {
  const validation = validateProviderCookieHeader(provider, rawCookies);
  const label = PROVIDER_SESSION_CONFIG[provider].label;
  if (!validation.ok) {
    return {
      ok: false,
      status: 'needs_refresh',
      reason: validation.reason ?? `Saved ${label} Cookie header is invalid for this provider.`,
    };
  }

  try {
    const res = await fetchImpl(PROVIDER_SESSION_CONFIG[provider].testUrl, {
      redirect: 'manual',
      headers: buildProviderRequestHeaders(provider, validation.cookies),
    });

    const location = res.headers.get('location') ?? '';
    if (res.status >= 300 && res.status < 400 && /login|signin|auth|uas\/login/i.test(location)) {
      return {
        ok: false,
        status: 'expired',
        httpStatus: res.status,
        reason: `${label} redirected to login — session expired.`,
      };
    }

    const html = await res.text();
    if (isProviderLoggedOutHtml(provider, html)) {
      return {
        ok: false,
        status: 'expired',
        httpStatus: res.status,
        reason: `${label} returned a login page — session expired.`,
      };
    }

    if (isRemoteVerificationBlockedStatus(res.status) || isProviderBlockedHtml(html)) {
      return {
        ok: false,
        status: 'blocked',
        httpStatus: res.status,
        reason: `${label} blocked automated verification (${res.status}). Cookie format is valid, but the provider requires a browser refresh or later retry.`,
      };
    }

    const ok = res.ok && (isProviderLoggedInHtml(provider, html) || html.length > 0);
    return {
      ok,
      status: ok ? 'active' : 'needs_refresh',
      httpStatus: res.status,
      reason: ok ? 'Session is active.' : `${label} session could not be verified — please log in again.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'needs_refresh',
      reason: `Could not reach ${label} to verify remotely. The saved session was not disabled. Technical detail: ${String(err)}`,
    };
  }
}
