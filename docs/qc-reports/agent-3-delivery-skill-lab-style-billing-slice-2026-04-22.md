# Agent 3 — Skill Lab + Style billing slice (`skill_lab_gap_analysis` / `skill_lab_course_suggest` / `style_analyze_document`)

**Date:** 2026-04-22  
**Mandatory first line (§5a / Hard Rule 8):** Owning agent: required work is executed in the repository, not in chat instead of implementation — see [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §5a and Hard Rule 8.

---

## Scope You Are Implementing Now

**One narrow slice:** lock **catalogue ↔ policy** behaviour for the three paid feature keys used by Skill Lab gap analysis, Skill Lab course suggestions, and Style document analysis — so `estimateCostFor` cannot drift from [`FEATURE_COSTS`](../../backend/src/services/creditsConfig.ts) without a failing test. **Out of scope:** new routers, new OpenAI flows, wider Agent 2 backlog, Practice/Settings/Community C-F1/C-F2 umbrella, Legal Hub, Job Radar.

**Existing server spend paths (unchanged in this commit, cited for QC):**

| Feature key | tRPC procedure | Middleware |
|-------------|----------------|------------|
| `skill_lab_gap_analysis` | `skillLab.analyzeJobGap` | `requireSpendApproval('skill_lab_gap_analysis')` in [`skillLab.router.ts`](../../backend/src/trpc/routers/skillLab.router.ts) |
| `skill_lab_course_suggest` | `style.suggestCoursesForSkill` | `requireSpendApproval('skill_lab_course_suggest')` in [`style.router.ts`](../../backend/src/trpc/routers/style.router.ts) |
| `style_analyze_document` | `style.analyzeDocument` | `requireSpendApproval('style_analyze_document')` in [`style.router.ts`](../../backend/src/trpc/routers/style.router.ts) |

Hermetic router coverage already lives in [`style-skillLab-billing.spec.ts`](../../backend/src/trpc/routers/__tests__/style-skillLab-billing.spec.ts).

---

## Scope Implemented

- Added **Vitest** file [`skillLabStyleFeatureCostPolicy.spec.ts`](../../backend/src/services/__tests__/skillLabStyleFeatureCostPolicy.spec.ts) asserting `estimateCostFor` bands for `skill_lab_gap_analysis`, `skill_lab_course_suggest`, and `style_analyze_document` match `FEATURE_COSTS` (min/max and `suggestedApprovedMaxCost` = max).

---

## Files Changed

- `backend/src/services/__tests__/skillLabStyleFeatureCostPolicy.spec.ts` — narrow policy tests for the three keys only.  
- `docs/qc-reports/agent-3-delivery-skill-lab-style-billing-slice-2026-04-22.md` — this §6 delivery.

---

## Routes / APIs / Schemas / Components Changed

**None** in application routers or services — spend wiring was already present; this delivery adds **regression tests** on the billing policy layer only.

---

## Tests Added Or Updated

- `backend/src/services/__tests__/skillLabStyleFeatureCostPolicy.spec.ts` — `estimateCostFor` coverage for the three feature keys.  
- **Run In:** `/Users/nikodem/job-app-restore/proj/backend` — **Command:** `npx vitest run src/services/__tests__/skillLabStyleFeatureCostPolicy.spec.ts src/trpc/routers/__tests__/style-skillLab-billing.spec.ts`

---

## Existing Reports Checked

| Path | Notes |
|------|--------|
| [`agent-3-blocker-wider-practice-stalled-2026-04-22.md`](./agent-3-blocker-wider-practice-stalled-2026-04-22.md) | Wider Practice still STALLED; this slice is **separate** and small. |
| [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) | Does not gate this Skill/Style **policy** test add. |
| [`qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md) | Context only — no claim to extend bounded Agent 2 AFI. |

---

## Existing QC Reports Checked

Same as table above.

---

## Integration Notes

No DB migrations, no deploy script changes. Complements existing `approveSpend` / `commitSpend` calls on the three procedures; does not broaden C-F1/C-F2 integration status.

---

## Ready For QC Target

**Ready For QC: Yes** — for **narrow** review of added **policy tests** for `skill_lab_gap_analysis`, `skill_lab_course_suggest`, and `style_analyze_document` (catalogue parity). **Not** a claim of AFI for full Skill Lab module, Agent 2’s full backlog, or wider Practice.

---

## Blockers

**None** for this slice.
