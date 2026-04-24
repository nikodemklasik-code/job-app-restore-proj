import { Loader2, DatabaseZap } from 'lucide-react';
import { api } from '@/lib/api';
import { LedgerView } from '@/components/billing/LedgerView';
import { PendingSpend } from '@/components/billing/PendingSpend';

type Props = { enabled: boolean };

function isLedgerInactive(data: {
  entries: Array<unknown>;
  charges: Array<unknown>;
  ledgerSummary: {
    postedDebitCents: number;
    postedCreditCents: number;
    postedNetCents: number;
    postedCount: number;
  };
  pendingSummary: {
    pendingDebitCents: number;
    pendingNetCents: number;
    pendingCount: number;
    availableBalanceCents: number;
  };
}) {
  return (
    data.entries.length === 0 &&
    data.charges.length === 0 &&
    data.ledgerSummary.postedDebitCents === 0 &&
    data.ledgerSummary.postedCreditCents === 0 &&
    data.ledgerSummary.postedNetCents === 0 &&
    data.ledgerSummary.postedCount === 0 &&
    data.pendingSummary.pendingDebitCents === 0 &&
    data.pendingSummary.pendingNetCents === 0 &&
    data.pendingSummary.pendingCount === 0 &&
    data.pendingSummary.availableBalanceCents === 0
  );
}

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

  const ledgerInactive = isLedgerInactive({
    entries: ledgerQuery.data.entries,
    charges: pendingQuery.data.charges,
    ledgerSummary: ledgerQuery.data.summary,
    pendingSummary: pendingQuery.data.summary,
  });

  if (ledgerInactive) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-50">
        <div className="flex items-start gap-3">
          <DatabaseZap className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <p className="font-semibold text-white">Ledger not active yet</p>
            <p className="mt-1 text-amber-100/90">
              We are not showing fake zero balances here. This area needs posted ledger data or the SQL-backed billing tables to be enabled first.
            </p>
            <p className="mt-2 text-amber-100/80">
              Until then, treat this as <strong>setup required</strong>, not as a real account balance of zero.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
