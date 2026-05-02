# Shared API Contract Rules

Obowiązuje frontend i backend. Jeśli backend zmienia response, frontend dostaje zmianę przez shared types albo OpenAPI, nie przez zgadywanie z Network tab.

## Minimum dla score/insight
Każdy score lub insight musi zawierać: `score`, `reasons[]`, `confidence`, `sourceMetadata[]`, `generatedAt`, `modelVersion` albo `ruleVersion`.

## JobRadarItem v0
```ts
export type SourceMetadata = {
  sourceName: string;
  sourceType: "api" | "scraper" | "registry" | "review" | "user_feedback" | "inferred";
  sourceUrl?: string | null;
  observedAt: string;
  freshness: "new" | "recent" | "stale" | "unknown";
  confidence: number;
};

export type ScoreReason = {
  label: string;
  explanation: string;
  confidence: number;
  sourceType: string;
};

export type RiskReason = ScoreReason & {
  severity: "low" | "medium" | "high";
};

export type JobRadarItem = {
  jobId: string;
  title: string;
  companyName: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryConfidence: "verified" | "predicted" | "unknown";
  jobFitScore: number;
  marketValueScore: number;
  employerTrustScore: number;
  employerRiskScore: number;
  actionPriorityScore: number;
  recommendedAction: "apply" | "save" | "reject" | "hide" | "learn_more";
  fitReasons: ScoreReason[];
  riskReasons: RiskReason[];
  matchedSkills: string[];
  missingSkills: string[];
  sourceMetadata: SourceMetadata[];
  generatedAt: string;
  modelVersion: string;
};
```

## Required E2E flows
1. Job Radar -> detail -> why/risk drawer -> apply -> application exists.
2. Skill Signals -> gap -> evidence -> add evidence.
3. Paid action -> credits reserved -> success -> commit -> ledger updated.
4. Paid action -> credits reserved -> failure -> cancel -> no debit.
