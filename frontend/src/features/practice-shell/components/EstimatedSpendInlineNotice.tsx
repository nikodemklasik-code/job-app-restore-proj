import type { CreditCostViewModel } from '@/types/billing';

export default function EstimatedSpendInlineNotice({ cost }: { cost: CreditCostViewModel }) {
  if (cost.type !== 'estimated') return null;
  return (
    <div className="rounded-xl border border-amber-300/30 bg-amber-100/10 px-3 py-2 text-xs text-amber-200">
      Estimated cost: {cost.estimatedMin}-{cost.estimatedMax} credits. Auto-approval up to {cost.approvalRule?.maxCostWithoutFurtherApproval ?? 0} credits.
    </div>
  );
}
