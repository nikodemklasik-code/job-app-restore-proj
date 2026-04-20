import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { LedgerView } from '@/components/billing/LedgerView';
import { PendingSpend } from '@/components/billing/PendingSpend';

type Props = { enabled: boolean };

export function BillingLedgerPanels({ enabled }: Props) {
  const ledgerQuery = api.billing.getLedger.useQuery(
    { limit: 50 },
    { enabled, staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  );
  const pendingQuery = api.billing.getPendingSpend.useQuery(
    { limit: 50 },
    { enabled, staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  );

  const loading = ledgerQuery.isLoading || pendingQuery.isLoading;
  const err = ledgerQuery.isError || pendingQuery.isError;
  const msg = ledgerQuery.error?.message ?? pendingQuery.error?.message ?? 'Billing ledger could not be loaded.';

  if (!enabled) return null;

  if (loading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" aria-label="Loading ledger" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        <p className="font-medium">Ledger / pending spend</p>
        <p className="mt-1 text-red-200/90">{msg}</p>
      </div>
    );
  }

  if (!ledgerQuery.data || !pendingQuery.data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Available (ledger model)</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {(pendingQuery.data.summary.availableBalanceCents / 100).toLocaleString('en-GB', {
              style: 'currency',
              currency: pendingQuery.data.summary.currency,
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Posted net</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {(ledgerQuery.data.summary.postedNetCents / 100).toLocaleString('en-GB', {
              style: 'currency',
              currency: ledgerQuery.data.summary.currency,
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending spend</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {(pendingQuery.data.summary.pendingDebitCents / 100).toLocaleString('en-GB', {
              style: 'currency',
              currency: pendingQuery.data.summary.currency,
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Posted credits</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {(ledgerQuery.data.summary.postedCreditCents / 100).toLocaleString('en-GB', {
              style: 'currency',
              currency: ledgerQuery.data.summary.currency,
            })}
          </div>
        </div>
      </div>
      <LedgerView entries={ledgerQuery.data.entries} summary={ledgerQuery.data.summary} />
      <PendingSpend charges={pendingQuery.data.charges} summary={pendingQuery.data.summary} />
    </div>
  );
}
