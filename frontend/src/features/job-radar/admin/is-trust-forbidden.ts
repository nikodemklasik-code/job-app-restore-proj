import { TRPCClientError } from '@trpc/client';

export function isTrustAccessForbidden(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  const code = error.data?.code;
  return code === 'FORBIDDEN' || error.message.includes('TRUST_ACCESS_REQUIRED');
}
