import { AlertTriangle, CheckCircle2, Coins, Loader2, RotateCcw } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';

export type BillingFeatureKey =
  | 'warmup_session_15s'
  | 'warmup_session_30s'
  | 'warmup_session_45s'
  | 'warmup_session_60s'
  | 'coach_quick_reframe'
  | 'coach_structured_guidance'
  | 'coach_deep_coaching'
  | 'coach_session'
  | 'interview_lite'
  | 'interview_standard'
  | 'interview_deep'
  | 'negotiation_reply_draft'
  | 'negotiation_counter_offer'
  | 'negotiation_strategy'
  | 'negotiation_simulation'
  | 'skill_lab_gap_analysis'
  | 'skill_lab_course_suggest'
  | 'style_analyze_document'
  | 'legal_hub_ai_answer'
  | 'legal_hub_search_pdf'
  | 'ai_analysis_compare'
  | 'matrix_skill_gap_analysis'
  | 'matrix_employer_deep_dive'
  | 'matrix_market_comparison';

type Props = {
  feature: BillingFeatureKey;
  title?: string;
};

function estimateDisplay(cost: unknown): { label: string; maxCost: number; productLabel: string } {
  const c = cost as { kind?: string; cost?: number; minCost?: number; maxCost?: number; productLabel?: string } | undefined;
  const productLabel = c?.productLabel ?? 'AI action';
  if (!c) return { label: 'Cost unavailable', maxCost: 0, productLabel };
  if (c.kind === 'fixed') return { label: `${c.cost ?? 0} credits`, maxCost: c.cost ?? 0, productLabel };
  const min = c.minCost ?? 0;
  const max = c.maxCost ?? min;
  return { label: min === max ? `${max} credits` : `${min}-${max} credits`, maxCost: max, productLabel };
}

export function CreditCostPreview({ feature, title = 'Before you run this AI action' }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const accountQuery = api.billing.getAccountState.useQuery(
    { userId },
    { enabled: Boolean(userId), staleTime: 30_000, retry: 1 },
  );
  const estimateQuery = api.billing.estimateCost.useQuery(
    { feature },
    { staleTime: 5 * 60_000, retry: 1 },
  );

  const isLoading = accountQuery.isLoading || estimateQuery.isLoading;
  const isError = accountQuery.isError || estimateQuery.isError;
  const errorMessage = accountQuery.error?.message ?? estimateQuery.error?.message ?? 'Could not load credit preview.';
  const estimate = estimateDisplay(estimateQuery.data);
  const available = accountQuery.data?.spendableTotal ?? 0;
  const lowBalance = available > 0 && available <= Math.max(10, estimate.maxCost * 2);
  const blocked = !isLoading && !isError && available < estimate.maxCost;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
          Loading credit preview…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Credit preview unavailable</p>
            <p className="mt-1 text-red-100/85">{errorMessage}</p>
          </div>
          <button type="button" onClick={() => { void accountQuery.refetch(); void estimateQuery.refetch(); }} className="inline-flex items-center gap-1 rounded-lg border border-red-300/30 px-2 py-1 text-xs text-red-50 hover:bg-red-500/20">
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 text-sm ${blocked ? 'border-red-500/35 bg-red-500/10 text-red-50' : lowBalance ? 'border-amber-500/35 bg-amber-500/10 text-amber-50' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-50'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {blocked || lowBalance ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{estimate.productLabel}: <strong>{estimate.label}</strong>. Available now: <strong>{available.toLocaleString()} credits</strong>.</p>
          {blocked ? (
            <p className="mt-2 text-xs opacity-90">Blocked by credits: top up or wait for allowance reset before running this action.</p>
          ) : lowBalance ? (
            <p className="mt-2 text-xs opacity-90">Low balance warning: this action may leave very few credits available.</p>
          ) : (
            <p className="mt-2 text-xs opacity-80">This action is allowed. The backend still performs the final debit and writes usage history.</p>
          )}
        </div>
        <Coins className="h-5 w-5 shrink-0 opacity-75" />
      </div>
    </div>
  );
}
