export type DashboardApplicationStatus =
  | 'draft'
  | 'saved'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'archived';

export type ApplicationSummary = {
  total: number;
  byStatus: Record<DashboardApplicationStatus, number>;
  recent: Array<{
    id: string;
    companyName: string;
    roleTitle: string;
    status: DashboardApplicationStatus;
    updatedAt: string;
  }>;
  needsReviewCount: number;
};

export type DashboardNewsroomItem = {
  id: string;
  type: 'job' | 'employer' | 'recruitment';
  title: string;
  description: string;
  href: string;
  occurredAt: string;
  ctaLabel: string;
};

export type BillingSummary = {
  currency: 'GBP';
  postedDebitCents: number;
  postedCreditCents: number;
  postedNetCents: number;
  pendingDebitCents: number;
  pendingCreditCents: number;
  pendingNetCents: number;
  availableBalanceCents: number;
};

export type DashboardSnapshot = {
  userId: string;
  profile: {
    fullName: string | null;
    targetRole: string | null;
    completeness: number;
    missingCriticalFields: string[];
  };
  applications: ApplicationSummary;
  billing: BillingSummary;
  practice: {
    totalSessions: number;
    completedSessions: number;
    averageScore: number | null;
    lastCompletedAt: string | null;
  };
  nextAction: {
    label: string;
    href: string;
    reason: string;
  };
  newsroom: DashboardNewsroomItem[];
  activity: {
    lastLoginAt: string | null;
    lastJobSearchAt: string | null;
    lastJobSearchLabel: string | null;
    lastMarketResearchAt: string | null;
  };
  generatedAt: string;
};
