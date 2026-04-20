/**
 * Express `trust proxy` for deployments behind Nginx (or similar).
 * Without this, `req.ip` / rate limiting can see the proxy instead of the client.
 *
 * Override with TRUST_PROXY: `0` | `false` | `1` | `2` | … (hop count).
 *
 * If NODE_ENV is not `production` but the process still runs behind a reverse proxy
 * (staging, PM2 without NODE_ENV set, etc.), set **BEHIND_REVERSE_PROXY=1** so the
 * default becomes one trusted hop without opening trust in raw local dev.
 */
function envFlagTrue(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function resolveExpressTrustProxy(): boolean | number {
  const raw = process.env.TRUST_PROXY?.trim();
  if (raw === undefined || raw === '') {
    if (envFlagTrue('BEHIND_REVERSE_PROXY')) return 1;
    return process.env.NODE_ENV === 'production' ? 1 : false;
  }
  if (raw === 'false' || raw === '0') return false;
  if (raw === 'true' || raw === '1') return 1;
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0) return n;
  return false;
}
