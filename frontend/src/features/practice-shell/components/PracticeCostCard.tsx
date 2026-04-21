import type { CreditCostViewModel } from '@/types/billing';
import type { ReactNode } from 'react';

type Props =
  | { cost: CreditCostViewModel; icon?: never; label?: never; value?: never; footer?: never }
  | { cost?: never; icon: ReactNode; label: string; value: ReactNode; footer?: ReactNode };

export default function PracticeCostCard(props: Props) {
  if ('cost' in props && props.cost) {
    const { cost } = props;
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-sm font-medium text-slate-500">Cost</div>{cost.type === 'free' && <><div className="mt-2 text-2xl font-semibold text-slate-900">Free</div>{cost.freeAllowanceNote ? <p className="mt-2 text-sm text-slate-600">{cost.freeAllowanceNote}</p> : null}</>}{cost.type === 'fixed' && <><div className="mt-2 text-2xl font-semibold text-slate-900">{cost.credits} Credits</div><p className="mt-2 text-sm text-slate-600">{cost.label}</p></>}{cost.type === 'estimated' && <><div className="mt-2 text-2xl font-semibold text-slate-900">{cost.estimatedMin === cost.estimatedMax ? `${cost.estimatedMax} Credits` : `${cost.estimatedMin}-${cost.estimatedMax} Credits`}</div><p className="mt-2 text-sm text-slate-600">{cost.label}</p>{cost.approvalRule ? <p className="mt-2 text-xs text-slate-500">Maximum Cost Without Further Approval: {cost.approvalRule.maxCostWithoutFurtherApproval} Credits</p> : null}</>}</div>;
  }
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-sm text-slate-500">{props.icon}{props.label}</div><div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>{props.footer ? <div className="mt-2 text-sm text-slate-600">{props.footer}</div> : null}</div>;
}
