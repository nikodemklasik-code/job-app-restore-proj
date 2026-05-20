import { AlertTriangle, Clock3, Coins, Loader2, RotateCcw } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';

type UsageEntry = {
  id: string;
  feature: string;
  kind: string;
  status: string;
  estimatedCost: number;
  approvedMaxCost: number;
  actualCost: number;
  allowanceDebited: number;
  creditsDebited: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
};

function formatFeature(feature: string): string {
  return feature.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function amountFor(entry: UsageEntry): number {
  if (entry.status === 'committed' || entry.status === 'partial') return entry.actualCost;
  if (entry.status === 'approved') return entry.approvedMaxCost;
  return entry.actualCost;
}

export function CreditUsageHistory() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const historyQuery = api.billing.getUsageHistory.useQuery(
    { userId, limit: 50 },
    { enabled: Boolean(userId), staleTime: 30_000, retry: 1 },
  );

  if (!userId) return null;

  if (historyQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
          Loading AI credit history…
        </div>
      </div>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">AI credit history unavailable</p>
            <p className="mt-1 text-red-100/85">{historyQuery.error.message}</p>
          </div>
          <button type="button" onClick={() => void historyQuery.refetch()} className="inline-flex items-center gap-1 rounded-lg border border-red-300/30 px-2 py-1 text-xs text-red-50 hover:bg-red-500/20">
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const entries = (historyQuery.data ?? []) as UsageEntry[];

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 text-slate-400" />
          <div>
            <p className="font-semibold text-white">No AI credit transactions yet</p>
            <p className="mt-1 text-slate-400">Paid AI actions will appear here after the backend approves, commits, rejects or refunds spend events.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-indigo-300" />
          <h2 className="font-semibold text-white">AI credit transaction history</h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">Backend credit spend events: action type, amount, status and related entity reference.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Action type</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Related entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const amount = amountFor(entry);
              const blocked = entry.status === 'rejected' || entry.status === 'refunded';
              return (
                <tr key={entry.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-slate-300">{formatDate(entry.createdAt)}</td>
                  <td className="px-5 py-3 text-white">
                    <div className="font-medium">{formatFeature(entry.feature)}</div>
                    <div className="text-xs text-slate-500">{entry.kind}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-200">
                    {amount.toLocaleString()} credits
                    {(entry.allowanceDebited > 0 || entry.creditsDebited > 0) && (
                      <div className="text-xs text-slate-500">{entry.allowanceDebited} allowance · {entry.creditsDebited} paid</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${blocked ? 'bg-amber-500/15 text-amber-200' : entry.status === 'committed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
                      {blocked ? <AlertTriangle className="h-3 w-3" /> : null}
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{entry.referenceId ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
