import type { LedgerBillingSummary, LedgerEntry } from '@/types/billing';

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatCategory(category: LedgerEntry['category']): string {
  return category.replaceAll('_', ' ');
}

function LedgerAmount({ entry }: { entry: LedgerEntry }) {
  const isCredit = entry.direction === 'credit';
  const sign = isCredit ? '+' : '-';
  const textClass = isCredit ? 'text-emerald-300' : 'text-rose-300';

  return (
    <span className={`font-semibold ${textClass}`}>
      {sign}
      {formatCurrency(entry.amountCents, entry.currency)}
    </span>
  );
}

export function LedgerView(props: { entries: LedgerEntry[]; summary: LedgerBillingSummary }) {
  const { entries, summary } = props;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">Posted ledger</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Transaction history</h2>
          <p className="mt-2 text-sm text-slate-500">
            Posted charges and credits (when tables exist on the server).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Posted debits</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatCurrency(summary.postedDebitCents, summary.currency)}
            </div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Posted credits</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatCurrency(summary.postedCreditCents, summary.currency)}
            </div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Net posted</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatCurrency(summary.postedNetCents, summary.currency)}
            </div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Entries</div>
            <div className="mt-1 text-sm font-semibold text-white">{summary.postedCount}</div>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
          No posted ledger entries yet. Run the SQL migration on MySQL to enable this ledger.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Occurred
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/10">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 align-top text-sm font-medium text-white">{entry.description}</td>
                  <td className="px-4 py-3 align-top text-sm capitalize text-slate-300">{formatCategory(entry.category)}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-400">
                    {entry.sourceType
                      ? `${entry.sourceType}${entry.sourceId ? ` · ${entry.sourceId}` : ''}`
                      : 'Direct'}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-400">
                    {new Date(entry.occurredAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 align-top text-right text-sm">
                    <LedgerAmount entry={entry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
