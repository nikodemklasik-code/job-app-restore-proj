export function providerEnvKey(providerName: string): string {
  return `JOB_PROVIDER_${providerName.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_ENABLED`;
}

export function isExperimentalProviderEnabled(providerName: string): boolean {
  const specific = process.env[providerEnvKey(providerName)]?.toLowerCase() === 'true';
  const global = process.env.JOB_PROVIDERS_ENABLE_EXPERIMENTAL?.toLowerCase() === 'true';
  return specific || global;
}

export function providerTimeoutMs(): number {
  const raw = Number(process.env.JOB_PROVIDER_TIMEOUT_MS ?? '8000');
  if (!Number.isFinite(raw) || raw < 1000) return 8000;
  return Math.min(raw, 30000);
}

export async function fetchWithProviderTimeout(url: string | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs());
  try {
    return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function disabledUntilFlagReason(providerName: string): string {
  return `Disabled until ${providerEnvKey(providerName)}=true or JOB_PROVIDERS_ENABLE_EXPERIMENTAL=true is set on the server.`;
}
