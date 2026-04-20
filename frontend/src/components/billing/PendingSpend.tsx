import type { LedgerBillingSummary, PendingCharge } from '@/types/billing';

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatCategory(category: PendingCharge['category']): string {
  return category.replaceAll('_', ' ');
}

function statusPillClass(status: PendingCharge['status']): string {
  switch (status) {
    case 'authorized':
      return 'bg-amber-500/20 text-amber-100';
    case 'queued':
      return 'bg-sky-500/20 text-sky-100';
    case 'committed':
      return 'bg-emerald-500/20 text-emerald-100';
    case 'cancelled':
      return 'bg-slate-500/30 text-slate-200';
    case 'failed':
      return 'bg-rose-500/20 text-rose-100';
    default:
      return 'bg-slate-500/20 text-slate-200';
  }
}

export function PendingSpend(props: { charges: PendingCharge[]; summary: LedgerBillingSummary }) {
  const { charges, summary } = props;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">Pending spend</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Charges not yet posted</h2>
          <p className="mt-2 text-sm text-slate-500">Queued or authorized charges that will hit balance when committed.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending debits</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatCurrency(summary.pendingDebitCents, summary.currency)}
            </div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending count</div>
            <div className="mt-1 text-sm font-semibold text-white">{summary.pendingCount}</div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Available balance</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatCurrency(summary.availableBalanceCents, summary.currency)}
            </div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Net pending</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatCurrency(summary.pendingNetCents, summary.currency)}
            </div>
          </div>
        </div>
      </div>

      {charges.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
          No pending spend right now.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {charges.map((charge) => (
            <div
              key={charge.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{charge.description}</span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(charge.status)}`}
                  >
                    {charge.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span className="capitalize">{formatCategory(charge.category)}</span>
                  <span>
                    {charge.sourceType
                      ? `${charge.sourceType}${charge.sourceId ? ` · ${charge.sourceId}` : ''}`
                      : 'Direct'}
                  </span>
                  <span>
                    {charge.expectedCommitAt
                      ? `Expected ${new Date(charge.expectedCommitAt).toLocaleString()}`
                      : `Created ${new Date(charge.createdAt).toLocaleString()}`}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm font-semibold text-rose-300">
                -{formatCurrency(charge.amountCents, charge.currency)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
