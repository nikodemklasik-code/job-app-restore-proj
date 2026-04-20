import { TRPCClientError } from '@trpc/client';

let lastUnauthorizedRedirectAt = 0;
const REDIRECT_DEBOUNCE_MS = 2500;

export function isTrpcUnauthorizedError(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  const code = error.data?.code;
  if (code === 'UNAUTHORIZED') return true;
  return error.message.includes('Authentication required');
}

/**
 * When a protected tRPC call fails with UNAUTHORIZED, send the user to sign-in again.
 * Avoids loops on /auth and debounces bursts from parallel failing queries.
 */
export function redirectIfTrpcUnauthorized(error: unknown): void {
  if (!isTrpcUnauthorizedError(error)) return;
  if (typeof window === 'undefined') return;

  const path = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname.startsWith('/auth')) return;

  const now = Date.now();
  if (now - lastUnauthorizedRedirectAt < REDIRECT_DEBOUNCE_MS) return;
  lastUnauthorizedRedirectAt = now;

  const qs = new URLSearchParams({
    reason: 'authentication_required',
    returnTo: path,
  });
  window.location.assign(`/auth?${qs.toString()}`);
}
