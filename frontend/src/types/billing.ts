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

export type CreditChargeType = 'free' | 'fixed' | 'estimated';

export interface CreditApprovalRule {
  maxCostWithoutFurtherApproval: number;
  requiresApproval: boolean;
}

export interface CreditCostViewModel {
  type: CreditChargeType;
  label: string;
  credits: number | null;
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  approvalRule?: CreditApprovalRule | null;
  freeAllowanceNote?: string | null;
}
