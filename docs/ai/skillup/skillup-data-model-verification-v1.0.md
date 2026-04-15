# SkillUp — data model and verification engine v1.0

**Status:** Domain + product spec (implementable; not yet bound to a single SQL migration in this repo)  
**Audience:** Product, backend, AI prompts, Skill Lab / Profile UX  
**Related:** [Career growth and agency principles](../principles/career-growth-agency-and-evidence-v1.0.md)

---

## 1. Goal

SkillUp stores not only what the user **declared**, but what the system **observed**, what was **verified**, what is **missing**, and how that affects:

- fit to a **target role**,  
- estimated **market value**,  
- **development roadmap**,  
- **application readiness**.

A flat `skills[] + level + years` model is **insufficient**.

---

## 2. Domain entities (eight core aggregates)

| Entity | Role |
| --- | --- |
| **A. `skill_profile`** | Top-level competency snapshot: targets, market value band, overall confidence, readiness. |
| **B. `skill_claim`** | What the user declared (source: CV, LinkedIn, form, manual). |
| **C. `skill_evidence`** | Every piece of support / weaken / neutral evidence for a skill. |
| **D. `skill_assessment`** | Synthetic AI view for one skill after aggregating evidence. |
| **E. `skill_gap`** | Gap vs target role, job, or job family. |
| **F. `career_value_snapshot`** | Estimated market value at a point in time (current or projected). |
| **G. `growth_milestone`** | Actionable development step linked to skills and impact. |
| **H. `verification_session`** | Active check: mock interview, language check, coding task, portfolio review, etc. |

---

## 3. Type sketches (canonical field names)

### `SkillProfile`

```ts
type SkillProfile = {
  id: string;
  userId: string;

  targetRole?: string | null;
  targetSeniority?: 'junior' | 'mid' | 'senior' | 'lead' | null;
  targetLocation?: string | null;
  targetSalaryMin?: number | null;
  targetSalaryMax?: number | null;
  targetCurrency?: string | null;

  currentMarketValueMin?: number | null;
  currentMarketValueMax?: number | null;
  currentMarketValueConfidence: 'low' | 'medium' | 'high';

  profileConfidence: 'low' | 'medium' | 'high';
  readinessScore?: number | null;

  createdAt: string;
  updatedAt: string;
};
```

### `SkillClaim`

```ts
type SkillClaim = {
  id: string;
  userId: string;
  skillKey: string;
  skillCategory: 'hard' | 'soft' | 'language' | 'domain' | 'tool';
  claimedLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  claimSource: 'cv' | 'linkedin' | 'profile_form' | 'manual_edit';
  claimText?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### `SkillEvidence` (central table)

```ts
type SkillEvidence = {
  id: string;
  userId: string;
  skillKey: string;

  sourceType:
    | 'cv'
    | 'linkedin'
    | 'portfolio'
    | 'github'
    | 'reference'
    | 'mock_interview'
    | 'assistant_conversation'
    | 'coding_task'
    | 'writing_sample'
    | 'certificate'
    | 'job_history';

  sourceRefId?: string | null;
  evidenceDirection: 'supports' | 'weakens' | 'neutral';
  evidenceStrength: 'low' | 'medium' | 'high';

  observedLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert' | null;

  evidenceText: string;
  structuredPayload?: Record<string, unknown> | null;

  freshnessScore?: number | null;
  confidence: 'low' | 'medium' | 'high';

  createdAt: string;
};
```

### `SkillAssessment`

```ts
type SkillAssessment = {
  id: string;
  userId: string;
  skillKey: string;
  skillCategory: 'hard' | 'soft' | 'language' | 'domain' | 'tool';

  claimedLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert' | null;
  observedLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert' | null;

  verificationStatus:
    | 'self_declared'
    | 'lightly_evidenced'
    | 'partially_verified'
    | 'strongly_verified'
    | 'inconsistent';

  evidenceCount: number;
  supportCount: number;
  weakenCount: number;

  confidence: 'low' | 'medium' | 'high';
  consistencyScore: number;
  marketRelevanceScore?: number | null;

  summary: string;
  improvementNote?: string | null;

  updatedAt: string;
};
```

### `LanguageAssessment` (languages as sub-dimensions)

```ts
type LanguageAssessment = {
  id: string;
  userId: string;
  languageKey: string;

  declaredLevel?: string | null;
  observedGeneralLevel?: string | null;
  confidence: 'low' | 'medium' | 'high';

  speakingLevel?: string | null;
  writingLevel?: string | null;
  comprehensionLevel?: string | null;

  verificationStatus:
    | 'self_declared'
    | 'lightly_evidenced'
    | 'partially_verified'
    | 'strongly_verified'
    | 'inconsistent';

  summary: string;
  improvementNote?: string | null;

  updatedAt: string;
};
```

### `SkillGap`

```ts
type SkillGap = {
  id: string;
  userId: string;

  targetType: 'job' | 'role_family' | 'career_goal';
  targetRefId?: string | null;
  targetLabel: string;

  skillKey: string;
  gapSeverity: 'missing' | 'weak' | 'needs_proof' | 'stretch';
  importance: 'must_have' | 'important' | 'optional';

  currentObservedLevel?: string | null;
  targetExpectedLevel?: string | null;

  summary: string;
  recommendedAction?: string | null;

  createdAt: string;
  updatedAt: string;
};
```

### `CareerValueSnapshot`

```ts
type CareerValueSnapshot = {
  id: string;
  userId: string;

  snapshotType: 'current' | 'projected';
  projectionHorizonMonths?: number | null;

  roleFamily: string;
  seniorityBand?: string | null;
  marketRegion: string;
  currency: string;

  valueMin: number;
  valueMax: number;
  confidence: 'low' | 'medium' | 'high';

  assumptions: string[];
  driverSkillKeys: string[];

  createdAt: string;
};
```

### `GrowthMilestone`

```ts
type GrowthMilestone = {
  id: string;
  userId: string;

  milestoneType: 'skill' | 'experience' | 'portfolio' | 'language' | 'certificate' | 'interview' | 'proof';

  title: string;
  summary: string;

  relatedSkillKeys: string[];

  estimatedDurationWeeks?: number | null;
  difficulty: 'low' | 'medium' | 'high';

  impactMatchRate?: number | null;
  impactMarketValueMin?: number | null;
  impactMarketValueMax?: number | null;

  unlocks?: string[] | null;
  status: 'suggested' | 'planned' | 'in_progress' | 'done' | 'skipped';

  dueDate?: string | null;
  completedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};
```

### `VerificationSession`

```ts
type VerificationSession = {
  id: string;
  userId: string;

  sessionType:
    | 'mock_interview'
    | 'language_check'
    | 'coding_challenge'
    | 'portfolio_review'
    | 'case_study_review'
    | 'writing_assessment';

  targetSkills: string[];
  status: 'started' | 'completed' | 'abandoned';

  transcriptRef?: string | null;
  resultSummary?: string | null;
  confidence: 'low' | 'medium' | 'high';

  startedAt: string;
  completedAt?: string | null;
};
```

On **completion** of a session: create `skill_evidence` rows for `targetSkills`, then recompute assessments / gaps / value as per pipeline policy.

---

## 4. Verification status — definitions

| Status | Meaning |
| --- | --- |
| `self_declared` | Claim only, or no meaningful evidence. |
| `lightly_evidenced` | One weak or medium-strength signal. |
| `partially_verified` | Two or more reasonable signals; may be incomplete or mixed. |
| `strongly_verified` | Strong, fresh, consistent evidence (policy-tuned thresholds). |
| `inconsistent` | Claim and observation clearly diverge. |

### Example MVP aggregation (pseudo-code)

```ts
function getVerificationStatus(input: {
  hasClaim: boolean;
  supportCount: number;
  weakenCount: number;
  highConfidenceEvidenceCount: number;
  consistencyScore: number;
}): SkillAssessment['verificationStatus'] {
  if (!input.hasClaim && input.supportCount === 0) return 'self_declared';
  if (input.weakenCount >= 2 && input.consistencyScore < 40) return 'inconsistent';
  if (input.highConfidenceEvidenceCount >= 2 && input.consistencyScore >= 75) return 'strongly_verified';
  if (input.supportCount >= 2) return 'partially_verified';
  if (input.supportCount >= 1) return 'lightly_evidenced';
  return 'self_declared';
}
```

Tune thresholds with product and legal review; do not treat this snippet as production law.

---

## 5. Soft skills — caution

Soft skills are **not** “has / does not have personality trait”. Prefer:

- **evidence present**,  
- **evidence limited**,  
- **evidence mixed**,  

based on **observed behaviour in samples**, not personality diagnosis.

Example skill keys: `communication`, `structured_thinking`, `stakeholder_management`, `leadership`, `collaboration`, `facilitation`, `autonomy`, `problem_solving`.

---

## 6. Relationship flow (data lineage)

```text
Inputs (CV, LinkedIn, refs, portfolio, AI sessions, mocks, tasks)
    → skill_claim
    → skill_evidence
    → skill_assessment (+ language_assessment where relevant)
    → skill_gap
    → career_value_snapshot
    → growth_milestone
```

---

## 7. Verification engine flows (product)

1. **After CV upload** — parse claims → `skill_claim` + weak `skill_evidence` → initial `skill_assessment` (`self_declared` / `lightly_evidenced`).  
2. **After LinkedIn link** — add profile evidence → update consistency → refresh assessments.  
3. **After mock interview** — `verification_session` → evidence for communication, language, structure, role knowledge → refresh assessments.  
4. **After coding / portfolio review** — hard-skill evidence → strengthen or weaken claims → refresh market value inputs.  
5. **After any material update** — recompute gaps, value snapshots, roadmap milestones.

---

## 8. How AI talks about mismatch (UX copy)

Avoid:

- “Skill not true”, “Candidate overstated ability.”

Prefer:

- “Current **evidence is limited** for this declared skill.”  
- “Observed evidence does **not yet strongly support** the declared level.”  
- “This skill may need **additional verification**.”  
- “You can strengthen this claim with examples or a short verification task.”  

**No humiliation** — clarify and **lead forward**.

---

## 9. Internal verification score (optional composite)

```ts
type SkillVerificationScore = {
  skillKey: string;
  evidenceCoverage: number;
  evidenceQuality: number;
  consistency: number;
  recency: number;
  verificationScore: number;
};
```

Map composite ranges to `verificationStatus` for roadmap and UI confidence.

---

## 10. What the Profile UI should show (simplified layer)

- **Snapshot:** current level band, strongest **verified** skills, skills **needing proof**, target role, current market value range, **next milestone**.  
- **Skill verification:** Verified / Needs more evidence / In progress.  
- **Languages:** Declared vs observed vs suggested next step.

---

## 11. Non‑negotiable product rules

1. **Claims are not truth** — declaration is a starting point.  
2. **Evidence beats self-description** when they conflict.  
3. **No humiliation UX** — the system does not “catch” users; it helps them refine.  
4. **Soft skills need more caution** — confidence usually lower, language more hedged.  
5. **Languages are practical** — interview and workplace use matter, not only a CEFR label on a CV.

---

## 12. Next engineering artifacts

1. **Drizzle schema (implemented)** — `backend/src/db/schemas/skillup.ts` (exported via `backend/src/db/schema.ts`). Apply matching **MySQL DDL** on the server before using these tables in production (generate from Drizzle or maintain a reference SQL migration under `docs/` when added).  
2. **Verification engine logic spec** — how transcripts become `skill_evidence`, how `observed_level` is derived, when `inconsistent` triggers, how milestones refresh.

The document remains the **product contract**; the Drizzle file is the **app-side schema source of truth**.
