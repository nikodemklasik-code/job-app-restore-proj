export type LedgerEntry = {
  id: string;
  direction: 'debit' | 'credit';
  category:
    | 'subscription'
    | 'interview'
    | 'warmup'
    | 'coach'
    | 'negotiation'
    | 'skill_lab'
    | 'document_lab'
    | 'adjustment'
    | 'refund'
    | 'other';
  description: string;
  currency: string;
  amountCents: number;
  sourceType: string | null;
  sourceId: string | null;
  occurredAt: string;
};

export type PendingCharge = {
  id: string;
  category: LedgerEntry['category'];
  status: 'queued' | 'authorized' | 'committed' | 'cancelled' | 'failed';
  description: string;
  currency: string;
  amountCents: number;
  sourceType: string | null;
  sourceId: string | null;
  expectedCommitAt: string | null;
  createdAt: string;
};

export type LedgerBillingSummary = {
  currency: string;
  postedDebitCents: number;
  postedCreditCents: number;
  postedNetCents: number;
  pendingDebitCents: number;
  pendingCreditCents: number;
  pendingNetCents: number;
  availableBalanceCents: number;
  pendingCount: number;
  postedCount: number;
};

/** Shared charge typing for visible/estimated credit-cost UI. */
export type CreditChargeType =
  | 'none'
  | 'visible_cost'
  | 'estimated_cost'
  | 'pre_authorization'
  | 'final_charge';

/** Approval rule metadata for gates before a credit-bearing action is executed. */
export type CreditApprovalRule = {
  requiresApproval: boolean;
  autoApproveBelowOrEqualCredits?: number;
  approvalReason?: 'high_cost' | 'insufficient_balance' | 'policy' | 'manual_review';
  policyLabel?: string;
};

/** View model for rendering credits to the user before they run a feature/action. */
export type CreditCostViewModel = {
  chargeType: CreditChargeType;
  visibleCostCredits: number | null;
  estimatedCostCredits: number | null;
  minEstimatedCostCredits?: number | null;
  maxEstimatedCostCredits?: number | null;
  currencyLabel?: string;
  displayLabel: string;
  approvalRule?: CreditApprovalRule;
};
